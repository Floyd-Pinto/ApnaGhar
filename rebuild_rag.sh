#!/bin/bash
# Rebuild RAG Pipeline with Fresh Data from Database
# This script exports latest data from Django DB and rebuilds FAISS index

set -e  # Exit on any error

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "   🔄 ApnaGhar RAG Pipeline Rebuild Script"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Store the project root
PROJECT_ROOT="/home/floydpinto/ApnaGhar"

# Check if we're in the correct directory
if [ ! -d "$PROJECT_ROOT/backend" ]; then
    echo -e "${RED}❌ Error: Project directory not found${NC}"
    echo "Please run this script from: $PROJECT_ROOT"
    exit 1
fi

# Step 1: Activate virtual environment
echo -e "${BLUE}[Step 1/5]${NC} Activating virtual environment..."
if [ -f "$PROJECT_ROOT/venv/bin/activate" ]; then
    source "$PROJECT_ROOT/venv/bin/activate"
    echo -e "${GREEN}✓ Virtual environment activated${NC}"
else
    echo -e "${YELLOW}⚠ Warning: Virtual environment not found at $PROJECT_ROOT/venv${NC}"
    echo "Continuing with system Python..."
fi
echo ""

# Step 2: Export fresh data from Django database
echo -e "${BLUE}[Step 2/5]${NC} Exporting fresh data from database..."
cd "$PROJECT_ROOT/backend"

# Check if database is accessible
if ! python manage.py check --database default > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Cannot connect to database${NC}"
    echo "Please ensure your database is running and configured correctly."
    exit 1
fi

# Run export command
echo "Exporting: Projects, Properties, Developers, Construction Milestones..."
python manage.py export_for_rag

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to export data from database${NC}"
    exit 1
fi

# Show export statistics
echo ""
echo "Export Statistics:"
echo "─────────────────────────────────────────────────────────────"
ls -lh "$PROJECT_ROOT/rag-pipeline/data/"*.csv | awk '{printf "  %-35s %8s\n", $9, $5}'
echo "─────────────────────────────────────────────────────────────"

# Count total rows
TOTAL_ROWS=0
for file in "$PROJECT_ROOT/rag-pipeline/data/"*.csv; do
    ROWS=$(wc -l < "$file")
    ROWS=$((ROWS - 1))  # Subtract header row
    TOTAL_ROWS=$((TOTAL_ROWS + ROWS))
done
echo -e "${GREEN}✓ Exported $TOTAL_ROWS total records${NC}"
echo ""

# Step 3: Backup old FAISS index
echo -e "${BLUE}[Step 3/5]${NC} Backing up old FAISS index..."
cd "$PROJECT_ROOT/rag-pipeline"

if [ -d "faiss_store" ] && [ -f "faiss_store/faiss.index" ]; then
    BACKUP_DIR="faiss_store_backup_$(date +%Y%m%d_%H%M%S)"
    mv faiss_store "$BACKUP_DIR"
    echo -e "${GREEN}✓ Old index backed up to: $BACKUP_DIR${NC}"
else
    echo -e "${YELLOW}⚠ No existing index to backup${NC}"
fi
echo ""

# Step 4: Build new FAISS index
echo -e "${BLUE}[Step 4/5]${NC} Building new FAISS vector index..."
echo "This may take 1-3 minutes depending on data size..."
echo ""

python app.py build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build FAISS index${NC}"
    
    # Restore backup if build failed
    if [ -n "$BACKUP_DIR" ] && [ -d "$BACKUP_DIR" ]; then
        echo "Restoring backup..."
        rm -rf faiss_store
        mv "$BACKUP_DIR" faiss_store
        echo -e "${YELLOW}⚠ Restored previous index${NC}"
    fi
    
    exit 1
fi

echo ""
echo -e "${GREEN}✓ FAISS index built successfully${NC}"

# Show index statistics
if [ -d "faiss_store" ]; then
    echo ""
    echo "New Index Statistics:"
    echo "─────────────────────────────────────────────────────────────"
    ls -lh faiss_store/ | tail -n +2 | awk '{printf "  %-25s %8s\n", $9, $5}'
    echo "─────────────────────────────────────────────────────────────"
fi
echo ""

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ RAG Pipeline Rebuilt Successfully!${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "${YELLOW}📋 NEXT STEPS:${NC}"
echo ""
echo "1. Restart the RAG service to load new index:"
echo -e "   ${BLUE}cd $PROJECT_ROOT && python rag-service.py${NC}"
echo ""
echo "2. In another terminal, keep ngrok running (if not already):"
echo -e "   ${BLUE}ngrok http 8000${NC}"
echo ""
echo "3. Update Render environment variable with new ngrok URL:"
echo -e "   ${BLUE}RAG_SERVICE_URL=https://your-new-ngrok-url.ngrok-free.dev${NC}"
echo ""
echo "4. Test the chatbot:"
echo -e "   ${BLUE}curl -X POST http://localhost:8000/query \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"query\": \"Tell me about all builders\"}'${NC}"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
