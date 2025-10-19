# QuoteScout - Deployment Guide

## Google Cloud Run Deployment

This guide will help you deploy QuoteScout to Google Cloud Run.

### Prerequisites

1. **Google Cloud Project**: Create a project at [console.cloud.google.com](https://console.cloud.google.com)
2. **gcloud CLI**: Install from [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
3. **Gemini API Key**: Get your key from [ai.google.dev](https://ai.google.dev)

### Setup Steps

#### 1. Initialize Google Cloud

```bash
# Login to Google Cloud
gcloud auth login

# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

#### 2. Set Environment Variables

```bash
# Set your Gemini API key as a Cloud Run secret
echo -n "your_gemini_api_key_here" | gcloud secrets create gemini-api-key --data-file=-
```

#### 3. Deploy to Cloud Run

**Option A: Using Cloud Build (Recommended)**

```bash
# Deploy using cloudbuild.yaml
gcloud builds submit --config cloudbuild.yaml

# After deployment, set the secret
gcloud run services update quotescout \
  --update-secrets=GEMINI_API_KEY=gemini-api-key:latest \
  --region=us-central1
```

**Option B: Manual Deployment**

```bash
# Build the Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/quotescout:latest .

# Push to Container Registry
docker push gcr.io/YOUR_PROJECT_ID/quotescout:latest

# Deploy to Cloud Run
gcloud run deploy quotescout \
  --image gcr.io/YOUR_PROJECT_ID/quotescout:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --update-secrets=GEMINI_API_KEY=gemini-api-key:latest \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10 \
  --timeout 300
```

#### 4. Access Your Application

After deployment, Cloud Run will provide a URL like:
```
https://quotescout-xxxxx-uc.a.run.app
```

### Local Development

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Set Environment Variables

Create a `.env` file:
```bash
GEMINI_API_KEY=your_api_key_here
PORT=8080
```

#### 3. Run Development Server

```bash
# Terminal 1: Run Vite dev server (frontend)
npm run dev

# Terminal 2: Run Express server (backend)
node server.js
```

Visit `http://localhost:3000` to see the app.

### Production Build & Test Locally

```bash
# Build the frontend
npm run build

# Start the production server
npm start
```

Visit `http://localhost:8080` to test the production build.

### Configuration

#### Cloud Run Settings

- **Memory**: 2Gi (handles large video uploads)
- **CPU**: 2 (fast processing)
- **Timeout**: 300 seconds (5 minutes for large file processing)
- **Max Instances**: 10 (adjust based on expected traffic)

#### File Upload Limits

- Max file size: 100MB per file
- Max files: 10 files per request
- Supported formats:
  - Video: mp4, mov, avi, etc.
  - Images: jpg, png, webp, etc.
  - Audio: mp3, wav, m4a, etc.

### Monitoring

```bash
# View logs
gcloud run services logs read quotescout --region=us-central1 --limit=50

# View service details
gcloud run services describe quotescout --region=us-central1
```

### Troubleshooting

#### Issue: "GEMINI_API_KEY not set"
- Ensure you've created the secret and updated the service with `--update-secrets`

#### Issue: "Request timeout"
- Increase the timeout: `gcloud run services update quotescout --timeout=600 --region=us-central1`

#### Issue: "Out of memory"
- Increase memory: `gcloud run services update quotescout --memory=4Gi --region=us-central1`

### Cost Optimization

- Cloud Run pricing is pay-per-use
- Estimated costs for moderate usage: $10-50/month
- Monitor usage: `gcloud run services describe quotescout --region=us-central1 --format="value(status.traffic)"`

### Security

- API key is stored as a Cloud Secret
- Files are temporarily stored and deleted after processing
- CORS is enabled for frontend communication
- Consider adding authentication for production use

### Next Steps

1. Add custom domain: [cloud.google.com/run/docs/mapping-custom-domains](https://cloud.google.com/run/docs/mapping-custom-domains)
2. Set up CI/CD: Connect to GitHub for automatic deployments
3. Add monitoring: Set up Cloud Monitoring alerts
4. Scale settings: Adjust based on traffic patterns

