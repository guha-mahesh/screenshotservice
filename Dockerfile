FROM ghcr.io/puppeteer/puppeteer:21.0.0

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

RUN npm uninstall puppeteer-core

COPY . .

CMD ["node", "index.js"]