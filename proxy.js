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
	
		
		console.log(require('util').inspect(wsclient, true, 10));
	
		

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




