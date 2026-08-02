# Kavya 2.0 — Personal Hands-Free AI Voice Assistant

**Fully automated, hands-free voice assistant.** Just speak — no button, no login, no subscription needed.

### What It Does
- 🎤 Listens automatically (always-on voice recognition)
- 🤖 Understands intent via Gemini AI
- 📱 Performs 30+ device actions (call, SMS, WhatsApp, maps, calendar, alarms, camera scan, overlay, screen capture, Spotify, etc.)
- 🔊 Speaks replies naturally (TTS)
- 🔁 Auto-resumes listening after each reply

---

## ⚠️ Prerequisites
- **Android phone** (6.0+, API 24+)
- **GitHub account** (for CI/CD build)
- **Free Gemini API key** (takes 2 minutes)
- **Node.js** installed locally (for setup only)

---

## Setup (5 minutes)

### Step 1: Extract & Install
```bash
unzip kavya-2-0.zip
cd kavya-assistant
npm install
npx expo install --fix
```

### Step 2: Get Free Gemini API Key
1. Visit https://aistudio.google.com/app/apikey
2. Click "Create API key"
3. Copy it

### Step 3: Add to .env
```bash
cp .env.example .env
# Edit .env and paste your key:
# EXPO_PUBLIC_GEMINI_API_KEY=abc123...
```

### Step 4: Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/kavya-assistant.git
git branch -M main
git push -u origin main
```

### Step 5: Add GitHub Secret
1. Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `GEMINI_API_KEY` → Value: your API key from Step 2

### Step 6: Build APK
1. Go to **Actions** tab
2. Select "Build Debug APK"
3. Click **Run workflow**
4. Wait 10-20 minutes (first build is slower)
5. When done: click run → **Artifacts** → download `kavya-2-0-debug-apk` (zip file)
6. Extract the APK inside and transfer to phone (USB, email, or download on phone browser)

### Step 7: Install on Phone
1. Tap the APK file
2. Click "Install" (might need to enable "Unknown sources" in Settings)
3. Launch **Kavya 2.0**

---

## First Run on Phone

### Permissions
You'll see permission popups — **allow all** (mic, camera, contacts, calendar, etc.). These enable the features you request.

### Quick Test
Just **speak naturally**:
- "Open WhatsApp"
- "Call mom"
- "What time is it"
- "Set alarm for 7 AM"
- "Take a screenshot"
- "What's on my screen"
- "Play some Spotify"
- "Open Google Maps"

---

## How It Works (Behind the Scenes)

```
You speak
   ↓
Android's speech recognizer (on-device) captures text
   ↓
Text sent to Gemini API (with conversation history)
   ↓
Gemini returns reply + optional [ACTION:TAG]
   ↓
If action detected → execute (call, SMS, map, etc.)
   ↓
Reply spoken aloud via TTS
   ↓
Listening resumes automatically
```

---

## 30+ Actions Supported

### Communication
- **Call** contact by number or name
- **SMS** with message
- **WhatsApp** message to contact

### Navigation & Web
- **Maps** search/navigation
- **Browser** open URL
- **YouTube** search & play

### Media
- **Spotify** play song/artist/playlist
- **Video** playback

### Smart Home
- **Calendar** create events
- **Alarm** set by time
- **Timer** set by duration

### Device Control
- **Camera** scan QR/barcode
- **Screen capture** & ask AI about it
- **Overlay bubble** toggle (floating widget)
- **Contacts** lookup & call

### Notifications
- **Push notifications** (local)
- **Background location** tracking

---

## File Structure

```
kavya-assistant/
├── app/                    # UI Screens
│   ├── index.tsx          # Main voice chat screen
│   ├── scan.tsx           # QR/barcode scanner
│   ├── video.tsx          # Video playback
│   └── _layout.tsx        # Router config
├── src/
│   ├── services/
│   │   ├── geminiService.ts        # AI brain (conversation logic)
│   │   ├── deviceActions.ts        # Execute calls/SMS/maps/etc
│   │   ├── visionService.ts        # Screen capture + ask AI
│   │   ├── ttsService.ts           # Text-to-speech
│   │   ├── contactsService.ts      # Phone contacts
│   │   ├── notificationService.ts  # Push alerts
│   │   └── backgroundLocationService.ts # GPS tracking
│   └── hooks/
│       └── useAlwaysListening.ts   # Microphone loop
├── modules/
│   ├── overlay-bubble/   # Floating widget (native module)
│   └── screen-capture/   # Screenshot capture (native module)
├── .github/workflows/
│   └── build-apk.yml     # GitHub Actions CI/CD
├── app.json              # App config (version, permissions, icon)
├── package.json          # Dependencies
└── README.md             # This file
```

---

## Customization

### Change App Name
Edit `app.json`:
```json
"name": "Your App Name",
"slug": "your-app-slug"
```

### Change Colors
Edit `app/index.tsx`, line 114:
```javascript
const PURPLE = "#b478ff";  // Change this color
```

### Change AI Personality
Edit `src/services/geminiService.ts`, update `SYSTEM_INSTRUCTION` string.

### Add Your Logo
Replace these files:
- `assets/icon.png` (1024×1024 PNG)
- `assets/adaptive-icon.png` (same size)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Gemini API error" | Check API key in `.env`, verify it's active at aistudio.google.com |
| Mic not working | Go to phone Settings → Apps → Kavya → Permissions → enable Microphone |
| Speech not recognized | Speak clearly; try Settings → Languages → download offline pack |
| Build fails on GitHub | Run `npx expo prebuild --clean` locally, push again |
| "Can't find WhatsApp" | Install WhatsApp on your phone first |
| Overlay not showing | Go to Settings → Apps → Kavya → Permissions → enable "Overlay" |

---

## Advanced: Firebase Notifications (Optional)

To enable push notifications:
1. Get `google-services.json` from Firebase Console
2. Place in `android/app/google-services.json`
3. Rebuild via GitHub Actions

---

## Advanced: Better Barcode Scanning (Optional)

Current: Basic camera + OpenCV. For ML Kit production barcode scanner:
1. Add dependency in `package.json`: `"@react-native-ml-kit/vision-barcode": "latest"`
2. Update `app/scan.tsx` to use ML Kit
3. Rebuild

---

## Build Specs

- **Size**: ~50-70 MB (single ARM64 ABI)
- **Min Android**: 6.0 (API 24)
- **Target Android**: 15 (API 35)
- **Signing**: Debug keystore (personal use)
- **No Firebase**: Configured but not activated (add google-services.json to enable)

---

## What's NOT Included

- Gmail integration
- Email sending
- Wallet/payment
- Home automation (Philips Hue, Alexa, etc.)
- Video recording

These can be added if needed — just ask.

---

## Disclaimer

**Personal use only.** Not for Play Store distribution or commercial use. Built using:
- React Native + Expo (open source)
- Google Gemini API (free tier)
- Android built-in services (free)

No proprietary code reverse-engineered. All services use public, documented APIs.

---

## Support

- **API key issues?** Check aistudio.google.com
- **Build fails?** Check GitHub Actions logs
- **Feature request?** Modify source code (it's yours!)
- **Want to add feature X?** Code is open — go for it

Enjoy! 🎙️
