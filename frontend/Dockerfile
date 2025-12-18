# Build Stage
FROM node:20-alpine as builder
WORKDIR /app
COPY package.json .
RUN npm install --legacy-peer-deps
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_ENABLE_DEBUG
ENV VITE_ENABLE_DEBUG=$VITE_ENABLE_DEBUG

RUN npm run build

# Production Stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy custom nginx config to support SPA routing (redirect 404 to index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
