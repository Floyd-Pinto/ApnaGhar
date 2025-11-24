#!/bin/bash

# Database Verification Script
# Run this to check all data is stored properly

echo "🗄️  ApnaGhar Database Verification"
echo "=================================="
echo ""

cd backend

# Activate virtual environment
source ../venv/bin/activate

echo "📊 Checking Database Records..."
echo ""

python3 manage.py shell << EOF
from projects.models import *
from users.models import *
from blockchain.models import *
from payments.models import *
from notifications.models import *

print("=" * 50)
print("DATABASE RECORD COUNTS")
print("=" * 50)
print("")

print("👥 USERS & AUTHENTICATION")
print(f"  Users: {CustomUser.objects.count()}")
print(f"  Developers: {Developer.objects.count()}")
print("")

print("🏗️  PROJECTS & PROPERTIES")
print(f"  Projects: {Project.objects.count()}")
print(f"  Properties: {Property.objects.count()}")
print(f"  Milestones: {ConstructionMilestone.objects.count()}")
print(f"  Construction Updates: {ConstructionUpdate.objects.count()}")
print("")

print("⭐ REVIEWS & BOOKINGS")
print(f"  Reviews: {Review.objects.count()}")
print(f"  Bookings: {Booking.objects.count()}")
print("")

print("💰 PAYMENTS")
print(f"  Payments: {Payment.objects.count()}")
print("")

print("⛓️  BLOCKCHAIN RECORDS")
print(f"  Progress Updates: {BlockchainProgressUpdate.objects.count()}")
print(f"  Documents: {BlockchainDocument.objects.count()}")
print("")

print("🔔 NOTIFICATIONS")
print(f"  Notifications: {Notification.objects.count()}")
print("")

print("=" * 50)
print("VERIFICATION COMPLETE")
print("=" * 50)
EOF

echo ""
echo "✅ Database verification complete!"
echo ""
echo "To check specific records, run:"
echo "  python3 manage.py shell"
echo ""
