
# Use Node.js 20 as the base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm i

# Copy project files
COPY . .

# Build the application
RUN npm run build

# Expose the port that the app runs on
EXPOSE 5000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Run the application
CMD ["npm", "run", "start"]
