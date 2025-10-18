# QuoteScout - Quick Command Reference

## 🚀 Getting Started

```bash
# Run setup script (recommended for first time)
./setup.sh

# Or manually
npm install
cp .env.example .env
# Edit .env with your GEMINI_API_KEY
```

## 💻 Local Development

```bash
# Terminal 1: Frontend development server with hot reload
npm run dev
# Visit: http://localhost:3000

# Terminal 2: Backend API server
node server.js
# API: http://localhost:8080/api
```

## 🏗️ Build & Production

```bash
# Build the React frontend
npm run build

# Start production server (serves built frontend + API)
npm start
# Visit: http://localhost:8080

# Preview production build with Vite
npm run preview
```

## 🧪 Testing & Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Test coverage
npm run test:coverage

# Check code duplication
npm run check-duplication
```

## 🐳 Docker

```bash
# Build Docker image
docker build -t quotescout .

# Run Docker container locally
docker run -p 8080:8080 \
  -e GEMINI_API_KEY=your_api_key_here \
  quotescout

# Visit: http://localhost:8080
```

## ☁️ Google Cloud Deployment

### Initial Setup

```bash
# Login and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Create API key secret
echo -n "your_gemini_api_key" | \
  gcloud secrets create gemini-api-key --data-file=-
```

### Deploy

```bash
# Deploy using Cloud Build (recommended)
gcloud builds submit --config cloudbuild.yaml

# Update service with secret
gcloud run services update quotescout \
  --update-secrets=GEMINI_API_KEY=gemini-api-key:latest \
  --region=us-central1

# Or manual deploy
docker build -t gcr.io/YOUR_PROJECT_ID/quotescout:latest .
docker push gcr.io/YOUR_PROJECT_ID/quotescout:latest

gcloud run deploy quotescout \
  --image gcr.io/YOUR_PROJECT_ID/quotescout:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --update-secrets=GEMINI_API_KEY=gemini-api-key:latest \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300
```

### Monitoring

```bash
# View logs
gcloud run services logs read quotescout \
  --region=us-central1 \
  --limit=50

# Follow logs in real-time
gcloud run services logs tail quotescout \
  --region=us-central1

# View service details
gcloud run services describe quotescout \
  --region=us-central1

# List all services
gcloud run services list

# Delete service
gcloud run services delete quotescout \
  --region=us-central1
```

### Update Configuration

```bash
# Update memory
gcloud run services update quotescout \
  --memory=4Gi \
  --region=us-central1

# Update timeout
gcloud run services update quotescout \
  --timeout=600 \
  --region=us-central1

# Update max instances
gcloud run services update quotescout \
  --max-instances=20 \
  --region=us-central1

# Add environment variable
gcloud run services update quotescout \
  --set-env-vars=NODE_ENV=production \
  --region=us-central1
```

## 🔧 Troubleshooting

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist

# Check port availability
lsof -i :3000
lsof -i :8080

# Kill process on port
kill -9 $(lsof -t -i:8080)

# Check environment variables
node -e "console.log(process.env.GEMINI_API_KEY)"

# Test API locally
curl http://localhost:8080/api/health

# Test Cloud Run deployment
curl https://quotescout-xxxxx.run.app/api/health
```

## 📦 Dependencies Management

```bash
# Update all dependencies
npm update

# Check for outdated packages
npm outdated

# Update specific package
npm install @google/generative-ai@latest

# Audit for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## 🗂️ File Operations

```bash
# Create uploads directory
mkdir -p uploads

# Clean uploads directory
rm -rf uploads/*

# Clean build artifacts
npm run build && rm -rf dist

# Remove all generated files
rm -rf node_modules dist uploads
```

## 🔐 Secrets Management

```bash
# Create secret in Google Cloud
echo -n "secret_value" | \
  gcloud secrets create secret-name --data-file=-

# Update existing secret
echo -n "new_value" | \
  gcloud secrets versions add secret-name --data-file=-

# List secrets
gcloud secrets list

# Access secret value
gcloud secrets versions access latest --secret="secret-name"

# Delete secret
gcloud secrets delete secret-name
```

## 📊 Performance

```bash
# Analyze bundle size
npm run build
ls -lh dist/

# Check production build performance
npm run preview

# Load test (requires Apache Bench)
ab -n 100 -c 10 http://localhost:8080/
```

## 🔗 Useful URLs

- **Local Dev Frontend**: http://localhost:3000
- **Local Dev Backend**: http://localhost:8080
- **API Health Check**: http://localhost:8080/api/health
- **GCP Console**: https://console.cloud.google.com
- **Cloud Run Services**: https://console.cloud.google.com/run
- **Cloud Build History**: https://console.cloud.google.com/cloud-build
- **Secrets Manager**: https://console.cloud.google.com/security/secret-manager
- **Gemini API Keys**: https://ai.google.dev

