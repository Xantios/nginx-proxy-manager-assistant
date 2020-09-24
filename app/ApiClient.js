import Axios from 'axios';
import moment from 'moment';

class ApiClient {

    #token = "";
    #expires = moment();
    #health = false;

    constructor() {

        this.axios = Axios.create({
            baseURL: 'http://app:81/api/'
        });

        setInterval(async () => (await this.healthcheck()) ? this.auth() : null,5000)
    }

    async healthcheck() {

        try {

            const reply = await this.axios.get('/');

            if(reply.data.status=="OK") {
                this.#health = true;
                return true;
            }

            this.#health = false;
            return false;
        }
        catch(e) {
            // console.log('Healthcheck failed => ',e.message);
            this.#health = false;
            return false;
        }

    }

    expired() {
        return this.#expires.isBefore();
    }

    async auth() {

        if(this.expired() || this.#token == "") {
            console.log('Token invalid or expired, renewing');
        } else {
            return;
        }
        
        // Lets grep a token 
        this.axios.post('tokens',{
            identity: process.env.username,
            secret: process.env.password
        })
        .then(response => {

            this.#token = response.data.token;
            this.#expires = moment(response.data.expires);

            this.axios.defaults.headers.common['Authorization'] = "Bearer "+response.data.token;

            console.log('Token renewed successfully, new expiration date is '+this.#expires.format());
        })
        .catch(e => {
            console.error('Cant authenticate! please check credentials in environment');
        });
    }

    createVhost(id,name,target,port=80,secure=false) {

        /**
         * {
         *  "domain_names":["cokemaster.xantios.nl"],
         *  "forward_scheme":"http",
         * "forward_host":"10.13.37.254",
         * "forward_port":1337,
         * "access_list_id":"0",
         * "certificate_id":"new",
         * "ssl_forced":true,
         * "meta":{
         *  "letsencrypt_email":"info@xantios.nl",
         *  "letsencrypt_agree":true
         * },
         * "advanced_config":"",
         * "locations":[],
         * "block_exploits":false,
         * "caching_enabled":false,
         * "allow_websocket_upgrade":false,
         * "http2_support":false,
         * "hsts_enabled":false,
         * "hsts_subdomains":false
         * }
         */

        const metadata = {
            automagic:"true",
            name: name,
            id: id,
            secure: secure
        };

        let data = {
            domain_names: [ name ],
            forward_scheme: 'http',
            forward_host: target,
            forward_port: port,
            advanced_config: "# [metadata]=["+JSON.stringify(metadata)+"]",
            meta: {}
        };

        if(secure) {
            
            data.certificate_id = "new";
            data.ssl_forced = secure;

            data.meta.letsencrypt_email = process.env['le_email'];
            data.meta.letsencrypt_agree = true;
        }

        this.axios.post('nginx/proxy-hosts',data)
            .then(resp => {
                console.log('Created vhost!');
                console.log('==> ',data);
            })
            .catch(e => {
                // console.error(e);
                // console.log(this.axios.defaults.headers);
            });

    }

    deleteVhost(container_id) {

        this.axios
            .get('nginx/proxy-hosts')
            .then(resp => resp.data.map(item => {

                let metadata = item.advanced_config
                    .split('\n')
                    .find(line => line.includes('# [metadata]'))

                if(!metadata) {
                    return;
                }

                let unwrappedMetadata = JSON.parse(metadata.replace('# [metadata]=[','').slice(0,-1));

                console.log('Mapped metadata from v-host ',unwrappedMetadata);

                // We've got 'm!
                if(unwrappedMetadata.id==container_id) {
                    this.axios.delete('nginx/proxy-hosts/'+item.id);
                }

            }))
            .catch(e => console.error(e));

    }


};

export default ApiClient;