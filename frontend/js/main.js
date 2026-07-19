import clovasAuth from './firebase-config.js';
import clovasApi from './api.js';

// --- Cart Operations ---
const cartKey = 'clovas_cart';

export const getCart = () => {
  return JSON.parse(localStorage.getItem(cartKey) || '[]');
};

export const saveCart = (cart) => {
  localStorage.setItem(cartKey, JSON.stringify(cart));
  updateCartBadge();
};

export const addToCart = (product, quantity = 1) => {
  const cart = getCart();
  const existingItem = cart.find(item => item.product === product._id);
  
  const price = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      product: product._id,
      title: product.title,
      image: product.images[0],
      price: price,
      quantity: quantity,
      stock: product.stock
    });
  }
  
  saveCart(cart);
  showToast(`${product.title} added to cart!`);
};

export const updateCartQuantity = (productId, quantity) => {
  let cart = getCart();
  const item = cart.find(item => item.product === productId);
  if (item) {
    item.quantity = Math.max(1, quantity);
    saveCart(cart);
  }
};

export const removeFromCart = (productId) => {
  let cart = getCart();
  cart = cart.filter(item => item.product !== productId);
  saveCart(cart);
  showToast('Item removed from cart.');
};

export const clearCart = () => {
  localStorage.removeItem(cartKey);
  updateCartBadge();
};

