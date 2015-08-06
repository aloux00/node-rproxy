[![Build Status](https://travis-ci.org/nickolanack/node-rproxy.svg?branch=master)](https://travis-ci.org/nickolanack/node-rproxy)

# node-rproxy
kind of like a proxy web server - but the endpoint is established and maintained by the endpoint itself so that it can easily exist behind a NAT. 

This project is proof of concept at this point, and should not be used in any sort of production environment.

###Situation.
I have a websever (webapp) that is behind a firewall/NAT such that there is no way for clients to establish a connection. 
Port forwarding is not an option - and relying on port forwarding is not great anyway, in my oppinion (even if it's just one less thing to configure). 
I do, however, have access to a public webserver and i would like to use it to proxy my private webapp but the webapp will
have to establish the connection to the public proxy server becuase the public proxy server can't. 

 - why not just put the private webapp on the public server? The app is run on a raspberry pi and serves a website that controls devices 
 in my home. sprinker system, lights, automatic blinds, climate control, etc (well I haven't quite got all that set up). anyway it is 
 best to keep the rpi where it is.
 
Anyway the rpi serves the app, and using node-rproxy it is intended to be able to provide a public interface to an otherwise unreachable service.



{private network [webapp]-[rproxy autoconnect]}-----web----{[rproxy slave] public server}
 
##rproxy setup

<img src="https://raw.github.com/nickolanack/node-rproxy/master/diagram.png" height="300px"/>

rproxy autoconnect (autoconnectproxy.js) runs on the endpoint and provides connections to the public wesocket proxy (bridgeproxy.js) that connects to real clients. **autoconnectproxy.js assumes that the client (real client) initiates communication by sending data first** (request - response). autoconnectproxy.js waits for the first message and then connects the other end of the connection to the real webserver app. bridgeproxy.js is a websocket server that must distinguish between connections from autoconnectproxy.js and real clients and for each real client, it must have aa autoconnectproxy connection ready to pair (otherwise the client is buffered until one is ready). 

Alternatively, I could have used a seperate ports for server and client connections however in my situation I have a limited number publicly open ports, And the primary
use for this application is to provide functionality in situations where it is not possible to configure firewall/router settings.

bridgeproxy.js is run like this on the public server: 
```
 # assuming that you want to serve your websocket app to the world on port 8080

 # log into your public server
 # start rproxy bridgeproxy.js
 # this will start the public proxy server, without any endpoint set up. but clients 
 # can connect immediatel, and will be buffered.
 
 sudo node bridgeproxy.js 8080 username:password
 
 # username:password is used to differentiate client and autoconnectproxy connections
 
```

autoconnectproxy.js is run like this on the webapp private server: 
```
 # start real websocket app to listen on port 8080:
 # node rpi-webapp 8080
 
 # start rproxy autoconnectproxy.js
 # this will connect to the public server immediately so it should be running...
 
 node autoconnectproxy.js ws://username:password@my.public.websocket:8080 ws://localhost:8080
 
 # username:password should match that of bridgeproxy.js
 
```

note: autoconnectproxy.js waits for data from the client, before connecting it's other end to the application. This is becuase autoconnectproxy.js creates a number of 'primed'
connections with the brideproxy server, and thus autoconnectproxy.js has no way of knowing when a client connects other than on transfer of data. Additionally, I did not want
the application server to have connections from autoconnectproxy.js before real clients are established becuase any data sent from the application in this case would be discarded
and might cause strange behavior depending on what the application does. 

