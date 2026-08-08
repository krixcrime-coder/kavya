# TouchLock

Voice-controlled touch lock for a phone with a flaky/ghost-touch screen.

## Kya karta hai
- **"on" / "lock" bolein** → screen ke upar ek transparent overlay lag jata hai jo har touch
  (chahe ghost touch ho ya aapka apna touch) ko **consume** kar leta hai — koi bhi app ke
  andar click/tap register nahi hota. Touch hua wahan chhota sa laal "tick" dot dikhta hai
  taaki pata chale ki touch hua tha, bina use action mein badle.
- **"off" / "unlock" bolein** → overlay hat jata hai, phone normal ho jata hai.
- **"up" bolein** → screen neeche se upar slide hoti hai (pichla reel/content).
- **"down" bolein** → screen upar se neeche slide hoti hai (agla reel/content) — reels/shorts
  scroll karne jaisa. Ye lock ON hone par bhi kaam karta hai, kyunki ye Accessibility
  service ke through system-level gesture inject karta hai, overlay ke touch-blocking se
  independent hai.

## Setup (build karne ke baad phone par)
1. `app-debug.apk` install karein (Unknown sources allow karna padega).
2. App kholein, teeno permission button daba kar allow karein:
   - Overlay permission ("Display over other apps")
   - Accessibility service ("TouchLock" ko list mein ON karein)
   - Microphone permission
3. "Voice Assistant Start Karein" dabayein.
4. Ab bolen **"on"** to lock ho jayega, **"off"** se khulega, **"up"/"down"** se scroll hoga.

## GitHub Actions se APK build karna
Ye repo push karte hi `.github/workflows/android.yml` automatically chalega aur
`app-debug.apk` ko **Actions → us run → Artifacts** section mein daal dega, jahan se
download kar sakte hain.

Local build ke liye: `./gradlew assembleDebug` (ya `gradle assembleDebug` agar wrapper
nahi hai).

## Zaroori limitations — please padhein
- **Ye ek "always listening" wake-word engine nahi hai.** Android ka built-in
  `SpeechRecognizer` short bursts mein sunta hai aur khud restart hota rehta hai, isliye
  do phrases ke beech thoda (~0.5 sec) gap ho sakta hai jab wo sun nahi raha hoga.
  Agar aapko sach mein continuous offline wake-word chahiye, uske liye Vosk/Porcupine
  jaisi offline library integrate karni hogi — ye abhi is code mein nahi hai.
- Android **10+** mein background se microphone/foreground service start karne par
  restrictions hain — app ko kabhi-kabhi manually reopen karna pad sakta hai agar
  service system ne kill kar diya.
- Accessibility service ka gesture (up/down) **Android ke system permission** par
  depend karta hai — kuch OEM (Xiaomi, Vivo, etc.) apni battery-optimization se
  background service ko band kar dete hain; unme "no restriction" / battery
  optimization off karna padega TouchLock ke liye.
- Ye overlay pura touch **block** karta hai jab lock ON ho — agar aapko emergency mein
  turant phone control karna ho, "off" bolna hi sabse fast tareeka hai. (Ek safety net
  ke roop mein aap chahen to power button se screen off/on karke bhi dekh sakte hain,
  overlay wahan bhi persist karega jab tak "off" na bolein.)
- Screen digitizer hardware issue permanently theek nahi hota — ye sirf usse app-level
  par workaround karta hai jab tak aap actual screen repair na karwa lein.

## Files
- `app/src/main/java/com/example/touchlock/MainActivity.kt` — permission setup UI
- `VoiceService.kt` — continuous voice command listener (foreground service)
- `OverlayController.kt` / `LockOverlayView.kt` — the touch-blocking lock overlay + tick markers
- `TouchLockAccessibilityService.kt` — dispatches up/down swipe gestures
