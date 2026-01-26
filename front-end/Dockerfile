FROM node:22-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 4200

# Default command (will be overridden by docker-compose)
CMD ["npm", "run", "start"]
