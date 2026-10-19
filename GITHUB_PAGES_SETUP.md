# Centrelink Call Simulator — GitHub Pages & Privacy Guide

## 1. How to Use Your Gemini API Key on GitHub Pages (Without Leaking It)
When hosting on **GitHub Pages**, your site is statically hosted, meaning anyone visiting your repository or inspecting DevTools can read any code or environment variables hardcoded into JavaScript files.

### 🛡️ The Zero-Risk Solution (Built Right In):
1. **Never commit your API key to Git** (never put it in `package.json`, `.env`, or commit it to GitHub).
2. Open your deployed simulator on GitHub Pages.
3. Click the **Settings (Gear Icon)** in the top right corner of the phone.
4. Paste your Gemini API key and click **Save Key Locally**.
5. Your key is stored **exclusively in your browser's private `localStorage`** (`centrelink_gemini_api_key`).
   - It is **never sent to GitHub**.
   - It is **never bundled into source code**.
   - Other visitors to your site will use the built-in offline keyword engine, while you get full generative AI responses!

---

## 2. Dropping in "Opus No. 1" Hold Music
- **Drop an MP3 directly into your project**:
  Place any MP3 file named `opus-no-1.mp3` or `hold-music.mp3` inside the `public/` directory (e.g. `public/opus-no-1.mp3`).
- **Drag and Drop at runtime**:
  You can drag and drop any `.mp3` audio file directly onto the phone screen in your browser, or select it via the in-game Settings modal!
- **Safe Fallback**:
  If the file is missing or 0 bytes, the app automatically switches to the authentic procedural synthesizer of Tim Carleton's *Opus No. 1*.

---

## 3. Loud Speakerphone Mode
- If audio or speech sounds quiet on your phone or mobile browser, tap the **Speaker** button on the in-call screen.
- Speakerphone mode multiplies Web Audio and speech synthesis output by **2.4x**, ensuring loud, clear playback on iPhone and Android speakers.

---

## 4. Screaming & Anti-Abuse System
- **10-Second Immunity Delay**: After a shout is detected (>82 dB), a 10-second cooldown prevents counting the same scream multiple times.
- **2-Minute Reset Timer**: A 2-minute timer begins after shouting. Maintaining calm dialogue for 2 minutes completely clears all hostility strikes.
- **6-Strike Warning**: If 6 shouting strikes occur before the 2-minute timer elapses, the representative or robocaller boots you back to the queue.
- **Severe Abusive Language**: Severe threats or explicit offensive slurs trigger immediate call disconnection without warnings.

---

## 5. Multiple Calling Reasons & Diverse Representatives
- Every new call randomly selects from **8 distinct Centrelink issues** (JobSeeker medical certificates, casual earnings ABN mismatch, Dubbo cousin CRN merge, provider scanner outage, Austudy study load, Carer allowance review, DSP impairment appeal, and Rent Assistance rollover).
- You can also click the **Shuffle (Arrows) icon** in the top header to manually change your reason for calling.
- Representatives rotate among a diverse Australian cast (Darren, Priya, Greg, Sharon, Minh, Dimitri, Gurpreet, Mateo).
