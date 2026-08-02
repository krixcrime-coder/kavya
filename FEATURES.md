# Kavya 2.0 vs IRIS-MX Feature Comparison

## Core Voice AI
- ✅ Hands-free always-listening voice loop
- ✅ Real-time speech recognition (on-device)
- ✅ Gemini API backend (Kavya uses user's free key, IRIS-MX uses proprietary backend)
- ✅ Text-to-speech playback
- ✅ Chat history with conversation context

## Device Control & Automation
- ✅ Call phone (direct or by contact name)
- ✅ Send SMS messages
- ✅ Launch WhatsApp chat
- ✅ Open Maps/navigation
- ✅ Launch web browser
- ✅ Play YouTube videos
- ✅ Play Spotify songs/playlists
- ✅ Create calendar events
- ✅ Set alarms
- ✅ Set timers
- ✅ Open camera and scan QR/barcodes

## Vision & Screen
- ✅ Screen capture (MediaProjection)
- ✅ Ask Gemini about what's on your screen ("What does this error mean?")
- ✅ Floating overlay bubble (draggable, stays on top)

## Contacts & Social
- ✅ Read phone contacts
- ✅ Call contacts by name
- ✅ Contact information lookup

## Background & Notifications
- ✅ Local push notifications
- ✅ Background location tracking (foreground service)
- ✅ Task scheduler (expo-task-manager)
- ⚠️ Firebase Cloud Messaging (scaffolded but not configured - add your Google Services JSON to enable)

## Media & Playback
- ✅ Video playback (expo-video)
- ✅ Audio playback (TTS via expo-speech)

## Permissions (Android)
- ✅ RECORD_AUDIO (microphone)
- ✅ CAMERA (scanning, screen vision)
- ✅ READ/WRITE_CONTACTS (contact lookup)
- ✅ CALL_PHONE (dial)
- ✅ READ/WRITE_CALENDAR (events)
- ✅ SYSTEM_ALERT_WINDOW (overlay bubble)
- ✅ ACCESS_FINE/COARSE/BACKGROUND_LOCATION (maps, location)
- ✅ POST_NOTIFICATIONS (push alerts)
- ✅ REQUEST_INSTALL_PACKAGES (app install)
- ✅ QUERY_ALL_PACKAGES (see all installed apps)
- ✅ FOREGROUND_SERVICE + variants (background tasks)

## Known Limitations vs IRIS-MX
- ❌ ML Kit barcode scanner not integrated (using basic expo-camera)
- ❌ Firebase setup incomplete (need google-services.json)
- ❌ WorkManager not native Android (using Expo's task-manager as workaround)
- ❌ Video playback is skeleton only (no URL routing yet)
- ❌ No email/Gmail integration

## Build & Deployment
- ✅ GitHub Actions workflow (Gradle assembleDebug)
- ✅ Single-ABI arm64-v8a (faster, smaller APK)
- ✅ Expo prebuild + native module autolinking
- ✅ Debug keystore (personal use)
