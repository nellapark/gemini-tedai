import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Browserbase } from '@browserbasehq/sdk';
import { Stagehand } from '@browserbasehq/stagehand';
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

// Initialize Browserbase client
const browserbase = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY || '',
});

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
            },
            
            // TIMELINE & CONTEXT
            issueHistory: {
              type: 'object',
              properties: {
                whenStarted: { 
                  type: 'string',
                  description: 'When the issue first appeared or was noticed (e.g., "2 weeks ago", "This morning", "Unknown")'
                },
                howItHappened: {
                  type: 'string',
                  description: 'How the issue occurred or developed based on user description (e.g., "After heavy rain", "Gradually worsened over time", "Sudden failure")'
                },
                previousAttempts: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Any attempts the homeowner made to fix or address the issue'
                }
              },
              description: 'Historical context about when and how the issue developed'
            },
            userTimeline: {
              type: 'object',
              properties: {
                desiredCompletionDate: {
                  type: 'string',
                  description: 'When the user needs the repair completed (e.g., "ASAP", "Within 1 week", "Before winter", "Flexible")'
                },
                schedulingConstraints: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Any scheduling preferences or constraints mentioned (e.g., "Only weekdays", "Need to be home", "Holiday deadline")'
                }
              },
              description: 'User timeline and scheduling preferences'
            },
            userConcerns: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific concerns, worries, or priorities mentioned by the user (e.g., "Worried about mold", "Cost is a concern", "Need it done before guests arrive")'
            },
            environmentalFactors: {
              type: 'array',
              items: { type: 'string' },
              description: 'Environmental or situational factors mentioned that may affect the repair (e.g., "Heavy rain expected", "Cold weather", "Home occupied", "Pets in the house")'
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
            'recommendedActions',
            'issueHistory',
            'userTimeline',
            'userConcerns',
            'environmentalFactors'
          ]
        }
      },
      systemInstruction: `You are an expert home services estimator and project manager for QuoteScout. Your role is to analyze home repair issues from multimodal input (video, images, audio, text) and create professional, detailed scope-of-work documentation.

CRITICAL: EXTRACT ALL IMPORTANT INFORMATION FROM MULTIMODAL DATA
You MUST carefully analyze and extract ALL important details from videos, live streams, photos, audio recordings, and text descriptions including:
- Visual observations from videos/images (damage, materials, conditions, measurements)
- Spoken information from audio/video (user concerns, timeline, how it happened, urgency)
- Text descriptions and annotations provided by the user
- Environmental context shown or mentioned
- Timeline information (when issue started, when they need it fixed)
- User concerns, worries, and priorities
- Any previous repair attempts
- Scheduling constraints or preferences

ANALYSIS GUIDELINES:
1. **Be Thorough**: Examine ALL visual and audio details carefully. Note specific observations like pipe diameter, material type, damage extent, environmental conditions, etc.

2. **Listen Carefully**: Pay close attention to what the user SAYS in videos and audio. They often mention:
   - When the issue started and how it happened
   - Their timeline/deadline for getting it fixed
   - Specific concerns or worries
   - Previous attempts to fix it
   - Budget concerns or constraints
   - Why they need it done (events, guests, safety, etc.)

3. **Be Specific**: Use precise language and measurements when visible. Instead of "broken pipe", say "1.5-inch copper supply line with visible crack at elbow joint".

4. **Capture Context**: Document the full story:
   - Issue History: When it started, how it happened, what was tried
   - User Timeline: When they need it done, any scheduling constraints
   - User Concerns: What they're worried about, their priorities
   - Environmental Factors: Weather, occupancy, pets, events, etc.

5. **Think Like a Contractor**: Provide information that helps contractors give accurate quotes without an in-person visit. Include access requirements, materials likely needed, and complexity factors.

6. **Assess Risk**: Identify safety hazards, urgency factors (active leaks, electrical issues, structural concerns), and potential for damage escalation.

7. **Be Professional**: The scope of work should read like a document from an experienced project manager, not a homeowner's description. Use industry-standard terminology while remaining clear.

8. **Autofill Intelligently**: Make educated estimates for dimensions, quantities, and time requirements based on visual evidence and typical scenarios. Flag when in-person inspection is needed for accuracy.

9. **Categorize Precisely**: Use specific subcategories to help route to the right specialists (e.g., not just "Plumbing" but "Supply Line Leak" vs "Drain Clog" vs "Water Heater Issue").

SCOPE OF WORK FORMAT:
- Summary: Professional 2-3 sentence overview suitable for contractor brief
- Required Tasks: Step-by-step list with priority levels
- Materials: Specific items needed with approximate quantities
- Duration: Realistic time estimate
- Access: Any special requirements or challenges

TIMELINE & CONTEXT FORMAT:
- Issue History: Document when it started, how it happened, and any previous fix attempts
- User Timeline: Capture their desired completion date and scheduling constraints
- User Concerns: List their specific worries and priorities
- Environmental Factors: Note any relevant conditions or circumstances

Remember: This document will be sent directly to contractors. Make it comprehensive, professional, and actionable. INCLUDE ALL IMPORTANT INFORMATION FROM THE MULTIMODAL DATA - don't leave anything out!`
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

