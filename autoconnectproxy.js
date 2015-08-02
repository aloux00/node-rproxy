/**
 * A self connecting Websocket client-client proxy. 
 * 
 * expects two arguments like: ws://user:pass@source.socket.com:port/path ws://dest.socket.com:port/path 
 * where the source is a kind of websocket slave proxy (slaveproxy.js) 
 * 
 */



function WSAutoconnectProxy(config){
	
	var me=this;
	
	me.__primeSourceConnection(config);
	
	
};

WSAutoconnectProxy.prototype._primeSourceConnection=function(config){
	var me=this;
//	if(!me._sourceConnections){
//		me._sourceConnections=[];
//		me._destConnections=[];
//	}

	var WSocket = require('ws');

	/**
	 * creates a half connected socket. that immediately connects to the source, and once data is recieved, connects to the destination.
	 */

	var source=(new WSocket(config.source)).on('open',function(){
		//me._sourceConnections.push(source);
		console.log('connected proxy');
		me._primedConnection=source;
	}).once('message', function message(data, flags) {
		me._primedConnection=null;


		var dest=(new WSocket(config.destination)).on('open', function() {
			//me._destConnections.push(dest);
			
			dest.send(data);
			
			
			
			source.on('message', function message(data, flags) {
				dest.send(data);
			}).on('error',function(error){
				console.log('a error: '+error)
			}).on('close',function(code, message){
				console.log('a close: '+code+' '+message);
				source=null;
				if(dest){
					dest.close();
				}
			});
			
			dest.on('message', function message(data, flags) {
				source.send(data);
			}).on('error',function(error){
				console.log('b error: '+error)
			}).on('close',function(code, message){
				console.log('b close: '+code+' '+message);
				
				dest=null;
				if(source){
					source.close();
				}

			});
			
		});
		

		me.__primeSourceConnection(config);

	});
	
}
WSAutoconnectProxy.prototype.close=function(){
	
	if(me._primedConnection!==null){
		me._primedConnection.close();
	}
	
}

module.exports=WSAutoconnectProxy;

if(process.argv){
	
	console.log(process.argv);
	
	var fs=require('fs');
	fs.realpath(process.argv[1],function(err, p1){
		fs.realpath(__filename,function(err, p2){

			console.log(p1+' '+p2);
			
			if(p1===p2){


				if(process.argc!=4){
					throw new Error('Requires websocket source and destination address arguments: ie: www.host.com:port/path');
				}

				if(process.argv[2].indexOf('ws:')!==0){
					throw new Error('Requires websocket source address argument: ie: www.host.com:port/path');
				}

				if(process.argv[3].indexOf('ws:')!==0){
					throw new Error('Requires websocket destination address argument: ie: www.host.com:port/path');
				}


				new WSAutoconnectProxy({source:process.argv[2], destination:process.argv[3]});


			}

		});
	});
}
