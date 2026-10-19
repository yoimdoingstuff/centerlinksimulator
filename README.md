# Centrelink Call Simulator

A satirical, interactive Australian government phone call simulation game where players must navigate the labyrinthine Services Australia (132 850) automated phone queue using only their voice, balancing volume and persistence to get an AI-powered bureaucratic representative to approve their case before the line drops.

## Gameplay Mechanics

1. **Microphone Voice Input Only**: Speak directly into your microphone. A live decibel meter analyzes your vocal urgency in real time:
   - **0 – 30 dB (Quiet / Whisper)**: Inaudible to the robocaller.
   - **30 – 55 dB (Casual / Polite)**: The robocaller ignores or misinterprets your responses and traps you in infinite automated loops.
   - **56 – 81 dB (Firm & Assertive — The Sweet Spot)**: The robocaller's cost-cutting gatekeeper algorithm detects customer escalation and finally transfers you to the queue for a human representative!
   - **82+ dB (Hostile Screaming — Danger)**: Exceeds the department's hostile caller policy, penalizing you by moving your call backwards in the queue.
2. **Dual DTMF Keypad & Voice Menus**: Touch or click the handset keypad to navigate menus with authentic DTMF dual-tone telephone beeps.
3. **Distinct Voice Identities**:
   - **Robocaller**: Mechanical, flat, monotone voice designed like cheap automated IVR software.
   - **Representative**: Fatigued, natural human customer service officer (Sharon) with procedural background keyboard typing and sighing.
4. **Custom Hold Music**: Upload and import any MP3/WAV/OGG audio file to endure on hold, or listen to the default nostalgic lo-fi classical government synthesizer.
5. **Calibrated Difficulty Modes**:
   - **Easy Mode**: Average ~5 minutes (2–10 min range).
   - **Normal Mode**: Average ~15 minutes (6–20 min range).
   - **Realistic Mode**: True-to-life Australian wait times (45–90+ mins). Queue size is dynamically grounded in your computer's actual time of day (morning rush, lunch rush, afternoon peak).
6. **Anti-Cheat Clock Lock**: High-precision monotonic timer detection ensures players cannot cheat by modifying their system clock mid-game.
7. **Random Roadblocks**: Reverse queue jumps ("You are now caller #156..."), random line drops (30-second redial panic grace period), and the "Hold for an agent who never answers" trap.

## Hosting on GitHub Pages

This project is configured out-of-the-box for GitHub Pages:
1. Push this repository to GitHub.
2. Go to **Settings > Pages** in your GitHub repository.
3. Under **Build and deployment**, select **GitHub Actions**.
4. The included `.github/workflows/deploy.yml` workflow will automatically build and publish your game to `https://<username>.github.io/<repository-name>/`.
