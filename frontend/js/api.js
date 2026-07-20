import clovasAuth from './firebase-config.js';

const getApiBaseUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

// --- Complete 47 Subcategories Mock Database ---
const MOCK_PRODUCTS = [
  // --- Men Subcategories (19 Items) ---
  {
    _id: "mock-men-1",
    title: "Premium Classic Linen Shirt",
    description: "Tailored from 100% organic European flax. Offers supreme breathability and timeless style.",
    price: 2450, discountPrice: 1950,
    images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Shirts", gender: "Men", stock: 25, ratings: 4.8, reviewsCount: 12, isFeatured: true, isTrending: true, isBestSeller: true, isNewArrival: false
  },
  {
    _id: "mock-men-2",
    title: "Minimalist Graphic Tee",
    description: "Heavyweight crewneck cotton tee featuring custom graphic accents on the back.",
    price: 1200, discountPrice: 950,
    images: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "T-Shirts", gender: "Men", stock: 40, ratings: 4.6, reviewsCount: 11, isFeatured: false, isTrending: true, isBestSeller: false, isNewArrival: true
  },
  {
    _id: "mock-men-3",
    title: "Classic Pique Polo Shirt",
    description: "Structured pique knit collar with double-button placket. Comfort cotton blend.",
    price: 1650, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Polo Shirts", gender: "Men", stock: 18, ratings: 4.4, reviewsCount: 9, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: false
  },
  {
    _id: "mock-men-4",
    title: "Cozy Fleece Pullover Hoodie",
    description: "Brushed cotton fleece lining, double-lined hood with kangaroo front pocket.",
    price: 2600, discountPrice: 2200,
    images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Hoodies", gender: "Men", stock: 25, ratings: 4.7, reviewsCount: 14, isFeatured: true, isTrending: true, isBestSeller: false, isNewArrival: true
  },
  {
    _id: "mock-men-5",
    title: "Classic Leather Biker Jacket",
    description: "High-grade cowhide leather with heavy-duty zipper details and satin lining.",
    price: 9500, discountPrice: 7900,
    images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Jackets", gender: "Men", stock: 8, ratings: 4.9, reviewsCount: 7, isFeatured: true, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    _id: "mock-men-6",
    title: "Sleek Slim-Fit Denim Jeans",
    description: "Dark-wash stretch denim with reinforced stitching and classic 5-pocket layout.",
    price: 2800, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Jeans", gender: "Men", stock: 20, ratings: 4.5, reviewsCount: 18, isFeatured: false, isTrending: true, isBestSeller: true, isNewArrival: false
  },
  {
    _id: "mock-men-7",
    title: "Premium Comfort Chino Pants",
    description: "Breathable stretch twill pants tailored for smart-casual wardrobes.",
    price: 2200, discountPrice: 1800,
    images: ["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Pants", gender: "Men", stock: 15, ratings: 4.3, reviewsCount: 5, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    _id: "mock-men-8",
    title: "Formal Slim Fit Trousers",
    description: "Tailored trousers featuring side adjusters, premium hook closure, and pressed creases.",
    price: 2950, discountPrice: 2450,
    images: ["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Trousers", gender: "Men", stock: 12, ratings: 4.7, reviewsCount: 6, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: false
  },
  {
    _id: "mock-men-9",
    title: "Urban Casual Cargo Shorts",
    description: "Multi-pocket durable cotton cargo shorts with premium utility belt included.",
    price: 1500, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Shorts", gender: "Men", stock: 30, ratings: 4.2, reviewsCount: 10, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    _id: "mock-men-10",
    title: "Handcrafted Leather Oxford Shoes",
    description: "Premium full-grain leather dress shoes with hand-painted burnished detailing.",
    price: 5500, discountPrice: 4800,
    images: ["https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Shoes", gender: "Men", stock: 10, ratings: 4.9, reviewsCount: 15, isFeatured: true, isTrending: false, isBestSeller: true, isNewArrival: false
  },
  {
    _id: "mock-men-11",
    title: "Urban Comfort Retro Sneakers",
    description: "Cushioned rubber soles, soft calfskin panels, designed for high-paced walking.",
    price: 3800, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Sneakers", gender: "Men", stock: 14, ratings: 4.5, reviewsCount: 8, isFeatured: false, isTrending: true, isBestSeller: true, isNewArrival: true
  },
  {
    _id: "mock-men-12",
    title: "Comfort Fit Leather Sandals",
    description: "Adjustable double straps with cushioned cork-latex footbed support.",
    price: 1800, discountPrice: 1400,
    images: ["https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Sandals", gender: "Men", stock: 22, ratings: 4.4, reviewsCount: 12, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    _id: "mock-men-13",
    title: "Minimalist Chronograph Watch",
    description: "Genuine Italian leather band watch with scratch-resistant mineral crystal.",
    price: 7500, discountPrice: 5900,
    images: ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Watches", gender: "Men", stock: 8, ratings: 4.9, reviewsCount: 22, isFeatured: true, isTrending: false, isBestSeller: true, isNewArrival: true
  },
  {
    _id: "mock-men-14",
    title: "Genuine Leather Bifold Wallet",
    description: "Sleek card holder layout, deep cash compartments and built-in RFID shielding.",
    price: 1500, discountPrice: 1250,
    images: ["https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Wallets", gender: "Men", stock: 35, ratings: 4.5, reviewsCount: 9, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: true
  },
  {
    _id: "mock-men-15",
    title: "Full-Grain Leather Dress Belt",
    description: "Handcrafted calfskin leather belt with hand-brushed silver steel buckle.",
    price: 1850, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1624222247344-550fb8ec5b0d?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Belts", gender: "Men", stock: 20, ratings: 4.3, reviewsCount: 5, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    _id: "mock-men-16",
    title: "Retro Round Polarized Sunglasses",
    description: "100% UV400 protective polarized lenses in an amber tortoiseshell frame.",
    price: 2200, discountPrice: 1800,
    images: ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Sunglasses", gender: "Men", stock: 15, ratings: 4.6, reviewsCount: 10, isFeatured: true, isTrending: true, isBestSeller: false, isNewArrival: true
  },
  {
    _id: "mock-men-17",
    title: "Executive Leather Messenger Bag",
    description: "Padded slots for 15-inch laptops, premium hardware locks and adjustable shoulder strap.",
    price: 4500, discountPrice: 3800,
    images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Bags", gender: "Men", stock: 10, ratings: 4.8, reviewsCount: 4, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: false
  },
  {
    _id: "mock-men-18",
    title: "Woodland Oud Premium Cologne",
    description: "Deep fragrance notes of sandalwood, amber and cedarwood with long-lasting projection.",
    price: 5200, discountPrice: 4200,
    images: ["https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Perfume", gender: "Men", stock: 12, ratings: 4.7, reviewsCount: 8, isFeatured: true, isTrending: true, isBestSeller: false, isNewArrival: true
  },
  {
    _id: "mock-men-19",
    title: "Premium Classic Baseball Cap",
    description: "Breathable cotton canvas, adjustable brass clasp, embroidered brand accent logo.",
    price: 950, discountPrice: 750,
    images: ["https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400&q=80"],
    category: "Men", subCategory: "Caps", gender: "Men", stock: 50, ratings: 4.1, reviewsCount: 6, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },

  // --- Women Subcategories (20 Items) ---
  {
    _id: "mock-women-1",
    title: "Midnight Velvet Party Gown",
    description: "Elegant party dress featuring a wrap detail silhouette, dynamic side slit and rich velvet texture.",
    price: 4900, discountPrice: 3950,
    images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Dresses", gender: "Women", stock: 12, ratings: 4.7, reviewsCount: 9, isFeatured: true, isTrending: true, isBestSeller: false, isNewArrival: true
  },
  {
    _id: "mock-women-2",
    title: "Traditional Jamdani Silk Saree",
    description: "Exquisite hand-woven Banarasi style silk Saree with gold-threaded floral borders.",
    price: 8500, discountPrice: 7200,
    images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Sarees", gender: "Women", stock: 5, ratings: 5.0, reviewsCount: 6, isFeatured: true, isTrending: true, isBestSeller: true, isNewArrival: false
  },
  {
    _id: "mock-women-3",
    title: "Embroidered Silk Salwar Kameez",
    description: "Beautiful semi-stitched salwar set with a chiffon dupatta and zardozi work.",
    price: 3600, discountPrice: 2950,
    images: ["https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Salwar Kameez", gender: "Women", stock: 15, ratings: 4.5, reviewsCount: 8, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: true
  },
  {
    _id: "mock-women-4",
    title: "Embroidered Premium Georgette Kurti",
    description: "Intricate hand embroidery work along the neckline, paired with lightweight georgette.",
    price: 2200, discountPrice: 1650,
    images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Kurti", gender: "Women", stock: 30, ratings: 4.2, reviewsCount: 15, isFeatured: false, isTrending: true, isBestSeller: true, isNewArrival: false
  },
  {
    _id: "mock-women-5",
    title: "Floral Ruffle Chiffon Top",
    description: "V-neck lightweight top featuring flared sleeves and an elegant waist tie.",
    price: 1450, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1548624149-f7b2e650d511?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Tops", gender: "Women", stock: 25, ratings: 4.3, reviewsCount: 7, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    _id: "mock-women-6",
    title: "Casual Cotton Printed Tee",
    description: "Soft combed cotton tee featuring a retro typography design.",
    price: 850, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "T-Shirts", gender: "Women", stock: 40, ratings: 4.4, reviewsCount: 5, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    _id: "mock-women-7",
    title: "Oversized Fleece Hoodie",
    description: "Drop shoulder warm fleece hoodie with double lined hoods and pockets.",
    price: 2400, discountPrice: 1950,
    images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Hoodies", gender: "Women", stock: 15, ratings: 4.6, reviewsCount: 10, isFeatured: false, isTrending: true, isBestSeller: false, isNewArrival: true
  },
  {
    _id: "mock-women-8",
    title: "High Waisted Skinny Jeans",
    description: "Super stretch blue denim jeans designed to mold and hug your shape.",
    price: 2600, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Jeans", gender: "Women", stock: 20, ratings: 4.4, reviewsCount: 12, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: false
  },
  {
    _id: "mock-women-9",
    title: "Active Stretch Comfort Leggings",
    description: "Moisture-wicking squat-proof athletic leggings with a high waistband profile.",
    price: 1250, discountPrice: 950,
    images: ["https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Leggings", gender: "Women", stock: 35, ratings: 4.5, reviewsCount: 16, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    _id: "mock-women-10",
    title: "Pleated Chiffon Midi Skirt",
    description: "Flowy, high-waisted pleated midi length skirt with secure lining.",
    price: 1800, discountPrice: 1450,
    images: ["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Skirts", gender: "Women", stock: 18, ratings: 4.2, reviewsCount: 8, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    _id: "mock-women-11",
    title: "Classic Leather Satchel Bag",
    description: "Structured design handbag featuring a double handle profile and gold metal zippers.",
    price: 3900, discountPrice: 3200,
    images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Bags", gender: "Women", stock: 10, ratings: 4.7, reviewsCount: 9, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: false
  },
  {
    _id: "mock-women-12",
    title: "Elegant Designer Handbag",
    description: "Premium saffiano leather shopper handbag with detachable crossbody straps.",
    price: 4800, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Handbags", gender: "Women", stock: 8, ratings: 4.6, reviewsCount: 11, isFeatured: true, isTrending: false, isBestSeller: true, isNewArrival: false
  },
  {
    _id: "mock-women-13",
    title: "Comfort Soft Ballet Flats",
    description: "Classic rounded toe slip-on shoes with padded micro-memory foam insoles.",
    price: 2200, discountPrice: 1850,
    images: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Shoes", gender: "Women", stock: 15, ratings: 4.4, reviewsCount: 13, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    _id: "mock-women-14",
    title: "Stiletto Evening Party Heels",
    description: "Stunning 4-inch heels featuring wrap around ankle straps and rhinestone borders.",
    price: 3500, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Heels", gender: "Women", stock: 12, ratings: 4.8, reviewsCount: 14, isFeatured: false, isTrending: true, isBestSeller: true, isNewArrival: true
  },
  {
    _id: "mock-women-15",
    title: "Classic Silver Hoop Earrings",
    description: "Highly polished 925 sterling silver hoop earrings. Lightweight design.",
    price: 2100, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Jewelry", gender: "Women", stock: 12, ratings: 4.8, reviewsCount: 15, isFeatured: false, isTrending: true, isBestSeller: true, isNewArrival: true
  },
  {
    _id: "mock-women-16",
    title: "Luxury Highlighter Palette",
    description: "4 pigmented shades of baked metallic highlight powders for ultimate glow.",
    price: 1850, discountPrice: 1500,
    images: ["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Cosmetics", gender: "Women", stock: 25, ratings: 4.5, reviewsCount: 8, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    _id: "mock-women-17",
    title: "Matte Lipstick & Gloss Duo",
    description: "Long lasting matte liquid lipstick with a clear hydrating gloss topper.",
    price: 1450, discountPrice: 1100,
    images: ["https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Makeup", gender: "Women", stock: 50, ratings: 4.3, reviewsCount: 18, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    _id: "mock-women-18",
    title: "Organic Hydrating Rose Serum",
    description: "Soothing pure rose extract serum designed for immediate moisture lock and glow.",
    price: 2200, discountPrice: 1800,
    images: ["https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Skincare", gender: "Women", stock: 30, ratings: 4.7, reviewsCount: 22, isFeatured: true, isTrending: true, isBestSeller: false, isNewArrival: true
  },
  {
    _id: "mock-women-19",
    title: "Rose Bouquet Eau de Parfum",
    description: "Fresh floral fragrance featuring turkish rose essence, white musk and vanilla.",
    price: 5800, discountPrice: 4800,
    images: ["https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Perfume", gender: "Women", stock: 10, ratings: 4.9, reviewsCount: 16, isFeatured: true, isTrending: true, isBestSeller: true, isNewArrival: false
  },
  {
    _id: "mock-women-20",
    title: "Cat Eye Oversized Sunglasses",
    description: "Oversized retro cat-eye frames with dark smoke tinted polarized lenses.",
    price: 1850, discountPrice: 1450,
    images: ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=400&q=80"],
    category: "Women", subCategory: "Sunglasses", gender: "Women", stock: 20, ratings: 4.4, reviewsCount: 7, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },

  // --- Accessories Subcategories (8 Items) ---
  {
    _id: "mock-acc-1",
    title: "Classic Mechanical Skeleton Watch",
    description: "Double side skeleton design watch, featuring self-winding automatic motion locks.",
    price: 14500, discountPrice: 11900,
    images: ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=400&q=80"],
    category: "Accessories", subCategory: "Watches", gender: "Accessories", stock: 5, ratings: 4.9, reviewsCount: 10, isFeatured: true, isTrending: false, isBestSeller: true, isNewArrival: true
  },
  {
    _id: "mock-acc-2",
    title: "Active Fit GPS Smart Watch",
    description: "AMOLED screen fitness tracker watch with built-in GPS and active heart rate sensors.",
    price: 12500, discountPrice: 10900,
    images: ["https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=400&q=80"],
    category: "Accessories", subCategory: "Smart Watches", gender: "Accessories", stock: 10, ratings: 4.6, reviewsCount: 8, isFeatured: true, isTrending: true, isBestSeller: true, isNewArrival: true
  },
  {
    _id: "mock-acc-3",
    title: "Minimalist Slim Bifold Wallet",
    description: "RFID blocking, top-grain leather layout holding 6 cards and cash.",
    price: 1550, discountPrice: 1250,
    images: ["https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=400&q=80"],
    category: "Accessories", subCategory: "Wallets", gender: "Accessories", stock: 30, ratings: 4.5, reviewsCount: 8, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: true
  },
  {
    _id: "mock-acc-4",
    title: "Premium Calfskin Leather Belt",
    description: "Genuine calfskin leather belt with an elegant silver-brushed buckle profile.",
    price: 1850, discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1624222247344-550fb8ec5b0d?auto=format&fit=crop&w=400&q=80"],
    category: "Accessories", subCategory: "Belts", gender: "Accessories", stock: 22, ratings: 4.3, reviewsCount: 7, isFeatured: false, isTrending: false, isBestSeller: false, isNewArrival: true
  },
  {
    _id: "mock-acc-5",
    title: "Water-Resistant Commuter Backpack",
    description: "Laptop sleeve up to 16 inches, anti-theft zipper compartments, water repellent.",
    price: 3200, discountPrice: 2600,
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80"],
    category: "Accessories", subCategory: "Backpacks", gender: "Accessories", stock: 45, ratings: 4.4, reviewsCount: 32, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: true
  },
  {
    _id: "mock-acc-6",
    title: "Premium Leather Duffle Travel Bag",
    description: "Spacious interior compartments, shoe pocket, adjustable reinforced carry straps.",
    price: 6500, discountPrice: 5200,
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80"],
    category: "Accessories", subCategory: "Travel Bags", gender: "Accessories", stock: 12, ratings: 4.8, reviewsCount: 15, isFeatured: true, isTrending: false, isBestSeller: true, isNewArrival: true
  },
  {
    _id: "mock-acc-7",
    title: "Gold Plated Link Chain Necklace",
    description: "Classic link chain necklace plated in 18k yellow gold. Durable and elegant.",
    price: 2800, discountPrice: 2200,
    images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&q=80"],
    category: "Accessories", subCategory: "Jewelry", gender: "Accessories", stock: 20, ratings: 4.6, reviewsCount: 10, isFeatured: false, isTrending: true, isBestSeller: false, isNewArrival: true
  },
  {
    _id: "mock-acc-8",
    title: "Magnetic Wireless Charger Stand",
    description: "Fast charger stand compatible with MagSafe devices, stable anti-slip base.",
    price: 1800, discountPrice: 1450,
    images: ["https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=400&q=80"],
    category: "Accessories", subCategory: "Mobile Accessories", gender: "Accessories", stock: 35, ratings: 4.5, reviewsCount: 6, isFeatured: false, isTrending: false, isBestSeller: true, isNewArrival: true
  }
];

const MOCK_REVIEWS = [
  { userName: "Sadman Sakib", rating: 5, comment: "Absolutely brilliant dress. Fits perfectly and material quality is highly premium.", createdAt: new Date().toISOString() },
  { userName: "Farzana Chowdhury", rating: 4, comment: "Very elegant design. Delivered to my home in Chittagong in 2 days.", createdAt: new Date().toISOString() }
];

const MOCK_CATEGORIES = [
  { name: 'Men Shirts', slug: 'men-shirts', parent: 'Men' },
  { name: 'Men Shoes', slug: 'men-shoes', parent: 'Men' },
  { name: 'Women Dresses', slug: 'women-dresses', parent: 'Women' },
  { name: 'Women Kurti', slug: 'women-kurti', parent: 'Women' },
  { name: 'Smart Watches', slug: 'smart-watches', parent: 'Accessories' }
];

// --- API Request Helper ---
const request = async (endpoint, options = {}) => {
  const token = await clovasAuth.getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

// Fallback Wrapper
const requestWithMock = async (endpoint, options = {}, mockCallback) => {
  try {
    return await request(endpoint, options);
  } catch (error) {
    // Catch fetch/network issues and trigger mock fallback
    if (error.name === 'TypeError' || error.message.includes('fetch') || error.message.includes('connect')) {
      console.warn(`[Offline Mode] Server offline on ${endpoint}. Returning simulated offline mockup data.`);
      return mockCallback();
    }
    throw error;
  }
};

const clovasApi = {
  // Authentication Sync & Profiles
  syncUser: () => requestWithMock('/auth/sync', { method: 'POST' }, () => {
    let mockProfile = JSON.parse(localStorage.getItem('mock_user_profile') || 'null');
    if (!mockProfile) {
      mockProfile = {
        name: "Mock User",
        email: "user@clovas.com",
        phone: "+8801712345678",
        role: "user",
        addresses: [
          { _id: "mock-addr-1", street: "House 12, Road 5, Dhanmondi", city: "Dhaka", zip: "1205", country: "Bangladesh" }
        ]
      };
      localStorage.setItem('mock_user_profile', JSON.stringify(mockProfile));
    }
    return mockProfile;
  }),

  updateProfile: (profile) => requestWithMock('/auth/profile', { method: 'PUT', body: profile }, () => {
    const mockProfile = JSON.parse(localStorage.getItem('mock_user_profile'));
    mockProfile.name = profile.name || mockProfile.name;
    mockProfile.phone = profile.phone || mockProfile.phone;
    localStorage.setItem('mock_user_profile', JSON.stringify(mockProfile));
    return mockProfile;
  }),

  addAddress: (address) => requestWithMock('/auth/address', { method: 'POST', body: address }, () => {
    const mockProfile = JSON.parse(localStorage.getItem('mock_user_profile'));
    const newAddr = { ...address, _id: 'mock-addr-' + Date.now() };
    mockProfile.addresses.push(newAddr);
    localStorage.setItem('mock_user_profile', JSON.stringify(mockProfile));
    return mockProfile;
  }),

  deleteAddress: (id) => requestWithMock('/auth/address/${id}', { method: 'DELETE' }, () => {
    const mockProfile = JSON.parse(localStorage.getItem('mock_user_profile'));
    mockProfile.addresses = mockProfile.addresses.filter(a => a._id !== id);
    localStorage.setItem('mock_user_profile', JSON.stringify(mockProfile));
    return mockProfile;
  }),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return requestWithMock(`/products?${query}`, {}, () => {
      let filtered = [...MOCK_PRODUCTS];

      if (params.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(p => 
          (p.sku && p.sku.toLowerCase().includes(s)) ||
          p.title.toLowerCase().includes(s) || 
          p.description.toLowerCase().includes(s)
        );
      }

      if (params.gender && params.gender !== 'All') {
        filtered = filtered.filter(p => p.gender === params.gender);
      }

      if (params.category) {
        filtered = filtered.filter(p => p.category === params.category);
      }

      if (params.subCategory && params.subCategory !== 'All') {
        filtered = filtered.filter(p => p.subCategory === params.subCategory);
      }

      if (params.minPrice) {
        filtered = filtered.filter(p => p.price >= Number(params.minPrice));
      }

      if (params.maxPrice) {
        filtered = filtered.filter(p => p.price <= Number(params.maxPrice));
      }

      return {
        products: filtered,
        page: 1,
        pages: 1,
        total: filtered.length
      };
    });
  },

  getProductHighlights: () => requestWithMock('/products/highlights', {}, () => {
    const featured = MOCK_PRODUCTS.filter(p => p.isFeatured);
    const trending = MOCK_PRODUCTS.filter(p => p.isTrending);
    const bestSellers = MOCK_PRODUCTS.filter(p => p.isBestSeller);
    const newArrivals = MOCK_PRODUCTS.filter(p => p.isNewArrival);
    const flashSale = MOCK_PRODUCTS.filter(p => p.discountPrice > 0);

    return { featured, trending, bestSellers, newArrivals, flashSale };
  }),

  getProductDetails: (id) => requestWithMock(`/products/${id}`, {}, () => {
    const product = MOCK_PRODUCTS.find(p => p._id === id) || MOCK_PRODUCTS[0];
    return { product, reviews: MOCK_REVIEWS };
  }),

  getRelatedProducts: (id) => requestWithMock(`/products/${id}/related`, {}, () => {
    const product = MOCK_PRODUCTS.find(p => p._id === id) || MOCK_PRODUCTS[0];
    return MOCK_PRODUCTS.filter(p => p._id !== product._id && p.category === product.category).slice(0, 4);
  }),

  addProductReview: (id, review) => requestWithMock(`/products/${id}/reviews`, { method: 'POST', body: review }, () => {
    const rev = { userName: "Customer Reviewer", rating: review.rating, comment: review.comment, createdAt: new Date().toISOString() };
    MOCK_REVIEWS.unshift(rev);
    return { message: "Review posted." };
  }),

  // Categories
  getCategories: () => requestWithMock('/categories', {}, () => MOCK_CATEGORIES),

  // Coupons
  validateCoupon: (code, cartAmount) => requestWithMock('/coupons/validate', { method: 'POST', body: { code, cartAmount } }, () => {
    if (code.toUpperCase() === 'SUMMER30') {
      if (cartAmount < 1000) {
        throw new Error('Minimum purchase amount BDT 1000 is required for SUMMER30.');
      }
      return { code: 'SUMMER30', discountType: 'flat', discountValue: 300, discountAmount: 300 };
    }
    throw new Error('Invalid or Expired promo coupon.');
  }),

  createOrder: (order) => requestWithMock('/orders', { method: 'POST', body: order }, () => {
    const mockOrders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
    const sub = order.items.reduce((s, i) => s + (i.price * i.quantity), 0);
    const ship = sub > 5000 ? 0 : 100;
    const totalAmount = Math.max(0, sub + ship - (order.discountAmount || 0));
    const newOrder = {
      ...order,
      _id: 'mock-ord-' + Date.now(),
      transactionId: 'TXN-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000),
      totalAmount,
      createdAt: new Date().toISOString(),
      paymentStatus: order.paymentMethod === 'COD' ? 'Pending' : 'Paid',
      orderStatus: 'Processing'
    };
    mockOrders.push(newOrder);
    localStorage.setItem('mock_orders', JSON.stringify(mockOrders));
    return newOrder;
  }),

  getMyOrders: () => requestWithMock('/orders/myorders', {}, () => {
    return JSON.parse(localStorage.getItem('mock_orders') || '[]');
  }),

  getOrderDetails: (id) => requestWithMock(`/orders/${id}`, {}, () => {
    const mockOrders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
    return mockOrders.find(o => o._id === id) || mockOrders[0];
  }),

  // Payments
  initiatePayment: (orderId) => requestWithMock(`/payments/initiate/${orderId}`, { method: 'POST' }, () => {
    const mockOrders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
    const ord = mockOrders.find(o => o._id === orderId);
    return {
      GatewayPageURL: `dashboard.html?status=success&txnId=${ord ? ord.transactionId : 'TXN-MOCK'}&tab=orders`
    };
  }),

  // Admin APIs
  getAdminAnalytics: () => requestWithMock('/admin/analytics', {}, () => {
    const mockOrders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
    const totalSales = mockOrders.reduce((sum, o) => sum + (o.paymentStatus === 'Paid' ? o.totalAmount : 0), 0);
    return {
      summary: { totalSales, totalOrders: mockOrders.length, totalProducts: MOCK_PRODUCTS.length, totalUsers: 1 },
      salesByCategory: { Men: totalSales },
      recentOrders: mockOrders.slice(0, 5)
    };
  }),
  getAdminUsers: () => requestWithMock('/admin/users', {}, () => []),
  updateUserRole: (userId, role) => requestWithMock(`/admin/users/${userId}/role`, { method: 'PUT', body: { role } }, () => ({})),
  
  // Admin Product Operations
  adminAddProduct: (product) => requestWithMock('/products', { method: 'POST', body: product }, () => {
    const newP = { ...product, _id: 'mock-p-' + Date.now(), ratings: 5, reviewsCount: 0 };
    MOCK_PRODUCTS.push(newP);
    return newP;
  }),
  adminUpdateProduct: (id, product) => requestWithMock(`/products/${id}`, { method: 'PUT', body: product }, () => {
    const pIdx = MOCK_PRODUCTS.findIndex(p => p._id === id);
    if (pIdx > -1) MOCK_PRODUCTS[pIdx] = { ...MOCK_PRODUCTS[pIdx], ...product };
    return MOCK_PRODUCTS[pIdx];
  }),
  adminDeleteProduct: (id) => requestWithMock(`/products/${id}`, { method: 'DELETE' }, () => {
    const pIdx = MOCK_PRODUCTS.findIndex(p => p._id === id);
    if (pIdx > -1) MOCK_PRODUCTS.splice(pIdx, 1);
    return { message: "Product deleted." };
  }),
  adminUploadImage: async (formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/upload`, {
        method: 'POST',
        body: formData
      });
      return await response.json();
    } catch (e) {
      console.warn('[Offline Mode] Image upload fallback utilized.');
      return { url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80" };
    }
  },

  // Admin Category Operations
  adminAddCategory: (category) => request('/categories', { method: 'POST', body: category }),
  adminDeleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Admin Coupon Operations
  adminGetCoupons: () => requestWithMock('/coupons', {}, () => []),
  adminAddCoupon: (coupon) => request('/coupons', { method: 'POST', body: coupon }),
  adminDeleteCoupon: (id) => request(`/coupons/${id}`, { method: 'DELETE' }),

  // Admin Order Operations
  adminGetOrders: () => requestWithMock('/orders', {}, () => {
    return JSON.parse(localStorage.getItem('mock_orders') || '[]');
  }),
  adminUpdateOrderStatus: (id, statusData) => requestWithMock(`/orders/${id}/status`, { method: 'PUT', body: statusData }, () => {
    const mockOrders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
    const oIdx = mockOrders.findIndex(o => o._id === id);
    if (oIdx > -1) {
      mockOrders[oIdx].orderStatus = statusData.orderStatus || mockOrders[oIdx].orderStatus;
      mockOrders[oIdx].paymentStatus = statusData.paymentStatus || mockOrders[oIdx].paymentStatus;
      localStorage.setItem('mock_orders', JSON.stringify(mockOrders));
    }
    return mockOrders[oIdx];
  }),

  // Notification Operations
  getNotifications: () => requestWithMock('/notifications', {}, () => {
    return JSON.parse(localStorage.getItem('mock_notifications') || JSON.stringify([
      {
        _id: "mock-notif-welcome",
        title: "Welcome to Clovas Shopping!",
        message: "Use BDT 300 flat discounts using coupon: SUMMER30",
        type: "account",
        read: false,
        createdAt: new Date().toISOString()
      },
      {
        _id: "mock-notif-sandbox",
        title: "Offline Sandbox Active",
        message: "Test fully interactive checkouts and admin dashboard offline.",
        type: "promo",
        read: false,
        createdAt: new Date().toISOString()
      }
    ]));
  }),
  markNotificationsAsRead: () => requestWithMock('/notifications/mark-read', { method: 'POST' }, () => {
    const mock = JSON.parse(localStorage.getItem('mock_notifications') || '[]');
    mock.forEach(n => n.read = true);
    localStorage.setItem('mock_notifications', JSON.stringify(mock));
    return { message: 'All notifications marked as read' };
  }),

  // Config Settings Operations
  getConfig: () => requestWithMock('/config', {}, () => {
    return JSON.parse(localStorage.getItem('mock_config') || JSON.stringify({
      flashSaleEnabled: true,
      flashSaleEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      flashSaleDiscountText: "Upto 50% Off",
      shippingFeeStandard: 60,
      shippingFeeOutside: 120,
      freeShippingThreshold: 2000,
      supportPhone: "+880 1700-000000",
      supportEmail: "support@clovas.com",
      facebookUrl: "https://facebook.com/clovas",
      instagramUrl: "https://instagram.com/clovas"
    }));
  }),
  updateConfig: (settings) => requestWithMock('/config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(settings)
  }, () => {
    const current = JSON.parse(localStorage.getItem('mock_config') || JSON.stringify({
      flashSaleEnabled: true,
      flashSaleEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      flashSaleDiscountText: "Upto 50% Off",
      shippingFeeStandard: 60,
      shippingFeeOutside: 120,
      freeShippingThreshold: 2000,
      supportPhone: "+880 1700-000000",
      supportEmail: "support@clovas.com",
      facebookUrl: "https://facebook.com/clovas",
      instagramUrl: "https://instagram.com/clovas"
    }));
    const updated = { ...current, ...settings };
    localStorage.setItem('mock_config', JSON.stringify(updated));
    return updated;
  }),

  checkSkuAvailability: (sku, excludeId) => requestWithMock('/products/check-sku?sku=' + encodeURIComponent(sku) + (excludeId ? '&excludeId=' + excludeId : ''), {}, () => {
    const products = JSON.parse(localStorage.getItem('mock_products') || '[]');
    const upperSku = sku.trim().toUpperCase();
    const exists = products.find(p => p.sku === upperSku && p._id !== excludeId);
    return { available: !exists };
  }),

  adminGetUsers: () => requestWithMock('/admin/users', {}, () => {
    // Generate some mock users if running completely client-side in sandbox
    const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
    if (mockUsers.length === 0) {
      const initialUsers = [
        { _id: 'mock-u-1', name: 'Clovas Super Admin', email: 'clovas.verify@gmail.com', role: 'admin', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
        { _id: 'mock-u-2', name: 'Shariar Ahamed', email: 'shariar@clovas.com', role: 'user', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { _id: 'mock-u-3', name: 'Tahmid Hasan', email: 'tahmid.h@gmail.com', role: 'user', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
      ];
      localStorage.setItem('mock_users', JSON.stringify(initialUsers));
      return initialUsers;
    }
    return mockUsers;
  }),

  adminUpdateUserRole: (id, role) => requestWithMock('/admin/users/' + id + '/role', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role })
  }, () => {
    const mockUsers = JSON.parse(localStorage.getItem('mock_users') || '[]');
    const user = mockUsers.find(u => u._id === id);
    if (user) {
      user.role = role;
      localStorage.setItem('mock_users', JSON.stringify(mockUsers));
    }
    return { message: 'User role updated successfully', user };
  }),
};

window.clovasApi = clovasApi;
export default clovasApi;
