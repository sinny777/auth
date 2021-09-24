##
## Copyright 2021 IBM Corporation
##
## This will build SmartThings Auth container image
## Author: Gurvinder Singh (gurvsin3@in.ibm.com)
##
## docker build -t sinny777/smartthings-auth:local .
## docker run --rm -it -p 3000:3000 --name smartthings-auth --env-file .env sinny777/smartthings-auth:local
##

FROM node:12-slim
# FROM registry.access.redhat.com/ubi8/nodejs-12

LABEL org.label-schema.build-date=${BUILD_DATE} \
    org.label-schema.license="Apache-2.0" \
    org.label-schema.name="SmartthingsAuthService" \
    org.label-schema.version=${BUILD_VERSION} \
    org.label-schema.description="Smartthings Auth Microservice" \
    org.label-schema.vcs-ref=${BUILD_REF} \
    org.label-schema.vcs-type="Git" \
    authors="Gurvinder Singh <sinny777@gmail.com>" \
    profile="http://www.gurvinder.info"

# Set to a non-root built-in user `node`
USER node

# Create app directory (with user `node`)
RUN mkdir -p /home/node/app

WORKDIR /home/node/app

COPY --chown=node package*.json ./

RUN npm i @loopback/cli && \
    npm ci

# Bundle app source code
COPY --chown=node . .

RUN npm run clean && \
    npm run build

# FROM node:12-slim
# WORKDIR /usr/src/app
# COPY --from=BUILD /usr/src/app/node_modules ./node_modules/
# COPY --from=BUILD /usr/src/app/dist ./dist/
# Bind to all network interfaces so that it can be mapped to the host OS
ENV HOST=0.0.0.0 PORT=3000

EXPOSE ${PORT}
CMD [ "node", "." ]
