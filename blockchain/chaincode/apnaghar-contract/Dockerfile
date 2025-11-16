FROM node:18-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy chaincode source and entrypoint script
COPY . .
COPY docker-entrypoint.sh ./

# Set environment for CCAAS (will be overridden by docker run)
ENV CHAINCODE_SERVER_ADDRESS=0.0.0.0:9999
ENV CORE_CHAINCODE_ID_NAME=""

EXPOSE 9999

# Use entrypoint script to ensure proper startup
ENTRYPOINT ["./docker-entrypoint.sh"]
