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
	})).on('headers',function(headers){
		if(master===null){
			console.log('master client connected');
			console.log(require('util').inspect(obj, true, 10))
		}
		
	}).on('connection', function(wsclient){
	
		

		

		wsclient.on('message',function(data){

			console.log(data);
			
		}).on('error', function(error){
			console.log('error: '+error);
		}).on('close',function(code, message){
			console.log('close: '+message);
		});
		
		

	}).on('error', function(error){
		console.log('error: '+error);
	})
		
	console.log('websocket listening on: '+port);

})();




