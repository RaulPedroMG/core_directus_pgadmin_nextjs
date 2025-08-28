FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Update Next.js to latest version and install dependencies including Directus SDK
RUN npm install next@latest react@latest react-dom@latest @directus/sdk && \
    npm install && \
    npm audit fix --force || true

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Create a startup script that handles database initialization
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "Waiting for database..."' >> /start.sh && \
    echo 'sleep 10' >> /start.sh && \
    echo 'echo "Running database migrations..."' >> /start.sh && \
    echo 'npx drizzle-kit push || echo "Database migration failed, continuing..."' >> /start.sh && \
    echo 'echo "Starting development server..."' >> /start.sh && \
    echo 'npm run dev' >> /start.sh && \
    chmod +x /start.sh

# Development command
CMD ["/start.sh"]
