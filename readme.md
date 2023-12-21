## Nginx Proxy Manager Assistant

Its the assistant you've always wanted (if you wanted a auto-router for incoming traffic to docker containers that is)
Basically it talks to the Docker API and the [jc21/nginx-proxy-manager](https://github.com/jc21/nginx-proxy-manager/)

The jc21 manager has a great interface and already does most of the heavy lifting i want and need for my network, except for automatic routing to my docker containers.

## Quickstart

Copy/paste `docker-compose.example.yml` to `docker-compose.yml` modify to your likings and run `docker-compose up`

## Got it running, now what?

Run a container with the environment variable `VIRTUAL_HOST` set to whatever you like. 
`docker run -it -p 1337:80 -e VIRTUAL_HOST=proxy.example.com -e VIRTUAL_PORT=1337 httpd`

The assistant will forward to the left port (`1337` of `1337:80`) to route via `VIRTUAL_HOST`, or set `VIRTUAL_PORT` to manually configure the forwarded port.

If you need to generate SSL with Let's Encrypt, remember to add `GEN_CERT=true`.

## Rebuild

`docker-compose build --no-cache`
