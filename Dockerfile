FROM node:14.5.0-alpine

WORKDIR /usr/src/app

COPY app/* /usr/src/app/

RUN npm install

# CMD npm start
ENTRYPOINT [ "npm","start" ]