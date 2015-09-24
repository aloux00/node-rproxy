/**
 * 
 */



console.log(
		'This is local ssh test, ssh traffic will be routed through rproxy. You need to have an extra terminal open, and you will need to run: '+
'ssh user@localhost -p 9104');

var rproxy=require('../');
var TCPEcho=rproxy.TCPEchoServer;
var TCPAutoConnect=rproxy.TCPAutoConnect;
var BridgeProxy=rproxy.Bridge;
var TCPWSProxy=rproxy.TCPWSProxy;


var bridge=new BridgeProxy({port:9103, basicauth:'nickolanack:nick'},function(){

	var autoconnect=new TCPAutoConnect({source:'ws://nickolanack:nick@localhost:9103', destination:22});
	var tcp=new TCPWSProxy({source:9104, destination:'ws://localhost:9103'},function(){				 
		console.log('Ok, everything looks good, try to run: ssh user@localhost -p 9104');
	});
	
});


