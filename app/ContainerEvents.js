class ContainerEvents {

    constructor(api, docker) {
        this.api = api;
        this.docker = docker;
    }

    create(msg) {

        this.docker
            .getContainer(msg.id)
            .inspect((e, data) => {

                // Extract Vhost
                let vhost = data.Config.Env.find(item => item.split('=')[0] == "VIRTUAL_HOST") || null;

                if(!vhost) {
                    return false;
                }

                vhost = vhost.split('=')[1] || '';

                // Extract vhost_port if available
                const vhost_port = data.Config.Env.find(item => item.split('=')[0] == "VIRTUAL_PORT") || null;

                // Get IP and port-map
                const ip = data.NetworkSettings.IPAddress ?? '';
                const ports = Object.keys(data.NetworkSettings.Ports).map(item => parseInt(item.split('/')[0]));

                // use Vhost port if defined, else use first port in map
                const port = (vhost_port) ? parseInt(vhost_port.split('=')[1]) : ports[0];

                // Create 
                console.log('Mapping V-Host ' + vhost + " => " + ip + ":" + port);
                this.api.createVhost(msg.id,vhost, ip, port);
            });
    }

    remove(msg) {
        this.api.deleteVhost(msg.id);
    }

}


export default ContainerEvents;