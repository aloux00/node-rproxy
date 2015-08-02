/**
 * 
 */

var assert=require('assert');
assert.equal(true, true);



// a ws server that just echos back all messages...
var echo=(new (require('ws').Server)({
	port: 9001
})).on('connection', function(wsclient){
	
	wsclient.on('message',function(message){
		wsclient.send(message);
	})
	
});



// a bridge server.
var bridge=(new (require('../WSBridgeProxy.js').WSBridgeProxy)({port:9002}));

var autoconnect=(new (require('../WSAutoconnectProxy.js').WSAutoconnectProxy)({source:'ws://localhost:9002', destination:'ws://localhost:9001'}));


var client=(new (require('ws')('ws://localhost:9002')).on('open', function() {
	
	this.on('message',function(message){
		
		assert.equal(message,'hello world');
		
	});
	this.send('hello world');
	
});