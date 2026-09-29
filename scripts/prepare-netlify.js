import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildDir = path.join(__dirname, '../build');
const redirectsFile = path.join(buildDir, '_redirects');

// 1. Ensure build directory exists
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// 2. Resolve the API target URL
const rawUrl = process.env.VITE_APP_PRODUCTS_API_URL || 'http://localhost:8080';
let apiTarget = 'http://localhost:8080';

try {
  apiTarget = new URL(rawUrl).origin;
} catch {
  // Fallback to rawUrl if it doesn't parse as a valid URL, or keep localhost
  apiTarget = rawUrl;
}

console.log(`[Netlify Build] Resolving API proxy: /api/* -> ${apiTarget}/api/:splat`);

// 3. Create _redirects file content
const redirectsContent = [
  `# API Proxy Redirect`,
  `/api/*  ${apiTarget}/api/:splat  200`,
  ``,
  `# SPA Routing Fallback`,
  `/*      /index.html                     200`,
  ``
].join('\n');

fs.writeFileSync(redirectsFile, redirectsContent, 'utf-8');
console.log(`[Netlify Build] Generated _redirects file successfully at: ${redirectsFile}`);
