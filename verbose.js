/**
 * 
 */


function logAutoconnectProxy(acp){
	console.log('adding logger');
	acp.on('source.connect',function(source){
	
		source.on('open',function(){
			console.log('autoconnect created proxy: there are '+acp.connectionPoolCount()+' ready sockets');
		}).on('message', function message(data, flags) {
			console.log('autoconnect proxy source sends: '+(typeof data));
		}).on('close',function(code, message){
			console.log('autoconnect proxy source close: '+code+' '+message);
		}).on('error',function(error){
			console.log('autoconnect proxy source error: '+error);
		});
		
		
	}).on('destination.connect',function(destination){
		
		destination.on('message', function message(data, flags) {
			console.log('autoconnect proxy destination sends: '+(typeof data));
		}).on('error',function(error){
			console.error('autoconnect proxy destination error: '+error+' | '+(typeof error));
		}).on('close',function(code, message){
			console.log('autoconnect proxy destination close: '+code+' '+message);
		});
		
	});
}


function logBridgeProxy(brdg){


	brdg.server.on('close',function(code, mesage){
		console.log('bridge closed: '+code+' - '+message);
	});


	brdg.on('server.connect',function(server){
		
		console.log('bridge recieved server socket');
		
		server.on('message', function message(data, flags) {
			console.log('bridge server sends: '+(typeof data));
		}).on('close',function(code, message){
			console.log('bridge server close: '+code+' '+message);
		}).on('error',function(error){
			console.log('bridge server error: '+error)
		})

	}).on('client.connect',function(client){
		console.log('bridge recieved client socket');

		client.on('message', function message(data, flags) {
			log('bridge client sends: '+(typeof data));
		}).on('close',function(code, message){
			console.log('bridge client  close: '+code+' '+message);
		}).on('error',function(error){
			console.log('bridge client error: '+error)
		});
		
	}).on('pair',function(server, client){
		
		console.log('bridge paired server client sockets');
	});

	
	
	
}


module.exports={
		logAutoconnectProxy:logAutoconnectProxy
		logBridgeProxy:logBridgeProxy
		
}