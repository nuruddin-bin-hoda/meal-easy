# Stage 1 — build the React app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# In production Docker, Nginx proxies /api/* to the server container,
# so a relative base URL is sufficient. Override at build time if needed.
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2 — serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
