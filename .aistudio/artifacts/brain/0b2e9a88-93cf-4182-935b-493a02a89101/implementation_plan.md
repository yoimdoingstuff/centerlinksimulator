# Centrelink Call Simulator

An interactive, satirical Australian government phone call simulation game where players must navigate the labyrinthine Centrelink automated phone queue, screaming at a useless robocaller to reach a real representative, surviving hold music, DTMF keypad traps, and realistic line drops before their claim is approved.

### User Review & Critical Decisions

> [!IMPORTANT]
> The revised plan incorporates all newly requested specifications:
> - **Three Calibrated Difficulty Modes**:
>   - **Easy Mode**: ~5 minutes average session (2–10 min range). Queue size: 8–18 callers. Fewer IVR loops, forgiving voice recognition, faster representative answer rate.
>   - **Normal Mode**: ~15 minutes average session (6–20 min range). Queue size: 35–75 callers. Classic bureaucratic loops, moderate queue progression, requiring strategic vocal escalation.
>   - **Realistic Mode**: True-to-life Australian Centrelink ordeal (45–90+ minutes real-time pacing, 180–450+ callers). Dynamic queue length calculated from your computer's actual time of day (morning rush 9am–11am and afternoon peak 1pm–3:30pm produce massive queues).
>   - **Anti-Cheat Clock Lock**: Snapshots the start time and tracks session duration using monotonic high-precision timestamps (`performance.now()`); if the player attempts to change their system clock mid-game, the robocaller detects the anomaly: *"Security verification failed: System time discrepancy detected. Your call has been moved to the rear of the national queue."*
> - **Dual DTMF Keypad & Voice Menus**: Authentic telephone keypad with realistic DTMF dual-tone audio beeps alongside voice recognition menus that deliberately misunderstand or ignore low-volume responses.
> - **Screaming at the Robocaller (Urgency Progression)**: The robocaller is designed as a cheap cost-cutting corporate gatekeeper. Speaking casually gets you stonewalled; raising your voice and screaming in frustration trips its hidden escalation algorithm to finally queue you for a human. But exceeding the hostile screaming ceiling resets your position.
> - **Distinct Vocal Identity**:
>   - *Robocaller*: Monotone, mechanical, cheap automated synthesizer voice with robotic cadence.
>   - *Human Representative*: Natural, fatigued human employee voice accompanied by authentic office background ambience (keyboard clatter, papers shuffling, sighing, "system is running slow today").
> - **GitHub & GitHub Pages Ready**: Built with relative asset paths (`base: './'`), automated GitHub Pages workflow configuration, and dual-mode architecture (server-side Gemini in dev/container, with direct standalone client support for static GitHub Pages hosting).

---

## 1. Overview & Core Concept

- **What It Does**: Puts the player in the hot seat calling Services Australia (132 850). You are assigned an infuriatingly complex government case (e.g., *"Dispute a $1,420 Robodebt breach notice because your employer listed gross earnings instead of net pay for FY2023"*). You must dial, punch in options or yell at the automated robocaller, survive custom hold music, endure dropouts, and convince an AI representative to push the stamp of approval.
- **The Robocaller Gauntlet**:
  - Deliberately unhelpful automated answering system designed to prevent people from reaching humans.
  - Cycles through endless numeric menus ("Press 1 for Payments, Press 2 for Digital Services, Press 3 to repeat...") and broken voice recognition ("Please describe your issue in a few words... Did you say: Update your address?").
  - The player must escalate their vocal intensity: speaking softly results in loops; shouting firmly triggers the escalation keyword override.
- **The Representative**:
  - Once through the hold queue, a distinct human-sounding representative answers.
  - Background audio plays authentic office keystrokes and sighing.
  - The representative responds using realistic, evasive bureaucratic jargon ("I can see your file here, but unfortunately our system is undergoing scheduled maintenance...").

---

## 2. User Experience & Visual Design

