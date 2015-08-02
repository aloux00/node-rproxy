/**
 * Bridge proxy
 * 
 */



function WSBridgeProxy(config){

	// Simple websocket server

	var port = config.port;
	var serverconnections=[];
	var clientconnections=[];
	
	var atob=require('atob');

	(new (require('ws').Server)({
		port: port
	})).on('connection', function(wsclient){

		if((typeof wsclient.upgradeReq.headers.authorization)!='undefined'){
			//console.log(wsclient.upgradeReq)
			var b64auth=wsclient.upgradeReq.headers.authorization.split(' ')[1];
			var basicauth=atob(b64auth);
			if(basicauth===config.basicauth){
				serverconnections.push(wsclient)
			}else{
				console.log('Basic auth attempt invalid: '+b64auth+' = ' +basicauth+' | '+config.basicauth)
				wsclient.close(3000,'Basic auth attempt invalid');
			}
		}else{
			clientconnections.push(wsclient);
		}
		
		while(serverconnections.length&&clientconnections.length){
			
			var a=serverconnections.shift();
			var b=clientconnections.shift();

			a.on('message', function message(data, flags) {
				console.log('master sent '+data);
				b.send(data);
			}).on('error',function(error){
				console.log('a error: '+error)
			}).on('close',function(code, message){
				console.log('a close: '+code+' '+message);
				a=null;
				if(b){
					b.close();
				}
			});

			b.on('message', function message(data, flags) {
				console.log('client sent '+data);
				a.send(data);

			}).on('error',function(error){
				console.log('b error: '+error)
			}).on('close',function(code, message){
				console.log('b close: '+code+' '+message);
				b=null;
				if(a){
					a.close();
				}

			});
			
			
			
		}





	}).on('error', function(error){
		console.log('error: '+error);
	})

	console.log('websocket listening on: '+port);

};

module.exports=WSBridgeProxy;


//console.log(argv);


if(process.argv){
	
	console.log(process.argv);
	
	var fs=require('fs');
	fs.realpath(process.argv[1],function(err, p1){

		fs.realpath(__filename,function(err, p2){

			console.log(p1+' '+p2);
			
			if(p1===p2){


				if(process.argc==3){
					new WSBridgeProxy({port:parseInt(process.argv[2])});
				}else{
					new WSBridgeProxy(require('./bridgeproxy.json'));
				}


			}

		});
	});
}

