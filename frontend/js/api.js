import clovasAuth from './firebase-config.js';

const API_BASE_URL = 'http://localhost:5000/api';

// --- Extensive Offline Mock Database ---
const MOCK_PRODUCTS = [
  {
    _id: "mock-p1",
    title: "Premium Classic Linen Shirt",
    description: "Elevate your everyday wardrobe with our Premium Classic Linen Shirt. Tailored from 100% organic European flax, it offers supreme breathability, a relaxed structure, and timeless elegance.",
    price: 2450,
    discountPrice: 1950,
    images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80"],
    category: "Men",
    subCategory: "Shirts",
    gender: "Men",
    stock: 25,
    ratings: 4.8,
    reviewsCount: 12,
    isFeatured: true,
    isTrending: true,
    isBestSeller: true,
    isNewArrival: false
  },
  {
    _id: "mock-p2",
    title: "Urban Comfort Retro Sneakers",
    description: "Designed for daily exploration, these sneakers pair a vintage leather upper with a dynamic cushioned sole. Extremely lightweight and durable.",
    price: 3800,
    discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80"],
    category: "Men",
    subCategory: "Shoes",
    gender: "Men",
    stock: 14,
    ratings: 4.5,
    reviewsCount: 4,
    isFeatured: false,
    isTrending: true,
    isBestSeller: false,
    isNewArrival: true
  },
  {
    _id: "mock-p3",
    title: "Minimalist Chronograph Leather Watch",
    description: "A stunning watch featuring a genuine Italian leather strap, a scratch-resistant sapphire crystal glass, and Japanese quartz movement.",
    price: 7500,
    discountPrice: 5900,
    images: ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80"],
    category: "Men",
    subCategory: "Watches",
    gender: "Men",
    stock: 8,
    ratings: 4.9,
    reviewsCount: 22,
    isFeatured: true,
    isTrending: false,
    isBestSeller: true,
    isNewArrival: true
  },
  {
    _id: "mock-p4",
    title: "Midnight Velvet Party Gown",
    description: "Make an unforgettable entrance with this stunning velvet gown. Features a flattering silhouette, dynamic wrap detail, and side slit.",
    price: 4900,
    discountPrice: 3950,
    images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80"],
    category: "Women",
    subCategory: "Dresses",
    gender: "Women",
    stock: 12,
    ratings: 4.7,
    reviewsCount: 9,
    isFeatured: true,
    isTrending: true,
    isBestSeller: false,
    isNewArrival: true
  },
  {
    _id: "mock-p5",
    title: "Embroidered Premium Georgette Kurti",
    description: "Add a splash of ethnic charm to your wardrobe. Intricate hand-embroidery along the neckline and cuffs, paired with lightweight, premium georgette fabric.",
    price: 2200,
    discountPrice: 1650,
    images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"],
    category: "Women",
    subCategory: "Kurti",
    gender: "Women",
    stock: 30,
    ratings: 4.2,
    reviewsCount: 15,
    isFeatured: false,
    isTrending: true,
    isBestSeller: true,
    isNewArrival: false
  },
  {
    _id: "mock-p6",
    title: "Active Fit GPS Smart Watch",
    description: "An advanced health and fitness tracker with built-in GPS, active heart rate tracking, Sleep score analysis, and a vibrant AMOLED touch screen.",
    price: 12500,
    discountPrice: 10900,
    images: ["https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80"],
    category: "Accessories",
    subCategory: "Smart Watches",
    gender: "Accessories",
    stock: 10,
    ratings: 4.6,
    reviewsCount: 8,
    isFeatured: true,
    isTrending: true,
    isBestSeller: true,
    isNewArrival: true
  },
  {
    _id: "mock-p7",
    title: "Water-Resistant Commuter Backpack",
    description: "Designed for daily city commutes, this backpack features dedicated padded sleeves for up to a 16-inch laptop, a hidden anti-theft back pocket, and waterproof materials.",
    price: 3200,
    discountPrice: 2600,
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80"],
    category: "Accessories",
    subCategory: "Backpacks",
    gender: "Accessories",
    stock: 45,
    ratings: 4.4,
    reviewsCount: 32,
    isFeatured: false,
    isTrending: false,
    isBestSeller: true,
    isNewArrival: true
  },
  {
    _id: "mock-p8",
    title: "Premium Calfskin Leather Belt",
    description: "Handcrafted from full-grain calfskin leather, this belt features an elegant silver-brushed buckle. Designed to elevate both formal trousers and casual denim.",
    price: 1850,
    discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1624222247344-550fb8ec5b0d?auto=format&fit=crop&w=800&q=80"],
    category: "Accessories",
    subCategory: "Belts",
    gender: "Accessories",
    stock: 22,
    ratings: 4.3,
    reviewsCount: 7,
    isFeatured: false,
    isTrending: false,
    isBestSeller: false,
    isNewArrival: true
  },
  {
    _id: "mock-p9",
    title: "Minimalist Graphic Tee",
    description: "Elevate your streetwear look. Heavyweight 100% cotton crewneck featuring a custom screenprinted graphic detail on the back. Breathable, relaxed streetwear silhouette.",
    price: 1200,
    discountPrice: 950,
    images: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80"],
    category: "Men",
    subCategory: "T-Shirts",
    gender: "Men",
    stock: 40,
    ratings: 4.6,
    reviewsCount: 11,
    isFeatured: false,
    isTrending: true,
    isBestSeller: false,
    isNewArrival: true
  },
  {
    _id: "mock-p10",
    title: "Classic Pique Polo Shirt",
    description: "A preppy style essential. Structured pique knit collar, double-button placket, and ribbed cuffs. Comfortable organic cotton blend with slight stretch.",
    price: 1650,
    discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80"],
    category: "Men",
    subCategory: "Polo Shirts",
    gender: "Men",
    stock: 18,
    ratings: 4.4,
    reviewsCount: 9,
    isFeatured: false,
    isTrending: false,
    isBestSeller: true,
    isNewArrival: false
  },
  {
    _id: "mock-p11",
    title: "Cozy Fleece Pullover Hoodie",
    description: "Wrap yourself in warmth. Premium brushed cotton fleece lining, double-lined hood with adjustable drawstrings, and a spacious front kangaroo pocket.",
    price: 2600,
    discountPrice: 2200,
    images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80"],
    category: "Men",
    subCategory: "Hoodies",
    gender: "Men",
    stock: 25,
    ratings: 4.7,
    reviewsCount: 14,
    isFeatured: true,
    isTrending: true,
    isBestSeller: false,
    isNewArrival: true
  },
  {
    _id: "mock-p12",
    title: "Traditional Jamdani Silk Saree",
    description: "Celebrate heritage and ethnicity. Exquisitely hand-woven silk Jamdani saree with gold-threaded floral motifs. Perfect for traditional celebrations.",
    price: 8500,
    discountPrice: 7200,
    images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"],
    category: "Women",
    subCategory: "Sarees",
    gender: "Women",
    stock: 5,
    ratings: 5.0,
    reviewsCount: 6,
    isFeatured: true,
    isTrending: true,
    isBestSeller: true,
    isNewArrival: false
  },
  {
    _id: "mock-p13",
    title: "Matte Lipstick & Gloss Duo",
    description: "Achieve the perfect pout. Long-lasting matte liquid lipstick paired with a matching high-shine hydrating gloss topper. Infused with vitamin E.",
    price: 1450,
    discountPrice: 1100,
    images: ["https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80"],
    category: "Women",
    subCategory: "Makeup",
    gender: "Women",
    stock: 50,
    ratings: 4.3,
    reviewsCount: 18,
    isFeatured: false,
    isTrending: false,
    isBestSeller: false,
    isNewArrival: true
  },
  {
    _id: "mock-p14",
    title: "Classic Silver Hoop Earrings",
    description: "An elegant essential. Made from certified 925 sterling silver with a high-polished finish. Lightweight, hypoallergenic, and timeless.",
    price: 2100,
    discountPrice: 0,
    images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80"],
    category: "Women",
    subCategory: "Jewelry",
    gender: "Women",
    stock: 12,
    ratings: 4.8,
    reviewsCount: 15,
    isFeatured: false,
    isTrending: true,
    isBestSeller: true,
    isNewArrival: true
  },
  {
    _id: "mock-p15",
    title: "Minimalist Slim Bifold Wallet",
    description: "Keep your pocket thin. Hand-crafted from top-grain leather. Features 6 card slots, a cash compartment, and RFID blocking shields.",
    price: 1550,
    discountPrice: 1250,
    images: ["https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80"],
    category: "Accessories",
    subCategory: "Wallets",
    gender: "Accessories",
    stock: 30,
    ratings: 4.5,
    reviewsCount: 8,
    isFeatured: false,
    isTrending: false,
    isBestSeller: true,
    isNewArrival: true
  },
  {
    _id: "mock-p16",
    title: "Retro Round Polarized Sunglasses",
    description: "Shield your eyes in style. Polarized composite lenses with 100% UV400 protection. Classic tortoiseshell acetate frame with gold alloy accents.",
    price: 2200,
    discountPrice: 1800,
    images: ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80"],
    category: "Men",
    subCategory: "Sunglasses",
    gender: "Men",
    stock: 20,
    ratings: 4.6,
    reviewsCount: 10,
    isFeatured: true,
    isTrending: true,
    isBestSeller: false,
    isNewArrival: true
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
        filtered = filtered.filter(p => p.title.toLowerCase().includes(s) || p.description.toLowerCase().includes(s));
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

  // Orders
  createOrder: (order) => requestWithMock('/orders', { method: 'POST', body: order }, () => {
    const mockOrders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
    const newOrder = {
      ...order,
      _id: 'mock-ord-' + Date.now(),
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
      GatewayPageURL: `dashboard.html?status=success&txnId=${ord ? ord.transactionId : 'TXN-MOCK'}`
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
    // Standalone upload fails if offline, fallback to a local preview image link
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
};

window.clovasApi = clovasApi;
export default clovasApi;
