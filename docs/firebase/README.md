# Firebase Auth & Authentication Architecture - Clovas Shopping

This document provides developer guidelines on how **Firebase Authentication** is integrated into the Clovas Shopping project, covering both client-side login flows and server-side token validation.

## 🔗 Useful Links
- **Firebase Console:** [https://console.firebase.google.com](https://console.firebase.google.com)
- **Firebase Auth Documentation:** [https://firebase.google.com/docs/auth](https://firebase.google.com/docs/auth)
- **Google Cloud Console:** [https://console.cloud.google.com](https://console.cloud.google.com)

---

## 🔒 Overview of Authentication in Clovas Shopping

Clovas Shopping utilizes a hybrid authentication approach:
1. **Client-Side:** Users authenticate directly with Firebase Auth (supporting email/password registration, login, and Google Sign-in).
2. **Session Persistence:** Firebase manages user sessions and issues short-lived JWTs (JSON Web Tokens / ID Tokens).
3. **Server-Side:** The Node/Express backend verifies these ID tokens on every protected request using the **Firebase Admin SDK**.
4. **Data Syncing:** Upon successful verification, the backend automatically logs in or registers the user in MongoDB, syncing their Firebase profile details.

---

## 💻 Client-Side Authentication Flow

The client-side Firebase configuration resides in [frontend/js/firebase-config.js](https://github.com/Shariar-Ahamed/Clovas-Shopping/blob/main/frontend/js/firebase-config.js) and the login controllers are in [frontend/js/auth.js](https://github.com/Shariar-Ahamed/Clovas-Shopping/blob/main/frontend/js/auth.js).

1. **Initialization:**
   Firebase Client SDK is initialized using credentials defined in the `/backend/.env` file (`FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`, etc.).
2. **Obtaining ID Tokens:**
   Whenever the frontend initiates an API request, it extracts the current user's security token:
   ```javascript
   const token = await firebase.auth().currentUser.getIdToken();
   ```
3. **HTTP Header Attachment:**
   The client attaches this token as a Bearer authorization header:
   ```http
   Authorization: Bearer <FIREBASE_ID_TOKEN>
   ```

---

## 🛡️ Server-Side Authorization Middleware (`protect`)

The middleware configured in [backend/middleware/auth.js](https://github.com/Shariar-Ahamed/Clovas-Shopping/blob/main/backend/middleware/auth.js) intercepts incoming requests and performs verification:

### 1. Offline/Development Mockups
To ensure the backend runs smoothly during offline local development without making Firebase network queries, the middleware checks for mock developer tokens:
- **`mock-admin-token`:** Automatically logs in or registers a developer account with the `admin` role.
- **`mock-user-token-XYZ`:** Automatically logs in or registers a shopper account with a custom ID.

### 2. Token Verification
For live staging/production routes, the middleware verifies the JWT:
```javascript
const decodedToken = await admin.auth().verifyIdToken(token);
const { uid, email, name } = decodedToken;
```

### 3. Dynamic MongoDB Syncing & Auto-Registration
If the Firebase token is valid, the server performs the following data sync operations:
```javascript
let user = await User.findOne({ firebaseUid: uid });

if (!user) {
  // Generate a unique clean username based on their email or name
  const username = await generateUniqueUsername(email, name);
  
  // Register the profile automatically in MongoDB
  user = await User.create({
    firebaseUid: uid,
    email: email,
    name: name || 'Shopper',
    username: username,
    role: 'user'
  });
}
```

### 4. Admin Guard Role Verification (`adminOnly`)
Certain backend routes (e.g. `/api/admin/*`, `/api/products` edit/delete, coupon creations) require administrator privileges. This is enforced by the `adminOnly` helper:
```javascript
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden. Admin access required.' });
  }
};
```

---

## 📁 Environment Variables configuration

Ensure the following variables are set inside the `/backend/.env` file:

### Server-Side variables (Admin SDK)
- **`FIREBASE_SERVICE_ACCOUNT_JSON`:** The complete Firebase Service Account private key credentials formatted as a JSON string (Recommended for production environments).
- **`FIREBASE_PRIVATE_KEY` & `FIREBASE_CLIENT_EMAIL` & `FIREBASE_PROJECT_ID`:** Alternatively, individual keys can be specified.

### Client-Side variables (Client SDK)
- **`FIREBASE_API_KEY`**
- **`FIREBASE_AUTH_DOMAIN`**
- **`FIREBASE_PROJECT_ID`**
- **`FIREBASE_STORAGE_BUCKET`**
- **`FIREBASE_MESSAGING_SENDER_ID`**
- **`FIREBASE_APP_ID`**
- **`FIREBASE_MEASUREMENT_ID`**

---

## 🛠️ Developer Recommendations & Troubleshooting

1. **Local Sandbox Login:**
   When testing the application locally without internet, configure `api.js` mockup flags or use mock auth headers:
   `Authorization: Bearer mock-admin-token` to bypass Firebase verification.
2. **Invalid Private Key Error:**
   When pasting `FIREBASE_PRIVATE_KEY` directly in Vercel settings, escape the newline characters properly or wrap it in the JSON string variable `FIREBASE_SERVICE_ACCOUNT_JSON` to avoid token parsing breaks.
3. **CORS / Session Mismatches:**
   Vercel hosting configures proxy rewrites so that both the client-side Firebase Auth hooks and the backend verification routes communicate over the exact same base domain, preventing standard cross-domain credential blocking.
