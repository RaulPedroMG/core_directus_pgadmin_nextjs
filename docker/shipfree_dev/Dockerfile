FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Update Next.js to latest version and install dependencies including Directus SDK
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Create a startup script that handles database initialization
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'npm run dev' >> /start.sh && \
    chmod +x /start.sh

# Development command
CMD ["/start.sh"]
