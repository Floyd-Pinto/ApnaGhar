# ApnaGhar Implementation Plan - Based on Wireframe

## Overview

Complete rebuild based on 18-page wireframe with blockchain, AI, and fractional ownership features.

## Phase 1: Foundation & Core Models (Week 1-2)

### Backend - Django Apps Structure

```bash
backend/
├── users/          # ✅ EXISTS - User authentication, profiles
├── projects/       # NEW - Projects, properties, listings
├── documents/      # NEW - IPFS document storage, verification
├── payments/       # NEW - Escrow, smart contracts, transactions
├── blockchain/     # NEW - Polygon integration, verification records
├── investments/    # NEW - Fractional ownership, tokens, marketplace
├── support/        # NEW - Disputes, tickets, admin panel
└── analytics/      # NEW - Developer scores, project analytics
```

### Database Models

#### projects/models.py

- **Developer**: extends User, trust_score, RERA_number, verified
- **Project**: name, developer, location, price, status, blockchain_hash
- **Property**: project FK, unit_number, size, type, price, status
- **ConstructionMilestone**: project FK, phase, target_date, actual_date, verified

#### documents/models.py

- **Document**: project FK, type, ipfs_hash, blockchain_hash, verified
- **VerificationRecord**: document FK, verified_by, timestamp, ai_score

#### payments/models.py

- **EscrowAccount**: project FK, buyer FK, total_amount, released_amount
- **Payment**: escrow FK, amount, milestone FK, status, smart_contract_tx

#### blockchain/models.py

- **BlockchainRecord**: content_type, object_id, tx_hash, block_number, network

#### investments/models.py

- **PropertyToken**: project FK, total_supply, token_contract_address
- **Investment**: investor FK, token FK, amount, shares, purchase_date
- **Transaction**: from_user, to_user, token FK, shares, price, tx_hash

#### support/models.py

- **Dispute**: raised_by, project FK, description, status, assigned_to
- **SupportTicket**: user FK, subject, description, status, priority

### API Endpoints Structure

```
/api/projects/
  GET    /projects/              # List all projects (with filters)
  POST   /projects/              # Create project (developer only)
  GET    /projects/{id}/         # Project detail
  GET    /projects/{id}/milestones/  # Construction timeline

/api/developers/
  GET    /developers/            # List developers
  GET    /developers/{id}/       # Developer profile + projects

/api/documents/
  POST   /documents/upload/      # Upload to IPFS + blockchain
  GET    /documents/{id}/verify/ # Verify document hash

/api/payments/
  GET    /payments/escrow/{id}/  # Escrow details
  POST   /payments/authorize/    # Release payment to milestone

/api/investments/
  GET    /investments/marketplace/  # Token listings
  POST   /investments/buy/       # Buy tokens (MetaMask)
  GET    /investments/portfolio/ # Investor holdings

/api/blockchain/
  GET    /blockchain/explorer/   # Internal explorer
  GET    /blockchain/verify/{tx}/ # Verify transaction

/api/support/
  POST   /support/tickets/       # Create ticket
  GET    /support/disputes/      # List disputes (admin)
```

## Phase 2: Frontend Structure (Week 3-4)

### Page Mapping

```
frontend/src/pages/
├── public/
│   ├── Homepage.tsx              # Page 1
│   ├── ExploreProjects.tsx       # Page 2
│   ├── DeveloperProfile.tsx      # Page 3
│   ├── ProjectOverview.tsx       # Page 4
│   ├── ConstructionTracker.tsx   # Page 5
│   └── DocumentRepository.tsx    # Page 6
├── buyer/
│   ├── BuyerDashboard.tsx        # Page 7
│   ├── BuyerDocuments.tsx        # Page 8
│   └── PaymentsEscrow.tsx        # Page 9
├── developer/
│   ├── DeveloperDashboard.tsx    # Page 10
│   └── VerificationUpload.tsx    # Page 11
├── admin/
│   └── AdminPanel.tsx            # Page 12
├── investment/
│   ├── Marketplace.tsx           # Page 13
│   └── InvestorDashboard.tsx     # Page 14
└── support/
    ├── BlockchainExplorer.tsx    # Page 15
    ├── AIChatbot.tsx             # Page 16 (global widget)
    ├── SupportDispute.tsx        # Page 17
    └── Legal.tsx                 # Page 18
```

