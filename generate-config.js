#!/usr/bin/env node

// Generate runtime config from environment variables
// This runs when the container starts, making env vars available to the frontend

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  VITE_GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ''
};

const configJs = `
// Runtime configuration - generated from environment variables
window.__ENV__ = ${JSON.stringify(config, null, 2)};
`;

const outputPath = path.join(__dirname, 'dist', 'config.js');
fs.writeFileSync(outputPath, configJs);

console.log('✅ Generated runtime config at', outputPath);
console.log('   API key length:', config.VITE_GEMINI_API_KEY.length);

