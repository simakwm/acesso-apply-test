FROM node:14.17-alpine as acesso_apply_test
WORKDIR /home/node/app
COPY package*.json ./
RUN yarn install --production
COPY dist dist
COPY logs logs
RUN yarn add -D nodemon
EXPOSE 3000
CMD yarn nodemon dist/server.js
