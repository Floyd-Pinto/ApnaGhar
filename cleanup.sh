#!/bin/bash

# ApnaGhar Project Cleanup Script
# This script safely removes temporary and cache files

echo "🧹 Starting ApnaGhar Project Cleanup..."
echo ""

# 1. Remove Python cache files
echo "📦 Removing Python cache files..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find . -type f -name "*.pyc" -delete 2>/dev/null
echo "✅ Python cache cleaned"

# 2. Remove .DS_Store files (Mac)
echo "🍎 Removing .DS_Store files..."
find . -name ".DS_Store" -delete 2>/dev/null
echo "✅ .DS_Store files removed"

# 3. Remove blockchain debugging scripts
echo "⛓️  Removing blockchain debug scripts..."
rm -f blockchain/chaincode/apnaghar-contract/reproduce_exit.js
rm -f blockchain/chaincode/apnaghar-contract/start-chaincode-custom.js
rm -f blockchain/chaincode/apnaghar-contract/test-ccaas.js
echo "✅ Debug scripts removed"

# 4. Create archive directory for outdated docs
echo "📚 Archiving outdated documentation..."
mkdir -p docs/archive

# Move outdated status reports
mv PROJECT_STATUS_REPORT.md docs/archive/ 2>/dev/null
mv FEATURES_COMPLETION_STATUS.md docs/archive/ 2>/dev/null
mv SETUP_STATUS.md docs/archive/ 2>/dev/null
echo "✅ Documentation archived"

# 5. Remove temporary debug files
echo "🗑️  Removing temporary files..."
rm -f FRONTEND_DEBUG.md 2>/dev/null
rm -f TESTING_STATUS.md 2>/dev/null
echo "✅ Temporary files removed"

# 6. Clean npm cache (optional)
echo "📦 Cleaning npm cache..."
cd frontend && npm cache clean --force 2>/dev/null
cd ../blockchain/api && npm cache clean --force 2>/dev/null
cd ../..
echo "✅ npm cache cleaned"

echo ""
echo "✨ Cleanup Complete!"
echo ""
echo "Summary:"
echo "  - Python cache files removed"
echo "  - .DS_Store files removed"
echo "  - Debug scripts removed"
echo "  - Outdated docs archived to docs/archive/"
echo "  - Temporary files removed"
echo ""
echo "Next steps:"
echo "  1. Review docs/archive/ and delete if not needed"
echo "  2. Run 'git status' to see changes"
echo "  3. Update .gitignore if needed"
