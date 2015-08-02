/**
 * Bridge proxy
 * 
 */



function WSBridgeProxy(config){

	// Simple websocket server
	var me=this;
	var port = config.port;
	var serverconnections=[];
	var clientconnections=[];

	var atob=require('atob');



	me._server=(new (require('ws').Server)({
		port: port
	})).on('connection', function(wsclient){

		if((typeof wsclient.upgradeReq.headers.authorization)!='undefined'){
			//console.log(wsclient.upgradeReq)
			var b64auth=wsclient.upgradeReq.headers.authorization.split(' ')[1];
			var basicauth=atob(b64auth);
			if(basicauth===config.basicauth){
				serverconnections.push(wsclient)
				console.log('bridge recieved server socket');
			}else{
				console.log('bridge basic auth attempt invalid: '+b64auth+' = ' +basicauth+' | '+config.basicauth)
				wsclient.close(3000,'bridge basic auth attempt invalid');
			}
		}else{
			clientconnections.push(wsclient);
			console.log('bridge recieved client socket');
		}

		while(serverconnections.length&&clientconnections.length){

			console.log('bridge paired sockets: server::client');

			var server=serverconnections.shift();
			var client=clientconnections.shift();

			server.on('message', function message(data, flags) {
				console.log('bridge server sends: '+(typeof data));
				client.send(data);
			}).on('error',function(error){
				console.log('bridge server error: '+error)
			}).on('close',function(code, message){
				console.log('bridge server close: '+code+' '+message);
				server=null;
				if(client){
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
					server.close();
				}

			});



		}





	}).on('error', function(error){
		console.log('error: '+error);
	})

	console.log('websocket listening on: '+port);

};

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

