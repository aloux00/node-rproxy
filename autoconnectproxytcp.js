/**
 * A self connecting tcp-websockt client-client proxy. 
 * 
 * expects two arguments like: ws://user:pass@source.socket.com:port/path ws://dest.socket.com:port/path 
 * where the source is a kind of websocket slave proxy (slaveproxy.js) 
 * 
 */


var WSAutoconnectProxy = require('./autoconnectproxy.js');

var WSocket = require('ws');

var events = require('events');

util = require('util');

var TCPAutoconnectProxy = function() {
	WSAutoconnectProxy.apply(this, arguments);
}
util.inherits(TCPAutoconnectProxy, WSAutoconnectProxy);

TCPAutoconnectProxy.prototype.constructor = WSAutoconnectProxy;
TCPAutoconnectProxy.prototype._connectToSource = function(callbackSource, callbackDest) {
	var me = this;

	var pingTimer = me.config.ping * 1000;
	var pingInterval = null;



	var source = (new WSocket(me.config.source)).on('open', function() {
		me._primedConnections.push(source);

		pingInterval = setInterval(function() {
			try {
				source.ping();
			} catch (e) {

				console.log('ping: not connected');
				console.log(e);

			}
		}, pingTimer);

	}).once('message', function message(data, flags) {

		me._removeSourceConnectionFromPool(source);
		var destination = me._connectSourceToDestination(source);
		destination.on('connect', function() {
			console.log('connected');
			console.log('write data from bridge');

			/**
			 * Added support for bridge to notify destination that a cling has connected. 
			 * the first message sent from the bridge is 'CLIENT CONNECT' this message should not 
			 * be passed on to the destination port but trigger the connection.
			 */

			if(data==='CLIENT CONNECT'){

				console.log('recieved client');

			}else{
				destination.write(data);
			}



			destination.write(data);
		});
		callbackDest(destination);
		me._primeSourceConnection();

	}).on('close', function(code, message) {
		if (me._isRunning) {

			if (me.connectionPoolCount() < me.config.connections) {
				me._primeSourceConnection();
			}

			me._removeSourceConnectionFromPool(source);
		}

		clearInterval(pingInterval);
	}).on('error', function() {
		if (me._isRunning) {

			if (me.connectionPoolCount() < me.config.connections) {
				me._primeSourceConnection();
			}

			me._removeSourceConnectionFromPool(source);

		}
		clearInterval(pingInterval);
	});
	me.emit('source.connect', source);
	callbackSource(source);

	return source;
};
TCPAutoconnectProxy.prototype._primeSourceConnection = function() {
	var me = this;

	var source = null;
	var destination = null;

	var cleanup = function() {
		if (source != null) {
			source.close();
		}
		if (destination != null) {
			destination.end();
		}

		source = null;
		destination = null;
	}

	return me._connectToSource(function(src) {
		source = src.on('close', cleanup).on('error', cleanup);
	}, function(dest) {
		destination = dest.on('end', cleanup).on('close', cleanup).on('error', cleanup);
	});

}
TCPAutoconnectProxy.prototype._connectSourceToDestination = function(source) {



	var me = this;
	//	var destination=(new WSocket(me.config.destination)).on('open', function() {
	//
	//		source.on('message', destination.send.bind(destination));
	//		destination.on('message', source.send.bind(source));
	//
	//	});
	//	me.emit('destination.connect', destination);
	//	return destination;


	var port = me.config.destination;
	var opts = {
		port: port
	};
	if ((typeof port) == 'string') {

		var i = port.indexOf(':');
		if (i > 0) {
			opts.host = port.substring(0, i);
			opts.port = port.substring(i + 1);
		}
	}

	var net = require('net');
	console.log('connecting source to destination ' + JSON.stringify(opts));
	var destination = net.connect(opts,
		function() { //'connect' listener

			source.on('message', function(data) {
				destination.write(data);
			});
			destination.on('data', function(data) {
				source.send(data);
			});

		});
	destination.close = destination.end;

	me.emit('destination.connect', destination);
	return destination;


}


module.exports = TCPAutoconnectProxy;


//run from command line

if (process.argv && process.argv.length > 1) {
	if (!process.argc) {
		process.argc = process.argv.length;
	}
	var fs = require('fs');
	fs.realpath(process.argv[1], function(err, p1) {
		fs.realpath(__filename, function(err, p2) {

			//console.log(p1+' '+p2);

			if (p1 === p2) {


				console.log(process.argv);


				if (process.argc != 4) {
					throw new Error('Requires websocket source and destination address arguments: ie: ws://www.host.com:port/path (' + process.argc + ')');
				}

				if (process.argv[2].indexOf('ws:') !== 0) {
					throw new Error('Requires websocket source address argument: ie: ws://www.host.com:port/path');
				}

				if (process.argv[3].indexOf(':') !== 0) {
					throw new Error('Requires websocket destination address argument: ie: www.host.com:port');
				}


				new TCPAutoconnectProxy({
					source: process.argv[2],
					destination: process.argv[3]
				});


			}

		});
	});
}