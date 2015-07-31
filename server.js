/**
 * 
 */


var WebSocket = require('ws');
if(process.argv[1].indexOf('ws:')!==0){
	throw new Error('Requires websocket address argument: ie: www.host.com:port/path');
}
var ws = new WebSocket(process.argv[1]);

ws.on('open', function open() {
	 
		console.log('opened');
	
	});