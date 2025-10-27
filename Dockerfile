FROM node:18-slim

WORKDIR /app

COPY package*.json ./
RUN apt-get update && apt-get install -y wget gnupg ca-certificates \
    fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 \
    libatk1.0-0 libcups2 libdbus-1-3 libdrm2 libx11-xcb1 libxcomposite1 \
    libxdamage1 libxrandr2 libgbm1 libnss3 lsb-release xdg-utils libu2f-udev \
    libvulkan1 \
    && wget -qO- https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /usr/share/keyrings/google-linux-signing-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/google-linux-signing-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update && apt-get install -y google-chrome-stable \
    && npm install --omit=dev \
    && rm -rf /var/lib/apt/lists/*

COPY . .

ENV PORT=8080
EXPOSE 8080

CMD ["node", "index.js"]
