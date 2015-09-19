/**
 * 
 */



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
			
			cleanup=function(){
				echo.close();
				bridge.close();
				autoconnect.close();
			}

			if(basicauth.length){
				basicauth=basicauth+'@';
			}
			var autoconnect=new WSAuto({source:'ws://'+basicauth+'localhost:'+config.bridge, destination:'ws://localhost:'+config.echo}).on('error',function(err){
				callback(new Error('test '+test+' autoconnectproxy error'));
			});

			var clients=0;

			if(typeof(config.beforeTest)=='function'){
				config.beforeTest({
					echo:echo,
					bridge:bridge,
					autoconnect:autoconnect
				});
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

						}, i*50);

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
	console.log('adding logger');
	acp.on('source.connect',function(source){
	
		source.on('open',function(){
			console.log('autoconnect created proxy: there are '+acp.connectionPoolCount()+' ready sockets');
		}).on('message', function message(data, flags) {
			console.log('autoconnect proxy source sends: '+(typeof data));
		}).on('close',function(code, message){
			console.log('autoconnect proxy source close: '+code+' '+message);
		}).on('error',function(error){
			console.log('autoconnect proxy source error: '+error);
		});
		
		
	}).on('destination.connect',function(destination){
		
		destination.on('message', function message(data, flags) {
			console.log('autoconnect proxy destination sends: '+(typeof data));
		}).on('error',function(error){
			console.error('autoconnect proxy destination error: '+error+' | '+(typeof error));
		}).on('close',function(code, message){
			console.log('autoconnect proxy destination close: '+code+' '+message);
		});
		
	});
	
}

module.exports=EchoTest;

