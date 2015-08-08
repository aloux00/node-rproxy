/**
 * A self connecting Websocket client-client proxy. 
 * 
 * expects two arguments like: ws://user:pass@source.socket.com:port/path ws://dest.socket.com:port/path 
 * where the source is a kind of websocket slave proxy (slaveproxy.js) 
 * 
 */



var WSocket = require('ws');

var events = require('events');

function WSAutoconnectProxy(options){

	var me=this;
	me._primedConnections=[];
	me._isRunning=true;
	
	var config={
			retry:0,
			verbose:false
	};
	
	Object.keys(options).forEach(function (key) {
		config[key]=options[key];
	});
	
	me.config=config;
	
	me.once('source.connect',function(source){
		console.log('autoconnectproxy listenting: '+me._pwd(me.config.source)+' => '+me._pwd(me.config.destination));
		source.on('error',function(err){
			console.log('first connection to source error');
			console.log(err);
		});
	});
	
	me.once('destination.connect',function(destination){
		
		destination.on('error',function(err){
			console.log('first connection to destination error');
			console.log(err);
		});
	});
	
	for(var i=0;i<10;i++){
		me._primeSourceConnection();
	}


};
WSAutoconnectProxy.prototype.__proto__ = events.EventEmitter.prototype;

WSAutoconnectProxy.prototype._configure=function(a, b){
	
	
}
WSAutoconnectProxy.prototype._pwd=function(str){
	
	var at=str.indexOf('@');
	var cln=str.lastIndexOf(':', at)+1;
	var substr=str.substring(cln, at);
	var replace='';
	for(var i=0;i<substr.length;i++){
		replace+='*';
	}
	return str.substring(0,cln)+replace+str.substring(at);
	
}
WSAutoconnectProxy.prototype.connectionPool=function(){
	var me=this;
	return me._primedConnections.slice(0);
}
WSAutoconnectProxy.prototype._primeSourceConnection=function(){
	var me=this;

	var source=null;
	var destination=null;
	
	var cleanup=function(){
		if(source!=null){
			source.close();
		}
		if(destination!=null){
			destination.close();
		}
		
		source=null;
		destination=null;
	}
	
	me._connectToSource(function(src){
		source=src.on('close',cleanup).on('error', cleanup);
	}, function(dest){
		destination=dest.on('close', cleanup).on('error', cleanup);
	});

}
WSAutoconnectProxy.prototype._connectToSource=function(callbackSource, callbackDest){
	var me=this;
	var source=(new WSocket(me.config.source)).on('open',function(){
		me._primedConnections.push(source);
	}).once('message', function message(data, flags) {

		me._primedConnections.splice(me._primedConnections.indexOf(source),1);
		var destination=me._connectSourceToDestination(source);
		destination.on('open',function(){
			destination.send(data);
		});
		callbackDest(destination);
		me._primeSourceConnection();

	}).on('close',function(code, message){
		if(me._isRunning){
			me._primeSourceConnection();
		}
	});
	me.emit('source.connect',source);
	callbackSource(source);	
};
WSAutoconnectProxy.prototype._connectSourceToDestination=function(source){
	var me=this;
	var destination=(new WSocket(me.config.destination)).on('open', function() {

		source.on('message', destination.send.bind(destination));
		destination.on('message', source.send.bind(source));

	});
	me.emit('destination.connect', destination);
	return destination;
}

WSAutoconnectProxy.prototype.close=function(){
	var me=this;
	me._isRunning=false;
	me._primedConnections.forEach(function(con){
		con.close();
	});


};


module.exports=WSAutoconnectProxy;


//run from command line

if(process.argv){
	if(!process.argc){
		process.argc=process.argv.length;
	}
	var fs=require('fs');
	fs.realpath(process.argv[1],function(err, p1){
		fs.realpath(__filename,function(err, p2){

			//console.log(p1+' '+p2);

			if(p1===p2){


				console.log(process.argv);
				
				
				if(process.argc!=4){
					throw new Error('Requires websocket source and destination address arguments: ie: www.host.com:port/path ('+process.argc+')');
				}

				if(process.argv[2].indexOf('ws:')!==0){
					throw new Error('Requires websocket source address argument: ie: www.host.com:port/path');
				}

				if(process.argv[3].indexOf('ws:')!==0){
					throw new Error('Requires websocket destination address argument: ie: www.host.com:port/path');
				}


				new WSAutoconnectProxy({source:process.argv[2], destination:process.argv[3]});


			}

		});
	});
}
