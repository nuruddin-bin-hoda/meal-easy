# Production image for the Express API
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache chromium

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY src ./src

# Ensure the uploads directory exists inside the container
RUN mkdir -p uploads

EXPOSE 5001
CMD ["node", "src/index.js"]
