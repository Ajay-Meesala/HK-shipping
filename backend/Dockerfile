FROM node:18-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy remaining code files
COPY . .

# Expose server port
EXPOSE 5000

# Set environment
ENV NODE_ENV=production

# Start Express server
CMD ["npm", "start"]
