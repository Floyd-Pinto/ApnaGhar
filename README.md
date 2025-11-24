# ApnaGhar

# A Smart and Secure Real Estate Platform

ApnaGhar is a comprehensive real estate platform designed to solve the challenges of uncertainty, lack of transparency, and inefficient communication in property transactions. Our mission is to create a seamless, transparent, and trustworthy experience for all stakeholders—from buyers and investors to builders and lawyers. We will achieve this by integrating cutting-edge technologies like real-time construction tracking, an AI-powered chatbot, and blockchain security.

## Problem Statement

The current real estate market is hindered by slow updates, unclear communication, and a lack of verifiable proof of construction progress. Traditional platforms do not leverage modern technologies like AI for instant responses or blockchain for secure contracts and verified media. This creates stress for buyers, weakens trust, and slows down the entire decision-making process.

## Core Objectives

- Provide real-time, verified construction updates to buyers and investors.
- Enable instant query resolution via AI chatbot integration.
- Secure booking contracts using blockchain smart contracts.
- Improve communication with push notifications and multi-channel support.
- Enhance transparency and trust between buyers and builders.

## Key Features

### Current Implementation Plan

- **Real-time Construction Tracker**: Builders can upload verified, geotagged, and timestamped photo/video updates to provide transparent progress tracking to buyers and investors.
- **AI Chatbot**: An instant-resolution chatbot to address buyer queries and provide guidance 24/7.
- **Blockchain Smart Contracts**: For secure, immutable booking transactions and contracts.
- **User-Centric Dashboards**: Interactive dashboards for buyers, builders, and investors to access relevant information easily.
- **Fractional Ownership**: A crucial feature that will use blockchain to tokenize property assets, allowing users to buy and sell small, fractional shares. This will make real estate investment more accessible and liquid for a wider audience.
- **Notifications**: Push notifications and multi-channel communication (email, SMS, in-app) to keep all stakeholders informed.

### Future Features

The following features are part of our long-term vision and will be implemented in later phases:

- **Redevelopment Module**: A specialized feature that connects building tenants, builders, and lawyers to streamline the complex redevelopment process.
- **AI-Powered Property Valuation**: A tool that uses machine learning to provide instant and accurate property value estimates.
- **Financial Forecaster**: A comprehensive tool that calculates the long-term total cost of ownership, including taxes, maintenance, and insurance.
- **Agent Performance Ledger**: A blockchain-based system to create a transparent, tamper-proof record of a real estate agent's transaction history and performance metrics.

## Detailed Technical Stack

Our chosen tech stack provides a robust and scalable foundation for the project:

- **Frontend**:  
  React / Next.js for building a fast and dynamic user interface.

- **Backend**:  
  Django, a high-level Python web framework, for rapid, secure, and clean development.

- **Database**:  
# ApnaGhar - Blockchain-Powered Real Estate Platform

**Status:** ✅ Production Ready (95% Complete)  
**Version:** 1.0  
**Last Updated:** November 24, 2025

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 14+
- Docker & Docker Compose

### Installation

```bash
# Clone repository
git clone https://github.com/your-repo/ApnaGhar.git
cd ApnaGhar

# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev

# Blockchain setup (new terminal)
cd blockchain/fabric-samples/test-network
./network.sh up createChannel -c apnaghar -ca
./network.sh deployCC -ccn apnaghar -ccp ../../chaincode/apnaghar-contract -ccl javascript -c apnaghar

cd ../../api
npm install
node app.js
```

### Access
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:8000
- **Blockchain API:** http://localhost:3000
- **Admin:** http://localhost:8000/admin

---

## 📚 Complete Documentation

**For full documentation, see:**
### 👉 [COMPLETE_PROJECT_GUIDE.md](./COMPLETE_PROJECT_GUIDE.md)

This comprehensive guide includes:
- ✅ Project Overview & Architecture
- ✅ System Status & Features
- ✅ Blockchain Integration Details
- ✅ 8 Ways to Verify Blockchain Records
- ✅ Deployment Guide (Vercel & Render)
- ✅ Monitoring & Maintenance
- ✅ Troubleshooting
- ✅ Quick Reference

---

## ✨ Key Features

### Core Features
- 🔐 User Authentication (Email, Google OAuth, JWT)
- 🏗️ Project & Property Management
- 💰 Payment Integration (Razorpay)
- 🎫 Support System
- 🔔 Real-time Notifications
- 💎 Fractional Ownership & Investments
- 📊 Analytics Dashboard
- 🤖 AI Chatbot

### Blockchain Features
- ⛓️ Hyperledger Fabric Integration
- 📝 Immutable Property Records
- 🏗️ Construction Milestone Tracking
- 📄 Document Hashing on IPFS
- ✅ Complete Audit Trail
- 🔍 8 Verification Methods

### Upload & Security
- ☁️ Cloudinary Media Storage
- 🌐 IPFS Permanent Storage
- 🔐 SHA-256 Hash Verification
- 📍 GPS Geotagging
- 📱 Mobile-only Camera Capture
- 🚫 Gallery Upload Blocking

---

## 🏗️ Technology Stack

**Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Shadcn UI  
**Backend:** Django 4.2 + DRF + PostgreSQL  
**Blockchain:** Hyperledger Fabric 2.5 + Node.js  
**Storage:** Cloudinary + IPFS/Pinata  
**Payments:** Razorpay  

---

## 📊 Project Status

| Component | Status | Completion |
|-----------|--------|------------|
| Backend | ✅ Operational | 95% |
| Frontend | ✅ Operational | 90% |
| Blockchain | ✅ Operational | 100% |
| Infrastructure | ✅ Operational | 100% |

**25 Features Complete** | **2 Features Partial** | **Ready for Production**

---

## 🚀 Deployment

### Quick Deploy

**Frontend (Vercel):**
```bash
cd frontend
vercel --prod
```

**Backend (Render):**
```bash
cd backend
# Follow Render dashboard setup
```

**Blockchain (Self-hosted VM):**
```bash
# See COMPLETE_PROJECT_GUIDE.md for detailed instructions
```

---

## 🔍 Verify Blockchain Records

**8 Methods Available:**
1. Frontend UI - Blockchain Records Page
2. Docker Logs - Real-time monitoring
3. API Queries - HTTP requests
4. Peer CLI - Direct blockchain queries
5. Django Admin - Admin panel
6. PostgreSQL - Database queries
7. IPFS Gateway - File verification
8. Custom Explorer - Build your own

**See full guide:** [COMPLETE_PROJECT_GUIDE.md](./COMPLETE_PROJECT_GUIDE.md#5-blockchain-verification)

---

## 🛠️ Useful Commands

```bash
# Start all services
./start-dev.sh

# Check database
./check-database.sh

# Clean Docker
./cleanup.sh

# Restart blockchain
./restart-fabric.sh

# Monitor blockchain
docker logs -f $(docker ps | grep "apnaghar" | awk '{print $1}')
```

---

## 📖 Documentation

- **Complete Guide:** [COMPLETE_PROJECT_GUIDE.md](./COMPLETE_PROJECT_GUIDE.md)
- **API Documentation:** http://localhost:8000/api/docs/
- **Blockchain Guide:** See Section 4 in Complete Guide
- **Deployment Guide:** See Section 6 in Complete Guide

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 🎉 Acknowledgments

- Hyperledger Fabric Team
- Django & React Communities
- Cloudinary & Pinata
- All contributors

---

**For detailed documentation, troubleshooting, and deployment instructions, see [COMPLETE_PROJECT_GUIDE.md](./COMPLETE_PROJECT_GUIDE.md)**

**Happy Building!** 🚀
