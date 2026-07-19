const getApiBaseUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  return '/api';
};

let authInstance = null;
let isMockMode = true;
let initPromise = null;

const ensureInitialized = () => {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const API_BASE_URL = getApiBaseUrl();
    let config = null;

    // Use AbortController with 5000ms timeout to prevent page blocking on serverless cold starts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/firebase-config`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        if (data.apiKey) {
          config = data;
        }
      }
    } catch (err) {
      console.warn("Could not fetch Firebase config from backend. Running fallback.", err);
    }

    const activeConfig = config || {
      apiKey: "PLACEHOLDER_API_KEY",
      authDomain: "PLACEHOLDER_AUTH_DOMAIN",
      projectId: "PLACEHOLDER_PROJECT_ID",
      storageBucket: "PLACEHOLDER_STORAGE_BUCKET",
      messagingSenderId: "PLACEHOLDER_MESSAGING_SENDER_ID",
      appId: "PLACEHOLDER_APP_ID"
    };

    if (activeConfig.apiKey && activeConfig.apiKey !== "PLACEHOLDER_API_KEY") {
      // Local testing override for authDomain to bypass third-party cookie/iframe blocking
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        activeConfig.authDomain = "clovas-shop.firebaseapp.com";
      }
      isMockMode = false;
      try {
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
        const app = initializeApp(activeConfig);
        const { getAuth, getRedirectResult } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
        authInstance = getAuth();
        
        // Handle pending redirect results from Google Sign-In
        getRedirectResult(authInstance).then((result) => {
          if (result) {
            console.log("Google redirect sign-in completed for user:", result.user.email);
          }
        }).catch((err) => {
          console.error("Google redirect sign-in error:", err);
        });

        console.log("Firebase Auth Initialized Successfully.");
      } catch (err) {
        console.error("Failed to load Firebase, running in Mock Mode:", err);
        isMockMode = true;
      }
    } else {
      isMockMode = true;
    }
  })();

  return initPromise;
};

// Trigger background initialization immediately without blocking script loading
ensureInitialized();

// Unified Auth Interface
const clovasAuth = {
  isMock: () => isMockMode,
  
  // Register User
  register: async (email, password, name) => {
    await ensureInitialized();
    if (isMockMode) {
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      if (users.find(u => u.email === email)) {
        throw new Error('User already exists in Mock Database');
      }
      
      const newMockUser = {
        uid: 'mock-user-uid-' + Date.now(),
        email,
        displayName: name,
        role: email.includes('admin') ? 'admin' : 'user'
      };
      
      users.push(newMockUser);
      localStorage.setItem('mock_users', JSON.stringify(users));
      localStorage.setItem('mock_current_user', JSON.stringify(newMockUser));
      return newMockUser;
    } else {
      const { createUserWithEmailAndPassword, updateProfile } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
      const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      return userCredential.user;
    }
  },

  // Login User
  login: async (email, password) => {
    await ensureInitialized();
    if (isMockMode) {
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const user = users.find(u => u.email === email);
      if (!user) {
        // Create auto-mock user for easy check
        const newMockUser = {
          uid: 'mock-user-uid-' + (email.includes('admin') ? 'admin' : 'user'),
          email,
          displayName: email.split('@')[0],
          role: email.includes('admin') ? 'admin' : 'user'
        };
        users.push(newMockUser);
        localStorage.setItem('mock_users', JSON.stringify(users));
        localStorage.setItem('mock_current_user', JSON.stringify(newMockUser));
        return newMockUser;
      }
      localStorage.setItem('mock_current_user', JSON.stringify(user));
      return user;
    } else {
      const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
      const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
      return userCredential.user;
    }
  },

  // Google Login
  loginWithGoogle: async () => {
    await ensureInitialized();
    if (isMockMode) {
      const googleUser = {
        uid: 'mock-user-uid-google-' + Date.now(),
        email: 'googleuser@gmail.com',
        displayName: 'Google Shopper',
        role: 'user'
      };
      localStorage.setItem('mock_current_user', JSON.stringify(googleUser));
      return googleUser;
    } else {
      const { signInWithRedirect, GoogleAuthProvider } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(authInstance, provider);
      // signInWithRedirect triggers a page redirection, so it doesn't return immediately
      return null;
    }
  },

  // Sign In with Firebase Custom Token
  signInWithCustomToken: async (customToken) => {
    await ensureInitialized();
    if (isMockMode) {
      const uid = customToken.split('-for-')[1] || 'mock-otp-user';
      const user = {
        uid,
        email: uid.includes('@') ? uid : `${uid}@gmail.com`,
        displayName: uid.split('@')[0].replace('otp-user-', ''),
        role: uid.includes('admin') ? 'admin' : 'user'
      };
      localStorage.setItem('mock_current_user', JSON.stringify(user));
      return user;
    } else {
      const { signInWithCustomToken } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
      const userCredential = await signInWithCustomToken(authInstance, customToken);
      return userCredential.user;
    }
  },

  // Logout
  logout: async () => {
    await ensureInitialized();
    if (isMockMode) {
      localStorage.removeItem('mock_current_user');
      return true;
    } else {
      const { signOut } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
      await signOut(authInstance);
      return true;
    }
  },

  // Forgot Password
  resetPassword: async (email) => {
    await ensureInitialized();
    if (isMockMode) {
      console.log(`Mock reset password link sent to: ${email}`);
      return true;
    } else {
      const { sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
      await sendPasswordResetEmail(authInstance, email);
      return true;
    }
  },

  // Get Current User (promise based callback)
  getCurrentUser: () => {
    return new Promise(async (resolve) => {
      await ensureInitialized();
      if (isMockMode) {
        const user = JSON.parse(localStorage.getItem('mock_current_user') || 'null');
        resolve(user);
      } else {
        const checkAuth = () => {
          if (authInstance) {
            const unsubscribe = authInstance.onAuthStateChanged(user => {
              unsubscribe();
              resolve(user);
            });
          } else {
            setTimeout(checkAuth, 100);
          }
        };
        checkAuth();
      }
    });
  },

  // Listen to Auth State Changes
  onAuthStateChanged: (callback) => {
    ensureInitialized().then(() => {
      if (isMockMode) {
        const user = JSON.parse(localStorage.getItem('mock_current_user') || 'null');
        callback(user);
      } else {
        authInstance.onAuthStateChanged(callback);
      }
    });
  },

  // Get Auth Token for Backend Requests
  getToken: async () => {
    await ensureInitialized();
    if (isMockMode) {
      const user = JSON.parse(localStorage.getItem('mock_current_user') || 'null');
      if (!user) return null;
      // If the user's email includes admin, return mock admin token
      if (user.email && user.email.includes('admin')) {
        return 'mock-admin-token';
      }
      return `mock-user-token-${user.uid}`;
    } else {
      const user = authInstance?.currentUser;
      if (!user) return null;
      return await user.getIdToken();
    }
  }
};

window.clovasAuth = clovasAuth;
export default clovasAuth;
