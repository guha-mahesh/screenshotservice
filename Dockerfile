# Use official Node 18 slim image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --omit=dev


# Copy app source
COPY . .

# Set environment variables for Puppeteer/Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=production

# Expose port
EXPOSE 8080

# Start the app
CMD ["node", "index.js"]
