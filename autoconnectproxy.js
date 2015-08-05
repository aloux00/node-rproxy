/**
 * A self connecting Websocket client-client proxy. 
 * 
 * expects two arguments like: ws://user:pass@source.socket.com:port/path ws://dest.socket.com:port/path 
 * where the source is a kind of websocket slave proxy (slaveproxy.js) 
 * 
 */



function WSAutoconnectProxy(config){

	var me=this;
	me._primedConnections=[];
	me._isRunning=true;
	for(var i=0;i<10;i++){
		me._primeSourceConnection(config);
	}


};

WSAutoconnectProxy.prototype._primeSourceConnection=function(config){
	var me=this;
	if(!me._primedConnections){
		me._primedConnections=[];

	}

	var WSocket = require('ws');

	/**
	 * creates a half connected socket. that immediately connects to the source, and once data is recieved, connects to the destination.
	 */

	var source=(new WSocket(config.source)).on('open',function(){
		//me._sourceConnections.push(source);
		console.log('connected proxy');
		me._primedConnections.push(source);
	}).once('message', function message(data, flags) {

		me._primedConnections.splice(me._primedConnections.indexOf(source),1);


		var destination=(new WSocket(config.destination)).on('open', function() {
			//me._destConnections.push(dest);

			destination.send(data);



			source.on('message', function message(data, flags) {
				console.log('autoconnect proxy source sends: '+(typeof data));
				destination.send(data);
			}).on('error',function(error){
				console.log('autoconnect proxy source error: '+error)
			}).on('close',function(code, message){
				console.log('autoconnect proxy source close: '+code+' '+message);
				source=null;
				if(destination){
					destination.close();
				}
				if(me._isRunning){
					me._primeSourceConnection(config);
				}
			});

			destination.on('message', function message(data, flags) {
				console.log('autoconnect proxy destination sends: '+(typeof data));
				source.send(data);
			}).on('error',function(error){
				console.log('autoconnect proxy destination error: '+error)
			}).on('close',function(code, message){
				console.log('autoconnect proxy destination close: '+code+' '+message);

				destination=null;
				if(source){
					source.close();
				}

			});

		});


		me._primeSourceConnection(config);

	});

}
WSAutoconnectProxy.prototype.close=function(){
	var me=this;
	me._isRunning=false;
	me._primedConnections.forEach(function(con){
		con.close();
	});


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
					throw new Error('Requires websocket source and destination address arguments: ie: www.host.com:port/path ('+process.argc+')');
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
