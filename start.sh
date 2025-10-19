#!/bin/sh
set -e

echo "🚀 Starting application..."

# Generate runtime config from environment variables
echo "📝 Generating runtime configuration..."
node generate-config.js

# Start the Node.js server
echo "✅ Starting server..."
exec node server.js

