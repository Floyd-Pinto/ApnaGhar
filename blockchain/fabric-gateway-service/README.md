# ApnaGhar Fabric Gateway Microservice

This is a Node.js microservice that bridges your Django backend with Hyperledger Fabric using the **official Fabric Gateway SDK**.

## Why This Approach?

Hyperledger Fabric officially supports only:

- ✅ **Node.js SDK** (what we use here)
- ✅ **Go SDK**

The Python SDK is deprecated. This microservice allows your Python/Django backend to interact with Fabric through a simple REST API.

## Architecture

```
Django Backend (Python)
    ↓ HTTP REST API
Fabric Gateway Service (Node.js) ← This service
    ↓ Fabric Gateway SDK
Hyperledger Fabric Network
```

## Setup

### 1. Install Dependencies

```bash
cd blockchain/fabric-gateway-service
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update with your Fabric network details:

```bash
cp .env.example .env
```

### 3. Start the Service

**Development:**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

The service will run on `http://localhost:3001` by default.

## API Endpoints

### Health Check

```bash
GET /health
```

### Store Progress Update

```bash
POST /api/progress-update
Content-Type: application/json

{
  "progressId": "progress-123",
  "projectId": "project-456",
  "propertyId": "property-789",
  "milestoneId": "milestone-001",
  "ipfsHash": "QmXXXXX...",
  "description": "Foundation completed",
  "uploadedBy": "user-123",
  "metadata": {}
}
```

### Store Document

```bash
POST /api/document
Content-Type: application/json

{
  "documentId": "doc-123",
  "projectId": "project-456",
  "propertyId": "property-789",
  "documentName": "Sale Agreement",
  "documentType": "contract",
  "ipfsHash": "QmYYYYY...",
  "uploadedBy": "user-123",
  "metadata": {}
}
```

### Get Progress Update

```bash
GET /api/progress-update/:id
```

### Get Document

```bash
GET /api/document/:id
```

### Query Progress Updates by Property

```bash
GET /api/progress-updates/property/:propertyId
```

### Query Documents by Project

```bash
GET /api/documents/project/:projectId
```

## Security

For production, set `API_KEY` in `.env` and include it in requests:

```bash
curl -H "X-API-Key: your-secret-key" http://localhost:3001/api/progress-update/123
```

## Deployment

### Docker (Recommended)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

### PM2 (Process Manager)

```bash
npm install -g pm2
pm2 start server.js --name apnaghar-fabric-gateway
```

## Testing Without Fabric Network

The service will start even without a Fabric network connection. It will log a warning but remain operational for development/testing purposes.

## Go SDK Alternative

If you prefer Go, create a similar microservice using:

```go
import "github.com/hyperledger/fabric-gateway/pkg/client"
```

The REST API interface remains the same for your Django backend.
