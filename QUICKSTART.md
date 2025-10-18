# QuoteScout MVP - Quick Start Guide

Get your AI home service agent running in 5 minutes!

## 🎯 What You're Building

An AI-powered app that analyzes home repair issues from videos/photos and provides:
- Automatic issue classification (Plumbing, Electrical, HVAC, etc.)
- Problem summary
- Scope of work
- Urgency assessment

## ⚡ Quick Setup (Local)

### 1. Prerequisites Check

```bash
# Check Node.js (need v20+)
node --version

# Check npm
npm --version

# If not installed, get Node.js from: https://nodejs.org
```

### 2. Get Your API Key

1. Go to https://ai.google.dev
2. Click "Get API Key"
3. Create a new API key
4. Copy it (you'll need it in step 4)

### 3. Install Dependencies

```bash
# Quick setup
./setup.sh

# Or manually
npm install
```

### 4. Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your API key
# Change this line:
#   GEMINI_API_KEY=your_api_key_here
# To:
#   GEMINI_API_KEY=AIza...your_actual_key
```

### 5. Run the App

**Option A: Two Terminals (Recommended for Development)**

```bash
# Terminal 1: Frontend (React + Vite)
npm run dev
# Opens at: http://localhost:3000

# Terminal 2: Backend (Express + Gemini)
node server.js
# API at: http://localhost:8080
```

**Option B: Production Mode**

```bash
# Build and start
npm run build
npm start
# Everything at: http://localhost:8080
```

### 6. Test It Out!

1. Open http://localhost:3000
2. Upload a video or photo of a home issue
   - Try a leaky faucet video
   - Or photos of an electrical outlet
   - Or any home repair issue
3. Add an optional description
4. Click "Get AI Analysis"
5. See the magic! ✨

## 🚀 Deploy to Cloud Run (5 Minutes)

### 1. Set Up Google Cloud

```bash
# Login
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com
```

### 2. Create API Key Secret

```bash
# Store your Gemini API key securely
echo -n "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create gemini-api-key --data-file=-
```

### 3. Deploy!

```bash
# One command deploy
gcloud builds submit --config cloudbuild.yaml

# Set the secret
gcloud run services update quotescout \
  --update-secrets=GEMINI_API_KEY=gemini-api-key:latest \
  --region=us-central1
```

### 4. Get Your URL

```bash
# Cloud Run will give you a URL like:
# https://quotescout-xxxxx-uc.a.run.app

gcloud run services describe quotescout \
  --region=us-central1 \
  --format='value(status.url)'
```

## 🎓 What to Test

### Test Case 1: Plumbing Issue
- **Upload**: Video of a dripping faucet
- **Description**: "Faucet in kitchen keeps dripping"
- **Expected**: Category: Plumbing, Urgency: Medium

### Test Case 2: Electrical Problem
- **Upload**: Photo of a broken outlet
- **Description**: "Outlet stopped working, smells like burning"
- **Expected**: Category: Electrical, Urgency: High

### Test Case 3: HVAC Issue
- **Upload**: Photos of AC unit + voice note
- **Description**: "Air conditioner not cooling, making loud noise"
- **Expected**: Category: HVAC, detailed scope items

## 📊 Understanding the Results

The AI analyzes your media and returns:

```json
{
  "category": "Plumbing",
  "problemSummary": "Leaking pipe under kitchen sink causing water damage",
  "scopeItems": [
    "Replace damaged pipe section",
    "Install new shutoff valve",
    "Repair water-damaged cabinet"
  ],
  "urgency": "High"
}
```

- **Category**: Type of service needed
- **Problem Summary**: What's wrong in one sentence
- **Scope Items**: What a contractor needs to do
- **Urgency**: How quickly you need help

## 🔧 Troubleshooting

### "API Key Not Set" Error
```bash
# Make sure .env file exists and has your key
cat .env
# Should show: GEMINI_API_KEY=AIza...
```

### Port Already in Use
```bash
# Kill process on port 3000
kill -9 $(lsof -t -i:3000)

# Kill process on port 8080
kill -9 $(lsof -t -i:8080)
```

### "Cannot find module" Error
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Validation Failed
```bash
# Run the validation script
./validate.sh

# It will show you what's missing
```

## 📚 Next Steps

1. **Customize the UI**: Edit `src/App.tsx`
2. **Adjust AI Prompts**: Edit `server.js` system instruction
3. **Add Authentication**: Implement user login
4. **Build F2-F8**: Add contractor sourcing, quotes, booking

## 🆘 Need Help?

- **Full Documentation**: See [README.md](./README.md)
- **Deployment Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Command Reference**: See [COMMANDS.md](./COMMANDS.md)
- **Architecture Details**: See [docs/technical_spec.md](./docs/technical_spec.md)

## 🎉 Success!

If you see the app running and can upload/analyze media, congratulations! You've successfully deployed the QuoteScout MVP.

Now you have a working AI agent that can:
- ✅ Accept multimodal input (video/photo/audio)
- ✅ Analyze home repair issues
- ✅ Generate structured scope of work
- ✅ Assess urgency
- ✅ Run locally or in the cloud

**Ready to build the rest of QuoteScout!** 🏠✨

---

Made with ❤️ using Google Gemini AI

