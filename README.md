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
 