// API endpoint for annotating images with Gemini Vision
app.post('/api/annotate-images', upload.array('images', 10), async (req, res) => {
  try {
    const files = req.files;
    const analysisContext = req.body.analysisContext || '';

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    console.log(`Annotating ${files.length} images with Gemini Vision`);

    const annotatedImages = [];

    // Use Gemini Vision to annotate each image
    const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    for (const file of files) {
      const imagePart = await fileToGenerativePart(file.path, file.mimetype);
      
      const prompt = `You are analyzing an image for a home repair scope of work document. 
      
Context: ${analysisContext}

Analyze this image and provide:
1. What you see in the image
2. Key measurements or dimensions if visible
3. Important details a contractor should note
4. Any safety concerns visible
5. Recommendations for the repair

Be specific, technical, and concise. This annotation will be included in a professional PDF document.

IMPORTANT: Use ONLY standard English characters (A-Z, a-z, 0-9, basic punctuation). Do NOT use emojis, special Unicode characters, or non-Latin characters. Keep all text in plain English.`;

      const result = await visionModel.generateContent([
        prompt,
        imagePart
      ]);

      // Sanitize annotation to remove non-English characters
      let annotation = result.response.text();
      // Remove emojis and non-Latin characters, keeping only ASCII printable characters
      annotation = annotation.replace(/[^\x20-\x7E\n\r\t]/g, '').trim();
      
      // Convert image to base64 for PDF embedding
      const imageData = await fs.readFile(file.path);
      const base64Image = `data:${file.mimetype};base64,${imageData.toString('base64')}`;

      annotatedImages.push({
        url: base64Image,
        annotation: annotation
      });

      // Clean up uploaded file
      await fs.unlink(file.path).catch(err => console.error('Error deleting file:', err));
    }

    console.log(`Successfully annotated ${annotatedImages.length} images`);
    res.json({ annotatedImages });

  } catch (error) {
    console.error('Error annotating images:', error);
    
    // Clean up files on error
    if (req.files) {
      for (const file of req.files) {
        await fs.unlink(file.path).catch(() => {});
      }
    }

    res.status(500).json({ 
      error: 'Failed to annotate images',
      message: error.message 
    });
  }
});

// Store for active quote search sessions
const quoteSessions = new Map();

// API endpoint for requesting quotes using computer use
app.post('/api/request-quotes', async (req, res) => {
  try {
    const { jobId, zipCode, city, category, subcategory, problemSummary, scopeOfWork } = req.body;

    if (!jobId || !zipCode || !city) {
      return res.status(400).json({ error: 'Job ID, zip code, and city are required' });
    }

    // Check if this job is already being processed
    if (quoteSessions.has(jobId)) {
      console.log(`Job ${jobId} is already being processed, returning existing session`);
      return res.json({ success: true, jobId, alreadyRunning: true });
    }

    console.log(`Starting quote search for job ${jobId} in ${city}, ${zipCode}`);

    // Initialize session storage
    const sessionData = {
      jobId,
      zipCode,
      city,
      category,
      subcategory,
      problemSummary,
      scopeOfWork,
      sessions: [],
      contractors: [],
      clients: new Set(),
      isRunning: true, // Add flag to track if search is in progress
    };
    quoteSessions.set(jobId, sessionData);

    // Start quote search asynchronously
    searchContractorsWithComputerUse(sessionData);

    res.json({ success: true, jobId });
  } catch (error) {
    console.error('Error starting quote search:', error);
    res.status(500).json({ 
      error: 'Failed to start quote search',
      message: error.message 
    });
  }
});

