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

                // Extract IP from container
                let ip = data.NetworkSettings.IPAddress ?? '';

                // Extract IP from composition if available
                if(ip==='') {
                    let compositionNetworkLabel = Object.keys(data.NetworkSettings.Networks)[0];
                    if(compositionNetworkLabel) {
                        ip = data.NetworkSettings.Networks[compositionNetworkLabel].IPAddress || '';
                    }
                }

                // Extract port to map
                const ports = Object.keys(data.NetworkSettings.Ports).map(item => parseInt(item.split('/')[0]));

                // use Vhost port if defined, else use first port in map
                const port = (vhost_port) ? parseInt(vhost_port.split('=')[1]) : ports[0];

                // Generate cert?
                let generateCert = data.Config.Env.find(item => {
                    let kv = item.split('=');
                    return (kv[0] == "GEN_CERT" && kv[1] == "true")
                });

                let secure = false;
                if(generateCert) {
                    secure = true;
                }

                let cert = (secure) ? 'yes' : 'no';

                // Create 
                console.log(`Mapping V-Host ${vhost} => ${ip}:${port} (certificate: ${cert})`);
                this.api.createVhost(msg.id,vhost, ip, port,secure);
            });
    }

    remove(msg) {
        this.api.deleteVhost(msg.id);
    }
}

export default ContainerEvents;