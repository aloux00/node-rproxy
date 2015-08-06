/**
 * 
 */

var assert=require('assert');
assert.equal(true, true);

var ws=require('ws');

var testNumber=0;

function EchoTest(BridgeProxy, AutoConnectProxy, config, callback){

	var test=testNumber;
	testNumber++;
	
	//a ws server that just echos back all messages...
	var echo=(new ws.Server({
		port: config.echo
	})).on('connection', function(wsclient){

		wsclient.on('message',function(message){
			wsclient.send(message);
			//console.log('endpoint echos: '+message);
		})

	});

	var basicauth='';
	basicauth='nickolanack:nick';


//	a bridge server. pairs clients with autoconnect proxy connections.
	var WSBridge=require('../bridgeproxy.js');
	var bridge=new WSBridge({
		port:config.bridge,
		basicauth:basicauth
	});
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
		})
	}

	var num=config.count;
	for(var i=0;i< num; i++){

		clients++;
		(function(i){
			var success=false;
			var client=(new ws('ws://localhost:'+config.bridge)).on('open', function(){
				setTimeout(function(){
					var tm=setTimeout(function(){
						assert.fail('test '+test+' client#'+i+' expected response by now.');
						callback(true, false);
					}, 10000);
					client.on('message',function(message){

						assert.equal(message, 'hello world', 'test '+test+' client#'+i+' echo failure, recieved: '+message);
						console.log('test '+test+' client#'+i+' success');
						success=true;
						clearTimeout(tm);
						this.close();
						clients--;
						if(clients==0){

							setTimeout(function(){
								echo.close();
								autoconnect.close();
								bridge.close();
								callback(null, true);
							},100);

						}
					});
					//console.log('test client #'+i+' sends: hello world');

					client.send('hello world');
					
				}, i*100);

			}).on('close', function(code, message){
				
				if(!success){
					assert.fail('test '+test+' client#'+i+' closed before sending anything: '+code+' - '+message);
				}
				
			}).on('error',function(error){
				
				assert.fail('test '+test+' client#'+i+' error: '+error);
				
			});
		})(i);

	}

}

var series=require("async").series(
		[
        function(callback){
        	//test direct load
        	EchoTest(require('../bridgeproxy.js'), require('../autoconnectproxy.js'), {echo:9001, bridge:9002, count:50},callback);
        },
        function(callback){
        	// test same ports - cleanup must complete
        	EchoTest(require('../bridgeproxy.js'), require('../autoconnectproxy.js'), {echo:9001, bridge:9002, count:5},callback);
        },
        function(callback){
        	//test using index, this should be the same as require('node-rproxy')
        	EchoTest(require('../index.js').AutoConnect, require('../index.js').Bridge, {echo:9003, bridge:9004, count:5}, callback);
        },function(callback){
        	
        	
       
        	//trigger errors. application stops running
        	EchoTest(require('../index.js').AutoConnect, require('../index.js').Bridge, {echo:9001, bridge:9002, count:5, beforeTest:function(sockets){
        		
        		sockets.echo.close(); //kill the 'application server' but keep the proxies
        		
        		
        	}}, callback);
        	
        	
        	
        }
        ],
        function(err, results) {
		    if(err){
		    	assert.fail('tests failed');
		    }
		    console.log(results);
		});



