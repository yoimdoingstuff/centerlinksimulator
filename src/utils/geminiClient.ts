import { GoogleGenAI } from '@google/genai';
import { Representative } from './representatives';
import { Mission } from '../types/game';
import { getSiteWideApiKey } from '../config/geminiConfig';

const STORAGE_KEY = 'centrelink_gemini_api_key';

export function getStoredApiKey(): string {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local && local.trim().length > 10) return local.trim();
  } catch {}
  return getSiteWideApiKey();
}

export function isSiteWideKeyActive(): boolean {
  return !!getSiteWideApiKey();
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

export async function generateClientIVR(params: {
  speechText: string;
  volumeDb: number;
  currentMenu: string;
  promptTask: string;
  difficulty: string;
}): Promise<{
  robocallerResponseText: string;
  action: string;
  callerDelta: number;
  nextMenu: string;
} | null> {
  if (!clientAi) return null;

  try {
    const isFirm = params.volumeDb >= 58 && params.volumeDb < 82;
    const response = await clientAi.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are the automated Services Australia (Centrelink) telephone robocaller IVR system.
The caller is trying to solve: "${params.promptTask}".
Current Menu: "${params.currentMenu}".
Caller said: "${params.speechText}". Loudness: ${params.volumeDb} dB.
Is firm & assertive: ${isFirm}. Difficulty: ${params.difficulty}.

Strict Rules:
1. Speak in a robotic, frustrating bureaucratic Australian telephone prompt under 35 words.
2. If caller speech is gibberish, random sounds, coughing, or unrelated words, DO NOT advance! Respond that you did not catch that and ask them to select a valid option or press 1.
3. If they say relevant keywords ("jobseeker", "breach", "payment", "dispute", "transfer", "officer", "representative", "demerit") with firm urgency (58-81 dB), transfer them: "Transferring you to the queue for a customer service officer."
4. Format strictly as JSON with keys: "responseText", "action" ("TRANSFER_QUEUE" | "MENU_LOOP" | "MISUNDERSTOOD"), "queuePenalty" (number), "nextMenu".`,
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
    return null;
  }
}

export async function generateClientAgent(params: {
  speechText: string;
  volumeDb: number;
  activeMission: Mission;
  representative: Representative;
  holdTimeSeconds: number;
  difficulty: string;
  screamStrikes?: number;
}): Promise<{
  agentResponseText: string;
  approved: boolean;
  agentState: string;
} | null> {
  if (!clientAi) return null;

  try {
    const rep = params.representative;
    const response = await clientAi.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are "${rep.name}", a human Centrelink ${rep.title} in Australia.
Heritage & Tone: ${rep.heritage}.
CRITICAL PERSONALITY INSTRUCTION: You are a real Australian human working in an overburdened call centre. You NEVER speak like a bot, automated assistant, or AI. Use natural conversational Australian speech with realistic hesitations, sighs, colloquialisms ('look mate', 'rightio', 'hang on a sec', 'fair enough', 'yeah no worries'), and typing pauses.
Player Mission: "${params.activeMission.title} - ${params.activeMission.description}".
Required Key Mission Concepts: "${params.activeMission.keyPhrases.join(', ')}".
Caller Loudness: ${params.volumeDb} dB.
Caller said: "${params.speechText}".
Hold time endured: ${params.holdTimeSeconds}s.
Current Scream Warning Strikes: ${params.screamStrikes || 0}/6.

Strict Assessment Rules:
1. If caller makes random noises, mumbling, coughing, or says things with NO relation to the mission keywords, DO NOT approve! In character as a bewildered or tired human agent, tell them that made no sense and ask what's actually gone wrong with their paperwork or appointment.
2. If caller is screaming (> 82 dB), do NOT immediately hang up unless at strike 6; instead, try to calm them down in your distinct Australian personality.
3. If caller explains with firm clarity (52-80 dB) and articulates the key facts of their dispute (e.g. medical cert, provider scanner down, casual earnings), APPROVE the claim and wipe the penalty!
4. Keep response concise (under 45 words), sounding like a genuine human Australian officer.
5. Format strictly as JSON with keys: "responseText", "approved" (boolean), "agentState" ("CONVERSING" | "CLAIM_APPROVED" | "PUT_ON_HOLD_AGAIN").`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      agentResponseText: parsed.responseText,
      approved: !!parsed.approved,
      agentState: parsed.agentState || 'CONVERSING',
    };
  } catch {
    return null;
  }
}
