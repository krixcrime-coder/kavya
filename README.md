# YouTube Uploader Companion

This folder is the Android-ready Expo app for the YouTube auto-uploader
project. It is separate from the Python/GitHub Actions automation code.

## Run the app

Install Node.js and Expo prerequisites, then run:

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `a` to open an Android emulator.

The app uses local device storage for metadata and report data. The GitHub
repository connection is shown in Settings but is not active until GitHub
authorization is configured.

## What belongs in GitHub

Put this entire app folder in a separate mobile-app repository, or keep it in
a separate `mobile/` folder. Do not copy it into the Python uploader root.

The Python uploader belongs in the repository root that runs GitHub Actions.
Its files are in the separate `youtube-auto-uploader-github.zip` package.

## Important

This is an Expo/React Native Android app source package, not an already-built
APK. To create an APK, open this project with Expo's Android build workflow
after installing dependencies.