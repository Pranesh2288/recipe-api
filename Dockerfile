# Use official Node.js image as base
FROM node:18

# Create app directory inside container
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Run the app
CMD ["node", "src/index.js"]
