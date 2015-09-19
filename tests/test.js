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
			 EchoTest({echo:9001, bridge:9002, count:20, eachClient:function(client, i){
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
					 assert.fail(err);
				 }
				 callback(null);
				 
			 });


		 }/*,function(callback){
			 
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
		});



