const admin = require('firebase-admin');

let isInitialized = false;

const initializeFirebase = () => {
  if (!isInitialized) {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
          });
          console.log('Firebase Admin initialized via JSON String.');
          isInitialized = true;
          global.firebaseInitError = 'Success (JSON)';
        } catch (jsonErr) {
          global.firebaseInitError = `JSON Parse Error: ${jsonErr.message}`;
          console.error(global.firebaseInitError);
        }
      } else if (process.env.FIREBASE_PRIVATE_KEY) {
        try {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            })
          });
          console.log('Firebase Admin initialized via individual Env variables.');
          isInitialized = true;
          global.firebaseInitError = 'Success (Individual)';
        } catch (indErr) {
          global.firebaseInitError = `Individual Init Error: ${indErr.message}`;
          console.error(global.firebaseInitError);
        }
      } else {
        global.firebaseInitError = 'Credentials empty (both FIREBASE_SERVICE_ACCOUNT_JSON and FIREBASE_PRIVATE_KEY are undefined)';
        console.warn(global.firebaseInitError);
        isInitialized = true;
      }
    } catch (error) {
      global.firebaseInitError = `Firebase Admin SDK Initialization Error: ${error.message}`;
      console.error(global.firebaseInitError);
    }
  }
  return admin;
};

// Automatically initialize on import for Serverless / Vercel environments
initializeFirebase();

module.exports = { initializeFirebase, admin };
