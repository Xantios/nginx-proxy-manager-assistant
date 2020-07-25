import dns from 'dns';
import Network from 'dockerode';

class NetworkEvents {

    constructor(docker) {

        this.docker = docker;

        // Map parent to all available networks!
        this.networkMap();
    }

    async networkMap() {

        const parent = await this.findParent();
        let networks = await this.all();
        
        networks.forEach(network => {
            try {
                network.connect({ Container: parent.Id })
                    .then(() => {
                        console.log('Connected to a network');
                    })
                    .catch(e => {});
            }catch(e) {
                // 
            }
        });
    }

    async all() {

        let networks = await this.docker.listNetworks();
        let items = networks.map(item => this.docker.getNetwork(item.Id));

        return items;
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
        //
    }

    remove(msg) {
        //
    }
    
}

export default NetworkEvents;