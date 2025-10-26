FROM ghcr.io/puppeteer/puppeteer:21.0.0

WORKDIR /app

COPY package*.json ./

RUN npm i


RUN echo "Force rebuild $(date)" && npm uninstall puppeteer-core

COPY . .

CMD ["node", "index.js"]