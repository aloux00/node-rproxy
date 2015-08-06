/**
 * 
 */

var assert=require('assert');
assert.equal(true, true);

var ws=require('ws');



function EchoTest(BridgeProxy, AutoConnectProxy, ports, callback){
	
	
	//a ws server that just echos back all messages...
	var echo=(new ws.Server({
		port: ports.echo
	})).on('connection', function(wsclient){

		wsclient.on('message',function(message){
			wsclient.send(message);
			console.log('endpoint echos: '+message);
		})

	});
	
	var basicauth='';
	basicauth='nickolanack:nick';


//	a bridge server. pairs clients with autoconnect proxy connections.
	var WSBridge=require('../bridgeproxy.js');
	var bridge=new WSBridge({
		port:ports.bridge,
		basicauth:basicauth
	});
	var WSAuto=require('../autoconnectproxy.js');

	if(basicauth.length){
		basicauth=basicauth+'@';
	}
	var autoconnect=new WSAuto({source:'ws://'+basicauth+'localhost:'+ports.bridge, destination:'ws://localhost:'+ports.echo});

	var clients=0;

	var num=50
	for(var i=0;i< num; i++){

		clients++;
		(function(i){
			var client=(new ws('ws://localhost:'+ports.bridge)).on('open', function(){
				setTimeout(function(){
					var tm=setTimeout(function(){
						assert.fail('#'+i+' expected response by now.');
					}, 10000);
					client.on('message',function(message){

						assert.equal(message, 'hello world');
						console.log('test client #'+i+' recieves: hello world');
						clearTimeout(tm);
						this.close();
						clients--;
						if(clients==0){

							setTimeout(function(){
								echo.close();
								autoconnect.close();
								bridge.close();
							},100);

						}
					});
					console.log('test client #'+i+' sends: hello world');

					client.send('hello world');
					if(i==num-1){
						if((typeof callback)=='function'){
							callback();
						}
					}
				}, i*100);

			});
		})(i);

	}

}

//test direct load
EchoTest(require('../bridgeproxy.js'), require('../autoconnectproxy.js'), {echo:9001, bridge:9002}, function(){
	
	EchoTest(require('../index.js').AutoConnect, require('../index.js').Bridge, {echo:9003, bridge:9004});
	
});



