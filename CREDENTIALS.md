# ApnaGhar - Credentials & Test Accounts

**Last Updated:** November 24, 2025  
**Environment:** Development & Testing

---

## 🔐 TABLE OF CONTENTS

1. [Admin Accounts](#admin-accounts)
2. [Builder/Developer Accounts](#builderdeveloper-accounts)
3. [Buyer Accounts](#buyer-accounts)
4. [API Keys & Credentials](#api-keys--credentials)
5. [Database Credentials](#database-credentials)
6. [Blockchain Credentials](#blockchain-credentials)
7. [Third-Party Services](#third-party-services)
8. [Test Data](#test-data)

---

## 1. ADMIN ACCOUNTS

### Django Admin (Superuser)

**URL:** http://localhost:8000/admin

**Credentials:**
```
Email: admin@apnaghar.com
Password: admin123
Username: admin
```

**Permissions:**
- Full system access
- User management
- Project approval
- Payment verification
- Support ticket management
- Analytics dashboard

**How to Create:**
```bash
cd backend
python manage.py createsuperuser
```

---

## 2. BUILDER/DEVELOPER ACCOUNTS

### Test Builder Account #1

**Login URL:** http://localhost:5173/login

**Credentials:**
```
Email: builder1@example.com
Password: Builder@123
Role: Builder/Developer
```

**Profile Details:**
```
Company Name: Skyline Constructions
RERA Number: MH123456789
Verified: Yes
Trust Score: 4.5/5
Total Projects: 12
Completed Projects: 8
```

**Permissions:**
- Create projects
- Add properties/units
- Upload construction updates
- Manage bookings
- View analytics
- Respond to reviews

### Test Builder Account #2

**Credentials:**
```
Email: builder2@example.com
Password: Builder@123
Role: Builder/Developer
```

**Profile Details:**
```
Company Name: Green Valley Developers
RERA Number: MH987654321
Verified: Yes
Trust Score: 4.2/5
Total Projects: 8
Completed Projects: 5
```

### How to Create Builder Account

**Via Frontend:**
1. Go to http://localhost:5173/register
2. Select "Builder" role
3. Fill in company details
4. Verify email
5. Admin approval required

**Via Django Admin:**
1. Create user with role="builder"
2. Create Developer profile linked to user
3. Set RERA number and verification status

---

## 3. BUYER ACCOUNTS

### Test Buyer Account #1

**Login URL:** http://localhost:5173/login

**Credentials:**
```
Email: buyer1@example.com
Password: Buyer@123
Role: Buyer
```

**Profile Details:**
```
Name: Rahul Sharma
Phone: +91 9876543210
Verified: Yes
Bookings: 2
Investments: 3
```

**Permissions:**
- Browse projects
- Book properties
- Make payments
- Track construction progress
- View blockchain records
- Leave reviews

### Test Buyer Account #2

**Credentials:**
```
Email: buyer2@example.com
Password: Buyer@123
Role: Buyer
```

**Profile Details:**
```
Name: Priya Patel
Phone: +91 9876543211
Verified: Yes
Bookings: 1
Investments: 5
```

### How to Create Buyer Account

**Via Frontend:**
1. Go to http://localhost:5173/register
2. Select "Buyer" role
3. Fill in personal details
4. Verify email
5. Complete KYC (optional)

---

## 4. API KEYS & CREDENTIALS

### Django Secret Key

**Location:** `backend/.env`

```bash
SECRET_KEY=your-django-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

**Generate New Key:**
```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

### JWT Settings

```python
# Token expiration
ACCESS_TOKEN_LIFETIME = 60 minutes
REFRESH_TOKEN_LIFETIME = 1 day
```

### API Authentication

**Headers Required:**
```bash
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Get Token:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer1@example.com","password":"Buyer@123"}'
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "buyer1@example.com",
    "role": "buyer"
  }
}
```

---

## 5. DATABASE CREDENTIALS

### PostgreSQL (Local Development)

**Connection Details:**
```
Host: localhost
Port: 5432
Database: apnaghar_db
Username: apnaghar_user
Password: apnaghar_password
```

**Connection String:**
```
postgresql://apnaghar_user:apnaghar_password@localhost:5432/apnaghar_db
```

**Django Settings:**
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'apnaghar_db',
        'USER': 'apnaghar_user',
        'PASSWORD': 'apnaghar_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### Create Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE apnaghar_db;
CREATE USER apnaghar_user WITH PASSWORD 'apnaghar_password';
GRANT ALL PRIVILEGES ON DATABASE apnaghar_db TO apnaghar_user;
```

---

## 6. BLOCKCHAIN CREDENTIALS

### Hyperledger Fabric Network

**Network:** test-network  
**Channel:** apnaghar  
**Chaincode:** apnaghar v1.0

### Organizations

**Org1MSP:**
```
MSP ID: Org1MSP
Peer: peer0.org1.example.com:7051
CA: ca.org1.example.com:7054
Admin: Admin@org1.example.com
```

**Org2MSP:**
```
MSP ID: Org2MSP
Peer: peer0.org2.example.com:9051
CA: ca.org2.example.com:8054
Admin: Admin@org2.example.com
```

### Blockchain API

**URL:** http://localhost:3000

**Endpoints:**
```
POST /api/v1/property
POST /api/v1/milestone
POST /api/v1/document
GET  /api/v1/history/:id
```

**No Authentication Required** (Internal API)

### Fabric Admin Credentials

**Location:** `blockchain/fabric-samples/test-network/organizations/`

**Admin User:**
```
Username: admin
Password: adminpw (default CA password)
```

**App User:**
```
Username: appUser
Password: (enrolled automatically)
```

---

## 7. THIRD-PARTY SERVICES

### Cloudinary (Media Storage)

**Dashboard:** https://cloudinary.com/console

**Credentials:**
```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Test Upload:**
```bash
curl -X POST https://api.cloudinary.com/v1_1/your-cloud-name/image/upload \
  -F "file=@image.jpg" \
  -F "api_key=your-api-key" \
  -F "timestamp=$(date +%s)" \
  -F "signature=your-signature"
```

### Pinata (IPFS Storage)

**Dashboard:** https://app.pinata.cloud

**Credentials:**
```bash
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key
```

**Test Upload:**
```bash
curl -X POST https://api.pinata.cloud/pinning/pinFileToIPFS \
  -H "pinata_api_key: your-api-key" \
  -H "pinata_secret_api_key: your-secret-key" \
  -F "file=@document.pdf"
```

### Razorpay (Payments)

**Dashboard:** https://dashboard.razorpay.com

**Test Mode Credentials:**
```bash
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

**Test Cards:**
```
Card Number: 4111 1111 1111 1111
CVV: 123
Expiry: Any future date
Name: Any name
```

**Test UPI:**
```
UPI ID: success@razorpay
```

### Google OAuth

**Console:** https://console.cloud.google.com

**Credentials:**
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

**Redirect URI:**
```
http://localhost:5173/auth/google/callback
```

### Email (Gmail SMTP)

**Settings:**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

**Get App Password:**
1. Go to Google Account settings
2. Security → 2-Step Verification
3. App passwords → Generate

---

## 8. TEST DATA

### Sample Projects

**Project 1:**
```json
{
  "name": "Skyline Residences",
  "developer": "builder1@example.com",
  "location": "Bandra West, Mumbai",
  "type": "residential",
  "status": "ongoing",
  "total_units": 50,
  "starting_price": 25000000,
  "completion_date": "2025-12-31"
}
```

**Project 2:**
```json
{
  "name": "Green Valley Towers",
  "developer": "builder2@example.com",
  "location": "Powai, Mumbai",
  "type": "residential",
  "status": "ongoing",
  "total_units": 30,
  "starting_price": 18000000,
  "completion_date": "2026-06-30"
}
```

### Sample Properties

**Property 1:**
```json
{
  "project": "Skyline Residences",
  "unit_number": "A-101",
  "property_type": "2bhk",
  "carpet_area": 850,
  "price": 25000000,
  "floor_number": 1,
  "status": "available"
}
```

### Sample Bookings

**Booking 1:**
```json
{
  "property": "A-101",
  "buyer": "buyer1@example.com",
  "booking_amount": 2500000,
  "token_amount": 500000,
  "status": "confirmed",
  "payment_plan": "construction_linked"
}
```

### Sample Payments

**Payment 1:**
```json
{
  "booking": 1,
  "amount": 500000,
  "payment_method": "razorpay",
  "razorpay_payment_id": "pay_test123",
  "status": "completed"
}
```

---

## 9. ENVIRONMENT VARIABLES TEMPLATE

### Backend (.env)

```bash
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://apnaghar_user:apnaghar_password@localhost:5432/apnaghar_db

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# IPFS/Pinata
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Blockchain
BLOCKCHAIN_API_URL=http://localhost:3000/api/v1

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:8000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

---

## 10. QUICK REFERENCE

### Login URLs

- **Frontend:** http://localhost:5173/login
- **Admin Panel:** http://localhost:8000/admin
- **API Docs:** http://localhost:8000/api/docs/

### Default Passwords

- **Admin:** admin123
- **Builders:** Builder@123
- **Buyers:** Buyer@123

### Test Accounts Summary

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| admin@apnaghar.com | admin123 | Admin | System administration |
| builder1@example.com | Builder@123 | Builder | Test project creation |
| builder2@example.com | Builder@123 | Builder | Test project creation |
| buyer1@example.com | Buyer@123 | Buyer | Test bookings |
| buyer2@example.com | Buyer@123 | Buyer | Test investments |

### API Endpoints

```bash
# Authentication
POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/refresh/
POST /api/auth/google/

# Projects
GET  /api/projects/
POST /api/projects/
GET  /api/projects/{id}/
PUT  /api/projects/{id}/

# Properties
GET  /api/properties/
POST /api/properties/
GET  /api/properties/{id}/

# Bookings
GET  /api/bookings/
POST /api/bookings/
GET  /api/bookings/{id}/

# Payments
POST /api/payments/create/
POST /api/payments/verify/

# Blockchain
GET  /api/blockchain/progress/
GET  /api/blockchain/documents/
```

---

## 11. SECURITY NOTES

### ⚠️ IMPORTANT - Production Deployment

**Before deploying to production:**

1. **Change ALL passwords**
2. **Generate new SECRET_KEY**
3. **Use production API keys**
4. **Set DEBUG=False**
5. **Configure ALLOWED_HOSTS**
6. **Enable HTTPS**
7. **Setup proper CORS**
8. **Rotate JWT secrets**
9. **Use strong passwords**
10. **Enable rate limiting**

### Password Requirements

**Minimum Requirements:**
- Length: 8 characters
- Must include: uppercase, lowercase, number
- Special characters recommended

### API Rate Limiting

```python
# Default limits
- Anonymous: 100 requests/hour
- Authenticated: 1000 requests/hour
- Admin: Unlimited
```

---

## 12. TROUBLESHOOTING

### Can't Login?

1. Check email/password
2. Verify account is active
3. Check role permissions
4. Clear browser cache
5. Check Django logs

### API Authentication Failed?

1. Check token expiration
2. Verify Authorization header
3. Refresh access token
4. Check CORS settings

### Database Connection Error?

1. Verify PostgreSQL is running
2. Check credentials
3. Test connection string
4. Check firewall rules

---

**For more information, see [COMPLETE_PROJECT_GUIDE.md](./COMPLETE_PROJECT_GUIDE.md)**

**Last Updated:** November 24, 2025
