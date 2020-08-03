import DockerEvents from 'docker-events';
import ContainerEvents from './ContainerEvents.js';
import NetworkEvents from './NetworkEvents.js';

class EventHandler {

    constructor(api,docker) {

        this.api = api;
        this.docker = docker;

        this.containerEvents = new ContainerEvents(api,docker);
        this.networkEvents = new NetworkEvents(docker);
        
        const emitter = new DockerEvents({ docker: this.docker });
        
        emitter.start();
        
        emitter.on('connect',() => console.log('Connected to Docker API') );
        emitter.on('_message',(msg) => this.messageHandler(msg));
    }

    messageHandler(msg) {

        const type = msg.Type+"_"+msg.Action;

        switch(type) {

            case 'container_start':
                this.containerEvents.create(msg);
                break;
            case 'container_die':
                this.containerEvents.remove(msg);
                break;
            case 'network_create': 
                this.networkEvents.create(msg);
                break;
            case 'network_remove':
                this.networkEvents.remove(msg);
                break;
        }

    }
};

export default EventHandler;