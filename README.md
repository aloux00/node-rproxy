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

rproxy autoconnect (autoconnectproxy.js) runs on the endpoint and provides connections to the public wesocket proxy (slaveproxy.js) that connects to real clients. autoconnectproxy.js assumes that the client (real client) initiates communication by sending data first. autoconnectproxy.js waits for the first message and then connects the other end of the connection to the real webserver app. slaveproxy.js is a websocket server that must distinguish between connections from autoconnectproxy.js and real clients and for each real client, it must have a autoconnectproxy connection to pair.

slaveproxy.js is run like this: 
```

 # start rproxy slaveproxy.js
 # this will start the public proxy server, without any endpoint set up.
 node slaveproxy.js 8080
```

autoconnectproxy.js is run like this: 
```
 # start real websocket app to listen on port 8080:
 # node rpi-webapp 8080
 
 # start rproxy autoconnectproxy.js
 # this will connect to the public server immediately so it should be running...
 node autoconnectproxy.js ws://my.public.websocket:8080 ws://localhost:8080
```


