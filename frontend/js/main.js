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
  toast.className = `px-6 py-4 rounded-xl shadow-xl glass transform translate-y-2 opacity-0 transition-all duration-300 flex items-center gap-3 border-l-4 ${
    type === 'success' ? 'border-emerald-500 text-emerald-800 dark:text-emerald-200' : 'border-red-500 text-red-800 dark:text-red-200'
  }`;
  
  toast.innerHTML = `
    <span class="font-medium">${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);
  
  // Remove after 3s
  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
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
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

const initTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// --- Dynamic Header & Footer Injection ---
const injectHeaderAndFooter = async () => {
  const headerPlaceholder = document.getElementById('header-placeholder');
  const footerPlaceholder = document.getElementById('footer-placeholder');

  const user = await clovasAuth.getCurrentUser();
  const isAdmin = user && user.email && user.email.includes('admin');

  if (headerPlaceholder) {
    headerPlaceholder.innerHTML = `
      <header class="sticky top-0 z-40 w-full glass shadow-sm transition-all duration-300">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-20">
            <!-- Logo -->
            <div class="flex-shrink-0 flex items-center">
              <a href="index.html" class="flex items-center gap-2 group">
                <span class="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary-600 to-emerald-500 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-105 transition-transform">C</span>
                <span class="font-serif text-2xl font-bold tracking-wide text-slate-800 dark:text-white">Clovas<span class="text-emerald-500 font-sans font-normal text-sm block -mt-1 tracking-widest">SHOPPING</span></span>
              </a>
            </div>
            
            <!-- Desktop Nav Items -->
            <nav class="hidden md:flex space-x-8 text-sm font-medium">
              <a href="index.html" class="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-white transition-colors nav-link-underline">Home</a>
              <a href="shop.html?gender=Men" class="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-white transition-colors nav-link-underline">Men</a>
              <a href="shop.html?gender=Women" class="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-white transition-colors nav-link-underline">Women</a>
              <a href="shop.html?gender=Accessories" class="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-white transition-colors nav-link-underline">Accessories</a>
              <a href="shop.html" class="text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-white transition-colors nav-link-underline">Shop All</a>
            </nav>

            <!-- Actions -->
            <div class="flex items-center gap-4">
              <!-- Dark Mode Switcher -->
              <button id="dark-mode-btn" class="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <!-- Sun Icon -->
                <svg class="h-5 w-5 hidden dark:block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707m2.828 9.9a5 5 0 111.59 0z"/></svg>
                <!-- Moon Icon -->
                <svg class="h-5 w-5 dark:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
              </button>

              <!-- Search Toggle (Directs to shop) -->
              <a href="shop.html" class="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:block">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </a>

              <!-- Wishlist -->
              <a href="dashboard.html?tab=wishlist" class="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                <span class="wishlist-count-badge absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900" style="display:none">0</span>
              </a>

              <!-- Cart -->
              <a href="cart.html" class="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                <span class="cart-count-badge absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900" style="display:none">0</span>
              </a>

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
      <footer class="bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 py-16 transition-colors">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
            <!-- Brand -->
            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-2">
                <span class="h-8 w-8 rounded-lg bg-gradient-to-tr from-primary-600 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">C</span>
                <span class="font-serif text-xl font-bold tracking-wide text-slate-800 dark:text-white">Clovas Shopping</span>
              </div>
              <p class="text-sm text-slate-500 dark:text-slate-400 font-sans leading-relaxed">Premium Fashion • Trusted Shopping • Fast Delivery. Delivering premium clothing, shoes, and luxury accessories directly to your door.</p>
              <div class="flex gap-4 mt-2">
                <!-- Social Icons -->
                <a href="#" class="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-500 flex items-center justify-center text-slate-500 dark:text-slate-450 hover:text-primary-500 transition-all"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg></a>
                <a href="#" class="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-500 flex items-center justify-center text-slate-500 dark:text-slate-450 hover:text-primary-500 transition-all"><svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
              </div>
            </div>

            <!-- Categories Links -->
            <div>
              <h4 class="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider mb-4">Shop Categories</h4>
              <ul class="space-y-2.5 text-sm">
                <li><a href="shop.html?gender=Men" class="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-white transition-colors">Men's Wear</a></li>
                <li><a href="shop.html?gender=Women" class="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-white transition-colors">Women's Premium</a></li>
                <li><a href="shop.html?gender=Accessories" class="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-white transition-colors">Fashion Accessories</a></li>
                <li><a href="shop.html" class="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-white transition-colors">New Arrivals</a></li>
              </ul>
            </div>

            <!-- Useful Links -->
            <div>
              <h4 class="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider mb-4">Customer Care</h4>
              <ul class="space-y-2.5 text-sm">
                <li><a href="dashboard.html" class="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-white transition-colors">Track Order</a></li>
                <li><a href="cart.html" class="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-white transition-colors">Shopping Cart</a></li>
                <li><a href="faq.html" class="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-white transition-colors">FAQ & Support</a></li>
                <li><a href="about.html" class="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-white transition-colors">About Our Story</a></li>
                <li><a href="contact.html" class="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-white transition-colors">Contact Support</a></li>
              </ul>
            </div>

            <!-- Newsletter -->
            <div class="flex flex-col gap-4">
              <h4 class="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider mb-4">Stay Connected</h4>
              <p class="text-sm text-slate-500 dark:text-slate-400">Subscribe to receive exclusive deals, flash sale alerts, and fashion updates.</p>
              <div class="flex gap-2">
                <input type="email" placeholder="Your Email" class="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors">
                <button class="px-4 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-white transition-all shadow-md">Join</button>
              </div>
            </div>
          </div>
          
          <div class="mt-12 pt-8 border-t border-slate-150 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-sans">
            <p>&copy; 2026 Clovas Shopping. All rights reserved.</p>
            <p>Designed with premium standards for high performance.</p>
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

// Global Initialization
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  injectHeaderAndFooter();
});
