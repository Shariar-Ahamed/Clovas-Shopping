const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Category = require('./models/Category');

dotenv.config();

const categories = [
  { name: 'Men Shirts', slug: 'men-shirts', parent: 'Men' },
  { name: 'Men Shoes', slug: 'men-shoes', parent: 'Men' },
  { name: 'Women Dresses', slug: 'women-dresses', parent: 'Women' },
  { name: 'Women Kurti', slug: 'women-kurti', parent: 'Women' },
  { name: 'Smart Watches', slug: 'smart-watches', parent: 'Accessories' }
];

const products = [
  // --- Men Subcategories (19 Items) ---
  {
    title: "Premium Classic Linen Shirt",
    description: "Tailored from 100% organic European flax. Offers supreme breathability and timeless style.",
    price: 2450, discountPrice: 1950,
    images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Shirts", gender: "Men", stock: 25, ratings: 4.8, reviewsCount: 12, isFeatured: true, isTrending: true, isBestSeller: true, isNewArrival: false
  },
  {
    title: "Minimalist Graphic Tee",
    description: "Heavyweight crewneck cotton tee featuring custom graphic accents on the back.",
    price: 1200, discountPrice: 950,
    images: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "T-Shirts", gender: "Men", stock: 40, ratings: 4.6, reviewsCount: 11, isFeatured: false, isTrending: true, isBestSeller: false, isNewArrival: true
  },
  {
    title: "Classic Pique Polo Shirt",
    description: "Structured pique knit collar with double-button placket. Comfort cotton blend.",
    price: 1650, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Polo Shirts", gender: "Men", stock: 18, ratings: 4.4, reviewsCount: 9, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: false
  },
  {
    title: "Cozy Fleece Pullover Hoodie",
    description: "Brushed cotton fleece lining, double-lined hood with kangaroo front pocket.",
    price: 2600, discountPrice: 2200,
    images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Hoodies", gender: "Men", stock: 25, ratings: 4.7, reviewsCount: 14, isFeatured: true, isTrending: true, isBestSeller: false, isNewArrival: true
  },
  {
    title: "Classic Leather Biker Jacket",
    description: "High-grade cowhide leather with heavy-duty zipper details and satin lining.",
    price: 9500, discountPrice: 7900,
    images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Jackets", gender: "Men", stock: 8, ratings: 4.9, reviewsCount: 7, isFeatured: true, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    title: "Sleek Slim-Fit Denim Jeans",
    description: "Dark-wash stretch denim with reinforced stitching and classic 5-pocket layout.",
    price: 2800, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Jeans", gender: "Men", stock: 20, ratings: 4.5, reviewsCount: 18, isFeatured: false, isTrending: true, isBestSeller: true, isNewArrival: false
  },
  {
    title: "Premium Comfort Chino Pants",
    description: "Breathable stretch twill pants tailored for smart-casual wardrobes.",
    price: 2200, discountPrice: 1800,
    images: ["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Pants", gender: "Men", stock: 15, ratings: 4.3, reviewsCount: 5, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    title: "Formal Slim Fit Trousers",
    description: "Tailored trousers featuring side adjusters, premium hook closure, and pressed creases.",
    price: 2950, discountPrice: 2450,
    images: ["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Trousers", gender: "Men", stock: 12, ratings: 4.7, reviewsCount: 6, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: false
  },
  {
    title: "Urban Casual Cargo Shorts",
    description: "Multi-pocket durable cotton cargo shorts with premium utility belt included.",
    price: 1500, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Shorts", gender: "Men", stock: 30, ratings: 4.2, reviewsCount: 10, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    title: "Handcrafted Leather Oxford Shoes",
    description: "Premium full-grain leather dress shoes with hand-painted burnished detailing.",
    price: 5500, discountPrice: 4800,
    images: ["https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Shoes", gender: "Men", stock: 10, ratings: 4.9, reviewsCount: 15, isFeatured: true, isTrending: false, isBestSeller: true, isNewArrival: false
  },
  {
    title: "Urban Comfort Retro Sneakers",
    description: "Cushioned rubber soles, soft calfskin panels, designed for high-paced walking.",
    price: 3800, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Sneakers", gender: "Men", stock: 14, ratings: 4.5, reviewsCount: 8, isFeatured: false, isTrending: true, isBestSeller: true, isNewArrival: true
  },
  {
    title: "Comfort Fit Leather Sandals",
    description: "Adjustable double straps with cushioned cork-latex footbed support.",
    price: 1800, discountPrice: 1400,
    images: ["https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Sandals", gender: "Men", stock: 22, ratings: 4.4, reviewsCount: 12, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    title: "Minimalist Chronograph Watch",
    description: "Genuine Italian leather band watch with scratch-resistant mineral crystal.",
    price: 7500, discountPrice: 5900,
    images: ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Watches", gender: "Men", stock: 8, ratings: 4.9, reviewsCount: 22, isFeatured: true, isTrending: false, isBestSeller: true, isNewArrival: true
  },
  {
    title: "Genuine Leather Bifold Wallet",
    description: "Sleek card holder layout, deep cash compartments and built-in RFID shielding.",
    price: 1500, discountPrice: 1250,
    images: ["https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Wallets", gender: "Men", stock: 35, ratings: 4.5, reviewsCount: 9, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: true
  },
  {
    title: "Full-Grain Leather Dress Belt",
    description: "Handcrafted calfskin leather belt with hand-brushed silver steel buckle.",
    price: 1850, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1624222247344-550fb8ec5b0d?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Belts", gender: "Men", stock: 20, ratings: 4.3, reviewsCount: 5, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    title: "Retro Round Polarized Sunglasses",
    description: "100% UV400 protective polarized lenses in an amber tortoiseshell frame.",
    price: 2200, discountPrice: 1800,
    images: ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Sunglasses", gender: "Men", stock: 15, ratings: 4.6, reviewsCount: 10, isFeatured: true, isTrending: true, isBestSeller: false, isNewArrival: true
  },
  {
    title: "Executive Leather Messenger Bag",
    description: "Padded slots for 15-inch laptops, premium hardware locks and adjustable shoulder strap.",
    price: 4500, discountPrice: 3800,
    images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Bags", gender: "Men", stock: 10, ratings: 4.8, reviewsCount: 4, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: false
  },
  {
    title: "Woodland Oud Premium Cologne",
    description: "Deep fragrance notes of sandalwood, amber and cedarwood with long-lasting projection.",
    price: 5200, discountPrice: 4200,
    images: ["https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Perfume", gender: "Men", stock: 12, ratings: 4.7, reviewsCount: 8, isFeatured: true, isTrending: true, isBestSeller: false, isNewArrival: true
  },
  {
    title: "Premium Classic Baseball Cap",
    description: "Breathable cotton canvas, adjustable brass clasp, embroidered brand accent logo.",
    price: 950, discountPrice: 750,
    images: ["https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Caps", gender: "Men", stock: 50, ratings: 4.1, reviewsCount: 6, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },

  // --- Women Subcategories (20 Items) ---
  {
    title: "Midnight Velvet Party Gown",
    description: "Elegant party dress featuring a wrap detail silhouette, dynamic side slit and rich velvet texture.",
    price: 4900, discountPrice: 3950,
    images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Dresses", gender: "Women", stock: 12, ratings: 4.7, reviewsCount: 9, isFeatured: true, isTrending: true, isBestSeller: false, isNewArrival: true
  },
  {
    title: "Traditional Jamdani Silk Saree",
    description: "Exquisite hand-woven Banarasi style silk Saree with gold-threaded floral borders.",
    price: 8500, discountPrice: 7200,
    images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Sarees", gender: "Women", stock: 5, ratings: 5.0, reviewsCount: 6, isFeatured: true, isTrending: true, isBestSeller: true, isNewArrival: false
  },
  {
    title: "Embroidered Silk Salwar Kameez",
    description: "Beautiful semi-stitched salwar set with a chiffon dupatta and zardozi work.",
    price: 3600, discountPrice: 2950,
    images: ["https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Salwar Kameez", gender: "Women", stock: 15, ratings: 4.5, reviewsCount: 8, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: true
  },
  {
    title: "Embroidered Premium Georgette Kurti",
    description: "Intricate hand embroidery work along the neckline, paired with lightweight georgette.",
    price: 2200, discountPrice: 1650,
    images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Kurti", gender: "Women", stock: 30, ratings: 4.2, reviewsCount: 15, isFeatured: false, isTrending: true, isBestSeller: true, isNewArrival: false
  },
  {
    title: "Floral Ruffle Chiffon Top",
    description: "V-neck lightweight top featuring flared sleeves and an elegant waist tie.",
    price: 1450, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1548624149-f7b2e650d511?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Tops", gender: "Women", stock: 25, ratings: 4.3, reviewsCount: 7, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    title: "Casual Cotton Printed Tee",
    description: "Soft combed cotton tee featuring a retro typography design.",
    price: 850, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "T-Shirts", gender: "Women", stock: 40, ratings: 4.4, reviewsCount: 5, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    title: "Oversized Fleece Hoodie",
    description: "Drop shoulder warm fleece hoodie with double lined hoods and pockets.",
    price: 2400, discountPrice: 1950,
    images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Hoodies", gender: "Women", stock: 15, ratings: 4.6, reviewsCount: 10, isFeatured: false, isTrending: true, isBestSeller: false, isNewArrival: true
  },
  {
    title: "High Waisted Skinny Jeans",
    description: "Super stretch blue denim jeans designed to mold and hug your shape.",
    price: 2600, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Jeans", gender: "Women", stock: 20, ratings: 4.4, reviewsCount: 12, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: false
  },
  {
    title: "Active Stretch Comfort Leggings",
    description: "Moisture-wicking squat-proof athletic leggings with a high waistband profile.",
    price: 1250, discountPrice: 950,
    images: ["https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Leggings", gender: "Women", stock: 35, ratings: 4.5, reviewsCount: 16, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    title: "Pleated Chiffon Midi Skirt",
    description: "Flowy, high-waisted pleated midi length skirt with secure lining.",
    price: 1800, discountPrice: 1450,
    images: ["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Skirts", gender: "Women", stock: 18, ratings: 4.2, reviewsCount: 8, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    title: "Classic Leather Satchel Bag",
    description: "Structured design handbag featuring a double handle profile and gold metal zippers.",
    price: 3900, discountPrice: 3200,
    images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Bags", gender: "Women", stock: 10, ratings: 4.7, reviewsCount: 9, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: false
  },
  {
    title: "Elegant Designer Handbag",
    description: "Premium saffiano leather shopper handbag with detachable crossbody straps.",
    price: 4800, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Handbags", gender: "Women", stock: 8, ratings: 4.6, reviewsCount: 11, isFeatured: true, isTrending: false, isBestSeller: true, isNewArrival: false
  },
  {
    title: "Comfort Soft Ballet Flats",
    description: "Classic rounded toe slip-on shoes with padded micro-memory foam insoles.",
    price: 2200, discountPrice: 1850,
    images: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Shoes", gender: "Women", stock: 15, ratings: 4.4, reviewsCount: 13, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    title: "Stiletto Evening Party Heels",
    description: "Stunning 4-inch heels featuring wrap around ankle straps and rhinestone borders.",
    price: 3500, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Heels", gender: "Women", stock: 12, ratings: 4.8, reviewsCount: 14, isFeatured: false, isTrending: true, isBestSeller: true, isNewArrival: true
  },
  {
    title: "Classic Silver Hoop Earrings",
    description: "Highly polished 925 sterling silver hoop earrings. Lightweight design.",
    price: 2100, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Jewelry", gender: "Women", stock: 12, ratings: 4.8, reviewsCount: 15, isFeatured: false, isTrending: true, isBestSeller: true, isNewArrival: true
  },
  {
    title: "Luxury Highlighter Palette",
    description: "4 pigmented shades of baked metallic highlight powders for ultimate glow.",
    price: 1850, discountPrice: 1500,
    images: ["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Cosmetics", gender: "Women", stock: 25, ratings: 4.5, reviewsCount: 8, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    title: "Matte Lipstick & Gloss Duo",
    description: "Long lasting matte liquid lipstick with a clear hydrating gloss topper.",
    price: 1450, discountPrice: 1100,
    images: ["https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Makeup", gender: "Women", stock: 50, ratings: 4.3, reviewsCount: 18, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    title: "Organic Hydrating Rose Serum",
    description: "Soothing pure rose extract serum designed for immediate moisture lock and glow.",
    price: 2200, discountPrice: 1800,
    images: ["https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Skincare", gender: "Women", stock: 30, ratings: 4.7, reviewsCount: 22, isFeatured: true, isTrending: true, isBestSeller: false, isNewArrival: true
  },
  {
    title: "Rose Bouquet Eau de Parfum",
    description: "Fresh floral fragrance featuring turkish rose essence, white musk and vanilla.",
    price: 5800, discountPrice: 4800,
    images: ["https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Perfume", gender: "Women", stock: 10, ratings: 4.9, reviewsCount: 16, isFeatured: true, isTrending: true, isBestSeller: true, isNewArrival: false
  },
  {
    title: "Cat Eye Oversized Sunglasses",
    description: "Oversized retro cat-eye frames with dark smoke tinted polarized lenses.",
    price: 1850, discountPrice: 1450,
    images: ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Sunglasses", gender: "Women", stock: 20, ratings: 4.4, reviewsCount: 7, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },

  // --- Accessories Subcategories (8 Items) ---
  {
    title: "Classic Mechanical Skeleton Watch",
    description: "Double side skeleton design watch, featuring self-winding automatic motion locks.",
    price: 14500, discountPrice: 11900,
    images: ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=400&q=80"],
    category: "Accessories", subCategory: "Watches", gender: "Accessories", stock: 5, ratings: 4.9, reviewsCount: 10, isFeatured: true, isTrending: false, isBestSeller: true, isNewArrival: true
  },
  {
    title: "Active Fit GPS Smart Watch",
    description: "AMOLED screen fitness tracker watch with built-in GPS and active heart rate sensors.",
    price: 12500, discountPrice: 10900,
    images: ["https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=400&q=80"],
    category: "Accessories", subCategory: "Smart Watches", gender: "Accessories", stock: 10, ratings: 4.6, reviewsCount: 8, isFeatured: true, isTrending: true, isBestSeller: true, isNewArrival: true
  },
  {
    title: "Minimalist Slim Bifold Wallet",
    description: "RFID blocking, top-grain leather layout holding 6 cards and cash.",
    price: 1550, discountPrice: 1250,
    images: ["https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=400&q=80"],
    category: "Accessories", subCategory: "Wallets", gender: "Accessories", stock: 30, ratings: 4.5, reviewsCount: 8, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: true
  },
  {
    title: "Premium Calfskin Leather Belt",
    description: "Genuine calfskin leather belt with an elegant silver-brushed buckle profile.",
    price: 1850, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1624222247344-550fb8ec5b0d?auto=format&fit=crop&w=400&q=80"],
    category: "Accessories", subCategory: "Belts", gender: "Accessories", stock: 22, ratings: 4.3, reviewsCount: 7, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    title: "Water-Resistant Commuter Backpack",
    description: "Laptop sleeve up to 16 inches, anti-theft zipper compartments, water repellent.",
    price: 3200, discountPrice: 2600,
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80"],
    category: "Accessories", subCategory: "Backpacks", gender: "Accessories", stock: 45, ratings: 4.4, reviewsCount: 32, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: true
  },
  {
    title: "Premium Leather Duffle Travel Bag",
    description: "Spacious interior compartments, shoe pocket, adjustable reinforced carry straps.",
    price: 6500, discountPrice: 5200,
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80"],
    category: "Accessories", subCategory: "Travel Bags", gender: "Accessories", stock: 12, ratings: 4.8, reviewsCount: 15, isFeatured: true, isTrending: false, isBestSeller: true, isNewArrival: true
  },
  {
    title: "Gold Plated Link Chain Necklace",
    description: "Classic link chain necklace plated in 18k yellow gold. Durable and elegant.",
    price: 2800, discountPrice: 2200,
    images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&q=80"],
    category: "Accessories", subCategory: "Jewelry", gender: "Accessories", stock: 20, ratings: 4.6, reviewsCount: 10, isFeatured: false, isTrending: true, isBestSeller: false, isNewArrival: true
  },
  {
    title: "Magnetic Wireless Charger Stand",
    description: "Fast charger stand compatible with MagSafe devices, stable anti-slip base.",
    price: 1800, discountPrice: 1450,
    images: ["https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=400&q=80"],
    category: "Accessories", subCategory: "Mobile Accessories", gender: "Accessories", stock: 35, ratings: 4.5, reviewsCount: 6, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: true
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
