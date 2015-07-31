/**
 * 
 */

var config=require('./proxy.json');

(function(){

	// Simple websocket server
	
	var port = config.websocketPort;


	var master=null;
	
	
	(new (require('ws').Server)({
		port: port
	})).on('connection', function(wsclient){
	
		
		
		if(master=null){
			master=wsclient;
		}else{
		
			a=master;
			master=null;
			b=wsclient;
			
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
		
		}
		
		
		

	}).on('error', function(error){
		console.log('error: '+error);
	})
		
	console.log('websocket listening on: '+port);

})();




