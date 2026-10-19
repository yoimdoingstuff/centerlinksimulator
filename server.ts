import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Robocaller IVR dialogue endpoint
app.post('/api/call/ivr', async (req, res) => {
  const { speechText, volumeDb, currentMenu, promptTask, difficulty } = req.body;

  // If screaming too loud (> 82 dB)
  if (volumeDb >= 82) {
    return res.json({
      robocallerResponseText: "Warning: We do not tolerate aggressive or abusive behavior towards our automated systems. Your call has been returned to the start of the general enquiry queue.",
      action: 'KICK_TO_BACK',
      callerDelta: difficulty === 'REALISTIC' ? 35 : difficulty === 'NORMAL' ? 12 : 5,
      nextMenu: 'MAIN_MENU',
      isRobotic: true
    });
  }

  // If too quiet / whisper (< 30 dB)
  if (volumeDb < 30 || !speechText || speechText.trim().length === 0) {
    return res.json({
      robocallerResponseText: "Sorry, we didn't quite catch that. Please speak clearly after the tone, or use your telephone keypad to select an option.",
      action: 'RETRY',
      callerDelta: 0,
      nextMenu: currentMenu || 'MAIN_MENU',
      isRobotic: true
    });
  }

  // Sweet spot: 58 - 80 dB (Firm / Frustrated / Urgency)
  const isFirmAndAssertive = volumeDb >= 58 && volumeDb < 82;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are the automated Services Australia (Centrelink) telephone robocaller IVR system.
The caller is trying to solve this task: "${promptTask || 'Dispute Mutual Obligations penalty'}".
Current Menu: "${currentMenu}".
Caller said: "${speechText}".
Caller loudness decibels: ${volumeDb} dB. (Normal is 40-55 dB, Firm/Frustrated is 58-80 dB).
Is caller firm & assertive: ${isFirmAndAssertive ? 'YES (they are raising their voice/sounding frustrated)' : 'NO (they are speaking casually/softly)'}.
Difficulty mode: ${difficulty}.

Bureaucratic Behavior Rules:
1. You are a frustrating automated voice IVR. You speak in concise, unhelpful, bureaucratic Australian government phone prompts.
2. If the caller spoke casually (not firm/assertive), you often misunderstand them hilariously or try to force them to use the myGov website or loop them back to the menu.
3. If the caller is FIRM & ASSERTIVE (${volumeDb} dB, frustrated/urgent), your automated system detects high emotional distress and triggers an escalation clause: "Transferring you to the queue for a customer service officer."
4. Format output strictly as JSON with keys:
- "responseText": String spoken by the IVR (keep it under 40 words, very robotic and bureaucratic).
- "action": One of "TRANSFER_QUEUE" (if transferred to human hold queue), "MENU_LOOP" (if looping), "MISUNDERSTOOD" (if pretending to hear wrong words), or "MENU_NAV".
- "nextMenu": Next menu name.
- "queuePenalty": Integer (0 if normal, positive if penalized, negative if moved forward).`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        robocallerResponseText: parsed.responseText || "Please listen carefully as our menu options have recently changed. For JobSeeker, press 1.",
        action: parsed.action || (isFirmAndAssertive ? 'TRANSFER_QUEUE' : 'MENU_LOOP'),
        callerDelta: parsed.queuePenalty || 0,
        nextMenu: parsed.nextMenu || 'MAIN_MENU',
        isRobotic: true
      });
    } catch (err) {
      console.error('Gemini IVR generation error:', err);
    }
  }

  // Fallback programmatic logic
  if (isFirmAndAssertive) {
    return res.json({
      robocallerResponseText: "It sounds like you are experiencing difficulty with our automated menu. Please hold while we transfer your call to the queue for a customer service representative.",
      action: 'TRANSFER_QUEUE',
      callerDelta: -3,
      nextMenu: 'HOLD_QUEUE',
      isRobotic: true
    });
  }

  // Casual speech default: loop or misunderstand
  const misunderstandings = [
    `Did you say: Report employment separation certificate? If this is correct, press 1. Otherwise, say "No" to return to the main menu.`,
    `We did not recognize that command. You can manage most payments faster online using your myGov account. Returning to main menu.`,
    `Please hold while we route you... All operators are currently busy assisting other callers. Please listen carefully as our options have changed.`
  ];
  const chosen = misunderstandings[Math.floor(Math.random() * misunderstandings.length)];

  return res.json({
    robocallerResponseText: chosen,
    action: 'MISUNDERSTOOD',
    callerDelta: 1,
    nextMenu: 'MAIN_MENU',
    isRobotic: true
  });
});

// Human representative dialogue endpoint
app.post('/api/call/agent', async (req, res) => {
  const {
    speechText,
    volumeDb,
    activeMission,
    dialogueHistory,
    holdTimeSeconds,
    difficulty,
    representative,
  } = req.body;

  const repName = representative?.name || 'Sharon';
  const repHeritage = representative?.heritage || 'Australian public service veteran';
  const repTitle = representative?.title || 'Senior Customer Service Officer';

  // Screaming check at the human rep
  if (volumeDb >= 84) {
    return res.json({
      agentResponseText: `Sir/Ma'am, this is ${repName}. I understand you are frustrated, but if you continue to shout I will have to terminate this call. I am placing you back on hold while I speak with my team leader.`,
      agentState: 'PUT_ON_HOLD_AGAIN',
      mood: 'OFFENDED',
      approved: false,
    });
  }

  // Too quiet check
  if (volumeDb < 28 || !speechText || speechText.trim().length === 0) {
    return res.json({
      agentResponseText: `Hello? ${repName} from Centrelink here. I can barely hear you, the line might be breaking up...`,
      agentState: 'CONVERSING',
      mood: 'CONFUSED',
      approved: false,
    });
  }

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are "${repName}", a Centrelink ${repTitle} in Australia.
Background/Heritage: ${repHeritage}.
You work at a busy Centrelink call centre with slow departmental computers, typing on a mechanical keyboard. Speak in authentic Australian call centre colloquialisms reflecting your character background.
Player Mission to Solve: "${activeMission?.title} - ${activeMission?.description}".
Required Key Concepts: "${activeMission?.keyPhrases?.join(', ')}".
Caller's Loudness: ${volumeDb} dB.
Caller just said to you: "${speechText}".
Dialogue History: ${JSON.stringify(dialogueHistory || [])}.
Hold time survived by caller: ${holdTimeSeconds} seconds.
Difficulty: ${difficulty}.

