FROM node:18-alpine3.17

WORKDIR /app

COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./

RUN ln -sf python3 /usr/bin/python && npm config set python /usr/bin/python3

RUN npm install -g pnpm

RUN pnpm install

RUN apt-get update && apt-get install -y postgresql-client

COPY . .

EXPOSE 3333

CMD ["pnpm", "run", "start"]
