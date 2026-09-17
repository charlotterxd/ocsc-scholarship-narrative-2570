# ---- build ----------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

# deps first so the layer caches across source edits
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

# ---- serve ----------------------------------------------------------------
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
