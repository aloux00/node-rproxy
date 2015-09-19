/**
 * 
 */


var events = require('events');
var ws = require('ws');


function EchoServer(config, callback){

	var me=this;
	events.EventEmitter.call(me);

	me.echo=(new ws.Server({
		port: config.port
	},callback).on('connection', function(wsclient){

		wsclient.on('message',function(message){
			wsclient.send(message);
			//console.log('endpoint echos: '+message);
		});

	});

}


EchoServer.prototype.__proto__ = events.EventEmitter.prototype;
EchoServer.prototype.close = function(){
	
	var me=this;
	me.echo.close();
	
	
}

module.exports=EchoServer