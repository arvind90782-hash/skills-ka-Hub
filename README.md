<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/56ed6d12-f38a-40cc-a3a4-1f4835ef0c51

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create `.env` from `.env.example` and set:
   - Gemini key: `GEMINI_API_KEY` (or `API_KEY` / `VITE_API_KEY`)
   - Firebase keys: `VITE_FIREBASE_*` values
   - Admin emails: `VITE_ADMIN_EMAILS` (comma-separated)
3. In Firebase console:
   - Enable Email/Password login in Authentication
   - Create Firestore database
4. Run the app:
   `npm run dev`
