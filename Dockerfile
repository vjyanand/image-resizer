FROM alpine:latest as builder

RUN apk add --no-cache ca-certificates memcached git make musl-dev redis nodejs npm

COPY . /app

# Create and change to the app directory.
WORKDIR /app

RUN npm i

CMD ["node", "index.js"]
