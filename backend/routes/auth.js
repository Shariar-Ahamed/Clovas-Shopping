const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { admin } = require('../config/firebase-admin');

const tempOtpStore = {};

// @desc    Sync Firebase Auth with MongoDB User
// @route   POST /api/auth/sync
// @access  Private
router.post('/sync', protect, async (req, res) => {
  try {
    // protect middleware already syncs the user and sets req.user
    res.status(200).json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = name || user.name;
      user.phone = phone || user.phone;

      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add shipping address
// @route   POST /api/auth/address
// @access  Private
router.post('/address', protect, async (req, res) => {
  try {
    const { street, city, state, zip, country } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
      user.addresses.push({ street, city, state, zip, country });
      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete shipping address
// @route   DELETE /api/auth/address/:addressId
// @access  Private
router.delete('/address/:addressId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.addresses = user.addresses.filter(
        (addr) => addr._id.toString() !== req.params.addressId
      );
      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Send OTP to email
// @route   POST /api/auth/send-otp
// @access  Public
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Generate 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to memory as fallback
    tempOtpStore[email] = otpCode;

    // Save to MongoDB with 5 minutes expiry (only if DB is connected)
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      try {
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        await Otp.findOneAndUpdate(
          { email },
          { otp: otpCode, expiresAt },
          { upsert: true, new: true }
        );
      } catch (dbError) {
        console.warn('MongoDB save query failed:', dbError.message);
      }
    } else {
      console.warn('MongoDB offline. Saved OTP to memory fallback instantly.');
    }

    // Find the user if they exist to get their name (only if DB is connected)
    let userName = email.split('@')[0];
    if (mongoose.connection.readyState === 1) {
      try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          userName = existingUser.name;
        }
      } catch (dbError) {
        console.warn('MongoDB query failed:', dbError.message);
      }
    } else {
      console.warn('MongoDB offline. Using email prefix as name fallback instantly.');
    }

    // Check if EmailJS credentials are set
    const { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY } = process.env;

    const hasEmailConfig = EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY;

    let sentEmail = false;
    let emailjsError = null;

    if (hasEmailConfig) {
      try {
        // Call EmailJS REST API
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            service_id: EMAILJS_SERVICE_ID,
            template_id: EMAILJS_TEMPLATE_ID,
            user_id: EMAILJS_PUBLIC_KEY,
            accessToken: EMAILJS_PRIVATE_KEY || undefined,
            template_params: {
              to_email: email,
              user_name: userName,
              otp_code: otpCode,
              app_name: "Clovas Shopping"
            }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText);
        }

        console.log(`Real OTP email sent to ${email}`);
        sentEmail = true;
      } catch (emailError) {
        console.error('Failed to send email via EmailJS:', emailError.message);
        emailjsError = emailError.message;
      }
    } else {
      console.log(`[MOCK MODE] Generated OTP for ${email}: ${otpCode}`);
    }

    res.status(200).json({ 
      message: sentEmail ? 'OTP sent successfully' : (emailjsError ? `EmailJS failed: ${emailjsError}. Running in Mock Mode.` : 'OTP generated (Mock Mode)'),
      mockOtp: !sentEmail ? otpCode : undefined
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Verify OTP and log in / register
// @route   POST /api/auth/verify-otp
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, name, verifyOnly } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find OTP in MongoDB (only if DB is connected)
    let otpRecord = null;
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      try {
        otpRecord = await Otp.findOne({ email });
      } catch (dbError) {
        console.warn('MongoDB query failed:', dbError.message);
      }
    }

    const validOtp = otpRecord ? otpRecord.otp : tempOtpStore[email];

    if (!validOtp) {
      return res.status(400).json({ message: 'No OTP requested for this email or OTP expired' });
    }

    if (validOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }

    // OTP is valid! Delete it immediately to prevent reuse
    delete tempOtpStore[email];
    if (otpRecord && mongoose.connection.readyState === 1) {
      await Otp.deleteOne({ _id: otpRecord._id }).catch(() => {});
    }

    if (verifyOnly) {
      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully'
      });
    }

    // Check if User exists in MongoDB (only if DB is connected)
    let user = null;
    let isNewUser = false;

    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findOne({ email });
        if (!user) {
          // Register new user
          isNewUser = true;
          const finalName = name || email.split('@')[0];
          user = await User.create({
            email,
            name: finalName,
            role: email.includes('admin') ? 'admin' : 'user',
            addresses: []
          });
          console.log(`New user registered via OTP: ${email}`);
        }
      } catch (dbError) {
        console.warn('MongoDB query failed:', dbError.message);
      }
    }

    if (!user) {
      user = {
        _id: 'mock-user-id',
        email,
        name: name || email.split('@')[0],
        role: email.includes('admin') ? 'admin' : 'user'
      };
    }

    // Generate Firebase Custom Token
    let customToken = null;
    try {
      const uid = (user && user.firebaseUid) || `otp-user-${(user && user._id) ? user._id.toString() : 'mock-id'}`;
      
      if (user && !user.firebaseUid && typeof user.save === 'function' && mongoose.connection.readyState === 1) {
        user.firebaseUid = uid;
        await user.save().catch(() => {});
      }

      if (admin.apps.length > 0) {
        customToken = await admin.auth().createCustomToken(uid);
        console.log(`Minted custom auth token for ${email}`);
      } else {
        customToken = `mock-custom-token-for-${uid}`;
        console.warn('Firebase Admin not fully initialized, returning mock custom token.');
      }
    } catch (adminError) {
      console.error('Failed to generate Firebase custom token:', adminError.message);
      customToken = `mock-custom-token-for-otp-user-${(user && user._id) ? user._id.toString() : 'mock-id'}`;
    }

    res.status(200).json({
      message: isNewUser ? 'Account registered successfully' : 'Logged in successfully',
      customToken,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get Firebase Client SDK Config
// @route   GET /api/auth/firebase-config
// @access  Public
router.get('/firebase-config', (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY || "",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.FIREBASE_APP_ID || "",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || ""
  });
});

// @desc    Debug Database Connection and Users
// @route   GET /api/auth/debug-db
// @access  Public
router.get('/debug-db', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const User = require('../models/User');
    const rawAdmin = require('firebase-admin');
    const { admin } = require('../config/firebase-admin');
    const count = await User.countDocuments({});
    const users = await User.find({}, 'email firebaseUid name role');
    res.json({
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      dbName: mongoose.connection.name,
      usersCount: count,
      firebaseAdminInitialized: (admin && admin.apps && admin.apps.length > 0) ? true : false,
      firebaseInitError: global.firebaseInitError || 'None',
      rawAdminKeys: Object.keys(rawAdmin || {}),
      rawAdminDefaultKeys: Object.keys(rawAdmin?.default || {}),
      firebaseServiceAccountJsonLength: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? process.env.FIREBASE_SERVICE_ACCOUNT_JSON.length : 0,
      firebaseServiceAccountJsonPrefix: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? process.env.FIREBASE_SERVICE_ACCOUNT_JSON.substring(0, 30) + '...' : 'undefined',
      nodeEnv: process.env.NODE_ENV,
      usersList: users
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
