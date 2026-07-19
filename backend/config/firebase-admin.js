const admin = require('firebase-admin');

let isInitialized = false;

const initializeFirebase = () => {
  if (!isInitialized) {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin initialized via JSON String.');
        isInitialized = true;
      } else if (process.env.FIREBASE_PRIVATE_KEY) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          })
        });
        console.log('Firebase Admin initialized via individual Env variables.');
        isInitialized = true;
      } else {
        // Fallback for development/testing if no keys are provided yet
        console.warn('WARNING: Firebase credentials not set. Auth verification will fail or run in fallback mode.');
        // Set to true so we don't spam warn logs
        isInitialized = true;
      }
    } catch (error) {
      console.error('Error initializing Firebase Admin SDK:', error.message);
    }
  }
  return admin;
};

// Automatically initialize on import for Serverless / Vercel environments
initializeFirebase();

module.exports = { initializeFirebase, admin };
