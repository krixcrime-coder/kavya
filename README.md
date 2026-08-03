# Arena — Native Android Video Editor

Ye ek **real native Android app** hai (Kotlin + XML, koi WebView/wrapper nahi).
Icons emoji nahi hai — sab proper vector drawables hain (`res/drawable/ic_*.xml`).
App icon tera diya hua wing logo hai, real Android density folders
(`mipmap-mdpi` se `mipmap-xxxhdpi` tak) mein generate kiya gaya hai.

## Project structure (important files)

```
arena-native/
├── build.gradle                          → root gradle config
├── settings.gradle                       → module list
├── app/
│   ├── build.gradle                      → app-level deps (Material, AppCompat)
│   ├── src/main/
│   │   ├── AndroidManifest.xml           → app name "Arena", permissions
│   │   ├── java/com/arena/editor/
│   │   │   ├── MainActivity.kt           → sara flow/logic yaha hai
│   │   │   └── OverlayElementView.kt     → drag/resize/lock wala custom view
│   │   └── res/
│   │       ├── layout/                   → har screen ki alag XML file
│   │       ├── drawable/                 → sab vector icons (emoji nahi)
│   │       ├── mipmap-*/                 → tera wing logo, app icon ke roop mein
│   │       └── values/                   → colors, strings, theme
└── .github/workflows/android-build.yml   → APK build karega
```

## Kaise APK banaye (GitHub Actions se)

1. GitHub par naya repo bana.
2. Poora `arena-native` folder push kar de:
   ```bash
   git init
   git add .
   git commit -m "Arena native app"
   git branch -M main
   git remote add origin <teri-repo-url>
   git push -u origin main
   ```
3. Push karne par **Actions** tab mein "Build Arena APK" workflow chalega.
4. Complete hone ke baad, run ke niche **Artifacts** section mein
   `arena-debug-apk` milega — download kar ke phone mein install kar.

## App ka flow (jo tune bataya tha, wahi hai)

1. Home → "+ New project"
2. Size select → 9:16 / 16:9 / 1:1 / 4:3 + "More ratios"
3. Video select → gallery se real video (system picker, koi extra permission dialog nahi lagega)
4. Crop screen → default "auto centre, black bars", "fill frame" chip, aur 4:3/1:1/free crop chips
5. Sequential sawaal: Watermark? → text → Caption? → text → Sticker? → icon pick →
   "add another?" jab tak "No" na bole
6. Main editor → video ke upar drag/resize (corner handle) + Lock switch (drag ↔ locked)
   + niche tray (Watermark / Caption / Sticker / Delete) — CapCut jaisa simple
7. Export button → abhi "saved" confirmation dikhata hai

## Ek important limitation — sach mein bata du

Export button abhi sirf confirmation dikhata hai; overlays ko **permanently video ke
pixels mein burn karna** (real export jisme watermark/caption/sticker hamesha ke liye
video ke andar chala jaye) ke liye video encoding chahiye (jaise FFmpeg/MediaCodec) —
ye ek bada alag kaam hai. Agar chahiye to bata dena, main next step mein ye add kar
dunga (FFmpeg-Android library se).

## Icon/logo change karna ho

`app/src/main/res/mipmap-*/ic_launcher.png` aur `ic_launcher_round.png` replace kar de
(har density folder mein), aur `res/drawable/logo_full.png` bhi (home screen ke liye).
