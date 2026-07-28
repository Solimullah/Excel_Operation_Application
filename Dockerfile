# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# ExcelFile Operations — static SPA.
#
# There is no application server. The build produces static assets; nginx
# serves them. No runtime environment variables: Vite inlines VITE_* values at
# BUILD time, so anything environment-specific must be passed as a build arg.
# ---------------------------------------------------------------------------

# --- Stage 1: build --------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Copy manifests first so the dependency layer caches independently of source.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build-time configuration. Override with:
#   docker build --build-arg VITE_BASE_PATH=/tools/ .
ARG VITE_APP_NAME="ExcelFile Operations"
ARG VITE_BASE_PATH="/"
ARG VITE_LOG_LEVEL="error"
ENV VITE_APP_NAME=$VITE_APP_NAME \
    VITE_BASE_PATH=$VITE_BASE_PATH \
    VITE_LOG_LEVEL=$VITE_LOG_LEVEL

RUN npm run build

# --- Stage 2: serve --------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# Drop the default site and install ours.
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

# nginx:alpine ships an unprivileged `nginx` user; run as it rather than root.
RUN touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /usr/share/nginx/html
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