- **Visual Identity & Theme**:
  - Commonwealth of Australia & Services Australia aesthetic: Deep Government Navy (`#0B2B47`), Commonwealth Gold (`#D4A017`), Department Blue (`#0069B4`), and clean utility slates.
  - Dial Screen: Authentic smartphone handset UI with illuminated DTMF keypad (1-9, *, 0, #), call timer, live signal bars, mute/speaker toggles, and hold queue status bar.
  - Bureaucracy Desk: Player's desk view showing their assigned CRN (Customer Reference Number), case dossier sheet, penalty notice, and hold music cassette player/uploader.
  - Live Audio Meter: Real-time decibel waveform showing:
    - *Gray Band (< 30 dB)*: Ignored / "Did not hear you"
    - *Yellow Band (30 - 55 dB)*: Casual (Trapped in automated loops)
    - *Green Band (55 - 80 dB)*: Firm / Escalation (Trips the human transfer)
    - *Red Band (> 80 dB)*: Hostile Screaming (Returned to queue or hung up)
- **Audio Soundscape**:
  - Custom audio track importer (drag & drop any MP3/WAV file for hold music) + default synthesized low-bitrate classical muzak.
  - DTMF dual-tone telephone dial beeps for keypad presses.
  - Mechanical robocaller audio vs. natural tired human employee voice.
  - Foley sound effects: Line static, phone disconnect tone, office keyboard clatter, hold transfer clicks.

---

## 3. Key Product Decisions & Trade-Offs

- **Calibrated Difficulty & Realistic Time-of-Day Dynamics**:
  - *Easy*: 2–10 minutes (average ~5 min).
  - *Normal*: 6–20 minutes (average ~15 min).
  - *Realistic*: Full real-world Centrelink wait. Initial queue size is grounded in real Australian business hours:
    - 08:30 – 11:30: Peak morning rush (320–480 callers)
    - 11:30 – 14:00: Lunch rush (240–350 callers)
    - 14:00 – 16:30: Afternoon rush (290–420 callers)
    - After 17:00: Office closed message or skeleton crew (150–220 callers)
  - *Anti-Cheat Architecture*: The system freezes initial time at call dial and measures elapsed duration using browser `performance.now()`. If a user attempts to change their OS clock during a call, the delta discrepancy immediately triggers an IVR tamper penalty.
- **Dual Voice Architecture**:
  - *Robocaller*: Fast, mechanical, repetitive browser speech synthesis with robotic pitch/rate modifiers to emulate cheap IVR hardware.
  - *Representative*: Natural human voice (using high-quality natural voices or Gemini TTS) paired with procedural background Foley (mechanical keyboard keystrokes, headset hiss).
- **GitHub Pages Static Deployment Support**:
  - Configured with `base: './'` in `vite.config.ts`.
  - Self-contained client engine: Includes built-in bureaucratic decision trees and dialogue generators that work on static GitHub Pages without requiring a backend server, while seamlessly utilizing the server-side Gemini proxy when running in full-stack mode.
  - Includes `.github/workflows/deploy.yml` for 1-click publishing.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Centrelink Game Client                          │
│                                                                        │
│  ┌──────────────────────┐  ┌────────────────────┐  ┌────────────────┐  │
│  │   Microphone Audio   │  │ Custom Hold Music  │  │   DTMF Phone   │  │
│  │  (RMS Analyser + VAD)│  │ (Upload + Muzak)   │  │ Keypad + Audio │  │
│  └──────────┬───────────┘  └─────────┬──────────┘  └───────┬────────┘  │
│             │                        │                     │           │
│             ▼                        ▼                     ▼           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │               Centrelink Telephony State Machine                 │  │
│  │                                                                  │  │
│  │  [Difficulty: Easy (~5m) | Normal (~15m) | Realistic (Real-Time)]│  │
│  │  [Time-of-Day Rush Logic + Monotonic Clock Anti-Cheat]           │  │
│  │  [Status: DIALING → ROBOCALLER_IVR → HOLD_QUEUE → REP → RESULT]  │  │
│  │  [Queue Counter: Dynamic Pos, Reverse Jumps, Estimated Wait]     │  │
│  │  [Roadblocks: Line Drop, Broken Voice Rec, Hold Forever Trap]    │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │
                   ┌──────────────────┴──────────────────┐
                   ▼                                     ▼
     ┌───────────────────────────┐         ┌───────────────────────────┐
     │ Full-Stack Mode (Express) │         │ Static / GitHub Pages Mode│
     │ /api/call/dialogue        │         │ Client-Side Telephony     │
     │ Gemini 3.8 Flash Engine   │         │ Bureaucratic Script Tree  │
     └───────────────────────────┘         └───────────────────────────┘
```

- **Interactive State Handlers**:
  - Keypad touch/click triggers accurate DTMF dual tones (1209Hz + 697Hz, etc.).
  - Microphone stream computes live RMS volume and transcribes speech.
  - Hold music audio element ducked when IVR or representative speaks.
  - Monotonic time tracking runs continuously to update queue progress and prevent clock tampering.
