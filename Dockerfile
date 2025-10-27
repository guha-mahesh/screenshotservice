FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

USER pptruser

CMD ["node", "index.js"]