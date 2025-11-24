# ApnaGhar Blockchain Component

Complete blockchain implementation for ApnaGhar using Hyperledger Fabric and IPFS (Pinata).

## Architecture

```
Frontend (React) 
    ↓
Django Backend (Python)
    ↓
Hyperledger Fabric (JavaScript Chaincode)
    ↓
IPFS (Pinata) - File Storage
```

## Components

### 1. Hyperledger Fabric Chaincode
- **Location**: `blockchain/chaincode/apnaghar-contract/`
- **Language**: JavaScript (Node.js)
- **Features**:
  - Immutable progress tracking
  - Secure document management
  - Query capabilities by project/property/type

### 2. Django Backend Integration
- **Models**: `backend/blockchain/models.py`
- **Views**: `backend/blockchain/views.py`
- **Services**: 
  - `fabric_client.py` - Fabric SDK integration
  - `ipfs_service.py` - Pinata IPFS integration
- **API Endpoints**: `/api/blockchain/`

### 3. Frontend Components
- To be created in `frontend/src/components/` and `frontend/src/pages/`

## Setup Instructions

### Prerequisites

1. **Hyperledger Fabric Test Network**
   ```bash
   # Clone fabric-samples
   git clone https://github.com/hyperledger/fabric-samples.git
   cd fabric-samples/test-network
   
   # Start network
   ./network.sh up createChannel
   ```

2. **Node.js 14+** (for chaincode)

3. **Python 3.8+** (for Django backend)

4. **Pinata Account**
   - Sign up at https://pinata.cloud
   - Get API Key and Secret

### Installation

1. **Install Backend Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Install Chaincode Dependencies**
   ```bash
   cd blockchain/chaincode/apnaghar-contract
   npm install
   ```

3. **Configure Environment Variables**
   
   Create `.env` file in `backend/`:
   ```env
   # Pinata IPFS
   PINATA_API_KEY=your_pinata_api_key
   PINATA_API_SECRET=your_pinata_secret
   PINATA_GATEWAY_URL=https://gateway.pinata.cloud/ipfs/
   
   # Hyperledger Fabric
   FABRIC_NETWORK_CONFIG=path/to/network-config.json
   FABRIC_CHANNEL_NAME=mychannel
   FABRIC_CHAINCODE_NAME=apnaghar-contract
   ```

4. **Deploy Chaincode**
   ```bash
   # From fabric-samples/test-network
   peer lifecycle chaincode package apnaghar.tar.gz \
     --path ../../../ApnaGhar/blockchain/chaincode/apnaghar-contract \
     --lang node \
     --label apnaghar_1.0
   
   # Install, approve, and commit (follow Fabric deployment process)
   ```

5. **Run Migrations**
   ```bash
   cd backend
   python manage.py makemigrations blockchain
   python manage.py migrate
   ```

## API Endpoints

### Progress Updates

- **POST** `/api/blockchain/progress/upload_progress/`
  - Upload construction progress photo + description
  - Body: `project_id`, `property_id` (optional), `milestone_id` (optional), `description`, `file`, `metadata` (optional)

- **GET** `/api/blockchain/progress/{id}/get_blockchain_data/`
  - Get blockchain data for a progress update

### Documents

- **POST** `/api/blockchain/documents/upload_document/`
  - Upload legal document
  - Body: `project_id`, `property_id` (optional), `document_name`, `document_type`, `file`, `metadata` (optional)

- **GET** `/api/blockchain/documents/{id}/get_blockchain_data/`
  - Get blockchain data for a document

## Usage Flow

### 1. Upload Progress Update

```python
# Frontend sends POST request
POST /api/blockchain/progress/upload_progress/
{
  "project_id": "uuid",
  "property_id": "uuid",
  "description": "Construction milestone achieved",
  "file": <image_file>
}

# Backend:
# 1. Uploads file to Pinata IPFS → gets IPFS hash
# 2. Stores IPFS hash on Hyperledger Fabric blockchain
# 3. Creates local database record
# 4. Returns success with IPFS hash and blockchain TX ID
```

### 2. Upload Document

```python
# Frontend sends POST request
POST /api/blockchain/documents/upload_document/
{
  "project_id": "uuid",
  "document_name": "Sale Agreement",
  "document_type": "contract",
  "file": <pdf_file>
}

# Backend:
# 1. Uploads file to Pinata IPFS → gets IPFS hash
# 2. Stores IPFS hash on Hyperledger Fabric blockchain
# 3. Creates local database record
# 4. Returns success with IPFS hash and blockchain TX ID
```

## File Structure

```
ApnaGhar/
├── blockchain/
│   └── chaincode/
│       └── apnaghar-contract/
│           ├── index.js          # Chaincode implementation
│           └── package.json      # Node.js dependencies
├── backend/
│   └── blockchain/
│       ├── models.py             # Django models
│       ├── views.py               # API views
│       ├── serializers.py        # DRF serializers
│       ├── urls.py                # URL routing
│       ├── fabric_client.py      # Fabric SDK client
│       └── ipfs_service.py       # Pinata IPFS service
└── frontend/
    └── src/
        └── (components to be created)
```

## Testing

### Test IPFS Upload
```python
from blockchain.ipfs_service import get_pinata_service

service = get_pinata_service()
# Test upload
```

### Test Blockchain Query
```python
from blockchain.fabric_client import get_fabric_service

service = get_fabric_service()
# Test query
```

## Next Steps

1. Create frontend components for blockchain features
2. Add UI for uploading progress updates and documents
3. Add blockchain verification UI
4. Add IPFS file viewing/downloading
5. Add transaction history display

## Notes

- Files are stored on IPFS (Pinata), only hashes are on blockchain
- Blockchain provides immutability and verification
- Local database caches blockchain data for faster queries
- If blockchain is unavailable, IPFS upload still succeeds (graceful degradation)

