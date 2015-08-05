# node-rproxy
kind of like a proxy web server - but the endpoint is established and maintained by the endpoint itself so that it can easily exist behind a NAT. 

This project is proof of concept at this point, and should not be used in any sort of production environment.

###Situation.
I have a websever (webapp) that is behind a firewall/NAT such that there is no way for clients to establish a connection (even local clients).
I also have another webserver that is publicly available and i would like to use it to proxy the private webapp but the webapp will
have to establish the connection to the public proxy server becuase the public proxy server can't.

 - why not just put the private webapp on the public server? The app is run on a raspberry pi and serves a website that controls devices 
 in my home. sprinker system, lights, automatic blinds, climate control, etc (well I haven't quite got all that set up). anyway it is 
 best to keep the rpi where it is.
 
Anyway the rpi serves the app, and using node-rproxy it is intended to be able to provide a public interface. 



{private network [webapp]-[rproxy autoconnect]}-----web----{[rproxy slave] public server}
 
##rproxy setup

rproxy autoconnect (autoconnectproxy.js) runs on the endpoint and provides connections to the public wesocket proxy (bridgeproxy.js) that connects to real clients. autoconnectproxy.js assumes that the client (real client) initiates communication by sending data first. autoconnectproxy.js waits for the first message and then connects the other end of the connection to the real webserver app. bridgeproxy.js is a websocket server that must distinguish between connections from autoconnectproxy.js and real clients and for each real client, it must have a autoconnectproxy connection to pair. alternatively, it would be possible to use a seperate port for server and client connections 
however in my situation I only have any publicly open ports to spare.

bridgeproxy.js is run like this on the public server: 
```
 # assuming that you want to server your websocket app to the world on port 8080

 # log into your public server
 # start rproxy bridgeproxy.js
 # this will start the public proxy server, without any endpoint set up. but clients can connect immediately
 sudo node bridgeproxy.js 8080 username:password
 
```

autoconnectproxy.js is run like this on the webapp private server: 
```
 # start real websocket app to listen on port 8080:
 # node rpi-webapp 8080
 
 # start rproxy autoconnectproxy.js
 # this will connect to the public server immediately so it should be running...
 node autoconnectproxy.js ws://username:password@my.public.websocket:8080 ws://localhost:8080
 
```


