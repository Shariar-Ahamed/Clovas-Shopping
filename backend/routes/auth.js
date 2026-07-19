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
      firebaseServiceAccountJsonLength: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? process.env.FIREBASE_SERVICE_ACCOUNT_JSON.length : 0,
      firebaseServiceAccountJsonPrefix: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? process.env.FIREBASE_SERVICE_ACCOUNT_JSON.substring(0, 30) + '...' : 'undefined',
      nodeEnv: process.env.NODE_ENV,
      usersList: users
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @desc    Seed Database
// @route   GET /api/auth/seed
// @access  Public
router.get('/seed', async (req, res) => {
  try {
    const Product = require('../models/Product');
    const Category = require('../models/Category');

    const categories = [
      { name: 'Men Shirts', slug: 'men-shirts', parent: 'Men' },
      { name: 'Men Shoes', slug: 'men-shoes', parent: 'Men' },
      { name: 'Women Dresses', slug: 'women-dresses', parent: 'Women' },
      { name: 'Women Kurti', slug: 'women-kurti', parent: 'Women' },
      { name: 'Smart Watches', slug: 'smart-watches', parent: 'Accessories' }
    ];

    const products = [
      {
        title: "Premium Classic Linen Shirt",
        description: "Tailored from 100% organic European flax. Offers supreme breathability and timeless style.",
        price: 2450, discountPrice: 1950,
        images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80"],
        category: "Men Shirts", subCategory: "Shirts", gender: "Men", stock: 25, ratings: 4.8, reviewsCount: 12, isFeatured: true, isTrending: true, isBestSeller: true, isNewArrival: false
      },
      {
        title: "Minimalist Graphic Tee",
        description: "Heavyweight crewneck cotton tee featuring custom graphic accents on the back.",
        price: 1200, discountPrice: 950,
        images: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80"],
        category: "Men Shirts", subCategory: "T-Shirts", gender: "Men", stock: 40, ratings: 4.6, reviewsCount: 11, isFeatured: false, isTrending: true, isBestSeller: false, isNewArrival: true
      },
      {
        title: "Classic Pique Polo Shirt",
        description: "Structured pique knit collar with double-button placket. Comfort cotton blend.",
        price: 1650, discountPrice: 0,
        images: ["https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=400&q=80"],
        category: "Men Shirts", subCategory: "Polo Shirts", gender: "Men", stock: 18, ratings: 4.4, reviewsCount: 9, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: false
      },
      {
        title: "Cozy Fleece Pullover Hoodie",
        description: "Brushed cotton fleece lining, double-lined hood with kangaroo front pocket.",
        price: 2600, discountPrice: 2200,
        images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&q=80"],
        category: "Men Shirts", subCategory: "Hoodies", gender: "Men", stock: 25, ratings: 4.7, reviewsCount: 14, isFeatured: true, isTrending: true, isBestSeller: false, isNewArrival: true
      },
      {
        title: "Classic Leather Biker Jacket",
        description: "High-grade cowhide leather with heavy-duty zipper details and satin lining.",
        price: 9500, discountPrice: 7900,
        images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80"],
        category: "Men Shirts", subCategory: "Jackets", gender: "Men", stock: 8, ratings: 4.9, reviewsCount: 7, isFeatured: true, isTrending: false, isBestSeller: false, isNewArrival: true
      },
      {
        title: "Sleek Slim-Fit Denim Jeans",
        description: "Dark-wash stretch denim with reinforced stitching and classic 5-pocket layout.",
        price: 2800, discountPrice: 0,
        images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=400&q=80"],
        category: "Men Shirts", subCategory: "Jeans", gender: "Men", stock: 20, ratings: 4.5, reviewsCount: 18, isFeatured: false, isTrending: true, isBestSeller: true, isNewArrival: false
      },
      {
        title: "Premium Comfort Chino Pants",
        description: "Breathable stretch twill pants tailored for smart-casual wardrobes.",
        price: 2200, discountPrice: 1800,
        images: ["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=400&q=80"],
        category: "Men Shirts", subCategory: "Pants", gender: "Men", stock: 15, ratings: 4.3, reviewsCount: 5, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
      },
      {
        title: "Formal Slim Fit Trousers",
        description: "Tailored trousers featuring side adjusters, premium hook closure, and pressed creases.",
        price: 2950, discountPrice: 2450,
        images: ["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=400&q=80"],
        category: "Men Shirts", subCategory: "Trousers", gender: "Men", stock: 12, ratings: 4.7, reviewsCount: 6, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: false
      },
      {
        title: "Urban Casual Cargo Shorts",
        description: "Multi-pocket durable cotton cargo shorts with premium utility belt included.",
        price: 1500, discountPrice: 0,
        images: ["https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=400&q=80"],
        category: "Men Shirts", subCategory: "Shorts", gender: "Men", stock: 30, ratings: 4.2, reviewsCount: 10, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
      },
      {
        title: "Handcrafted Leather Oxford Shoes",
        description: "Premium full-grain leather dress shoes with hand-painted burnished detailing.",
        price: 5500, discountPrice: 4800,
        images: ["https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=400&q=80"],
        category: "Men Shoes", subCategory: "Shoes", gender: "Men", stock: 10, ratings: 4.9, reviewsCount: 15, isFeatured: true, isTrending: false, isBestSeller: true, isNewArrival: false
      },
      {
        title: "Urban Comfort Retro Sneakers",
        description: "Cushioned rubber soles, soft calfskin panels, designed for high-paced walking.",
        price: 3800, discountPrice: 0,
        images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80"],
        category: "Men Shoes", subCategory: "Sneakers", gender: "Men", stock: 14, ratings: 4.5, reviewsCount: 8, isFeatured: false, isTrending: true, isBestSeller: true, isNewArrival: true
      },
      {
        title: "Comfort Fit Leather Sandals",
        description: "Adjustable double straps with cushioned cork-latex footbed support.",
        price: 1800, discountPrice: 1400,
        images: ["https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=400&q=80"],
        category: "Men Shoes", subCategory: "Sandals", gender: "Men", stock: 22, ratings: 4.4, reviewsCount: 12, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
      },
      {
        title: "Minimalist Chronograph Watch",
        description: "Genuine Italian leather band watch with scratch-resistant mineral crystal.",
        price: 7500, discountPrice: 5900,
        images: ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=400&q=80"],
        category: "Smart Watches", subCategory: "Watches", gender: "Men", stock: 8, ratings: 4.9, reviewsCount: 22, isFeatured: true, isTrending: false, isBestSeller: true, isNewArrival: true
      },
      {
        title: "Genuine Leather Bifold Wallet",
        description: "Sleek card holder layout, deep cash compartments and built-in RFID shielding.",
        price: 1500, discountPrice: 1250,
        images: ["https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=400&q=80"],
        category: "Men Shirts", subCategory: "Wallets", gender: "Men", stock: 35, ratings: 4.5, reviewsCount: 9, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: true
      },
      {
        title: "Full-Grain Leather Dress Belt",
        description: "Handcrafted calfskin leather belt with hand-brushed silver steel buckle.",
        price: 1850, discountPrice: 0,
        images: ["https://images.unsplash.com/photo-1624222247344-550fb8ec5b0d?auto=format&fit=crop&w=400&q=80"],
        category: "Men Shirts", subCategory: "Belts", gender: "Men", stock: 20, ratings: 4.3, reviewsCount: 5, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
      },
      {
        title: "Retro Round Polarized Sunglasses",
        description: "100% UV400 protective polarized lenses in an amber tortoiseshell frame.",
        price: 2200, discountPrice: 1800,
        images: ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=400&q=80"],
        category: "Men Shirts", subCategory: "Sunglasses", gender: "Men", stock: 15, ratings: 4.6, reviewsCount: 10, isFeatured: true, isTrending: true, isBestSeller: false, isNewArrival: true
      },
      {
        title: "Executive Leather Messenger Bag",
        description: "Padded slots for 15-inch laptops, premium hardware locks and adjustable shoulder strap.",
        price: 4500, discountPrice: 3800,
        images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80"],
        category: "Men Shirts", subCategory: "Bags", gender: "Men", stock: 10, ratings: 4.8, reviewsCount: 4, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: false
      },
      {
        title: "Woodland Oud Premium Cologne",
        description: "Deep fragrance notes of sandalwood, amber and cedarwood with long-lasting projection.",
        price: 5200, discountPrice: 4200,
        images: ["https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=400&q=80"],
        category: "Men Shirts", subCategory: "Perfume", gender: "Men", stock: 12, ratings: 4.7, reviewsCount: 8, isFeatured: true, isTrending: true, isBestSeller: false, isNewArrival: true
      },
      {
        title: "Premium Classic Baseball Cap",
        description: "Breathable cotton canvas, adjustable brass clasp, embroidered brand accent logo.",
        price: 950, discountPrice: 750,
        images: ["https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400&q=80"],
        category: "Men Shirts", subCategory: "Caps", gender: "Men", stock: 50, ratings: 4.1, reviewsCount: 6, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
      },
      {
        title: "Midnight Velvet Party Gown",
        description: "Elegant party dress featuring a wrap detail silhouette, dynamic side slit and rich velvet texture.",
        price: 4900, discountPrice: 3950,
        images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80"],
        category: "Women Dresses", subCategory: "Dresses", gender: "Women", stock: 12, ratings: 4.7, reviewsCount: 9, isFeatured: true, isTrending: true, isBestSeller: false, isNewArrival: true
      },
      {
        title: "Traditional Jamdani Silk Saree",
        description: "Exquisite hand-woven Banarasi style silk Saree with gold-threaded floral borders.",
        price: 8500, discountPrice: 7200,
        images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80"],
        category: "Women Dresses", subCategory: "Sarees", gender: "Women", stock: 5, ratings: 5.0, reviewsCount: 6, isFeatured: true, isTrending: true, isBestSeller: true, isNewArrival: false
      },
      {
        title: "Embroidered Silk Salwar Kameez",
        description: "Beautiful semi-stitched salwar set with a chiffon dupatta and zardozi work.",
        price: 3600, discountPrice: 2950,
        images: ["https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=400&q=80"],
        category: "Women Dresses", subCategory: "Salwar Kameez", gender: "Women", stock: 15, ratings: 4.5, reviewsCount: 8, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: true
      },
      {
        title: "Embroidered Premium Georgette Kurti",
        description: "Intricate hand embroidery work along the neckline, paired with lightweight georgette.",
        price: 2200, discountPrice: 1650,
        images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80"],
        category: "Women Kurti", subCategory: "Kurti", gender: "Women", stock: 30, ratings: 4.2, reviewsCount: 15, isFeatured: false, isTrending: true, isBestSeller: true, isNewArrival: false
      },
      {
        title: "Floral Ruffle Chiffon Top",
        description: "V-neck lightweight top featuring flared sleeves and an elegant waist tie.",
        price: 1450, discountPrice: 0,
        images: ["https://images.unsplash.com/photo-1548624149-f7b2e650d511?auto=format&fit=crop&w=400&q=80"],
        category: "Women Dresses", subCategory: "Tops", gender: "Women", stock: 25, ratings: 4.3, reviewsCount: 7, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
      },
      {
        title: "Casual Cotton Printed Tee",
        description: "Soft combed cotton tee featuring a retro typography design.",
        price: 850, discountPrice: 0,
        images: ["https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=400&q=80"],
        category: "Women Dresses", subCategory: "T-Shirts", gender: "Women", stock: 40, ratings: 4.4, reviewsCount: 5, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
      },
      {
        title: "Oversized Fleece Hoodie",
        description: "Drop shoulder warm fleece hoodie with double lined hoods and pockets.",
        price: 2400, discountPrice: 1950,
        images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&q=80"],
        category: "Women Dresses", subCategory: "Hoodies", gender: "Women", stock: 15, ratings: 4.6, reviewsCount: 10, isFeatured: false, isTrending: true, isBestSeller: false, isNewArrival: true
      }
    ];

    await Product.deleteMany({});
    await Category.deleteMany({});

    await Category.insertMany(categories);
    await Product.insertMany(products);

    res.json({ message: "Database seeded successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
