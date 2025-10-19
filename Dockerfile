# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (using npm install instead of npm ci for flexibility)
RUN npm install

# Copy source code
COPY . .

# Build the React app (without API key - will use backend proxy)
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built app from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js

# Copy config generation script and startup script
COPY generate-config.js ./generate-config.js
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Create uploads directory
RUN mkdir -p uploads

# Set environment to production
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start using startup script (generates config, then starts server)
CMD ["sh", "./start.sh"]

