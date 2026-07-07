const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Category = require('./models/Category');

dotenv.config();

const categories = [
  // Men
  { name: 'Men Shirts', slug: 'men-shirts', parent: 'Men', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80' },
  { name: 'Men Shoes', slug: 'men-shoes', parent: 'Men', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80' },
  { name: 'Men Watches', slug: 'men-watches', parent: 'Men', image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=400&q=80' },
  // Women
  { name: 'Women Dresses', slug: 'women-dresses', parent: 'Women', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80' },
  { name: 'Women Kurti', slug: 'women-kurti', parent: 'Women', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80' },
  { name: 'Women Cosmetics', slug: 'women-cosmetics', parent: 'Women', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80' },
  // Accessories
  { name: 'Smart Watches', slug: 'smart-watches', parent: 'Accessories', image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=400&q=80' },
  { name: 'Backpacks', slug: 'backpacks', parent: 'Accessories', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80' }
];

const products = [
  {
    title: 'Premium Classic Linen Shirt',
    description: 'Elevate your everyday wardrobe with our Premium Classic Linen Shirt. Tailored from 100% organic European flax, it offers supreme breathability, a relaxed structure, and timeless elegance.',
    price: 2450,
    discountPrice: 1950,
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'Men',
    subCategory: 'Shirts',
    gender: 'Men',
    stock: 25,
    isFeatured: true,
    isTrending: true,
    isBestSeller: true,
    isNewArrival: false,
    ratings: 4.8,
    reviewsCount: 12
  },
  {
    title: 'Urban Comfort Retro Sneakers',
    description: 'Designed for daily exploration, these sneakers pair a vintage leather upper with a dynamic cushioned sole. Extremely lightweight and durable.',
    price: 3800,
    discountPrice: 0,
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'Men',
    subCategory: 'Shoes',
    gender: 'Men',
    stock: 14,
    isFeatured: false,
    isTrending: true,
    isBestSeller: false,
    isNewArrival: true,
    ratings: 4.5,
    reviewsCount: 4
  },
  {
    title: 'Minimalist Chronograph Leather Watch',
    description: 'A stunning watch featuring a genuine Italian leather strap, a scratch-resistant sapphire crystal glass, and Japanese quartz movement.',
    price: 7500,
    discountPrice: 5900,
    images: [
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'Men',
    subCategory: 'Watches',
    gender: 'Men',
    stock: 8,
    isFeatured: true,
    isTrending: false,
    isBestSeller: true,
    isNewArrival: true,
    ratings: 4.9,
    reviewsCount: 22
  },
  {
    title: 'Midnight Velvet Party Gown',
    description: 'Make an unforgettable entrance with this stunning velvet gown. Features a flattering silhouette, dynamic wrap detail, and side slit.',
    price: 4900,
    discountPrice: 3950,
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'Women',
    subCategory: 'Dresses',
    gender: 'Women',
    stock: 12,
    isFeatured: true,
    isTrending: true,
    isBestSeller: false,
    isNewArrival: true,
    ratings: 4.7,
    reviewsCount: 9
  },
  {
    title: 'Embroidered Premium Georgette Kurti',
    description: 'Add a splash of ethnic charm to your wardrobe. Intricate hand-embroidery along the neckline and cuffs, paired with lightweight, premium georgette fabric.',
    price: 2200,
    discountPrice: 1650,
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'Women',
    subCategory: 'Kurti',
    gender: 'Women',
    stock: 30,
    isFeatured: false,
    isTrending: true,
    isBestSeller: true,
    isNewArrival: false,
    ratings: 4.2,
    reviewsCount: 15
  },
  {
    title: 'Active Fit GPS Smart Watch',
    description: 'An advanced health and fitness tracker with built-in GPS, active heart rate tracking, Sleep score analysis, and a vibrant AMOLED touch screen.',
    price: 12500,
    discountPrice: 10900,
    images: [
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'Accessories',
    subCategory: 'Smart Watches',
    gender: 'Accessories',
    stock: 10,
    isFeatured: true,
    isTrending: true,
    isBestSeller: true,
    isNewArrival: true,
    ratings: 4.6,
    reviewsCount: 8
  },
  {
    title: 'Water-Resistant Commuter Backpack',
    description: 'Designed for daily city commutes, this backpack features dedicated padded sleeves for up to a 16-inch laptop, a hidden anti-theft back pocket, and waterproof materials.',
    price: 3200,
    discountPrice: 2600,
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'Accessories',
    subCategory: 'Backpacks',
    gender: 'Accessories',
    stock: 45,
    isFeatured: false,
    isTrending: false,
    isBestSeller: true,
    isNewArrival: true,
    ratings: 4.4,
    reviewsCount: 32
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Seeding...');

    // Clear existing data
    await Product.deleteMany({});
    await Category.deleteMany({});
    console.log('Existing database entries cleared.');

    // Seed Categories
    await Category.insertMany(categories);
    console.log('Categories seeded successfully.');

    // Seed Products
    await Product.insertMany(products);
    console.log('Products seeded successfully.');

    console.log('Database Seeding Complete!');
    process.exit();
  } catch (error) {
    console.error('Seeding Error:', error.message);
    process.exit(1);
  }
};

seedDB();