export const getCartTotal = () => {
  return getCart().reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

export const getCartCount = () => {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
};

// --- Wishlist Operations ---
const wishlistKey = 'clovas_wishlist';

export const getWishlist = () => {
  return JSON.parse(localStorage.getItem(wishlistKey) || '[]');
};

export const toggleWishlist = (product) => {
  let wishlist = getWishlist();
  const exists = wishlist.some(item => item._id === product._id);
  
  if (exists) {
    wishlist = wishlist.filter(item => item._id !== product._id);
    showToast('Removed from wishlist.');
  } else {
    wishlist.push(product);
    showToast('Added to wishlist!');
  }
  
  localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
  updateWishlistBadge();
  return !exists;
};

// --- Toast & UI Helpers ---
export const showToast = (message, type = 'success') => {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  
  toast.className = `px-5 py-3.5 rounded-2xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-150/80 dark:border-slate-800/80 transform translate-y-2 opacity-0 transition-all duration-300 flex items-center gap-3 max-w-sm`;
  
  const icon = type === 'success' 
    ? `<div class="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
         <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
       </div>`
    : `<div class="p-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center">
         <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
       </div>`;

  toast.innerHTML = `
    ${icon}
    <span class="font-sans text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);
  
  // Remove after 3.2s
  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
};

const createToastContainer = () => {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm';
  document.body.appendChild(container);
  return container;
};

const updateCartBadge = () => {
  const badges = document.querySelectorAll('.cart-count-badge');
  const count = getCartCount();
  badges.forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  });
};

const updateWishlistBadge = () => {
  const badges = document.querySelectorAll('.wishlist-count-badge');
  const count = getWishlist().length;
  badges.forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  });
};

// --- Theme Switcher ---
export const toggleDarkMode = () => {
  // Locked to Light Mode by Admin directive.
  return;
};

const initTheme = () => {
  // Force light mode by default and disable dark styling class
  document.documentElement.classList.remove('dark');
  localStorage.setItem('theme', 'light');
};

// --- Dynamic Header & Footer Injection ---
const injectHeaderAndFooter = async () => {
  const headerPlaceholder = document.getElementById('header-placeholder');
  const footerPlaceholder = document.getElementById('footer-placeholder');

  const user = await clovasAuth.getCurrentUser();
  const isAdmin = user && user.email && user.email.includes('admin');

  if (headerPlaceholder) {
    headerPlaceholder.innerHTML = `
      <header class="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-150/80 dark:border-slate-850/80 shadow-[0_2px_15px_rgba(0,0,0,0.015)] transition-all duration-300">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-20 gap-4">
            <!-- Left: Logo -->
            <div class="flex-shrink-0 flex items-center">
              <a href="index.html" class="flex items-center group">
                <img src="assets/logo.png" alt="Clovas Shopping" class="h-8 w-auto object-contain rounded-md group-hover:scale-105 transition-transform">
              </a>
            </div>
            
            <!-- Center: Navigation Menu -->
            <nav class="hidden md:flex items-center justify-center space-x-8 text-sm font-semibold flex-grow">
              <a href="index.html" class="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-white transition-colors nav-link-underline">Home</a>
              <a href="shop.html?gender=Men" class="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-white transition-colors nav-link-underline">Men</a>
              <a href="shop.html?gender=Women" class="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-white transition-colors nav-link-underline">Women</a>
              <a href="shop.html?gender=Accessories" class="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-white transition-colors nav-link-underline">Accessories</a>
              <a href="shop.html" class="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-white transition-colors nav-link-underline">Shop All</a>
            </nav>
 
            <!-- Right: Search Bar & Actions -->
            <div class="flex items-center gap-3">
              <!-- Compact Search input box -->
              <div class="hidden lg:flex items-center relative w-44 xl:w-52 mr-1">
                <input type="text" id="header-search-input" placeholder="Search outfits..." class="w-full pl-3.5 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all font-sans">
                <button id="header-search-btn" class="absolute right-2.5 top-2 text-slate-400 hover:text-emerald-600 transition-colors">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </button>
              </div>

               <!-- Dark Mode Switcher (Locked) -->
               <button id="dark-mode-btn" class="p-2 rounded-xl text-slate-400 cursor-not-allowed hover:bg-transparent transition-colors" disabled title="Theme switching is currently locked to Light Mode.">
                 <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
               </button>
 
              <!-- Wishlist -->
              <a href="dashboard.html?tab=wishlist" class="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                <span class="wishlist-count-badge absolute -top-0.5 -right-0.5 h-4.5 w-4.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900" style="display:none">0</span>
              </a>
 
              <!-- Cart -->
              <a href="cart.html" class="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                <span class="cart-count-badge absolute -top-0.5 -right-0.5 h-4.5 w-4.5 rounded-full bg-primary-600 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900" style="display:none">0</span>
              </a>
 
              <!-- Notification Bell Dropdown -->
              <div class="relative inline-block text-left" id="notification-dropdown-wrapper">
                <button id="notification-bell-btn" class="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                  <span id="notif-ping" class="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                  <span id="notif-dot" class="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
                </button>
                <div id="notification-dropdown-menu" class="hidden absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-4 transition-all duration-300">
                  <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40 pb-2 mb-3">
                    <span class="font-serif text-sm font-bold text-slate-800 dark:text-white">Notifications</span>
                    <button id="clear-notifications-btn" class="text-[10px] text-primary-500 hover:underline">Mark read</button>
                  </div>
                  <div class="space-y-3 max-h-60 overflow-y-auto font-sans" id="notification-list-items">
                    <div class="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors text-[11px] flex gap-2">
                      <span class="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5"></span>
                      <div>
                        <p class="text-slate-800 dark:text-white font-medium">Welcome to Clovas Shopping!</p>
                        <span class="text-[9px] text-slate-400 block mt-0.5">Use BDT 300 flat discounts using coupon: SUMMER30</span>
                      </div>
                    </div>
                    <div class="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors text-[11px] flex gap-2">
                      <span class="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5"></span>
                      <div>
                        <p class="text-slate-800 dark:text-white font-medium">Offline Sandbox Active</p>
                        <span class="text-[9px] text-slate-400 block mt-0.5">Test fully interactive checkouts and admin dashboard offline.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Divider -->
              <div class="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

              <!-- Auth/Profile Button -->
              <div class="flex items-center gap-2">
                ${user ? `
                  <a href="dashboard.html" class="flex items-center gap-2 hover:opacity-85 transition-opacity">
                    <div class="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-350 border border-slate-300 dark:border-slate-700">
                      ${(user.displayName || user.email || 'U').substring(0, 1).toUpperCase()}
                    </div>
                  </a>
                  ${isAdmin ? `
                    <a href="admin/index.html" class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-medium text-xs border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-colors">Admin</a>
                  ` : ''}
                  <button id="logout-btn" class="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:block">
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                  </button>
                ` : `
                  <a href="auth.html" class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-tr from-primary-600 to-primary-500 rounded-xl hover:from-primary-700 hover:to-primary-600 shadow-md transition-all pulse-glow">Sign In</a>
                `}
              </div>
            </div>
          </div>
        </div>
      </header>
    `;

    // Wire up events
    document.getElementById('dark-mode-btn').addEventListener('click', toggleDarkMode);
    
    // Notification Toggle
    const bellBtn = document.getElementById('notification-bell-btn');
    const menuEl = document.getElementById('notification-dropdown-menu');
    const markReadBtn = document.getElementById('clear-notifications-btn');
    const pingEl = document.getElementById('notif-ping');
    const dotEl = document.getElementById('notif-dot');

    if (bellBtn && menuEl) {
      bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuEl.classList.toggle('hidden');
      });

      document.addEventListener('click', (e) => {
        if (menuEl && !menuEl.contains(e.target) && e.target !== bellBtn) {
          menuEl.classList.add('hidden');
        }
      });
    }

    if (markReadBtn) {
      markReadBtn.addEventListener('click', () => {
        if (pingEl) pingEl.style.display = 'none';
        if (dotEl) dotEl.style.display = 'none';
        const list = document.getElementById('notification-list-items');
        if (list) {
          list.innerHTML = `<div class="text-[10px] text-center text-slate-400 py-4">No new notifications.</div>`;
        }
      });
    }

    // Global Header Search bindings
    const headerSearchInput = document.getElementById('header-search-input');
    const headerSearchBtn = document.getElementById('header-search-btn');

    const runGlobalSearch = () => {
      const query = headerSearchInput.value.trim();
      if (query) {
        window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
      }
    };

    if (headerSearchInput) {
      headerSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          runGlobalSearch();
        }
      });
    }
    if (headerSearchBtn) {
      headerSearchBtn.addEventListener('click', runGlobalSearch);
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await clovasAuth.logout();
        showToast('Logged out successfully.');
        setTimeout(() => window.location.href = 'index.html', 1000);
      });
    }
  }

  if (footerPlaceholder) {
    footerPlaceholder.innerHTML = `
      <footer class="premium-footer-bg text-slate-550 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 py-16 transition-colors font-sans">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <!-- Trust Badges Header -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-8 pb-12 mb-12 border-b border-slate-200 dark:border-slate-800">
            <div class="flex items-center gap-4 bg-white/70 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-150/60 dark:border-slate-800/40 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
              <div class="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 flex items-center justify-center flex-shrink-0">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              </div>
              <div>
                <h5 class="text-sm font-semibold text-slate-850 dark:text-white">100% Original Outfits</h5>
                <p class="text-xs text-slate-500 mt-0.5">Sourced from certified ateliers.</p>
              </div>
            </div>
            <div class="flex items-center gap-4 bg-white/70 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-150/60 dark:border-slate-800/40 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
              <div class="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 flex items-center justify-center flex-shrink-0">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div>
                <h5 class="text-sm font-semibold text-slate-850 dark:text-white">Fast Delivery Nationwide</h5>
                <p class="text-xs text-slate-500 mt-0.5">Secure shipping across Bangladesh.</p>
              </div>
            </div>
            <div class="flex items-center gap-4 bg-white/70 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-150/60 dark:border-slate-800/40 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
              <div class="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 flex items-center justify-center flex-shrink-0">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div>
                <h5 class="text-sm font-semibold text-slate-850 dark:text-white">Secure SSL Payments</h5>
                <p class="text-xs text-slate-500 mt-0.5">Fully encrypted SSLCommerz gateway.</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <!-- Brand -->
            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-2">
                <img src="assets/logo.png" alt="C" class="h-6 w-auto object-contain rounded-md">
                <span class="font-serif text-xl font-bold tracking-wide text-slate-855 dark:text-white">Clovas Shopping</span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">Premium Fashion • Trusted Shopping • Fast Delivery. Delivering premium clothing, shoes, and luxury accessories directly to your door.</p>
              <div class="flex gap-3 mt-2">
                <!-- Social Icons -->
                <a href="#" class="h-9 w-9 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 flex items-center justify-center text-slate-500 hover:text-emerald-500 shadow-sm transition-all duration-300"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg></a>
                <a href="#" class="h-9 w-9 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 flex items-center justify-center text-slate-500 hover:text-emerald-500 shadow-sm transition-all duration-300"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
              </div>
            </div>
 
            <!-- Categories Links -->
            <div>
              <h4 class="text-xs font-bold text-slate-805 dark:text-white uppercase tracking-wider mb-4">Shop Categories</h4>
              <ul class="space-y-2.5 text-xs">
                <li><a href="shop.html?gender=Men" class="text-slate-500 hover:text-emerald-600 transition-all hover:translate-x-1 duration-300 block transform">&rarr; Men's Wear</a></li>
                <li><a href="shop.html?gender=Women" class="text-slate-500 hover:text-emerald-600 transition-all hover:translate-x-1 duration-300 block transform">&rarr; Women's Premium</a></li>
                <li><a href="shop.html?gender=Accessories" class="text-slate-500 hover:text-emerald-600 transition-all hover:translate-x-1 duration-300 block transform">&rarr; Fashion Accessories</a></li>
                <li><a href="shop.html" class="text-slate-500 hover:text-emerald-600 transition-all hover:translate-x-1 duration-300 block transform">&rarr; New Arrivals</a></li>
              </ul>
            </div>
 
            <!-- Useful Links -->
            <div>
              <h4 class="text-xs font-bold text-slate-805 dark:text-white uppercase tracking-wider mb-4">Customer Care</h4>
              <ul class="space-y-2.5 text-xs">
                <li><a href="dashboard.html" class="text-slate-505 hover:text-emerald-600 transition-all hover:translate-x-1 duration-300 block transform">&rarr; Track Order</a></li>
                <li><a href="cart.html" class="text-slate-505 hover:text-emerald-600 transition-all hover:translate-x-1 duration-300 block transform">&rarr; Shopping Cart</a></li>
                <li><a href="faq.html" class="text-slate-505 hover:text-emerald-600 transition-all hover:translate-x-1 duration-300 block transform">&rarr; FAQ & Support</a></li>
                <li><a href="about.html" class="text-slate-505 hover:text-emerald-600 transition-all hover:translate-x-1 duration-300 block transform">&rarr; About Our Story</a></li>
                <li><a href="contact.html" class="text-slate-505 hover:text-emerald-600 transition-all hover:translate-x-1 duration-300 block transform">&rarr; Contact Support</a></li>
              </ul>
            </div>
 
            <!-- Newsletter -->
            <div class="flex flex-col gap-4">
              <h4 class="text-xs font-bold text-slate-805 dark:text-white uppercase tracking-wider mb-4">Stay Connected</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">Subscribe to receive exclusive deals, flash sale alerts, and fashion updates.</p>
              <div class="flex gap-2">
                <input type="email" placeholder="Your Email" class="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors">
                <button class="px-4 py-2.5 bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white text-xs font-semibold rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-md">Join</button>
              </div>
            </div>
          </div>
          
          <div class="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 font-sans">
            <p>&copy; 2026 Clovas Shopping. All rights reserved.</p>
            <div class="flex gap-4">
              <a href="privacy.html" class="hover:text-emerald-600 transition-colors">Privacy Policy</a>
              <span>&bull;</span>
              <a href="terms.html" class="hover:text-emerald-600 transition-colors">Terms & Conditions</a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  // Update badges
  updateCartBadge();
  updateWishlistBadge();

  // If there's a login syncing check, do it once
  if (user) {
    try {
      // Sync auth status with database silently
      await clovasApi.syncUser();
    } catch (e) {
      console.warn('Silent MDB user sync failed:', e.message);
    }
  }
};

// --- Scroll Reveal Animations ---
const initScrollReveal = () => {
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px', // triggers slightly before entering viewport fully
    threshold: 0.05
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('scroll-reveal-active');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const observeAll = () => {
    // Target common product cards, promo banners, lookbooks, filters, and dashboard cards
    const targets = document.querySelectorAll(
      '.scroll-reveal-left, .scroll-reveal-bottom, .scroll-reveal-right, ' +
      '.product-card, .featured-card, .promo-banner, .gender-lookbook-card, ' +
      '#panel-profile > div, #panel-orders > div, #wishlist-grid > div, ' +
      '.category-card, #filters-container, #shop-products-grid > div'
    );
    targets.forEach(item => {
      if (!item.classList.contains('scroll-reveal-item')) {
        item.classList.add('scroll-reveal-item');
      }
      observer.observe(item);
    });
  };

  // Run on initial static load
  observeAll();

  // Watch for dynamic DOM insertions (like fetched API products, orders list, wishlist items)
  const mainEl = document.querySelector('main') || document.body;
  const mutationObserver = new MutationObserver(() => {
    observeAll();
  });
  
  mutationObserver.observe(mainEl, { childList: true, subtree: true });
};

// Global Initialization
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  injectHeaderAndFooter();
  initScrollReveal();
});
