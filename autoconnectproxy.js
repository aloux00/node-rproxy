/**
 * A self connecting Websocket client-client proxy. 
 * 
 * expects two arguments like: ws://source.socket.com:port/path ws://dest.socket.com:port/path 
 * where the source is a kind of websocket slave proxy (slaveproxy.js) 
 * 
 */



function WSAutoconnectProxy(config){
	
	var WSocket = require('ws');

	/**
	 * creates a half connected socket. that immediately connects to the source, and once data is recieved, connects to the destination.
	 */
	
	(new WSocket(config.source)).on('open',function(){

		console.log('connected proxy');

	}).once('message', function message(data, flags) {

		var a=this;

		(new WSocket(config.destination)).on('open', function() {

			var b=this;
			b.send(data);
			a.on('message', function message(data, flags) {
				b.send(data);
			}).on('error',function(error){
				console.log('a error: '+error)
			}).on('close',function(code, message){
				console.log('a close: '+code+' '+message);
				a=null;
				if(b){
					b.close();
				}
			});
			b.on('message', function message(data, flags) {
				a.send(data);
			}).on('error',function(error){
				console.log('b error: '+error)
			}).on('close',function(code, message){
				console.log('b close: '+code+' '+message);
				b=null;
				if(a){
					a.close();
				}

			});
		});

		new WSAutoconnectProxy(config); 

	});
};

module.exports=WSAutoconnectProxy;

var fs=require('fs');
if(fs.realpath(argv[1],function(p1){
	fs.realpath(__filename,function(p2){

		if(p1===p2){


			if(process.argc!=4){
				throw new Error('Requires websocket source and destination address arguments: ie: www.host.com:port/path');
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
