# Google Cloud Run Deployment Setup

## Prerequisites
- Google Cloud Project with billing enabled
- `gcloud` CLI installed and configured
- Your Gemini API key

## Setup Steps

### 1. Store API Key in Secret Manager

First, store your Gemini API key in Google Secret Manager:

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Create the secret (replace YOUR_API_KEY with your actual key)
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key \
  --data-file=- \
  --replication-policy="automatic"
```

### 2. Grant Cloud Build Access to Secret

Grant the Cloud Build service account permission to access the secret:

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Grant Secret Manager Secret Accessor role to Cloud Build
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Deploy to Cloud Run

Now deploy using Cloud Build:

```bash
# Trigger build from your repository
gcloud builds submit --config=cloudbuild.yaml

# Or if using Cloud Build triggers with GitHub/GitLab, just push to your repo
git add .
git commit -m "Add Cloud Run deployment config"
git push origin main
```

## How It Works

1. **Build Time**: During Docker build, Cloud Build retrieves the `GEMINI_API_KEY` from Secret Manager and passes it as a build argument `VITE_GEMINI_API_KEY`

2. **Vite Build**: The Vite build process embeds `import.meta.env.VITE_GEMINI_API_KEY` into the JavaScript bundle

3. **Runtime**: The built application runs on Cloud Run with the API key embedded in the client bundle

## Updating the API Key

To update the API key:

```bash
echo -n "NEW_API_KEY" | gcloud secrets versions add gemini-api-key --data-file=-
```

Then redeploy your application.

## Security Note

⚠️ **Important**: The API key is embedded in the client-side JavaScript bundle. This means:
- The key is visible to anyone who inspects the browser's network traffic or JavaScript files
- Consider implementing rate limiting and API key restrictions in Google Cloud Console
- For production, consider proxying Gemini API requests through your backend instead

To restrict your API key:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your Gemini API key
3. Add restrictions (e.g., HTTP referrers, IP addresses)

## Troubleshooting

### Error: "Secret not found"
Make sure you created the secret with the exact name `gemini-api-key`

### Error: "Permission denied"
Ensure Cloud Build service account has `secretmanager.secretAccessor` role

### API Key not working in deployed app
1. Check Cloud Build logs to confirm the secret was accessed
2. Verify the API key is valid
3. Ensure the key has proper restrictions that allow your Cloud Run URL

