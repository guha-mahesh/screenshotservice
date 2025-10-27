FROM ghcr.io/puppeteer/puppeteer:latest

USER root

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .



CMD ["node", "index.js"]