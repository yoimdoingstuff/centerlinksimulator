import { GoogleGenAI } from '@google/genai';
import { Representative } from './representatives';
import { Mission } from '../types/game';

const clientApiKey = import.meta.env.VITE_GEMINI_API_KEY;
let clientAi: GoogleGenAI | null = null;

if (clientApiKey && clientApiKey !== 'MY_GEMINI_API_KEY') {
  try {
    clientAi = new GoogleGenAI({ apiKey: clientApiKey });
  } catch (err) {
    console.warn('Client Gemini init error', err);
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

Rules:
1. Robotic, frustrating bureaucratic Australian telephone prompt under 35 words.
2. If firm/assertive, escalate: "Transferring you to the queue for a customer service officer."
3. Format strictly as JSON with keys: "responseText", "action" ("TRANSFER_QUEUE" | "MENU_LOOP" | "MISUNDERSTOOD"), "queuePenalty" (number), "nextMenu".`,
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
      contents: `You are "${rep.name}", a Centrelink ${rep.title} in Australia.
Heritage: ${rep.heritage}.
Player Mission: "${params.activeMission.title} - ${params.activeMission.description}".
Required Key Concepts: "${params.activeMission.keyPhrases.join(', ')}".
Caller Loudness: ${params.volumeDb} dB.
Caller said: "${params.speechText}".
Hold time: ${params.holdTimeSeconds}s.

Rules:
1. If caller explains clearly with firm urgency (55-80 dB) and mentions key facts, approve the claim!
2. If too timid, stall or say you need to consult a manual.
3. If they scream (> 82 dB), get defensive.
4. Keep response under 45 words in authentic Australian call centre colloquialisms.
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
