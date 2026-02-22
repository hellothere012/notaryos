# Notary UI - Multi-stage Docker build
# Stage 1: Build with Node.js
# Stage 2: Serve with nginx

# =============================================================================
# Stage 1: Build
# =============================================================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install dependencies based on available lock file
RUN if [ -f pnpm-lock.yaml ]; then \
        npm install -g pnpm && pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then \
        yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
        npm ci; \
    else \
        npm install; \
    fi

# Copy source files
COPY . .

# Build arguments for environment variables
ARG REACT_APP_API_URL
ARG REACT_APP_WS_URL

# Set environment variables for build
ENV REACT_APP_API_URL=${REACT_APP_API_URL:-https://api.agenttownsquare.com}
ENV REACT_APP_WS_URL=${REACT_APP_WS_URL:-wss://api.agenttownsquare.com}

# Build the application
RUN npm run build

# =============================================================================
# Stage 2: Production with nginx
# =============================================================================
FROM nginx:alpine AS production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Create a simple health check endpoint
RUN echo "OK" > /usr/share/nginx/html/health

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=30s \
    CMD curl -sf http://localhost:80/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
