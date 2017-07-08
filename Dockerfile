FROM node:8.1.2-alpine

ENV HOME=/usr/windbreaker

RUN mkdir -p $HOME

WORKDIR $HOME

ADD package.json $HOME
RUN npm install --silent

