/**
 * 
 */


var events = require('events');
var net = require('net');
var WS = require('ws')


function TCPWSProxy(config, callback) {

	var me = this;

	events.EventEmitter.call(me);



	me.server = net.createServer(function(socket) { //'connection' listener

		console.log('TCP to WS: Recieved local tcp connection');
		var buffer = [];
		var bufferFn = buffer.push.bind(buffer);
		socket.on('data', bufferFn);


		var pingInterval;

		var wsclient = new WS(config.destination).on('open', function() {

			console.log('Established Websocket Connection: ' + config.destination);

			socket.removeListener('data', bufferFn);
			socket.on('data', wsclient.send.bind(wsclient));
			wsclient.on('message', socket.write.bind(socket));

			buffer.forEach(function(data) {
				wsclient.send(data);
			});


			pingInterval = setInterval(function() {
				wsclient.ping();
				//console.log('ping');
			}, 10000);


		});


		wsclient.on('error', function(e) {
			console.log('Websock Error: ' + e.message);
		}).on('close', function() {
			clearInterval(pingInterval);
			console.log('Websock Close: ' + JSON.stringify(arguments));
		});



		socket.on('error', function(e) {
			console.log('TCP Sock Error: ' + e.message);
		}).on('close', function() {
			console.log('TCP Sock Close: ' + JSON.stringify(arguments));
		});

	});

	me.server.listen(config.source, callback).on('error', function(e) {
		console.log('TCP Server Error: ' + e.message);
	}).on('close', function() {
		console.log('TCP Server Close: ' + JSON.stringify(arguments));
	});



}


TCPWSProxy.prototype.__proto__ = events.EventEmitter.prototype;
TCPWSProxy.prototype.close = function() {

	var me = this;
	me.server.end();


}

module.exports = TCPWSProxy