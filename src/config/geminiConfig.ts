/**
 * Centrelink Call Simulator - Global Gemini AI Configuration
 * 
 * To enable realistic Gemini-powered dialogue for ALL visitors on GitHub Pages or web hosting:
 * 
 * Option 1 (Recommended for GitHub Pages):
 * - Go to your GitHub Repository -> Settings -> Secrets and variables -> Actions
 * - Click "New repository secret" and name it: GEMINI_API_KEY
 * - Paste your Gemini API Key as the secret value.
 * - The included GitHub Actions workflow (.github/workflows/deploy.yml) will automatically inject
 *   this secret as VITE_GEMINI_API_KEY during the build step!
 * 
 * Option 2 (Local / Hardcoded Site Key):
 * - You can paste your key into DEFAULT_SITE_GEMINI_API_KEY below or in a .env file:
 *   VITE_GEMINI_API_KEY=AIzaSy...
 */

export const DEFAULT_SITE_GEMINI_API_KEY: string = '';

export function getSiteWideApiKey(): string {
  // 1. Check Vite build-time environment variable (injected by GitHub Actions secret or .env)
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey !== 'MY_GEMINI_API_KEY' && envKey.trim().length > 10) {
    return envKey.trim();
  }

  // 2. Check hardcoded configuration
  if (DEFAULT_SITE_GEMINI_API_KEY && typeof DEFAULT_SITE_GEMINI_API_KEY === 'string' && DEFAULT_SITE_GEMINI_API_KEY.trim().length > 10) {
    return DEFAULT_SITE_GEMINI_API_KEY.trim();
  }

  return '';
}
