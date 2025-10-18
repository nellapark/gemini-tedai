#!/bin/bash

echo "🔍 QuoteScout MVP - Validation Script"
echo "======================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

errors=0

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} $(node --version)"
else
    echo -e "${RED}✗ Not installed${NC}"
    ((errors++))
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✓${NC} $(npm --version)"
else
    echo -e "${RED}✗ Not installed${NC}"
    ((errors++))
fi

# Check if node_modules exists
echo -n "Checking dependencies... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Installed"
else
    echo -e "${YELLOW}⚠${NC} Not installed (run: npm install)"
fi

# Check .env file
echo -n "Checking .env file... "
if [ -f ".env" ]; then
    if grep -q "GEMINI_API_KEY=" .env; then
        if grep -q "GEMINI_API_KEY=your_api_key_here" .env; then
            echo -e "${YELLOW}⚠${NC} Exists but needs API key"
        else
            echo -e "${GREEN}✓${NC} Configured"
        fi
    else
        echo -e "${YELLOW}⚠${NC} Missing GEMINI_API_KEY"
    fi
else
    echo -e "${YELLOW}⚠${NC} Not found (run: cp .env.example .env)"
fi

# Check required files
echo ""
echo "Checking required files..."
files=(
    "package.json"
    "index.html"
    "index.tsx"
    "server.js"
    "Dockerfile"
    "src/App.tsx"
    "src/components/Icons.tsx"
    "src/styles.css"
    "tailwind.config.js"
    "vite.config.ts"
)

for file in "${files[@]}"; do
    echo -n "  $file... "
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗${NC}"
        ((errors++))
    fi
done

# Check TypeScript
echo ""
echo -n "Type checking... "
if [ -d "node_modules" ]; then
    npm run type-check &> /dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} No errors"
    else
        echo -e "${YELLOW}⚠${NC} Type errors found (run: npm run type-check)"
    fi
else
    echo -e "${YELLOW}⚠${NC} Skipped (install dependencies first)"
fi

# Summary
echo ""
echo "======================================="
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ Validation passed!${NC}"
    echo ""
    echo "Ready to:"
    echo "  • Run locally: npm run dev (+ node server.js)"
    echo "  • Build: npm run build"
    echo "  • Deploy: gcloud builds submit"
else
    echo -e "${RED}❌ Found $errors error(s)${NC}"
    echo "Please fix the errors above."
fi
echo ""

