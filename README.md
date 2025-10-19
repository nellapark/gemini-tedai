<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1saIFZEerZTFtrcmhRrzBgg0wsUts_TrU

## Features

- **Multimodal AI Analysis**: Analyze home repair issues using video, images, audio, and text
- **Automated Quote Requesting**: Uses Browserbase + Gemini Computer Use Agent to search TaskRabbit and Thumbtack
- **Live Streaming**: Stream live video with AI analysis
- **PDF Generation**: Create professional Scope of Work documents
- **Real-time Updates**: Server-Sent Events for live progress tracking

## Run Locally

**Prerequisites:**  Node.js, Browserbase account (for automated quote searching)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key
   GOOGLE_API_KEY=your_google_api_key
   BROWSERBASE_API_KEY=your_browserbase_api_key
   BROWSERBASE_PROJECT_ID=your_browserbase_project_id
   ```

3. Run the app:
   ```bash
   # Run both frontend and backend
   npm run dev:full
   
   # Or run separately:
   npm run dev:backend  # Backend server (port 8080)
   npm run dev          # Frontend dev server (port 3000)
   ```

## Deploy to Google Cloud Run

Your GitHub CI/CD automatically deploys when you push. Just add the missing secrets:

**One-time setup:** Add these 3 secrets to Google Secret Manager:
- `GOOGLE_API_KEY` (same value as GEMINI_API_KEY)
- `BROWSERBASE_API_KEY`
- `BROWSERBASE_PROJECT_ID`

See [ADD_SECRETS.md](ADD_SECRETS.md) for the exact commands.

Then push to GitHub and it will auto-deploy! 🚀

## Browserbase Setup

For the automated contractor search feature, you'll need to set up Browserbase:
1. Sign up at https://www.browserbase.com
2. Get your API Key and Project ID from Settings
3. Add them to your `.env` file (local) or Google Secret Manager (Cloud Run)

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + Gemini AI + Browserbase + Stagehand
- **AI Models**: 
  - `gemini-2.0-flash-exp` for multimodal analysis
  - `gemini-2.5-computer-use-preview-10-2025` for browser automation
- **Infrastructure**: Google Cloud Run + Secret Manager + Browserbase
