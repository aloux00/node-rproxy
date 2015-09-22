/**
 * 
 */
var assert=require('assert');
assert.equal(true, true);
var EchoTest=require('./echo.js');

var series=require("async").series(
		[
		 function(callback){
			 //test direct load
			 EchoTest({echo:9001, bridge:9002, count:20, verbose:false, eachClient:function(client, i){
				 client.on('message',function(m){
					 console.log('test 0, client '+i+' success');
				 });
			 }}, function(err, message){

				 if(err){	
					 assert.fail(err.message||err);
				 }

				 callback(null);

			 });
		 },
		 function(callback){
			 // test same ports - cleanup must complete
			 EchoTest({echo:9001, bridge:9002, count:5, eachClient:function(client, i){
				 client.on('message',function(m){
					 console.log('test 0, client '+i+' success');
				 });
			 }}, function(err, message){

				 if(err){	
					 assert.fail(err);
				 }
				 callback(null);

			 });
		 },
		 function(callback){
			 //test using index, this should be the same as require('node-rproxy')
			 EchoTest({echo:9003, bridge:9004, count:5, eachClient:function(client, i){
				 client.on('message',function(m){
					 console.log('test 0, client '+i+' success');
				 });
			 }}, function(err, message){

				 if(err){	
					 assert.fail(err.message||err);
				 }
				 callback(null);

			 });


		 },
		 function(callback){

			 console.log('tcp test');

			 var rproxy=require('../');
			 var TCPEcho=rproxy.TCPEchoServer;
			 var TCPAutoConnect=rproxy.TCPAutoConnect;
			 var BridgeProxy=rproxy.Bridge;

			 var echo=new TCPEcho({port:9101}, function(){
				 console.log('tcp echo server listening');
			 });
			 var bridge=new BridgeProxy({port:9102, basicauth:'nickolanack:nick'},function(){
				
				 rproxy.util.logBridgeProxy(bridge)
				 var autoconnect=new TCPAutoConnect({source:'ws://nickolanack:nick@localhost:9102', destination:9101});
				 rproxy.util.logAutoconnectProxy(autoconnect)

				 var ws=require('ws');
				 var client=new ws('ws://localhost:9102');

				 client.on('open', function(){

					 client.on('message',function(message){
						 console.log('client recieved: '+message)
						 assert.equal(message,'hello world');
						 callback(null);
					 });
					 client.send('hello world');
					 setTimeout(function(){
						 callback(new Error('did not recieve echo'));
					 },3000);

				 });
				 
				 
			 });
			 





		 }


		 /*,function(callback){

			 //trigger errors. application stops running
			 EchoTest(require('../index.js').AutoConnect, require('../index.js').Bridge, {echo:9001, bridge:9002, count:1, beforeTest:function(sockets){

				 console.log('Closing echo server to trigger error');
				 logAutoconnectProxy(sockets.autoconnect);
				 sockets.echo.close(); //kill the 'application server' but keep the proxies



			 }}, function(err, message){
				 console.log('Error Test:');
				 if(!err){	
					 assert.fail('Expected connection error: No Destination Error');
				 }
				 console.log(err.message);
				 callback(null);

			 });



		 }*/ //disabled this test...
		 ],
		 function(err, results) {
			if(err){
				assert.fail(err.message||err);
			}
			console.log('tests completed successfully');
			process.exit(0);
		});



