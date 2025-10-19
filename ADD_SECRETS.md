# Add Missing Secrets to Google Cloud

Your GitHub CI/CD will automatically deploy when you push. You just need to add **3 missing secrets** to Google Secret Manager.

## Current Status

✅ You already have: `GEMINI_API_KEY`

❌ You need to add:
- `GOOGLE_API_KEY` (same value as GEMINI_API_KEY)
- `BROWSERBASE_API_KEY` 
- `BROWSERBASE_PROJECT_ID`

---

## Add the Secrets

Run these commands (replace with your actual values):

```bash
# 1. Add GOOGLE_API_KEY (use the same value as your GEMINI_API_KEY)
echo -n "YOUR_GEMINI_API_KEY_VALUE" | gcloud secrets create GOOGLE_API_KEY \
  --data-file=- \
  --replication-policy="automatic"

# 2. Add BROWSERBASE_API_KEY (get from https://www.browserbase.com/settings)
echo -n "YOUR_BROWSERBASE_API_KEY" | gcloud secrets create BROWSERBASE_API_KEY \
  --data-file=- \
  --replication-policy="automatic"

# 3. Add BROWSERBASE_PROJECT_ID (get from https://www.browserbase.com/settings)
echo -n "YOUR_BROWSERBASE_PROJECT_ID" | gcloud secrets create BROWSERBASE_PROJECT_ID \
  --data-file=- \
  --replication-policy="automatic"
```

---

## Grant Cloud Build Access

After creating the secrets, grant Cloud Build permission to access them:

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')

# Grant access to the 3 new secrets
for SECRET in GOOGLE_API_KEY BROWSERBASE_API_KEY BROWSERBASE_PROJECT_ID; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

---

## Verify

Check all secrets are created:

```bash
gcloud secrets list
```

You should see all 4:
- ✅ GEMINI_API_KEY
- ✅ GOOGLE_API_KEY
- ✅ BROWSERBASE_API_KEY
- ✅ BROWSERBASE_PROJECT_ID

---

## Deploy

Once secrets are added, just push to GitHub:

```bash
git add .
git commit -m "Add Browserbase integration"
git push origin main
```

Your GitHub CI/CD will automatically deploy to Cloud Run with all the secrets! 🚀

---

## Where to Get Keys

- **Gemini API Key**: https://aistudio.google.com/apikey
- **Browserbase API Key & Project ID**: https://www.browserbase.com/settings

