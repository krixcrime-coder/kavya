# Kavya 2.0

Kavya 2.0 is a Hindi-English Android voice assistant with permission-first onboarding, a conversational orb interface, and a GitHub Actions workflow for building APKs.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/kavya-assistant/` — Expo mobile app, onboarding, permission checklist, Gemini setup, and assistant home screen.
- `artifacts/kavya-assistant/app/(tabs)/index.tsx` — first-run flow and assistant UI.
- `artifacts/kavya-assistant/app.json` — Android package and permission declarations.
- `.github/workflows/build-kavya-apk.yml` — GitHub Actions release APK workflow.

## Architecture decisions

- The first build is frontend-first and persists onboarding completion locally with AsyncStorage.
- Sensitive device actions are confirmation-first; the initial build does not silently call or send messages.
- The app uses an Expo mobile artifact so it can be previewed with Expo Go and prebuilt for Android in CI.
- Gemini is treated as a follow-up secure integration; API keys should not be stored as plain text in the app bundle.

## Product

The current build guides users through Kavya's capabilities, requests microphone/contact/location/calendar/notification access, provides a Gemini setup gate, and offers a voice-orb assistant surface with working time/date, Maps, and YouTube shortcut commands.

## User preferences

- User wants the app in native Android APK form, built through a GitHub workflow.
- User wants the first launch to explain how Kavya works, request permissions, and only then start the assistant.

## Gotchas

- Complete secure Gemini storage/integration before accepting a production API key in the app.
- Background listening, floating overlay, and several Android device actions require a later native-focused phase and careful permission handling.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
