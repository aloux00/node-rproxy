/**
 * 
 */

var config=require('./slaveproxy.json');

(function(){

	// Simple websocket server
	
	var port = config.websocketPort;
	if(process.argc==3){
		port=parseInt(process.argv[2]);
	}

	var master=null;
	
	
	(new (require('ws').Server)({
		port: port
	})).on('connection', function(wsclient){
	
		
		
		if(master===null){
			master=wsclient;
			console.log('connected a master');
		}else{
		
			var a=master;
			master=null;
			var b=wsclient;
			console.log('connected a client');
	
			
			
			a.on('message', function message(data, flags) {
				console.log('master sent '+data);
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
				console.log('client sent '+data);
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




