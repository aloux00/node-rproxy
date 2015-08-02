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
var bridge=(new (require('../bridgeproxy.js'))({port:9002}));

var autoconnect=(new (require('../autoconnectproxy.js'))({source:'ws://localhost:9002', destination:'ws://localhost:9001'}));


var client=(new ws('ws://localhost:9002')).on('open', function(){
	
	this.on('message',function(message){
		
		assert.equal(message,'hello world');
		
	});
	this.send('hello world');
	
});