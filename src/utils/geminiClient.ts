import { GoogleGenAI } from '@google/genai';
import { Representative } from './representatives';
import { Mission } from '../types/game';
import { getSiteWideApiKey } from '../config/geminiConfig';

const STORAGE_KEY = 'centrelink_gemini_api_key';

export function hasCustomUserKey(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return !!(val && val.trim().length > 10);
  } catch {
    return false;
  }
}

export function getCustomUserKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function isSiteWideKeyLoaded(): boolean {
  return !!getSiteWideApiKey();
}

export function getStoredApiKey(): string {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local && local.trim().length > 10) return local.trim();
  } catch {}
  return getSiteWideApiKey();
}

let clientAi: GoogleGenAI | null = null;

function initClientAi() {
  const key = getStoredApiKey();
  if (key && key !== 'MY_GEMINI_API_KEY' && key.trim().length > 10) {
    try {
      clientAi = new GoogleGenAI({ apiKey: key.trim() });
    } catch (err) {
      console.warn('Client Gemini init error', err);
      clientAi = null;
    }
  } else {
    clientAi = null;
  }
}

initClientAi();

export function setStoredApiKey(key: string): void {
  try {
    if (key && key.trim()) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    initClientAi();
  } catch (err) {
    console.error('Error saving API key to localStorage', err);
  }
}

export function clearStoredApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    initClientAi();
  } catch (err) {
    console.error('Error clearing API key', err);
  }
}

export function hasClientGeminiKey(): boolean {
  return !!clientAi;
}

export async function testGeminiApiKey(candidateKey?: string): Promise<{ success: boolean; message: string }> {
  const keyToTest = (candidateKey && candidateKey.trim()) || getStoredApiKey();
  if (!keyToTest || keyToTest === 'MY_GEMINI_API_KEY' || keyToTest.trim().length < 10) {
    return { success: false, message: 'No Gemini API key provided. Please enter a valid key.' };
  }

  const models = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];
  let lastError = '';

  for (const model of models) {
    try {
      const testAi = new GoogleGenAI({ apiKey: keyToTest.trim() });
      const response = await testAi.models.generateContent({
        model,
        contents: "Respond in under 10 words: G'day mate! Centrelink AI is connected and ready.",
      });
      const text = response.text?.trim() || "Connected!";
      return { success: true, message: `Connected with ${model}: "${text}"` };
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }

  return {
    success: false,
    message: `API connection failed: ${lastError.slice(0, 130) || 'Invalid key or network error'}`,
  };
}

export async function generateClientIVR(params: {
  speechText: string;
  volumeDb: number;
  currentMenu: string;
  promptTask: string;
  difficulty: string;
}): Promise<{
  robocallerResponseText: string;
  action: string;
  callerDelta?: number;
  nextMenu?: string;
} | null> {
  if (!clientAi) return null;

  const models = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];
  for (const model of models) {
    try {
      const isFirm = params.volumeDb >= 55 && params.volumeDb < 82;
      const response = await clientAi.models.generateContent({
        model,
        contents: `You are an automated Centrelink Interactive Voice Response (IVR) telephone robot.
Current Menu: "${params.currentMenu}".
User Loudness: ${params.volumeDb} dB.
User Speech: "${params.speechText}".
Target Task: "${params.promptTask}".
Difficulty: ${params.difficulty}.

Instructions:
1. If user is in the wrong department or speaking about a different department, announce you are redirecting them to the correct queue!
2. If user spoke with firm assertive tone (55-81 dB) and requested help or dispute, action is "TRANSFER_QUEUE".
3. If volume < 45 dB or mumbling, loop them with a typical bureaucratic automated response.
4. Keep under 30 words in mechanical telephone IVR phrasing.
5. Format strictly as JSON with keys: "responseText", "action" ("TRANSFER_QUEUE" | "MENU_LOOP" | "KICK_TO_BACK"), "queuePenalty" (number), "nextMenu" (string).`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        robocallerResponseText: parsed.responseText,
        action: parsed.action || (isFirm ? 'TRANSFER_QUEUE' : 'MENU_LOOP'),
        callerDelta: parsed.queuePenalty || 0,
        nextMenu: parsed.nextMenu || 'MAIN_MENU',
      };
    } catch {
      continue;
    }
  }
  return null;
}