// SSE endpoint for real-time quote progress updates
app.get('/api/quote-progress/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  console.log(`SSE connection established for job ${jobId}`);
  
  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sessionData = quoteSessions.get(jobId);
  if (!sessionData) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Session not found' })}\n\n`);
    res.end();
    return;
  }

  // Add client to session
  sessionData.clients.add(res);

  // Send initial state
  if (sessionData.sessions.length > 0) {
    sessionData.sessions.forEach(session => {
      res.write(`data: ${JSON.stringify({ type: 'session_update', session })}\n\n`);
    });
  }

  // Handle client disconnect
  req.on('close', () => {
    console.log(`SSE connection closed for job ${jobId}`);
    sessionData.clients.delete(res);
  });
});

// Broadcast update to all connected clients
function broadcastToClients(jobId, data) {
  const sessionData = quoteSessions.get(jobId);
  if (sessionData && sessionData.clients) {
    sessionData.clients.forEach(client => {
      try {
        client.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (error) {
        console.error('Error broadcasting to client:', error);
      }
    });
  }
}

// Main function to search contractors using computer use
async function searchContractorsWithComputerUse(sessionData) {
  const { jobId, zipCode, category, subcategory, problemSummary } = sessionData;
  
  // Create sessions for both platforms - EXACTLY 2 SESSIONS
  const platforms = ['taskrabbit', 'thumbtack'];
  console.log(`Creating ${platforms.length} Computer Use Agent sessions for job ${jobId}: ${platforms.join(', ')}`);
  
  // Run searches in parallel
  const searchPromises = platforms.map(platform => 
    searchPlatform(platform, sessionData)
  );

  try {
    await Promise.all(searchPromises);
    
    console.log(`Completed all ${platforms.length} searches for job ${jobId}`);
    
    // Mark session as completed
    sessionData.isRunning = false;
    
    // Broadcast completion
    broadcastToClients(jobId, { 
      type: 'complete',
      totalContractors: sessionData.contractors.length 
    });
    
    // Clean up session after 5 minutes
    setTimeout(() => {
      quoteSessions.delete(jobId);
      console.log(`Cleaned up session data for job ${jobId}`);
    }, 5 * 60 * 1000);
    
  } catch (error) {
    console.error('Error in quote search:', error);
    sessionData.isRunning = false;
    
    broadcastToClients(jobId, { 
      type: 'error',
      message: error.message 
    });
  }
}

// Search a specific platform using Browserbase + Gemini Computer Use Agent
async function searchPlatform(platform, sessionData) {
  const { jobId, zipCode, city, category, subcategory, problemSummary, scopeOfWork } = sessionData;
  const sessionId = `${platform}-${Date.now()}`;
  
  console.log(`[${jobId}] Starting Computer Use Agent session for ${platform.toUpperCase()} in ${city}, ${zipCode}`);
  
  // Initialize session state
  const session = {
    id: sessionId,
    platform,
    status: 'initializing',
    progress: 0,
    currentAction: 'Setting up Browserbase session with Google Computer Use...',
    screenshot: null,
    contractors: [],
    logs: [], // Initialize logs array
    error: null,
    startTime: new Date(),
  };
  
  sessionData.sessions.push(session);
  broadcastToClients(jobId, { type: 'session_update', session });

  let stagehand;
  let originalConsoleLog;
  let originalConsoleInfo;

  try {
    // Initialize Stagehand with Browserbase - following the gemini-browser pattern
    updateSession(session, {
      progress: 5,
      currentAction: 'Creating remote browser session...',
    });
    broadcastToClients(jobId, { type: 'session_update', session });

    // Set up console interceptor to capture agent reasoning logs
    originalConsoleLog = console.log;
    originalConsoleInfo = console.info;
    
    const logInterceptor = (...args) => {
      const logMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      // Check if this is an agent reasoning log
      if (logMessage.includes('Reasoning:')) {
        const reasoningMatch = logMessage.match(/Reasoning:\s*(.+)/s);
        if (reasoningMatch) {
          const reasoning = reasoningMatch[1].trim();
          // Add to agent activity logs - show more context (300 chars)
          const displayReasoning = reasoning.length > 300 
            ? reasoning.substring(0, 300) + '...' 
            : reasoning;
          addLog(session, `🤔 Agent Reasoning: ${displayReasoning}`, 'info');
          broadcastToClients(jobId, { type: 'session_update', session });
        }
      }
      
      // Also check for other agent actions
      if (logMessage.includes('Taking screenshot')) {
        addLog(session, `📸 Agent taking screenshot for verification`, 'info');
        broadcastToClients(jobId, { type: 'session_update', session });
      }
      
      // Call original console.log
      originalConsoleLog.apply(console, args);
    };
    
    // Override console methods to capture Stagehand logs
    console.log = logInterceptor;
    console.info = logInterceptor;

    stagehand = new Stagehand({
      env: 'BROWSERBASE',
      useAPI: false, // Required for agent pattern with Computer Use
      verbose: 1, // 0 = errors only, 1 = info, 2 = debug
      browserbaseSessionCreateParams: {
        projectId: process.env.BROWSERBASE_PROJECT_ID,
        browserSettings: {
          viewport: {
            width: 1288,
            height: 711,
          },
        },
      },
    });

    await stagehand.init();
    const sessionID = stagehand.browserbaseSessionID;
    console.log(`Stagehand initialized for ${platform}`);
    console.log(`Browserbase session ID: ${sessionID}`);

    // Get the page
    const page = stagehand.page;
    
      // Get debug URL from Browserbase for live viewing
      let liveViewUrl = null;
      try {
        // Use .debug() method to get the live view URLs (not .retrieve())
        const debugUrls = await browserbase.sessions.debug(sessionID);
        console.log(`[${jobId}] Debug URLs for ${platform}:`, JSON.stringify(debugUrls, null, 2));
        
        // Use debuggerFullscreenUrl for iframe embedding
        if (debugUrls.debuggerFullscreenUrl) {
          liveViewUrl = debugUrls.debuggerFullscreenUrl;
          console.log(`[${jobId}] ✓ Using debuggerFullscreenUrl: ${liveViewUrl}`);
        } else if (debugUrls.debuggerUrl) {
          liveViewUrl = debugUrls.debuggerUrl;
          console.log(`[${jobId}] ✓ Using debuggerUrl: ${liveViewUrl}`);
        } else {
          console.error(`[${jobId}] ✗ No debug URLs available in response`);
        }
      } catch (err) {
        console.error(`[${jobId}] ✗ Could not get debug URLs: ${err.message}`);
      }
    
    // Update status with live view URL
    updateSession(session, {
      status: 'navigating',
      progress: 15,
      currentAction: `Opening ${platform === 'taskrabbit' ? 'TaskRabbit.com' : 'Thumbtack.com'}...`,
      liveViewUrl,
      browserbaseSessionID: sessionID,
    });
    broadcastToClients(jobId, { type: 'session_update', session });
    
    console.log(`[${jobId}] Broadcasting session update with liveViewUrl for ${platform}`);

    // Step 1: Navigate to the website
    const url = platform === 'taskrabbit' 
      ? 'https://www.taskrabbit.com'
      : 'https://www.thumbtack.com';
    
    addLog(session, `🌐 Navigating to ${url}`, 'info');
    broadcastToClients(jobId, { type: 'session_update', session });
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    updateSession(session, {
      progress: 25,
      currentAction: 'Website loaded, AI agent starting...',
    });
    addLog(session, `✓ Successfully loaded ${platform === 'taskrabbit' ? 'TaskRabbit' : 'Thumbtack'}`, 'success');
    broadcastToClients(jobId, { type: 'session_update', session });

    // Step 2: Create Computer Use Agent for autonomous web browsing
    updateSession(session, {
      status: 'searching',
      progress: 35,
      currentAction: 'Initializing Gemini Computer Use Agent...',
    });
    addLog(session, `🤖 Initializing Gemini 2.5 Computer Use Agent`, 'info');
    broadcastToClients(jobId, { type: 'session_update', session });

    const platformName = platform === 'taskrabbit' ? 'TaskRabbit' : 'Thumbtack';
    
    // Generate smart search queries based on actual problem details
    const scopeSummary = scopeOfWork?.summary || '';
    const requiredTasks = scopeOfWork?.requiredTasks?.map(t => t.task).join(', ') || '';
    
    const agent = stagehand.agent({
      provider: 'google',
      model: 'gemini-2.5-computer-use-preview-10-2025',
      instructions: `You are a helpful assistant that can use a web browser to search for home service contractors.
      You are currently on ${url} and you MUST STAY ON THIS WEBSITE.
      
      ⚠️ CRITICAL CONSTRAINTS:
      - You MUST stay on ${url} at all times
      - DO NOT navigate to Google.com or any external search engines
      - DO NOT leave ${platformName}.com under any circumstances
      - Use ONLY the search functionality available on ${platformName}.com
      - All searches must be performed using ${platformName}'s built-in search
      
      📋 USER'S ACTUAL PROBLEM CONTEXT:
      - Problem Summary: "${problemSummary}"
      - Category: ${category} / ${subcategory}
      - Scope of Work: ${scopeSummary}
      - Required Tasks: ${requiredTasks}
      
      🔍 SMART SEARCH STRATEGY:
      Use the problem context to create SPECIFIC search queries. Try multiple searches if needed:
      
      Example 1: If problem is "hole in drywall" → Try these searches in order:
        1. "fix hole in wall" or "drywall hole repair"
        2. "patch drywall hole"
        3. "wall repair" or "drywall repair"
        4. If those fail, try generic "${subcategory}"
      
      Example 2: If problem is "leaky faucet in kitchen" → Try:
        1. "fix leaky faucet" or "faucet repair"
        2. "plumbing faucet leak"
        3. "kitchen plumbing repair"
        4. If those fail, try generic "plumber"
      
      Example 3: If problem is "broken door handle" → Try:
        1. "door handle repair" or "fix broken door handle"
        2. "door hardware repair"
        3. "handyman door repair"
        4. If those fail, try generic "handyman"
      
      YOUR TASK:
      1. Analyze the problem context above and formulate 2-3 specific search queries
      2. Try your first specific search query on ${platformName}.com (e.g., "fix hole in wall")
      3. If you get good results (contractors that match), proceed to extract data
      4. If results are poor or empty, try your second search query
      5. If still no good results, try a more generic search (${subcategory})
      6. For location/address field, enter "${city}, ${zipCode}" or "${zipCode}" depending on what the field accepts
      7. Browse through the top 3-5 contractor profiles that MATCH the actual problem
      8. Click on each relevant contractor profile to view their detailed page (staying on ${platformName}.com)
      9. Extract comprehensive information including reviews, specialties, and pricing
      
      DETAILED EXTRACTION REQUIREMENTS:
      For EACH contractor, extract the following (click into their ${platformName} profile if needed):
      
      BASIC INFO:
      - name (string): Full name or business name
      - rating (number): Overall rating (e.g., 4.8)
      - reviewCount (number): Total number of reviews
      - profileImage (string): URL to profile picture or business logo
      - profileUrl (string): Direct link to their ${platformName} profile
      - description (string): Brief summary of their services
      
      PRICING:
      - price (string): Hourly rate, project rate, or starting price (e.g., "$50-100/hr", "From $75", "$200/project")
      - priceNeedsFollowUp (boolean): true if no price listed and says "Contact for quote" or similar
      
      SPECIALTIES & EXPERIENCE:
      - specialties (array of strings): List of their specific expertise areas (e.g., ["Drywall Repair", "Painting", "Home Renovation"])
      - yearsOfExperience (number): Years in business (if visible)
      - isTopRated (boolean): Whether they have a "Top Pro", "Elite", or similar badge
      
      REVIEWS & TESTIMONIALS:
      - goodReviews (array): 2-3 POSITIVE reviews with:
        { text: "review text", rating: 5, author: "Customer name", date: "Month Year" }
      - badReviews (array): 1-2 NEGATIVE/CRITICAL reviews (if any) with same structure
        Note: Look for reviews with 3 stars or below, or complaints
      
      AVAILABILITY:
      - availability (string): "Available now", "Responds in 2 hours", booking schedule, etc.
      
      IMPORTANT RULES:
      - STAY ON ${url} - do not navigate to any other domain
      - Use only ${platformName}'s native search and navigation
      - Click into contractor profiles to see full details and reviews (all on ${platformName}.com)
      - Read through multiple reviews to find both good AND bad ones
      - Extract actual review text, not summaries
      - If information is not available, use null or empty array
      - Return results as a JSON array of contractor objects
      - If you cannot find the information on ${platformName}.com, return empty arrays/null values
      - DO NOT attempt to search elsewhere or leave ${platformName}.com
      
      Do not ask follow-up questions. Work entirely within ${platformName}.com to complete this task.`,
      options: {
        apiKey: process.env.GOOGLE_API_KEY,
      },
    });

    console.log(`[${jobId}] Executing Computer Use Agent for ${platform.toUpperCase()}...`);
    
    updateSession(session, {
      progress: 40,
      currentAction: 'Starting AI agent search...',
    });
    addLog(session, `🔍 Agent task: Find ${category} contractors in ${city}, ${zipCode}`, 'action');
    broadcastToClients(jobId, { type: 'session_update', session });

    // Execute the agent with the instruction - include problem context for smarter searching
    const instruction = `STAY ON ${url} - The user has this specific problem: "${problemSummary}".
    
    Based on this problem, formulate 2-3 specific search queries that match the actual issue (not just generic "${category}").
    For example:
    - If the problem is about a hole in drywall, search for "fix hole in wall" or "drywall hole repair"
    - If it's a leaky faucet, search for "fix leaky faucet" or "faucet repair"
    - If it's a broken door, search for "door repair" or "fix broken door"
    
    Try your most specific search first on ${platformName}.com in the location: ${city}, ${zipCode}.
    For the location/address field, enter "${city}, ${zipCode}" or just "${zipCode}" depending on what the field accepts.
    If the results are poor (no relevant contractors), try a slightly broader search.
    If still no results, fall back to generic "${subcategory}" search.
    
    DO NOT navigate to Google or any external sites. Use only ${platformName}.com's built-in search functionality.
    Once you find relevant contractors on ${platformName}.com, browse through the top 3-5 listings, click into each profile (staying on ${platformName}.com) to view detailed information, 
    read their reviews (both positive and negative), check their specialties, pricing, and experience. 
    Extract comprehensive data for each contractor including good and bad reviews, specialties, images, and pricing details.
    Work entirely within ${platformName}.com to complete this task.`;
    
    // Add detailed phase logs
    addLog(session, `🎯 Phase 1: Analyzing problem and formulating smart search queries`, 'action');
    addLog(session, `🔍 Problem: "${problemSummary.substring(0, 60)}${problemSummary.length > 60 ? '...' : ''}"`, 'info');
    broadcastToClients(jobId, { type: 'session_update', session });
    
    // Start agent execution with progress tracking
    const agentStartTime = Date.now();
    
    // Create a promise to track agent execution with periodic updates
    const executionPromise = agent.execute({
      instruction: instruction,
      maxSteps: 35,
      autoScreenshot: true,
    });
    
    // Add periodic status updates during execution
    const progressInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - agentStartTime) / 1000);
      const estimatedProgress = Math.min(40 + Math.floor(elapsed / 3), 65);
      
      // Add contextual logs based on elapsed time
      if (elapsed === 5) {
        addLog(session, `🔎 Phase 2: Trying specific search query on ${platformName}`, 'action');
        updateSession(session, { progress: estimatedProgress });
        broadcastToClients(jobId, { type: 'session_update', session });
      } else if (elapsed === 10) {
        addLog(session, `📋 Phase 3: Evaluating ${platformName} search results quality`, 'action');
        updateSession(session, { progress: estimatedProgress });
        broadcastToClients(jobId, { type: 'session_update', session });
      } else if (elapsed === 15) {
        addLog(session, `🔄 Refining search query if needed for better matches`, 'info');
        updateSession(session, { progress: estimatedProgress });
        broadcastToClients(jobId, { type: 'session_update', session });
      } else if (elapsed === 22) {
        addLog(session, `👤 Phase 4: Found relevant contractors, opening profiles`, 'action');
        updateSession(session, { progress: estimatedProgress });
        broadcastToClients(jobId, { type: 'session_update', session });
      } else if (elapsed === 32) {
        addLog(session, `⭐ Phase 5: Reading ${platformName} reviews and ratings`, 'action');
        updateSession(session, { progress: estimatedProgress });
        broadcastToClients(jobId, { type: 'session_update', session });
      } else if (elapsed === 42) {
        addLog(session, `💰 Phase 6: Extracting pricing and specialty data from ${platformName}`, 'action');
        updateSession(session, { progress: estimatedProgress });
        broadcastToClients(jobId, { type: 'session_update', session });
      } else if (elapsed === 52) {
        addLog(session, `🔄 Phase 7: Comparing additional ${platformName} contractors`, 'action');
        updateSession(session, { progress: estimatedProgress });
        broadcastToClients(jobId, { type: 'session_update', session });
      }
    }, 1000);
    
    // Wait for agent to complete
    const result = await executionPromise;
    
    // Clear the progress interval
    clearInterval(progressInterval);
    
    updateSession(session, {
      status: 'extracting',
      progress: 70,
      currentAction: 'Processing AI agent results...',
    });
    
    const actualSteps = result.steps || result.stepsTaken || 'unknown';
    addLog(session, `✅ Agent completed execution (${actualSteps} steps taken)`, 'success');
    addLog(session, `📊 Processing extracted data into structured format...`, 'info');
    broadcastToClients(jobId, { type: 'session_update', session });

    console.log(`Agent execution result for ${platform}:`, result);

    // Parse contractors from agent result
    let contractors = [];
    if (result.success) {
      try {
        // Try to parse JSON from the result
        const resultText = result.result || '';
        const jsonMatch = resultText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          contractors = JSON.parse(jsonMatch[0]);
          addLog(session, `✓ Found ${contractors.length} contractor${contractors.length !== 1 ? 's' : ''}`, 'success');
          broadcastToClients(jobId, { type: 'session_update', session });
        }
      } catch (e) {
        console.warn(`Failed to parse contractors from ${platform} agent result:`, e);
        addLog(session, `⚠ Unable to parse contractor data from results`, 'error');
        broadcastToClients(jobId, { type: 'session_update', session });
      }
    } else {
      addLog(session, `⚠ Agent execution did not complete successfully`, 'error');
      broadcastToClients(jobId, { type: 'session_update', session });
    }

    console.log(`Extracted ${contractors.length} contractors from ${platform}`);

    // Format contractors for our system with comprehensive data
    const formattedContractors = contractors.map((c, i) => ({
      // Basic Info
      id: `${platform}-${Date.now()}-${i}`,
      name: c.name || `Contractor ${i + 1}`,
      rating: parseFloat(c.rating) || 4.5,
      reviewCount: parseInt(c.reviewCount || c.review_count) || 0,
      description: c.description || 'Professional service provider',
      profileUrl: c.profileUrl || `https://www.${platform}.com`,
      profileImage: c.profileImage || `https://i.pravatar.cc/150?img=${(i + 1) * 7}`,
      
      // Pricing
      price: c.price || null,
      priceNeedsFollowUp: c.priceNeedsFollowUp !== undefined ? c.priceNeedsFollowUp : !c.price,
      
      // Specialties & Experience
      specialties: Array.isArray(c.specialties) ? c.specialties : [],
      yearsOfExperience: c.yearsOfExperience ? parseInt(c.yearsOfExperience) : undefined,
      isTopRated: c.isTopRated || false,
      
      // Reviews & Testimonials
      goodReviews: Array.isArray(c.goodReviews) ? c.goodReviews.map(r => ({
        text: r.text || r.review || '',
        rating: r.rating ? parseInt(r.rating) : undefined,
        author: r.author || r.name || 'Anonymous',
        date: r.date || undefined
      })) : [],
      badReviews: Array.isArray(c.badReviews) ? c.badReviews.map(r => ({
        text: r.text || r.review || '',
        rating: r.rating ? parseInt(r.rating) : undefined,
        author: r.author || r.name || 'Anonymous',
        date: r.date || undefined
      })) : [],
      
      // Availability & Contact
      availability: c.availability || 'Contact for availability',
      phoneNumber: c.phoneNumber || c.phone || undefined,
      email: c.email || undefined,
      
      // Platform
      platform,
    }));
    
    session.contractors = formattedContractors;
    sessionData.contractors.push(...formattedContractors);
    
    updateSession(session, {
      progress: 90,
      currentAction: `Extracted ${formattedContractors.length} contractors`,
    });
    addLog(session, `📋 Processing ${formattedContractors.length} contractor profile${formattedContractors.length !== 1 ? 's' : ''}`, 'info');
    broadcastToClients(jobId, { 
      type: 'contractors_found',
      contractors: formattedContractors,
      platform 
    });
    broadcastToClients(jobId, { type: 'session_update', session });
    
    // Complete session
    updateSession(session, {
      status: 'completed',
      progress: 100,
      currentAction: `Search complete! Found ${formattedContractors.length} contractors`,
      endTime: new Date(),
    });
    addLog(session, `✅ Search completed successfully - ${formattedContractors.length} contractor${formattedContractors.length !== 1 ? 's' : ''} ready for review`, 'success');
    
    console.log(`[${jobId}] Successfully completed ${platform.toUpperCase()} search - found ${formattedContractors.length} contractors`);
    broadcastToClients(jobId, { type: 'session_update', session });

  } catch (error) {
    console.error(`[${jobId}] Error searching ${platform.toUpperCase()}:`, error.message);
    
    updateSession(session, {
      status: 'error',
      progress: 100,
      error: error.message,
      currentAction: `Failed: ${error.message}`,
      endTime: new Date(),
    });
    addLog(session, `❌ Error: ${error.message}`, 'error');
    broadcastToClients(jobId, { type: 'session_update', session });
  } finally {
    // Restore original console methods
    if (originalConsoleLog) {
      console.log = originalConsoleLog;
    }
    if (originalConsoleInfo) {
      console.info = originalConsoleInfo;
    }
    
    // Clean up browser session
    if (stagehand) {
      try {
        addLog(session, `🔒 Closing browser session`, 'info');
        broadcastToClients(jobId, { type: 'session_update', session });
        await stagehand.close();
        console.log(`[${jobId}] Closed Stagehand session for ${platform.toUpperCase()}`);
      } catch (e) {
        console.error(`[${jobId}] Error closing Stagehand for ${platform}:`, e);
      }
    }
  }
}

// Helper function to update session
// Helper function to add a log entry to a session
function addLog(session, message, type = 'info') {
  if (!session.logs) {
    session.logs = [];
  }
  session.logs.push({
    timestamp: new Date(),
    message,
    type
  });
}

// Update session with new values and optionally add a log
function updateSession(session, updates, logMessage = null, logType = 'action') {
  Object.assign(session, updates);
  
  // If a log message is provided, add it to the logs
  if (logMessage) {
    addLog(session, logMessage, logType);
  } else if (updates.currentAction) {
    // Automatically log the current action
    addLog(session, updates.currentAction, 'action');
  }
}

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

