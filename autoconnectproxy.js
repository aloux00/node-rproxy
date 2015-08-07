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
	
	me._primeSourceConnection(config).on('open',function(){
		console.log('autoconnectproxy listenting: '+me._pwd(config.source).' => '+me._pwd(config.dest));
	});
	for(var i=1;i<10;i++){
		me._primeSourceConnection(config);
	}


};
WSAutoconnectProxy.prototype.__proto__ = events.EventEmitter.prototype;
WSAutoconnectProxy.prototype._pwd=function(str){
	
	var at=str.indexOf('@');
	var cln=str.lastIndexOf(':', at);
	var substr=str.substring(cln, at);
	var replace='';
	for(var i=0;i<substr.length;i++){
		replace+='*';
	}
	return str.substring(0,cln)+replace+str.substring(cln);
	
}
WSAutoconnectProxy.prototype.connectionPool=function(){
	var me=this;
	return me._primedConnections.slice(0);
}
WSAutoconnectProxy.prototype._primeSourceConnection=function(config){
	var me=this;

	





	/**
	 * creates a half connected socket. that immediately connects to the source, and once data is recieved, connects to the destination.
	 */

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
	
	source=(new WSocket(config.source, function() {
		me.emit('source.connect', destination);
	})).on('open',function(){
		me._primedConnections.push(source);
	}).once('message', function message(data, flags) {

		me._primedConnections.splice(me._primedConnections.indexOf(source),1);


		destination=(new WSocket(config.destination,function(){
			me.emit('destination.connect', destination);
		})).on('open', function() {

			destination.send(data);
			source.on('message', destination.send.bind(destination));
			destination.on('message', source.send.bind(source));

		}).on('error',cleanup).on('close', cleanup);


		me._primeSourceConnection(config);

	}).on('close',function(code, message){
		cleanup();
		if(me._isRunning){
			me._primeSourceConnection(config);
		}
	}).on('error', cleanup);

	
	return source;
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
