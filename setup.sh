#!/bin/bash

echo "🏠 QuoteScout - Setup Script"
echo "=============================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env and add your GEMINI_API_KEY"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env and add your GEMINI_API_KEY"
    echo "2. Run 'npm run dev' in one terminal (frontend)"
    echo "3. Run 'node server.js' in another terminal (backend)"
    echo "4. Open http://localhost:3000 in your browser"
    echo ""
else
    echo "❌ Installation failed. Please check the errors above."
    exit 1
fi