export async function generateClientAgent(params: {
  speechText: string;
  volumeDb: number;
  activeMission: Mission;
  representative: Representative;
  holdTimeSeconds: number;
  difficulty: string;
  screamStrikes?: number;
  currentDepartment?: string;
}): Promise<{
  agentResponseText: string;
  approved: boolean;
  agentState: string;
  targetDepartment?: string;
} | null> {
  if (!clientAi) return null;

  const rep = params.representative;
  const currentDept = params.currentDepartment || params.activeMission.targetDepartment;
  const isWrongDept = currentDept !== params.activeMission.targetDepartment;
  const models = ['gemini-2.5-flash', 'gemini-2.5-pro'];

  for (const model of models) {
    try {
      const response = await clientAi.models.generateContent({
        model,
        contents: `You are "${rep.name}", a human Centrelink ${rep.title} in Australia.
Heritage & Personality: ${rep.heritage}.
Your Current Department: "${currentDept}".
Caller's Required Department: "${params.activeMission.targetDepartment}".
Is Caller in Wrong Department right now?: ${isWrongDept ? 'YES - THEY ARE IN THE WRONG QUEUE!' : 'NO - CORRECT QUEUE'}.
CRITICAL INSTRUCTION: You are a genuine Australian human public servant. NEVER talk like an AI or corporate bot. Speak with real Australian call-centre colloquialisms ('look mate', 'fair dinkum', 'hang on a tick', 'rightio', 'yeah no worries', 'ah geez', 'pull ya head in').
Current Case File: "${params.activeMission.title} - ${params.activeMission.description}".
Caller Loudness: ${params.volumeDb} dB.
Caller just said: "${params.speechText}".
Hold time endured by caller: ${params.holdTimeSeconds} seconds.
Scream Strikes: ${params.screamStrikes || 0}/6.

CONVERSATION RULES (Respond dynamically to ANYTHING the caller says):
1. WRONG DEPARTMENT RULE: If the caller is in the wrong department (${isWrongDept ? 'THEY ARE IN WRONG DEPT!' : 'NO'}) or asks for a different department, tell them: "Whoa, hold on mate! You've come through to ${currentDept}, but your file needs ${params.activeMission.targetDepartment}. Don't hang up, I'm transferring you straight over right now." Set agentState to "TRANSFER_WRONG_DEPT".
2. The caller may say ANYTHING to you: small talk, jokes, complaints about the hold music, venting, asking how you are, making excuses, or explaining their case.
3. RESPOND NATURALLY AND DYNAMICALLY TO WHATEVER THEY SAY! Never give canned or repetitive responses. You have infinite options for what to say.
4. If they ask about Centrelink or your day, give a weary, humorous Australian worker response (drinking cold blend 43 coffee, computer freezing, supervisor hovering).
5. If they explain their case facts (doctor certificate, scanner offline, casual earnings, cousin in Dubbo, rent lease), react specifically to what they tell you.
6. If they clearly explain and justify their dispute in a firm, reasonable tone (50-80 dB), approve their claim and lift the suspension (set "approved": true, agentState: "CLAIM_APPROVED")!
7. If they scream (> 82 dB), tell them to pull their head in and calm down.
8. Keep response concise (under 45 words), natural, and human.
9. Format strictly as JSON with keys: "responseText", "approved" (boolean), "agentState" ("CONVERSING" | "CLAIM_APPROVED" | "PUT_ON_HOLD_AGAIN" | "TRANSFER_WRONG_DEPT").`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        agentResponseText: parsed.responseText,
        approved: !!parsed.approved,
        agentState: parsed.agentState || 'CONVERSING',
        targetDepartment: params.activeMission.targetDepartment,
      };
    } catch {
      continue;
    }
  }

  return null;
}
