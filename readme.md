## Nginx Proxy Manager Assistent

Its the assistent you've always wanted (if you wanted a auto-router for incoming traffic to docker containers that is)
Basically it talks to the Docker API and the [jc21/nginx-proxy-manager](https://github.com/jc21/nginx-proxy-manager/)

The jc21 manager has a great interface and already does most of the heavy lifting i want and need for my network, except for automatic routing to my docker containers.

## Quickstart

Copy/paste `docker-compose.example.yml` to `docker-compose.yml` modify to your likings and run `docker-compose up`
