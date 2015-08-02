/**
 * 
 */

var assert=require('assert');
assert.equal(true, true);

var ws=require('ws');

// a ws server that just echos back all messages...
var echo=(new ws.Server({
	port: 9001
})).on('connection', function(wsclient){
	
	wsclient.on('message',function(message){
		wsclient.send(message);
	})
	
});

// a bridge server.
var WSBridge=require('../bridgeproxy.js');
var bridge=new WSBridge({port:9002});
var WSAuto=require('../autoconnectproxy.js');
var autoconnect=new WSAuto({source:'ws://localhost:9002', destination:'ws://localhost:9001'});

var clients=0;

for(var i=0;i< 250; i++){
	
	clients++;
	(function(i){
		var client=(new ws('ws://localhost:9002')).on('open', function(){
			var tm=setTimeout(function(){}, assert.fail('#'+i+' expected response by now.'))
			this.on('message',function(message){
				
				assert.equal(message, 'hello world');
				clearTimeout(tm);
				this.close();
				clients--;
				if(clients==0){
					
					echo.close();
					autoconnect.close();
					bridge.close();
					
				}
			});
			
			this.send('hello world');
			
		});
	})(i);
	
}
