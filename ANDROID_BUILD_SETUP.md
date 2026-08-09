# Android APK build — one-time setup

This repo builds an installable Android APK automatically using Expo's
free cloud build service (EAS Build), triggered by GitHub Actions.

## One-time setup (5 minutes)

1. Create a free Expo account: https://expo.dev/signup
2. Install EAS CLI on any machine with Node.js and log in once:
   ```
   npm install -g eas-cli
   eas login
   ```
3. From inside this project folder, link it to your Expo account:
   ```
   eas init
   ```
   This creates a project ID on expo.dev and adds it to app.json.
4. Generate an access token for GitHub Actions:
   - Go to https://expo.dev/accounts/[your-username]/settings/access-tokens
   - Create a new token, copy it.
5. In this GitHub repo: Settings -> Secrets and variables -> Actions ->
   New repository secret:
   - Name: `EXPO_TOKEN`
   - Value: the token from step 4

## Building the APK

- Push to `main`, or go to Actions -> "Build Android APK" -> "Run workflow".
- The build runs on Expo's servers (free tier: limited builds/month).
- When it finishes, open the workflow run -> scroll to "Artifacts" ->
  download `android-apk` -> it contains `app-release.apk`.
- Transfer that APK to an Android phone and install it (enable
  "install from unknown sources" if prompted).

## Notes

- First build takes longer (10-20 min) because EAS has to prepare a
  fresh native build. Later builds are faster.
- `eas.json`'s `preview` profile produces a direct-install `.apk`.
  The `production` profile produces an `.aab`, which is what the
  Google Play Store requires if you publish there later — that one
  cannot be installed directly on a phone.
