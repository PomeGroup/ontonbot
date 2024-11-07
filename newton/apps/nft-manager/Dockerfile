FROM node:21.1.0-alpine3.17

RUN apk update && apk upgrade
RUN apk add --no-cache \
  openssh \
  rsync \
  curl \
  ca-certificates

# Download and install the Minio client
# RUN curl -LO https://dl.min.io/client/mc/release/linux-amd64/mc && \
#   chmod +x mc && \
#   mv mc /usr/local/bin/
RUN npm i -g pnpm

WORKDIR /app

COPY package.json ./

ADD prisma ./prisma
# COPY .env ./
# RUN pnpm prisma:generate

RUN pnpm install

COPY . .
RUN pnpm build

CMD node dist/main
