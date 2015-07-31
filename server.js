/**
 * 
 */


var WebSocket = require('ws');
if(process.argv[2].indexOf('ws:')!==0){
	throw new Error('Requires websocket address argument: ie: www.host.com:port/path');
}
var ws = new WebSocket(process.argv[2]);

ws.on('open', function open() {
	 
		console.log('opened');
	
	});