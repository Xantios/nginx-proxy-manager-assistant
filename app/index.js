import Docker from 'dockerode';
import EventHandler from './EventHandler.js';
import ApiClient from './ApiClient.js';

const d = new Docker({ socketPath:  '/var/run/docker.sock'});
const a = new ApiClient();
const e = new EventHandler(a,d);