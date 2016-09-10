/**
 * A self connecting Websocket client-client proxy. 
 * 
 * expects two arguments like: ws://user:pass@source.socket.com:port/path ws://dest.socket.com:port/path 
 * where the source is a kind of websocket slave proxy (slaveproxy.js) 
 * 
 */



var WSocket = require('ws');

var events = require('events');

function WSAutoconnectProxy(options, callback) {

	var me = this;
	events.EventEmitter.call(me);
	me._primedConnections = [];
	me._isRunning = true;

	var config = {
		retry: 0,

		//source: 'ws://user:pass@url' this should point to an running instance of bridgeproxy.js,
		//destination: // 'ws://localhost:port' this should be some app with a websocket interface,
		ping: 15,
		connections: 10
	};

	Object.keys(options).forEach(function(key) {
		config[key] = options[key];
	});

	me.config = config;

	me.once('source.connect', function(source) {
		console.log('autoconnectproxy listening: ' + me._pwd(me.config.source) + ' => ' + me._pwd(me.config.destination));
		source.on('error', function(err) {
			console.log('first connection to source error');
			console.log(err);
			me.emit('error', new Error('Failed to connect to source (bridgeproxy?). Is it reachable, check ports and firewall config'));
			me._stop();
		});
	});

	me.once('destination.connect', function(destination) {

		destination.on('error', function(err) {
			console.log('first connection to destination error');
			console.log(err);
			me.emit('error', new Error('Failed to connect to destination (application?). Is it reachable, check ports and firewall config'));
			me._stop();
		});
	});

	var poolInterval;
	var checkPrimedConnections = function() {

		if (me._isRunning) {
			for (var i = me.connectionPoolCount(); i < me.config.connections; i++) {
				setTimeout(function() {
					me._primeSourceConnection();
				}, 100 + (i * 25));
			}
		} else {
			clearInterval(poolInterval);
		}

	};

	poolInterval = setInterval(checkPrimedConnections, 1000 * 60);
	checkPrimedConnections();


};



WSAutoconnectProxy.prototype.__proto__ = events.EventEmitter.prototype;
WSAutoconnectProxy.prototype.connectionPoolCount = function() {
	var me = this;
	return me._primedConnections.length;
}

WSAutoconnectProxy.prototype._configure = function(a, b) {


}
WSAutoconnectProxy.prototype._pwd = function(str) {

	var at = str.indexOf('@');
	var cln = str.lastIndexOf(':', at) + 1;
	var substr = str.substring(cln, at);
	var replace = '';
	for (var i = 0; i < substr.length; i++) {
		replace += '*';
	}
	return str.substring(0, cln) + replace + str.substring(at);

}
WSAutoconnectProxy.prototype.connectionPool = function() {
	var me = this;
	return me._primedConnections.slice(0);
}
WSAutoconnectProxy.prototype._removeSourceConnectionFromPool = function(source) {

	var me = this;
	var i = me._primedConnections.indexOf(source);
	if (i >= 0) {
		me._primedConnections.splice(i);
	}

}
WSAutoconnectProxy.prototype._primeSourceConnection = function() {
	var me = this;

	var source = null;
	var destination = null;

	var cleanup = function() {
		if (source != null) {
			source.close();
		}
		if (destination != null) {
			destination.close();
		}

		source = null;
		destination = null;
	}

	return me._connectToSource(function(src) {
		source = src.on('close', cleanup).on('error', cleanup);
	}, function(dest) {
		destination = dest.on('close', cleanup).on('error', cleanup);
	});

}
WSAutoconnectProxy.prototype._connectToSource = function(callbackSource, callbackDest) {
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
		destination.on('open', function() {
			destination.send(data);
		});
		callbackDest(destination);
		me._primeSourceConnection();

	}).on('close', function(code, message) {
		if (me._isRunning) {
			if (me.connectionPoolCount() < me.config.connections) {
				me._primeSourceConnection();
			}
		}

		me._removeSourceConnectionFromPool(source);
		clearInterval(pingInterval);
	}).on('error', function() {
		if (me._isRunning) {
			if (me.connectionPoolCount() < me.config.connections) {
				me._primeSourceConnection();
			}


		}

		me._removeSourceConnectionFromPool(source);
		clearInterval(pingInterval);
	});
	me.emit('source.connect', source);
	callbackSource(source);
	return source;
};
WSAutoconnectProxy.prototype._connectSourceToDestination = function(source) {
	var me = this;
	var destination = (new WSocket(me.config.destination)).on('open', function() {

		source.on('message', destination.send.bind(destination));
		destination.on('message', source.send.bind(source));

	});
	me.emit('destination.connect', destination);
	return destination;
}

WSAutoconnectProxy.prototype.close = function() {
	var me = this;
	me._stop();
	me.emit('close');


};
WSAutoconnectProxy.prototype._stop = function() {
	var me = this;
	me._isRunning = false;
	me._primedConnections.forEach(function(con) {
		con.close();
	});


};

module.exports = WSAutoconnectProxy;


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
					throw new Error('Requires websocket source and destination address arguments: ie: www.host.com:port/path (' + process.argc + ')');
				}

				if (process.argv[2].indexOf('ws:') !== 0) {
					throw new Error('Requires websocket source address argument: ie: www.host.com:port/path');
				}

				if (process.argv[3].indexOf('ws:') !== 0) {
					throw new Error('Requires websocket destination address argument: ie: www.host.com:port/path');
				}


				new WSAutoconnectProxy({
					source: process.argv[2],
					destination: process.argv[3]
				});


			}

		});
	});
}