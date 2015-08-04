/**
 * Bridge proxy
 * 
 */


var events = require('events');
function WSBridgeProxy(config){
	
	// Simple websocket server
	var me=this;
	events.EventEmitter.call(me);
	var port = config.port;
	var freeServerConnections=[];
	var freeClientConnections=[];

	
	me._server=(new (require('ws').Server)({
		port: port
	})).on('connection', function(wsclient){

		if(me._isSocketAttemptingAuth(wsclient)){
		
			if(me._authorizeSocketAsServerConnection(wsclient, config.basicauth)){
				freeServerConnections.push(wsclient)
				console.log('bridge recieved server socket');
			}else{
				wsclient.close(3000,'bridge basic auth attempt invalid');
				return;
			}
		}else{
			freeClientConnections.push(wsclient);
			console.log('bridge recieved client socket');
			me._bufferSocket(wsclient);
		
		}

		
		
		

		while(freeServerConnections.length&&freeClientConnections.length){

			var server=freeServerConnections.shift();
			var client=freeClientConnections.shift();
			me._connectSockets(server, client)

		}





	}).on('error', function(error){
		console.log('error: '+error);
	});

	console.log('websocket listening on: '+port);

};
WSBridgeProxy.prototype.__proto__ = events.EventEmitter.prototype;
WSBridgeProxy.prototype._bufferSocket=function(wsclient){
	var me=this;
	if(!me._flushBuffers){
		
		me._bufferedClients=[];
		me._buffers=[];
		me._handlers=[];
		
		me._flushBuffers=function(server, client){
			var i=me._bufferedClients.indexOf(client);
			console.log('flushing buffer '+i+': '+(typeof me._buffers[i])+' server:'+server+' client:'+client);
			me._buffers[i].forEach(function(message){
				server.send(message);
			});
			
			me._bufferedClients.splice(i,1);
			me._buffers.splice(i,1);
			client.removeEventListener('message', me._handlers[i]);
			me._handlers.splice(i,1);
		}
		
		me.on('pair', me._flushBuffers);
	}
	
	
	me._bufferedClients.push(wsclient);
	var buffer=[];
	me._buffers.push(buffer);
	var handler=function message(data, flags) {
		buffer.push(data);
	}
	me._handlers.push(handler);
	wsclient.on('message', handler);
	
};

WSBridgeProxy.prototype._isSocketAttemptingAuth=function(wsclient){
	return (typeof wsclient.upgradeReq.headers.authorization)!='undefined'
};

WSBridgeProxy.prototype._authorizeSocketAsServerConnection=function(wsclient, basicauth){
	var atob=require('atob');
	var b64auth=wsclient.upgradeReq.headers.authorization.split(' ')[1];
	var auth=atob(b64auth);
	if(auth===basicauth){
		return true;
	}else{
		console.log('bridge basic auth attempt invalid: '+b64auth+' = ' +auth+' | '+basicauth)
		return false;
	}
};

WSBridgeProxy.prototype._connectSockets=function(server, client){
	console.log('bridge paired sockets: server::client');

	var me=this;

	server.on('message', function message(data, flags) {
		console.log('bridge server sends: '+(typeof data));
		client.send(data);
	}).on('error',function(error){
		console.log('bridge server error: '+error)
	}).on('close',function(code, message){
		console.log('bridge server close: '+code+' '+message);
		server=null;
		if(client){
			me.emit('unpair', [server, client]);
			client.close();
		}
	});

	client.on('message', function message(data, flags) {
		console.log('bridge client sends: '+(typeof data));
		server.send(data);

	}).on('error',function(error){
		console.log('bridge client error: '+error)
	}).on('close',function(code, message){
		console.log('bridge client  close: '+code+' '+message);
		client=null;
		if(server){
			me.emit('unpair', [server, client]);
			server.close();
		}
		
		

	});
	
	me.emit('pair', [server, client]);
	
	
	
}

WSBridgeProxy.prototype.close=function(){

	var me=this;
	me._server.close();


}

module.exports=WSBridgeProxy;


//console.log(argv);


if(process.argv){

	console.log(process.argv);

	var fs=require('fs');
	fs.realpath(process.argv[1],function(err, p1){

		fs.realpath(__filename,function(err, p2){

			console.log(p1+' '+p2);

			if(p1===p2){


				if(process.argc==3){
					new WSBridgeProxy({port:parseInt(process.argv[2])});
				}else{
					new WSBridgeProxy(require('./bridgeproxy.json'));
				}


			}

		});
	});
}

