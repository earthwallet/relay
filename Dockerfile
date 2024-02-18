FROM node:16-alpine as build

# Install build dependencies
RUN apk update && apk add python3 make gcc g++ libc-dev

COPY package.json ./
COPY dist/ ./dist/

# Install project dependencies
RUN npm i --omit=dev

FROM node:16-alpine as runtime
WORKDIR /opt/app

COPY --from=build /node_modules/ ./node_modules/
COPY --from=build /dist/ ./dist/

ENV SERVER_PORT=7777
ENV BASE_URI=https://relay.example.com

EXPOSE 7777
ENTRYPOINT [ "node", "dist/src/index.js" ]
