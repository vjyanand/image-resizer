FROM node:current-alpine3.15 as builder

RUN apk add --no-cache ca-certificates git

# Show all node logs
ENV NPM_CONFIG_LOGLEVEL warn

# Create app directory
RUN mkdir -p /opt/app

# Set Working Directory
WORKDIR /opt/app/

# Copy only package.json and yarn.lock for cache
COPY package.json ./

# Add libvips
RUN apk add --upgrade --no-cache vips-dev build-base --repository https://alpine.global.ssl.fastly.net/alpine/v3.15/community/

# Install Dependncies
RUN yarn install --production --ignore-optional --pure-lockfile --non-interactive

# Copy Files
COPY . ./

CMD ["node", "index.js"]