### Component Structure

```
frontend/src/components/
├── projects/
│   ├── ProjectCard.tsx
│   ├── ProjectFilters.tsx
│   ├── ProjectMap.tsx
│   └── MilestoneTimeline.tsx
├── blockchain/
│   ├── WalletConnect.tsx
│   ├── TransactionHistory.tsx
│   └── VerificationBadge.tsx
├── documents/
│   ├── DocumentViewer.tsx
│   └── IPFSUploader.tsx
└── ai/
    └── ChatWidget.tsx
```

## Phase 3: Blockchain Integration (Week 5-6)

### Smart Contracts (Solidity)

```
contracts/
├── EscrowContract.sol        # Milestone-based payment release
├── PropertyToken.sol         # ERC-1155 fractional ownership
├── DocumentRegistry.sol      # IPFS hash storage
└── VerificationOracle.sol    # AI verification bridge
```

### Web3 Integration

```typescript
// frontend/src/services/web3.ts
- Connect MetaMask / WalletConnect
- Read/Write smart contracts
- Sign transactions
- Event listeners
```

## Phase 4: AI Integration (Week 7)

### AI Services

```python
# backend/ai/
├── image_verification.py     # YOLO/Detectron2
├── chatbot.py               # OpenAI API
└── trust_scoring.py         # Developer reputation
```

## Phase 5: IPFS Integration (Week 8)

### Document Storage

```python
# backend/ipfs/
├── upload.py     # Upload to IPFS, return hash
├── retrieve.py   # Fetch from IPFS by hash
└── verify.py     # Compare file hash with blockchain
```

## Commands to Run

### Phase 1 - Backend Setup

```bash
# 1. Activate environment
cd /home/floydpinto/ApnaGhar && source venv/bin/activate && cd backend

# 2. Create new Django apps
python manage.py startapp projects
python manage.py startapp documents
python manage.py startapp payments
python manage.py startapp blockchain
python manage.py startapp investments
python manage.py startapp support
python manage.py startapp analytics

# 3. Install additional packages
pip install web3 ipfshttpclient Pillow opencv-python torch torchvision

# 4. Update requirements.txt
pip freeze > requirements.txt

# 5. Add apps to INSTALLED_APPS in settings.py

# 6. Create models in each app

# 7. Make and run migrations
python manage.py makemigrations
python manage.py migrate

# 8. Create superuser for admin
python manage.py createsuperuser
```

### Phase 2 - Frontend Setup

```bash
# 1. Install additional packages
cd frontend
npm install web3 @web3-react/core @web3-react/injected-connector ethers
npm install react-map-gl mapbox-gl
npm install recharts apexcharts
npm install socket.io-client

# 2. Create page structure
mkdir -p src/pages/{public,buyer,developer,admin,investment,support}

# 3. Create component structure
mkdir -p src/components/{projects,blockchain,documents,ai}
```

## Technology Stack

### Existing

- ✅ Django 5.2.6
- ✅ Django REST Framework
- ✅ PostgreSQL (Supabase)
- ✅ React + TypeScript
- ✅ Vite
- ✅ shadcn/ui

### New Additions

- **Blockchain**: Web3.py, ethers.js, Polygon Mumbai testnet
- **IPFS**: ipfshttpclient, Pinata
- **AI**: OpenAI API, YOLO/Detectron2, PyTorch
- **Maps**: Mapbox GL JS
- **Charts**: Recharts, ApexCharts
- **Real-time**: Socket.io (for live updates)

## Testing Strategy

1. Unit tests for models and serializers
2. Integration tests for API endpoints
3. E2E tests for critical user flows
4. Smart contract tests (Hardhat/Truffle)

## Security Considerations

1. MetaMask signature verification
2. IPFS content addressing (immutable)
3. Smart contract audits
4. Rate limiting on AI endpoints
5. KYC/AML for fractional ownership
6. RERA compliance validation

## Deployment Updates

- Frontend: Vercel (no change)
- Backend: Render (upgrade for AI workloads)
- Blockchain: Deploy contracts to Polygon Mumbai
- IPFS: Pinata gateway
- Database: Supabase (scale up for blockchain logs)
