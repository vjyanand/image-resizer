FROM alpine:latest as builder

RUN apk add --no-cache ca-certificates memcached git make musl-dev nodejs npm redis

COPY . /app

# Create and change to the app directory.

RUN sed -i 's/^\(bind .*\)$/# \1/' /etc/redis/redis.conf && \
  sed -i 's/^\(daemonize .*\)$/# \1/' /etc/redis/redis.conf && \
  sed -i 's/^\(dir .*\)$/# \1\ndir \/data/' /etc/redis/redis.conf && \
  sed -i 's/^\(logfile .*\)$/# \1/' /etc/redis/redis.conf

WORKDIR /app

RUN npm i

CMD ["node", "index.js"]
