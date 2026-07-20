const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Product = require('../models/Product');
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// Configure Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper to generate a unique SKU
const generateUniqueSKU = async (category) => {
  const prefix = "CLV";
  const cat = (category || "GEN").substring(0, 3).toUpperCase();
  
  let isUnique = false;
  let sku = "";
  
  while (!isUnique) {
    const randomNum = Math.floor(10000 + Math.random() * 90000); // 5-digit number
    sku = `${prefix}-${cat}-${randomNum}`;
    const exists = await Product.findOne({ sku });
    if (!exists) {
      isUnique = true;
    }
  }
  return sku;
};

// Auto-migration script to fill missing SKUs in database
const runSKUMigration = async () => {
  try {
    const products = await Product.find({ sku: { $exists: false } });
    if (products.length > 0) {
      console.log(`[Migration] Found ${products.length} products missing a SKU. Generating...`);
      for (const prod of products) {
        prod.sku = await generateUniqueSKU(prod.category);
        await prod.save();
      }
      console.log(`[Migration] SKU migration completed successfully.`);
    }
  } catch (err) {
    console.error(`[Migration Error] Failed to migrate missing SKUs:`, err);
  }
};

// Run migration asynchronously after a brief timeout
setTimeout(runSKUMigration, 1500);

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      category, 
      subCategory, 
      gender, 
      minPrice, 
      maxPrice, 
      sort, 
      page = 1, 
      limit = 12 
    } = req.query;

    const query = {};

    // Apply Search
    if (search) {
      query.$or = [
        { sku: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply Category
    if (category) {
      query.category = category;
    }

    // Apply Subcategory
    if (subCategory) {
      query.subCategory = subCategory;
    }

    // Apply Gender
    if (gender && gender !== 'All') {
      query.gender = gender;
    }

    // Apply Price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Build Sorting options
    let sortOption = { createdAt: -1 }; // Default: Newest
    if (sort === 'price-low') {
      sortOption = { price: 1 };
    } else if (sort === 'price-high') {
      sortOption = { price: -1 };
    } else if (sort === 'rating') {
      sortOption = { ratings: -1 };
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get featured/trending/bestseller/new products
// @route   GET /api/products/highlights
// @access  Public
router.get('/highlights', async (req, res) => {
  try {
    const featured = await Product.find({ isFeatured: true }).limit(8);
    const trending = await Product.find({ isTrending: true }).limit(8);
    const bestSellers = await Product.find({ isBestSeller: true }).limit(8);
    const newArrivals = await Product.find({ isNewArrival: true }).sort({ createdAt: -1 }).limit(8);
    const flashSale = await Product.find({ 'flashSale.isFlashSale': true }).limit(8);

    res.json({ featured, trending, bestSellers, newArrivals, flashSale });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Check if a SKU is available
// @route   GET /api/products/check-sku
// @access  Private (Admin Only)
router.get('/check-sku', protect, adminOnly, async (req, res) => {
  try {
    const { sku, excludeId } = req.query;
    if (!sku) {
      return res.status(400).json({ message: 'SKU parameter is required' });
    }

    const query = { sku: sku.trim().toUpperCase() };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const exists = await Product.findOne(query);
    res.json({ available: !exists });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get single product details with reviews
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const reviews = await Review.find({ product: product._id }).sort({ createdAt: -1 });
    res.json({ product, reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
router.get('/:id/related', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const related = await Product.find({
      _id: { $ne: product._id },
      $or: [
        { category: product.category },
        { subCategory: product.subCategory },
        { gender: product.gender }
      ]
    }).limit(4);

    res.json(related);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add product review
// @route   POST /api/products/:id/reviews
// @access  Private
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user already reviewed
    const alreadyReviewed = await Review.findOne({
      product: product._id,
      user: req.user._id
    });

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Product already reviewed' });
    }

    const review = new Review({
      product: product._id,
      user: req.user._id,
      userName: req.user.name,
      rating: Number(rating),
      comment
    });

    await review.save();
    res.status(201).json({ message: 'Review added successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================= ADMIN ROUTING =================

// @desc    Upload Image to Cloudinary
// @route   POST /api/products/upload
// @access  Private (Admin Only)
router.post('/upload', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary using stream
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'clovas_shopping' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ message: 'Cloudinary upload failed' });
        }
        res.json({ url: result.secure_url });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a Product
// @route   POST /api/products
// @access  Private (Admin Only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const {
      sku,
      title,
      description,
      price,
      discountPrice,
      images,
      category,
      subCategory,
      gender,
      stock,
      isFeatured,
      isTrending,
      isBestSeller,
      isNewArrival,
      flashSale
    } = req.body;

    let finalSku = sku ? sku.trim().toUpperCase() : '';
    if (!finalSku) {
      finalSku = await generateUniqueSKU(category);
    } else {
      const exists = await Product.findOne({ sku: finalSku });
      if (exists) {
        return res.status(400).json({ message: `Product Code/SKU '${finalSku}' is already taken.` });
      }
    }

    const product = new Product({
      sku: finalSku,
      title,
      description,
      price,
      discountPrice: discountPrice || 0,
      images,
      category,
      subCategory,
      gender,
      stock: stock || 0,
      isFeatured: isFeatured || false,
      isTrending: isTrending || false,
      isBestSeller: isBestSeller || false,
      isNewArrival: isNewArrival !== undefined ? isNewArrival : true,
      flashSale: flashSale || { isFlashSale: false, discountPercent: 0 }
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a Product
// @route   PUT /api/products/:id
// @access  Private (Admin Only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      if (req.body.sku) {
        const finalSku = req.body.sku.trim().toUpperCase();
        if (finalSku !== product.sku) {
          const exists = await Product.findOne({ sku: finalSku });
          if (exists) {
            return res.status(400).json({ message: `Product Code/SKU '${finalSku}' is already taken.` });
          }
          product.sku = finalSku;
        }
      }
      Object.assign(product, { ...req.body, sku: product.sku });
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a Product
// @route   DELETE /api/products/:id
// @access  Private (Admin Only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await Review.deleteMany({ product: product._id });
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
