/**
 * 
 */


var events = require('events');
var net = require('net');


function TCPEchoServer(config, callback){

	var me=this;
	events.EventEmitter.call(me);


	me.echo = net.createServer(function(c) { //'connection' listener

	  c.on('data',function(data){
		  
		  console.log('echo: data: '+data);
		  c.write(data);
		  
	  
	  });
	  
	}).listen(config.port, callback);
	
	

}


TCPEchoServer.prototype.__proto__ = events.EventEmitter.prototype;
TCPEchoServer.prototype.close = function(){
	
	var me=this;
	me.echo.close();
	
	
}

module.exports=TCPEchoServer