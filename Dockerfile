FROM ghcr.io/puppeteer/puppeteer:21.0.0


ENV NODE_ENV production


WORKDIR /app


COPY package.json ./




USER root
RUN npm install --only=production



USER pptruser 



COPY . .


CMD ["node", "index.js"]
