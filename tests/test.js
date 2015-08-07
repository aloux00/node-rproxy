/**
 * 
 */

var assert=require('assert');
assert.equal(true, true);

var ws=require('ws');

var testNumber=0;

function EchoTest(BridgeProxy, AutoConnectProxy, config, callbackFn){

	var cleanup=function(){}; //reassigned
	
	var callback=function(err, msg){
		callbackFn(err, msg);
		cleanup();
		callback=function(){}; //avoid multiple executions, but don't worry about it below. 
	}
	
	
	var test=testNumber;
	testNumber++;
	console.log('Running Test: '+test);
	//a ws server that just echos back all messages...
	var echo=(new ws.Server({
		port: config.echo
	},function(){
		
		cleanup=function(){
			echo.close();
		}
		

		var basicauth='';
		basicauth='nickolanack:nick';


//		a bridge server. pairs clients with autoconnect proxy connections.
		var WSBridge=require('../bridgeproxy.js');
		var bridge=new WSBridge({
			port:config.bridge,
			basicauth:basicauth
		}, function(){

			var WSAuto=require('../autoconnectproxy.js');

			if(basicauth.length){
				basicauth=basicauth+'@';
			}
			var autoconnect=new WSAuto({source:'ws://'+basicauth+'localhost:'+config.bridge, destination:'ws://localhost:'+config.echo});

			var clients=0;

			if(typeof(config.beforeTest)=='function'){
				config.beforeTest({
					echo:echo,
					bridge:bridge,
					autoconnect:autoconnect
				});
			}
			
			cleanup=function(){
				echo.close();
				bridge.close();
				autoconnect.close();
			}

			var num=config.count;
			for(var i=0;i< num; i++){

				clients++;
				(function(i){
					var success=false;
					var client=new ws('ws://localhost:'+config.bridge);
					
					
					
					client.on('open', function(){
						setTimeout(function(){
							var tm=setTimeout(function(){
								callback(new Error('test '+test+' client#'+i+' expected response by now.'));
							}, 10000);
								client.on('message',function(message){

									if(message!=='hello world'){
										callback(new Error('test '+test+' client#'+i+' expected "hello world", recieved "'+message+'"'));	
									}else{
										
										//was logging a success message here.

									}
									
									success=true;
									clearTimeout(tm);
									this.close();
									clients--;
									if(clients==0){

										setTimeout(function(){
											callback(null); //success
											cleanup();
										},100);

									}
								});
								//console.log('test client #'+i+' sends: hello world');

								client.send('hello world');

						}, i*100);

					}).on('close', function(code, message){

						if(!success){
							callback(new Error('test '+test+' client#'+i+' closed before sending anything: '+code+(message?' - '+message:'')));
							
						}

					}).on('error',function(error){
						
						callback(new Error('test '+test+' client#'+i+' error: '+error));
						
					});
					
					if((typeof config.eachClient)=='function'){
						config.eachClient(client, i);
					}
					
				})(i);

			}


		});



	})).on('connection', function(wsclient){

		wsclient.on('message',function(message){
			wsclient.send(message);
			//console.log('endpoint echos: '+message);
		})

	});



}

//helper
function logAutoconnectProxy(acp){
	
	acp.on('source.connect',function(source){
		
		source.on('open',function(){
			log('autoconnect created proxy: there are '+me._primedConnections.length+' ready sockets');
		}).on('message', function message(data, flags) {
			log('autoconnect proxy source sends: '+(typeof data));
		}).on('close',function(code, message){
			console.log('autoconnect proxy source close: '+code+' '+message);
		}).on('error',function(error){
			console.log('autoconnect proxy source error: '+error);
		});
		
		
	}).on('destination.connect',function(destination){
		
		destination.on('message', function message(data, flags) {
			log('autoconnect proxy destination sends: '+(typeof data));
		}).on('error',function(error){
			console.error('autoconnect proxy destination error: '+error+' | '+(typeof error));
		}).on('close',function(code, message){
			console.log('autoconnect proxy destination close: '+code+' '+message);
		});
		
	});
	
}



var series=require("async").series(
		[
		 function(callback){
			 //test direct load
			 EchoTest(require('../bridgeproxy.js'), require('../autoconnectproxy.js'), {echo:9001, bridge:9002, count:20, eachClient:function(client, i){
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
			 EchoTest(require('../bridgeproxy.js'), require('../autoconnectproxy.js'), {echo:9001, bridge:9002, count:5, eachClient:function(client, i){
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
			 EchoTest(require('../index.js').AutoConnect, require('../index.js').Bridge, {echo:9003, bridge:9004, count:5, eachClient:function(client, i){
				 client.on('message',function(m){
					 console.log('test 0, client '+i+' success');
				 });
			 }}, function(err, message){

				 if(err){	
					 assert.fail(err);
				 }
				 callback(null);
				 
			 });


		 },function(callback){

			 //trigger errors. application stops running
			 EchoTest(require('../index.js').AutoConnect, require('../index.js').Bridge, {echo:9001, bridge:9002, count:1, beforeTest:function(sockets){

				 sockets.echo.close(); //kill the 'application server' but keep the proxies
				 logAutoconnectProxy(autoconnect);
				 

			 }}, function(err, message){

				 if(!err){	
					 assert.fail(err.message);
				 }
				 callback(err);
				 
			 });



		 }
		 ],
		 function(err, results) {
			if(err){
				assert.fail(err.message||err);
			}
			console.log('tests completed successfully');
		});



