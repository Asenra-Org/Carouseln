/**
 * Run this script once to set CORS on your Firebase Storage bucket.
 * Usage: node set-cors.mjs
 * 
 * Requires: npm install @google-cloud/storage (or use firebase-tools gsutil)
 */

// We use the Firebase Admin SDK approach via the REST API
// Since we don't have gcloud installed, we use the Firebase CLI storage:cors command

console.log(`
===========================================
FIREBASE STORAGE CORS SETUP
===========================================

Your Firebase Storage bucket (asenra-carousel-studio.firebasestorage.app)
needs CORS rules to allow uploads from localhost and your production domain.

OPTION 1 — Firebase CLI (Easiest, after CLI installs):
  firebase login
  firebase use asenra-carousel-studio
  firebase storage:cors:set cors.json

OPTION 2 — Google Cloud Console (No CLI needed):
  1. Go to https://console.cloud.google.com/storage/browser
  2. Find bucket: asenra-carousel-studio.firebasestorage.app
  3. Click the three dots > Edit access > CORS (under "Configuration")
  4. Paste the content of cors.json

OPTION 3 — gsutil via Google Cloud Shell:
  1. Go to https://console.cloud.google.com
  2. Click the terminal icon (Cloud Shell) in the top right
  3. In Cloud Shell, run:
     gsutil cors set cors.json gs://asenra-carousel-studio.firebasestorage.app

The cors.json file is already created in your project root.
`);
