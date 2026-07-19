const { admin } = require('../config/firebase-admin');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // If credentials aren't set in dev, we can support a mockup mode for manual checking
      if (process.env.NODE_ENV === 'development' && token === 'mock-admin-token') {
        let adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
          adminUser = await User.create({
            firebaseUid: 'mock-admin-uid',
            email: 'admin@clovas.com',
            name: 'Mock Admin',
            role: 'admin'
          });
        }
        req.user = adminUser;
        return next();
      }

      if (process.env.NODE_ENV === 'development' && token.startsWith('mock-user-token-')) {
        const userId = token.split('-')[3] || 'default';
        let normalUser = await User.findOne({ firebaseUid: `mock-user-uid-${userId}` });
        if (!normalUser) {
          normalUser = await User.create({
            firebaseUid: `mock-user-uid-${userId}`,
            email: `user-${userId}@clovas.com`,
            name: `Mock User ${userId}`,
            role: 'user'
          });
        }
        req.user = normalUser;
        return next();
      }

      // Standard Firebase verification
      let decodedToken;
      if (admin && typeof admin.auth === 'function' && admin.apps && admin.apps.length > 0) {
        decodedToken = await admin.auth().verifyIdToken(token);
      } else {
        console.warn('Firebase Admin not initialized. Using mock verification fallback.');
        const uid = token.startsWith('mock-custom-token-for-') ? token.replace('mock-custom-token-for-', '') : 'mock-user-uid';
        decodedToken = {
          uid: uid,
          email: uid.includes('@') ? uid : `${uid}@clovas.com`,
          name: uid.split('@')[0]
        };
      }
      
      // Find the user in MongoDB
      let user = await User.findOne({ firebaseUid: decodedToken.uid });
      
      if (!user) {
        // If they are in Firebase but not in MDB, we create a basic record
        user = await User.create({
          firebaseUid: decodedToken.uid,
          email: decodedToken.email || '',
          name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
          role: 'user'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth verification error:', error);
      res.status(401).json({ message: 'Not authorized, token verification failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
