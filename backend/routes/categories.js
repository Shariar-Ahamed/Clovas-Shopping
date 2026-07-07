const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a category
// @route   POST /api/categories
// @access  Private (Admin Only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, slug, parent, image } = req.body;

    const categoryExists = await Category.findOne({ slug });
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({
      name,
      slug,
      parent,
      image
    });

    const createdCategory = await category.save();
    res.status(201).json(createdCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private (Admin Only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (category) {
      await category.deleteOne();
      res.json({ message: 'Category removed' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
