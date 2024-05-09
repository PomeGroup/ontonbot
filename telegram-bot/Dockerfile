FROM node:latest  

WORKDIR /app

COPY package.json ./
COPY pnpm-lock.yaml ./

COPY tsconfig.json ./

RUN npm install -g pnpm

RUN pnpm install

# Copy the rest of your application source code
COPY . .

EXPOSE 3333

CMD ["pnpm", "run", "start"]
