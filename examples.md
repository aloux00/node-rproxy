
### Log all events and data etc.

```js




var autoconnect = new require('autoconnectproxy.js')({source:'ws://username:password@where.thepublicserveris.is:port, destination:'ws://where.theapplicationreallyis:port});

autoconnect.on('source.connect',function(source){
		
		source.on('open',function(){
			log('autoconnect created proxy: there are '+me._primedConnections.length+' ready sockets');
		}).on('message', function message(data, flags) {
			log('autoconnect proxy source sends: '+(typeof data));
		}).on('close',function(code, message){
			console.log('autoconnect proxy source close: '+code+' '+message);
		}).on('error',function(error){
			console.log('autoconnect proxy source error: '+error);
		});
		
		
	}).on('destination.connect',function(destination){
		
		destination.on('message', function message(data, flags) {
			log('autoconnect proxy destination sends: '+(typeof data));
		}).on('error',function(error){
			console.error('autoconnect proxy destination error: '+error+' | '+(typeof error));
		}).on('close',function(code, message){
			console.log('autoconnect proxy destination close: '+code+' '+message);
		});
		
	});

```