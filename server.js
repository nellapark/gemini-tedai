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

    // Call Gemini API with enhanced F2 requirements
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            // ISSUE CLASSIFIER
            category: {
              type: 'string',
              enum: ['Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Carpentry', 'Painting', 'Appliance Repair', 'Flooring', 'Windows & Doors', 'Insulation', 'Foundation', 'Pest Control', 'Landscaping', 'General Handyman', 'Other']
            },
            subcategory: {
              type: 'string',
              description: 'More specific classification (e.g., "Pipe Leak", "Circuit Breaker Issue", "AC Not Cooling")'
            },
            
            // CORE PROBLEM IDENTIFICATION
            problemSummary: {
              type: 'string',
              description: 'A clear, concise summary of the core issue in 1-2 sentences.'
            },
            detailedDescription: {
              type: 'string',
              description: 'Comprehensive description of the problem based on visual/audio analysis, including specific observations.'
            },
            
            // SEVERITY & DETAILS
            severity: {
              type: 'string',
              enum: ['Minor', 'Moderate', 'Major', 'Severe'],
              description: 'Overall severity of the issue based on potential damage, safety concerns, and repair complexity.'
            },
            urgency: {
              type: 'string',
              enum: ['Low', 'Medium', 'High', 'Critical'],
              description: 'How quickly this needs to be addressed (e.g., active water leak = Critical).'
            },
            urgencyReason: {
              type: 'string',
              description: 'Explanation for the urgency level (e.g., "Active water leak causing ongoing damage")'
            },
            
            // DIMENSIONS & SCOPE
            affectedAreas: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of rooms or areas affected (e.g., ["Kitchen", "Basement"])'
            },
            estimatedSize: {
              type: 'string',
              description: 'Approximate size or dimensions of the affected area or damaged component (e.g., "2 ft section of pipe", "10x12 ft room", "Single fixture")'
            },
            visibleDamage: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of visible damage or symptoms observed (e.g., "Water staining on ceiling", "Corrosion on pipes")'
            },
            
            // STANDARDIZED SCOPE OF WORK
            scopeOfWork: {
              type: 'object',
              properties: {
                summary: {
                  type: 'string',
                  description: 'Professional summary suitable for sending to contractors'
                },
                requiredTasks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      task: { type: 'string' },
                      description: { type: 'string' },
                      priority: { 
                        type: 'string',
                        enum: ['Required', 'Recommended', 'Optional']
                      }
                    }
                  },
                  description: 'Detailed list of tasks with descriptions and priority levels'
                },
                materialsNeeded: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of materials or components likely needed (e.g., "PVC pipe", "Circuit breaker", "Drywall patch")'
                },
                estimatedDuration: {
                  type: 'string',
                  description: 'Rough estimate of job duration (e.g., "2-4 hours", "1-2 days")'
                },
                accessRequirements: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Special access needs (e.g., "Ladder required", "Crawl space access", "Attic entry")'
                }
              }
            },
            
            // SAFETY & SPECIAL CONSIDERATIONS
            safetyHazards: {
              type: 'array',
              items: { type: 'string' },
              description: 'Any safety concerns identified (e.g., "Electrical hazard", "Water damage risk", "Mold potential")'
            },
            specialConsiderations: {
              type: 'array',
              items: { type: 'string' },
              description: 'Additional factors contractors should know (e.g., "Asbestos era home", "HOA restrictions", "Historic building")'
            },
            
            // MEASUREMENTS & TECHNICAL DETAILS
            measurements: {
              type: 'object',
              properties: {
                hasVisibleMeasurements: { type: 'boolean' },
                estimatedMeasurements: {
                  type: 'array',
                  items: { type: 'string' }
                }
              },
              description: 'Any measurements visible in media or estimated dimensions'
            },
            
            // RECOMMENDATIONS
            recommendedActions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Immediate actions homeowner can take while waiting for contractor (e.g., "Shut off water valve", "Turn off circuit breaker")'
            },
            additionalInspectionNeeded: {
              type: 'boolean',
              description: 'Whether contractor will likely need additional inspection before providing accurate quote'
            }
          },
          required: [
            'category', 
            'subcategory', 
            'problemSummary', 
            'detailedDescription', 
            'severity', 
            'urgency', 
            'urgencyReason',
            'affectedAreas',
            'estimatedSize',
            'visibleDamage',
            'scopeOfWork',
            'safetyHazards',
            'measurements',
            'recommendedActions'
          ]
        }
      },
      systemInstruction: `You are an expert home services estimator and project manager for QuoteScout. Your role is to analyze home repair issues from multimodal input (video, images, audio, text) and create professional, detailed scope-of-work documentation.

ANALYSIS GUIDELINES:
1. **Be Thorough**: Examine all visual and audio details carefully. Note specific observations like pipe diameter, material type, damage extent, environmental conditions, etc.

2. **Be Specific**: Use precise language and measurements when visible. Instead of "broken pipe", say "1.5-inch copper supply line with visible crack at elbow joint".

3. **Think Like a Contractor**: Provide information that helps contractors give accurate quotes without an in-person visit. Include access requirements, materials likely needed, and complexity factors.

4. **Assess Risk**: Identify safety hazards, urgency factors (active leaks, electrical issues, structural concerns), and potential for damage escalation.

5. **Be Professional**: The scope of work should read like a document from an experienced project manager, not a homeowner's description. Use industry-standard terminology while remaining clear.

6. **Autofill Intelligently**: Make educated estimates for dimensions, quantities, and time requirements based on visual evidence and typical scenarios. Flag when in-person inspection is needed for accuracy.

7. **Categorize Precisely**: Use specific subcategories to help route to the right specialists (e.g., not just "Plumbing" but "Supply Line Leak" vs "Drain Clog" vs "Water Heater Issue").

SCOPE OF WORK FORMAT:
- Summary: Professional 2-3 sentence overview suitable for contractor brief
- Required Tasks: Step-by-step list with priority levels
- Materials: Specific items needed with approximate quantities
- Duration: Realistic time estimate
- Access: Any special requirements or challenges

Remember: This document will be sent directly to contractors. Make it comprehensive, professional, and actionable.`
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

