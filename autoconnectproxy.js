/**
 * A self connecting Websocket client-client proxy. 
 * 
 * expects two arguments like: ws://source.socket.com:port/path ws://dest.socket.com:port/path 
 * where the source is a kind of websocket slave proxy (slaveproxy.js) 
 * 
 */


var WebSocket = require('ws');
if(process.argv[2].indexOf('ws:')!==0){
	throw new Error('Requires websocket source address argument: ie: www.host.com:port/path');
}

if(process.argv[3].indexOf('ws:')!==0){
	throw new Error('Requires websocket destination address argument: ie: www.host.com:port/path');
}



/**
 * creates a half connected socket. that immediately connects to the source, and once data is recieved, connects to the destination.
 */
var primeNextSocket=function(){
	(new WebSocket(process.argv[2])).on('open',function(){
		
		console.log('connected proxy');
		
	}).once('message', function message(data, flags) {
		
		var a=this;
		
		(new WebSocket(process.argv[3])).on('open', function open() {
			
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
		
		primeNextSocket(); 
	
	});
};

primeNextSocket();