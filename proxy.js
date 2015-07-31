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
	
		
		
		if(master===null){
			master=wsclient;
			console.log('connected a master');
		}else{
		
			a=master;
			master=null;
			b=wsclient;
			console.log('connected a client');
			var b=this;
			a.on('message', function message(data, flags) {
				b.send(data);
				console.log('master sent '+data);
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
				console.log('client sent '+data);
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




