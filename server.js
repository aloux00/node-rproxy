/**
 * 
 */


var WebSocket = require('ws');
if(process.argv[2].indexOf('ws:')!==0){
	throw new Error('Requires websocket source address argument: ie: www.host.com:port/path');
}

if(process.argv[3].indexOf('ws:')!==0){
	throw new Error('Requires websocket destination address argument: ie: www.host.com:port/path');
}




var run=function(){
	(new WebSocket(process.argv[2])).on('open',function(){
		var a=this;
		a.send('proxy');
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
	
	});
};

run();