import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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

// Inform client if server has site-wide Gemini API key configured
app.get('/api/config/gemini-status', (req, res) => {
  res.json({
    hasServerKey: !!(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length > 10),
  });
});

// Offensive abusive keywords that trigger immediate disconnection
const OFFENSIVE_KEYWORDS = [
  'cunt',
  'fuck off',
  'fuck you',
  'kill yourself',
  'die in a fire',
  'bomb your office',
  'slit your throat',
  'shoot you',
  'murder you',
];

const IVR_VALID_KEYWORDS = [
  'jobseeker', 'breach', 'payment', 'pension', 'concession',
  'report', 'income', 'debt', 'dispute', 'operator',
  'representative', 'officer', 'agent', 'human', 'help',
  'medical', 'certificate', 'doctor', 'suspended', 'demerit',
  'obligation', 'appointment', 'transfer', 'one', 'two', 'three', 'four', 'zero',
  'provider', 'centrelink', 'claim', 'exemption', 'attend'
];

// Robocaller IVR dialogue endpoint
app.post('/api/call/ivr', async (req, res) => {
  const { speechText, volumeDb, currentMenu, promptTask, difficulty, screamStrikes } = req.body;
  const textLower = (speechText || '').toLowerCase().trim();

  // Check for severe offensive keywords
  const isOffensive = OFFENSIVE_KEYWORDS.some((kw) => textLower.includes(kw));
  if (isOffensive) {
    return res.json({
      robocallerResponseText: "This call is being terminated immediately under Commonwealth workplace anti-harassment policy. Goodbye.",
      action: 'TERMINATE_CALL',
      callerDelta: 0,
      nextMenu: 'TERMINATED',
      isRobotic: true,
      terminate: true
    });
  }

  // Screaming check (> 82 dB)
  if (volumeDb >= 82) {
    const strikes = (screamStrikes || 0) + 1;
    if (strikes >= 6) {
      return res.json({
        robocallerResponseText: "Automated noise threshold exceeded 6 times. Your call has been returned to the start of the general menu.",
        action: 'KICK_TO_BACK',
        callerDelta: 20,
        nextMenu: 'MAIN_MENU',
        isRobotic: true,
        screamStrikes: strikes,
      });
    }

    return res.json({
      robocallerResponseText: `Elevated volume detected. Warning ${strikes} of 6. Please speak in a moderate conversational tone while our automated system processes your input.`,
      action: 'CALM_WARNING',
      callerDelta: 0,
      nextMenu: currentMenu || 'MAIN_MENU',
      isRobotic: true,
      screamStrikes: strikes,
    });
  }

  // Check if speech matches valid Centrelink IVR keywords
  const hasValidKeyword = IVR_VALID_KEYWORDS.some((kw) => textLower.includes(kw));

  // If too quiet / whisper (< 30 dB) or random non-keyword noise
  if (volumeDb < 30 || textLower.length < 3 || (!hasValidKeyword && textLower.length < 15)) {
    return res.json({
      robocallerResponseText: "Sorry, we could not understand that response. Please speak clearly, or use your keypad to choose from the menu options.",
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
Is caller firm & assertive: ${isFirmAndAssertive ? 'YES' : 'NO'}.
Difficulty mode: ${difficulty}.

Bureaucratic Behavior Rules:
1. Speak in concise, unhelpful, robotic Australian government phone prompts under 35 words.
2. If caller speech is random gibberish or does NOT relate to Centrelink services, do NOT transfer them! Say you did not recognize that command and repeat the keypad options.
3. If the caller states a genuine Centrelink issue ("jobseeker", "breach", "dispute", "transfer", "representative") with firm urgency, trigger: "Transferring you to the queue for a customer service officer."
4. Format output strictly as JSON with keys:
- "responseText": String
- "action": "TRANSFER_QUEUE" | "MENU_LOOP" | "MISUNDERSTOOD"
- "nextMenu": Next menu name
- "queuePenalty": Integer`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        robocallerResponseText: parsed.responseText || "Please listen carefully as our menu options have recently changed. For JobSeeker, press 1.",
        action: parsed.action || (isFirmAndAssertive && hasValidKeyword ? 'TRANSFER_QUEUE' : 'MENU_LOOP'),
        callerDelta: parsed.queuePenalty || 0,
        nextMenu: parsed.nextMenu || 'MAIN_MENU',
        isRobotic: true
      });
    } catch (err) {
      console.error('Gemini IVR generation error:', err);
    }
  }

  // Fallback programmatic logic
  if (isFirmAndAssertive && hasValidKeyword) {
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
  const textLower = (speechText || '').toLowerCase().trim();
  const strikes = (req.body.screamStrikes || 0);

  // Check for severe offensive keywords
  const isOffensive = OFFENSIVE_KEYWORDS.some((kw) => textLower.includes(kw));
  if (isOffensive) {
    return res.json({
      agentResponseText: `Under Commonwealth workplace anti-harassment policy, I am terminating this call immediately. Goodbye.`,
      agentState: 'CALL_TERMINATED',
      mood: 'OFFENDED',
      approved: false,
      terminate: true
    });
  }

  // Screaming check at the human rep (> 82 dB)
  if (volumeDb >= 82) {
    const newStrikes = strikes + 1;
    if (newStrikes >= 6) {
      return res.json({
        agentResponseText: `Right, that is your sixth warning. I have no tolerance for continuous shouting. I am placing you back into the general queue.`,
        agentState: 'PUT_ON_HOLD_AGAIN',
        mood: 'OFFENDED',
        approved: false,
        screamStrikes: newStrikes
      });
    }

    // Calming response
    const calmingLines = [
      `Whoa, please lower your voice. I understand this is frustrating, but shouting won't get your payment cleared. Let's take a breath.`,
      `Sir/Ma'am, please do not shout. I am trying to help you, but you need to speak at a normal volume so I can type your details.`,
      `Please calm down. Take a moment, catch your breath, and tell me clearly what happened with your appointment.`
    ];
    return res.json({
      agentResponseText: calmingLines[Math.floor(Math.random() * calmingLines.length)],
      agentState: 'CALMING_DOWN',
      mood: 'ANNOYED',
      approved: false,
      screamStrikes: newStrikes
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
      const currentDept = req.body.currentDepartment || activeMission?.targetDepartment;
      const isWrongDept = currentDept && activeMission?.targetDepartment && currentDept !== activeMission.targetDepartment;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are "${repName}", a real Australian human working as a Centrelink ${repTitle} in Australia.
Background/Heritage: ${repHeritage}.
Current Department: "${currentDept}".
Case Department Needed: "${activeMission?.targetDepartment}".
Is Caller in Wrong Department?: ${isWrongDept ? 'YES' : 'NO'}.
CRITICAL PERSONALITY INSTRUCTION: You are an authentic Australian human working in an overburdened public service call centre with slow departmental computers, typing on a mechanical keyboard. You NEVER sound like an AI, corporate bot, or automated system. Speak in authentic, weary Australian call centre colloquialisms reflecting your background ('look mate', 'rightio', 'hang on a tick', 'fair enough', 'yeah no worries', 'ah geez').
Player Mission: "${activeMission?.title} - ${activeMission?.description}".
Caller's Loudness: ${volumeDb} dB.
Caller just said: "${speechText}".
Dialogue History: ${JSON.stringify(dialogueHistory || [])}.
Hold time survived by caller: ${holdTimeSeconds} seconds.
Difficulty: ${difficulty}.

Rules:
1. WRONG DEPARTMENT: If the caller is in the wrong department (${isWrongDept ? 'YES' : 'NO'}) or asks for another queue, tell them: "Whoa, hold on mate! You've reached ${currentDept}, but your file needs ${activeMission?.targetDepartment}. I'm transferring you straight over right now." Set agentState: "TRANSFER_WRONG_DEPT".
2. RESPOND DYNAMICALLY TO ABSOLUTELY ANYTHING THE CALLER SAYS: banter, jokes, venting about the 2-hour hold music, asking how your day is, talking about their job or family, or explaining their case. Never give canned responses!
3. If caller explains their case clearly with firm urgency (50-80 dB) and explains their dispute facts, approve their claim and lift the suspension (set approved: true, agentState: "CLAIM_APPROVED")!
4. If they scream (> 82 dB), tell them to calm down.
5. Keep the response under 45 words, sounding like an everyday human Australian.
6. Return JSON:
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
        isAiPowered: true,
        targetDepartment: activeMission?.targetDepartment,
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
      isAiPowered: false,
    });
  }

  // Multi-option conversational offline fallback
  const offlineOptions = [
    `Centrelink Services, ${repName} speaking. Yeah look, system's running a bit slow today. What's the story with your case?`,
    `G'day mate, ${repName} here. I'm looking at your CRN now. Go ahead and tell me what happened with your appointment or payment.`,
    `Rightio, ${repName} here. Sorry about the hold time, our phones have been ringing off the hook since 8am. How can I help you sort this out?`,
    `Yeah look, I hear ya. Computers are crawling today. Talk to me—what's the dispute about your mutual obligations or reporting?`,
  ];
  return res.json({
    agentResponseText: offlineOptions[Math.floor(Math.random() * offlineOptions.length)],
    agentState: 'CONVERSING',
    mood: 'TIRED',
    approved: false,
    isAiPowered: false,
  });
});

// Mount Vite in dev mode or serve built static files
const distPath = path.resolve(__dirname, 'dist');
const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

if (process.env.NODE_ENV === 'production' && hasDist) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Centrelink Call Simulator listening on port ${port}`);
});
