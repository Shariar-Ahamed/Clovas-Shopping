// Firebase SDK and Mock Auth Fallback configuration
// If you want to use real Firebase, populate the config below.
// Otherwise, the site will automatically run in Mock Mode for easy testing!

const firebaseConfig = {
  apiKey: "PLACEHOLDER_API_KEY",
  authDomain: "PLACEHOLDER_AUTH_DOMAIN",
  projectId: "PLACEHOLDER_PROJECT_ID",
  storageBucket: "PLACEHOLDER_STORAGE_BUCKET",
  messagingSenderId: "PLACEHOLDER_MESSAGING_SENDER_ID",
  appId: "PLACEHOLDER_APP_ID"
};

let authInstance = null;
let isMockMode = true;

// Detect if config is still placeholders
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "PLACEHOLDER_API_KEY") {
  isMockMode = false;
}

if (!isMockMode) {
  // Load Firebase dynamically
  import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js")
    .then(({ initializeApp }) => {
      const app = initializeApp(firebaseConfig);
      return import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    })
    .then(({ getAuth }) => {
      authInstance = getAuth();
      console.log("Firebase Auth Initialized Successfully.");
    })
    .catch(err => {
      console.error("Failed to load Firebase, running in Mock Mode:", err);
      isMockMode = true;
    });
}

// Unified Auth Interface
const clovasAuth = {
  isMock: () => isMockMode,
  
  // Register User
  register: async (email, password, name) => {
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
    if (isMockMode) {
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const user = users.find(u => u.email === email);
      if (!user) {
        // Create auto-mock user for easy check
        const newMockUser = {
          uid: 'mock-user-uid-' + (email.includes('admin') ? 'admin' : 'user'),
          email,
          displayName: name = email.split('@')[0],
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
      const { signInWithPopup, GoogleAuthProvider } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(authInstance, provider);
      return userCredential.user;
    }
  },

  // Logout
  logout: async () => {
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
    return new Promise((resolve) => {
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

  // Get Auth Token for Backend Requests
  getToken: async () => {
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
