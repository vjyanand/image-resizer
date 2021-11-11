FROM mhart/alpine-node:17 as builder

RUN apk add --no-cache ca-certificates git

COPY . /app

# Create and change to the app directory.
WORKDIR /app

RUN npm i

CMD ["node", "index_redis_less.js"]
