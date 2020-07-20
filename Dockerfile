FROM node:14.5.0-alpine

WORKDIR /usr/src/app

COPY package*.json /usr/src/app/

RUN npm install

# CMD npm start
ENTRYPOINT [ "npm","start" ]