FROM alpine:latest as builder

RUN apk add --no-cache ca-certificates git musl-dev nodejs npm

COPY . /app

# Create and change to the app directory.
WORKDIR /app

RUN npm i

CMD ["node", "index.js"]
