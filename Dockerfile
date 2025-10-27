FROM ghcr.io/puppeteer/puppeteer:latest

USER root  

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

USER pptruser

CMD ["node", "index.js"]