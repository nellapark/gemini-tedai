#!/bin/bash

##
# Pre-commit Quality Checks
# Runs the same dynamic checks that will run in CI
# Install: ln -s ../../.github/scripts/pre-commit-checks.sh .git/hooks/pre-commit
##

set -e

echo "🔍 Running pre-commit quality checks..."
echo ""

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Are you in the project root?"
    exit 1
fi

# Run the dynamic check discovery script
if [ -f ".github/scripts/run-available-checks.js" ]; then
    echo "🤖 Using dynamic check runner..."
    node .github/scripts/run-available-checks.js
else
    echo "⚠️  Dynamic runner not found, running standard checks..."
    
    # Fallback to standard checks
    HAS_ERRORS=0
    
    # TypeScript check
    if [ -f "tsconfig.json" ] && grep -q "type-check" package.json; then
        echo "📘 Running TypeScript checks..."
        npm run type-check || HAS_ERRORS=1
    fi
    
    # Linting
    if ls .eslintrc* 1> /dev/null 2>&1 && grep -q '"lint"' package.json; then
        echo "🔍 Running linter..."
        npm run lint || HAS_ERRORS=1
    fi
    
    # Tests
    if grep -q '"test"' package.json; then
        echo "🧪 Running tests..."
        npm test || HAS_ERRORS=1
    fi
    
    if [ $HAS_ERRORS -eq 1 ]; then
        echo ""
        echo "❌ Pre-commit checks failed!"
        echo "Fix the errors above or use 'git commit --no-verify' to skip checks."
        exit 1
    fi
fi

echo ""
echo "✅ All pre-commit checks passed!"
echo "📤 Proceeding with commit..."
