import dns from 'dns';

/**
 * We have to manage the networks the nginx container is connected to a bit.
 * 
 * Nginx can only proxy to networks it can actually reach, so we have to make sure we connect to networks when needed.
 * 
 * There is a default network created when using docker-compose 
 * We need to be connected to that at all times to reach the database.
 * 
 * We also need a connection to the bridge so we can connect to our LAN/WAN network
 * 
 * When a container is created using docker-compose we want to connect to that network so we can proxy to it.
 * When a container is created in a seperated network we want to connect to that network to.
 *
 */
class NetworkEvents {

    constructor(docker) {
        this.docker = docker;
        this.networks = [];

        this.parent = null;
        this.exclude = '';

        this.networkSetup();
    }

    async networkSetup() {

        console.log('==> Running network setup...');

        this.parent = await this.findParent();
        this.exclude = this.parent.Labels['com.docker.compose.project']+"_default";

        const networks = await this.all();
        
        Object
            .keys(this.parent.NetworkSettings.Networks)
            .filter(name => (name!==this.exclude && name!=="bridge"))
            .forEach(name => {
                const network_id = this.parent.NetworkSettings.Networks[name].NetworkID;
                this.disconnect(this.parent.Id,network_id);
            });

        networks.map(async _item => {
            let item = await _item.inspect();

            if(item.Name==='bridge') {
                await this.connect(this.parent.Id,item.Id);
            }

        });

    }

    async all() {
        let networks = await this.docker.listNetworks();
        return networks.map(item => this.docker.getNetwork(item.Id));
    }

    async findParent() {
        
        // Resolve the IP
        const lookup = await dns.promises.lookup('app');
        const ip = lookup.address;

        // Find the container
        const containers = await this.docker.listContainers();
        const container = containers.find(item => {
            
            let networks = Object.values(item.NetworkSettings.Networks);
            let match = networks.find(network => (network.IPAddress==ip));

            if(!match) {
                return false;
            }

            return match;
        });

        return container;
    }
 
    create(msg) {
        console.log('Network created: ',msg);
    }

    remove(msg) {
        console.log('Network removed: ',msg);
    }

    async connected(msg) {

        const network_id = msg.Actor.ID;
        const container_id = msg.Actor.Attributes.container;

        // Check container
        const _network = await this.docker.getNetwork(network_id);
        const _container = await this.docker.getContainer(container_id);

        const container = await _container.inspect();
        const network = await _network.inspect();

        // Check if this container has a virtual_host set.
        let vhost = container.Config.Env.find(item => item.split('=')[0] == "VIRTUAL_HOST") || null;

        if(!vhost) return false;
        if(network.Name == "host" || network.Name == "bridge" || network.name == this.exclude) return false;

        await this.connect(container_id,network_id);
    }

    async connect(container_id,network_id) {

        /**
         * Collect data 
         */
        const network = await this.docker.getNetwork(network_id);
        const container = await this.docker.getContainer(container_id);

        const networkDetails = await network.inspect();
        const containerDetails = await container.inspect();

        /** Try to connect */
        try {
            
            console.log('==> Connecting '+containerDetails.Name+" to "+networkDetails.Name);

            const ret = await network.connect({
                Container: container_id
            });

            return ret;
        } catch(e) {
            console.log('Can not connect container '+containerDetails.Name+' to '+networkDetails.Name,e);
        }
    }

    async disconnect(container,network_id) {

        try {
            const network = await this.docker.getNetwork(network_id);
            const ret = await network.disconnect({
                Container: container,
                Force: true
            });
        } catch(e) {
            console.log('Oops! ',e);
        }
    }
    
}

export default NetworkEvents;