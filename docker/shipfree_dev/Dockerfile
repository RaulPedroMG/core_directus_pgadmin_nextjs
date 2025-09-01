FROM node:20-alpine

WORKDIR /app

# Install dependencies for better compatibility
RUN apk add --no-cache libc6-compat

# Copy package files for dependency installation
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Create a startup script that clears cache and starts dev server
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "Starting Next.js development server..."' >> /start.sh && \
    echo 'echo "Clearing Next.js cache..."' >> /start.sh && \
    echo 'rm -rf .next .turbo' >> /start.sh && \
    echo 'echo "Starting server without Turbopack to avoid Docker issues..."' >> /start.sh && \
    echo 'npm run dev:docker' >> /start.sh && \
    chmod +x /start.sh

# Create .next directory with proper permissions
RUN mkdir -p .next && chown -R node:node .next /start.sh

# Clear any existing build artifacts and cache
RUN rm -rf .next/* && rm -rf .turbo

# Expose port
EXPOSE 3000

# Switch to non-root user
USER node

# Development command
CMD ["/start.sh"]
