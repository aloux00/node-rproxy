/**
 * 
 */

var config=require('./server.json');


(function(){
	
	//Simple webserver

	var fs=require('fs');
	var http=require('http');

	var port=config.serverPort;


	var server=http.createServer().on('connect',function(request, socket, head){
	
		
	
	}).listen(port);
	console.log('webserver listening on: '+port);

});


(function(){

	// Simple websocket server
	
	var port = config.websocketPort;


	(new (require('ws').Server)({
		port: port
	})).on('connection', function(wsclient){
	

		console.log('client connected: '+wsclient);

		wsclient.on('message',function(data){

			console.log(data);
			
		}).on('close',function(code, message){

		});

	}).on('error', function(error){
		
		console.log('error: '+error);
	
	});
		
	console.log('websocket listening on: '+port);

})();




