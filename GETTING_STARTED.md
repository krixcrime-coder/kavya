# Kavya 2.0 - Quick Start Guide

## What You Got
- Full source code (TypeScript + React Native + Kotlin native modules)
- Hands-free voice AI assistant
- 30+ device automations (call, SMS, WhatsApp, maps, calendar, alarms, camera scan, overlay, screen capture, contacts, Spotify, etc.)
- GitHub Actions CI/CD pipeline to build APK

## Setup (1 time)
```bash
# 1. Unzip the project
unzip kavya-2-0.zip
cd kavya-assistant

# 2. Install Node dependencies
npm install
npx expo install --fix

# 3. Get free Gemini API key
# Visit: https://aistudio.google.com/app/apikey
# Click "Create API key"
# Copy it

# 4. Create .env file
cp .env.example .env
# Edit .env and paste your key:
# EXPO_PUBLIC_GEMINI_API_KEY=your_key_here
```

## Build & Install (via GitHub)
1. **Push to GitHub**
   - Create new GitHub repo
   - `git init`, `git add .`, `git commit -m "initial"`, `git remote add origin ...`, `git push`

2. **Add secret**
   - Go to repo Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `GEMINI_API_KEY` → Value: your API key

3. **Run workflow**
   - Go to Actions tab
   - Click "Build Debug APK"
   - Click "Run workflow"
   - Wait ~10-15 min (first time ~20 min)

4. **Download & install**
   - When done, click the run → scroll to "Artifacts"
   - Download `kavya-2-0-debug-apk` (zip file)
   - Extract the APK inside
   - Transfer to phone (USB, email, ADB, or download directly on phone browser)
   - Tap to install (allow "unknown sources" if prompted)

## First Run on Phone
1. **Grant permissions** when prompted (mic, camera, contacts, calendar, overlay, etc.)
2. **Just speak** — no button needed, hands-free from start
3. **Try**: "Open WhatsApp", "Call mom", "Set alarm for 7am", "What's on my screen", "Play some Spotify"

## What Happens Behind the Scenes
1. You speak → Android's speech recognizer captures text
2. Text → Gemini API (with conversation history)
3. Gemini → machine-readable action tag (if needed) + spoken reply
4. Reply spoken aloud via TTS
5. If action tag detected → automatically execute (call, SMS, open maps, etc.)
6. Loop restarts (listening again)

## Customization Ideas
- Change app name: Edit `app.json` > `name` and `slug`
- Change colors: Edit `app/index.tsx` > `PURPLE`, `styles`
- Change AI personality: Edit `src/services/geminiService.ts` > `SYSTEM_INSTRUCTION`
- Add more languages: Add locale to `useAlwaysListening.ts`

## Troubleshooting
- **"Gemini API error"** → Check API key in .env, make sure it's valid
- **Mic not working** → Grant RECORD_AUDIO permission in Settings
- **Speech not recognized** → Try speaking clearer, or switch to on-device language pack (Settings → Languages → Downloads)
- **Build fails** → Run `npx expo prebuild --clean` to reset native build cache
- **Can't find WhatsApp/maps** → Install those apps on your phone first

## Files You Should Know
- `app/index.tsx` → Main UI screen (chat + listening state)
- `src/services/geminiService.ts` → AI conversation logic
- `src/services/deviceActions.ts` → Call/SMS/maps/etc handlers
- `src/hooks/useAlwaysListening.ts` → Microphone listening loop
- `.github/workflows/build-apk.yml` → GitHub Actions build script
- `app.json` → App config (name, permissions, icon, etc.)

## Next Steps (Optional)
- Customize icon: Replace `assets/icon.png` and `assets/adaptive-icon.png`
- Add Firebase notifications: Get google-services.json and place in `android/app/`
- Improve barcode scanner: Install ML Kit lib (currently using basic camera)
- Dark mode / Light mode: Toggle in `app/index.tsx` styles

Enjoy! 🎙️
