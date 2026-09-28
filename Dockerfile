# Multi-stage Dockerfile for NAWI Platform

# Stage 1: Build Frontend
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Server & Final Image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install Server dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy Server source code
COPY server/ ./server/

# Copy built Client static assets into server's view path
COPY --from=client-builder /app/client/dist ./client/dist

# Expose server port
EXPOSE 5000

# Start server
CMD ["node", "server/server.js"]
