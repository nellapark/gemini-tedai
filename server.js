import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Helper function to convert file to base64 and prepare for Gemini
async function fileToGenerativePart(filePath, mimeType) {
  const data = await fs.readFile(filePath);
  return {
    inlineData: {
      data: data.toString('base64'),
      mimeType
    }
  };
}

// API endpoint for analyzing multimodal input
app.post('/api/analyze', upload.array('media', 10), async (req, res) => {
  try {
    const files = req.files;
    const description = req.body.description || '';

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No media files provided' });
    }

    console.log(`Processing ${files.length} files with description: "${description}"`);

    // Prepare parts for Gemini API
    const parts = [];

    // Add media files
    for (const file of files) {
      const part = await fileToGenerativePart(file.path, file.mimetype);
      parts.push(part);
    }

    // Add text description
    if (description) {
      parts.push({
        text: `User description: ${description}`
      });
    }

    // Add instruction text
    parts.push({
      text: `Analyze the provided media and description to identify the home repair or service issue. Classify the job category, summarize the problem, list specific tasks needed, and assess urgency.`
    });

    // Call Gemini API
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: ['Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Carpentry', 'Painting', 'Landscaping', 'Other']
            },
            problemSummary: {
              type: 'string',
              description: 'A one-sentence summary of the core issue.'
            },
            scopeItems: {
              type: 'array',
              items: { type: 'string' },
              description: 'A list of specific tasks a contractor would need to perform.'
            },
            urgency: {
              type: 'string',
              enum: ['Low', 'Medium', 'High', 'Critical'],
              description: 'Assess the urgency based on visual evidence.'
            }
          },
          required: ['category', 'problemSummary', 'scopeItems', 'urgency']
        }
      },
      systemInstruction: `You are an expert home services estimator for QuoteScout. Analyze the provided video, images, audio, and user description of a home repair issue. Based on all available information, accurately classify the job, identify the key tasks required for the repair, and assess the situation's urgency. The scopeItems should be clear, concise, and suitable for a contractor to provide a preliminary quote.`
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }]
    });

    const response = result.response;
    const analysisResult = JSON.parse(response.text());

    console.log('Analysis complete:', analysisResult);

    // Clean up uploaded files
    for (const file of files) {
      await fs.unlink(file.path).catch(err => console.error('Error deleting file:', err));
    }

    res.json(analysisResult);
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Clean up files on error
    if (req.files) {
      for (const file of req.files) {
        await fs.unlink(file.path).catch(() => {});
      }
    }

    res.status(500).json({ 
      error: 'Failed to analyze media',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`QuoteScout server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

