FROM ghcr.io/puppeteer/puppeteer:21.0.0


ENV NODE_ENV production


WORKDIR /app




COPY package.json ./
RUN npm install --only=production


COPY . .


CMD ["node", "index.js"]