Rules:
1. If caller explains their case clearly with firm urgency (55-80 dB) AND mentions key facts relevant to their mission, and they have provided their explanation, you can finally approve their claim and lift their suspension!
2. If caller is too timid or vague, give a classic bureaucratic stalling response ("Look, that document format was flagged by the system...") or say you need to consult a technical manual.
3. If they scream (> 82 dB), get defensive and place them back on hold.
4. Keep the response under 45 words, sounding authentic and human.
5. Return JSON:
- "responseText": String
- "agentState": "CONVERSING" | "PUT_ON_HOLD_AGAIN" | "CLAIM_APPROVED" | "TRANSFER_WRONG_DEPT"
- "mood": "TIRED" | "ANNOYED" | "RELUCTANTLY_HELPFUL" | "SYMPATHETIC"
- "approved": Boolean`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        agentResponseText:
          parsed.responseText ||
          `Centrelink Services, ${repName} speaking. Bear with me while the system loads your file...`,
        agentState: parsed.agentState || 'CONVERSING',
        mood: parsed.mood || 'TIRED',
        approved: !!parsed.approved,
      });
    } catch (err) {
      console.error('Gemini Agent error:', err);
    }
  }

  // Programmatic fallback
  const matchedPhrase = activeMission?.keyPhrases?.some((phrase: string) =>
    speechText.toLowerCase().includes(phrase.toLowerCase())
  );

  if (matchedPhrase && volumeDb >= 50 && volumeDb <= 81) {
    return res.json({
      agentResponseText: `Alright, ${repName} here... I can see the notes on my screen now. I've manually overridden the breach and stamped the exemption. Your payment should clear in 24 to 48 hours. Is there anything else today?`,
      agentState: 'CLAIM_APPROVED',
      mood: 'RELUCTANTLY_HELPFUL',
      approved: true,
    });
  }

  return res.json({
    agentResponseText: `Centrelink Services, ${repName} speaking. Yeah look, I can see something on your screen here, but the server's running slow. Can you clearly state why you believe this decision is incorrect?`,
    agentState: 'CONVERSING',
    mood: 'TIRED',
    approved: false,
  });
});

// Mount Vite or serve static
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Centrelink Call Simulator listening on port ${port}`);
});
