import clovasApi from './api.js';
import clovasAuth from './firebase-config.js';
import { showToast, showConfirm } from './main.js';

// Global instances to track dashboard charts
let salesTrendChartInstance = null;
let categoryShareChartInstance = null;

// --- Shared Admin Access Verifier ---
const verifyAdminAccess = async () => {
  const cachedUser = clovasAuth.getCachedUser();
  if (cachedUser) {
    const isCachedAdmin = (cachedUser.email && (cachedUser.email.includes('admin') || cachedUser.email === 'clovas.verify@gmail.com')) || cachedUser.role === 'admin';
    if (isCachedAdmin) {
      clovasAuth.getCurrentUser().then(realUser => {
        if (!realUser) {
          showToast('Session expired.', 'error');
          window.location.href = '../auth.html';
        } else {
          const isRealAdmin = (realUser.email && (realUser.email.includes('admin') || realUser.email === 'clovas.verify@gmail.com')) || realUser.role === 'admin';
          if (!isRealAdmin) {
            showToast('Unauthorized access.', 'error');
            window.location.href = '../dashboard.html';
          }
        }
      });
      return cachedUser;
    }
  }

  const user = await clovasAuth.getCurrentUser();
  if (!user) {
    showToast('Authentication required.', 'error');
    window.location.href = '../auth.html';
    return null;
  }
  
  const isAdmin = (user.email && (user.email.includes('admin') || user.email === 'clovas.verify@gmail.com')) || user.role === 'admin';
  if (!isAdmin) {
    showToast('Unauthorized access. Admin only.', 'error');
    window.location.href = '../dashboard.html';
    return null;
  }
  return user;
};

// --- SPA Loader & Router Shell ---
export const initAdminSPA = async () => {
  // Setup submenus immediately so they are responsive on page load
  setupSidebarSubmenus();

  const user = await verifyAdminAccess();
  if (!user) return;

  // Route hashchange listener
  window.addEventListener('hashchange', handleHashRouting);
  
  // Load initial view
  handleHashRouting();
};

// Collapsible sub-menu click triggers & mobile autohide
const setupSidebarSubmenus = () => {
  document.querySelectorAll('.submenu-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const container = e.currentTarget.closest('.submenu-container');
      const list = container.querySelector('.submenu-list');
      const chevron = container.querySelector('.chevron-icon');
      
      const isOpen = !list.classList.contains('hidden');
      if (isOpen) {
        list.classList.add('hidden');
        chevron.classList.remove('rotate-180');
      } else {
        list.classList.remove('hidden');
        chevron.classList.add('rotate-180');
      }
    });
  });

  // Autoclose mobile sidebar on link clicks
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const aside = document.querySelector('aside');
      const backdrop = document.getElementById('sidebar-backdrop');
      if (aside && window.innerWidth < 768) {
        aside.classList.add('-translate-x-full');
        if (backdrop) backdrop.classList.add('hidden');
      }
    });
  });
};

// Active link highlighting & parent group auto-expand
const highlightActiveSidebar = (hash) => {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('bg-primary-600', 'text-white', 'font-semibold', 'shadow-md');
    // For sidebar links that are not in a submenu, revert to standard slate classes
    if (!link.classList.contains('text-[11px]')) {
      link.classList.add('text-slate-350', 'hover:bg-slate-800', 'hover:text-white');
    } else {
      link.classList.remove('text-white', 'font-bold');
      link.classList.add('text-slate-400', 'hover:text-white');
    }
  });

  const activeLink = document.querySelector(`.nav-link[href="${hash}"]`);
  if (activeLink) {
    if (!activeLink.classList.contains('text-[11px]')) {
      activeLink.classList.remove('text-slate-350', 'hover:bg-slate-800', 'hover:text-white');
      activeLink.classList.add('bg-primary-600', 'text-white', 'font-semibold', 'shadow-md');
    } else {
      activeLink.classList.remove('text-slate-400');
      activeLink.classList.add('text-white', 'font-bold');
    }

    const parentSubmenu = activeLink.closest('.submenu-list');
    if (parentSubmenu) {
      parentSubmenu.classList.remove('hidden');
      const parentChevron = parentSubmenu.previousElementSibling.querySelector('.chevron-icon');
      if (parentChevron) parentChevron.classList.add('rotate-180');
    }
  }
};

// Dynamic View Swapper
const handleHashRouting = () => {
  const hash = window.location.hash || '#/dashboard';
  const viewport = document.getElementById('main-content-viewport');
  if (!viewport) return;

  highlightActiveSidebar(hash);
  viewport.innerHTML = ''; // Clear

  if (hash === '#/dashboard') {
    renderDashboardView(viewport);
  } else if (hash === '#/dashboard/visitor-analytics') {
    renderVisitorAnalyticsView(viewport);
  } else if (hash === '#/products/all') {
    fetchPageTemplate('products.html', viewport, initProductsPanel);
  } else if (hash === '#/products/categories') {
    renderCategoriesView(viewport);
  } else if (hash === '#/products/brands') {
    renderBrandsView(viewport);
  } else if (hash === '#/products/variants') {
    renderVariantsView(viewport);
  } else if (hash === '#/products/reviews') {
    renderReviewsGalleryView(viewport);
  } else if (hash.startsWith('#/orders')) {
    fetchPageTemplate('orders.html', viewport, () => {
      initOrdersPanel(hash);
    });
  } else if (hash === '#/customers') {
    fetchPageTemplate('shoppers.html', viewport, initShoppersPanel);
  } else if (hash === '#/customers/loyalty') {
    renderLoyaltyPointsView(viewport);
  } else if (hash === '#/coupons') {
    fetchPageTemplate('coupons.html', viewport, initCouponsPanel);
  } else if (hash === '#/coupons/flash-sales') {
    renderFlashSalesView(viewport);
  } else if (hash === '#/coupons/banners') {
    renderPromoBannersView(viewport);
  } else if (hash.startsWith('#/inventory')) {
    renderInventoryView(viewport, hash);
  } else if (hash.startsWith('#/shipping')) {
    renderShippingView(viewport, hash);
  } else if (hash.startsWith('#/payment')) {
    renderPaymentView(viewport, hash);
  } else if (hash.startsWith('#/reviews')) {
    renderReviewsApprovalView(viewport, hash);
  } else if (hash.startsWith('#/reports')) {
    renderReportsAnalyticsView(viewport, hash);
  } else if (hash.startsWith('#/marketing')) {
    renderMarketingView(viewport, hash);
  } else if (hash.startsWith('#/cms')) {
    renderCMSView(viewport, hash);
  } else if (hash.startsWith('#/staff')) {
    renderStaffManagementView(viewport, hash);
  } else if (hash === '#/notifications') {
    renderNotificationsView(viewport);
  } else if (hash.startsWith('#/support')) {
    renderSupportView(viewport, hash);
  } else if (hash === '#/settings') {
    fetchPageTemplate('settings.html', viewport, initSettingsView);
  } else if (hash === '#/settings/shipping') {
    renderShippingSettingsView(viewport);
  } else if (hash.startsWith('#/security')) {
    renderSecurityView(viewport, hash);
  } else if (hash.startsWith('#/multi')) {
    renderMultiFeaturesView(viewport, hash);
  } else {
    window.location.hash = '#/dashboard';
  }
};

// Helper to fetch and extract templates from static files
const fetchPageTemplate = (filename, targetEl, initCallback) => {
  targetEl.innerHTML = `<div class="p-8 text-center text-slate-500 animate-pulse">Loading view...</div>`;
  
  fetch(filename)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.text();
    })
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const mainEl = doc.querySelector('main');
      if (!mainEl) {
        targetEl.innerHTML = `<div class="p-8 text-center text-red-500">View container main tag not found.</div>`;
        return;
      }
      
      const mainContent = mainEl.innerHTML;
      const modals = Array.from(doc.body.children)
        .filter(child => child.tagName !== 'SCRIPT' && child.tagName !== 'ASIDE' && child.tagName !== 'MAIN')
        .map(child => child.outerHTML)
        .join('');
      
      targetEl.innerHTML = mainContent + modals;

      if (initCallback) initCallback();
    })
    .catch(err => {
      targetEl.innerHTML = `<div class="p-8 text-center text-red-500">Failed to load view: ${err.message}</div>`;
      console.error(err);
    });
};

const renderPlaceholderView = (viewport, title, desc) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">${title}</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Status: Coming Soon / Under Development</p>
    </header>
    <div class="glass p-8 rounded-3xl border border-slate-100 dark:border-slate-855 text-center max-w-lg mx-auto mt-12">
      <div class="h-16 w-16 bg-primary-500/10 text-primary-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">⚡</div>
      <h3 class="font-serif text-lg font-bold mb-2">${title} Module</h3>
      <p class="text-xs text-slate-500 dark:text-slate-400">${desc}</p>
    </div>
  `;
};

// --- Panel 1: Analytics Overview (Dashboard) ---
const DASHBOARD_HTML = `
  <header class="flex justify-between items-center pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
    <div>
      <h1 class="font-serif text-2xl md:text-3xl font-bold">Analytics Overview</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time statistics on orders, sales revenue, and stock count</p>
    </div>
  </header>

  <!-- Stats Cards Grid -->
  <section class="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-10">
    <a href="#/orders/all" class="glass p-6 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex items-center justify-between gap-4 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer">
      <div>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sales BDT</p>
        <h2 class="text-2xl font-extrabold mt-1" id="stat-sales"><span class="inline-block h-6 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse"></span></h2>
      </div>
      <span class="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg></span>
    </a>

    <a href="#/orders/all" class="glass p-6 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex items-center justify-between gap-4 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer">
      <div>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
        <h2 class="text-2xl font-extrabold mt-1" id="stat-orders"><span class="inline-block h-6 w-12 rounded bg-slate-200 dark:bg-slate-800 animate-pulse"></span></h2>
      </div>
      <span class="h-12 w-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-550"><svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg></span>
    </a>

    <a href="#/products/all" class="glass p-6 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex items-center justify-between gap-4 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer">
      <div>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Products</p>
        <h2 class="text-2xl font-extrabold mt-1" id="stat-products"><span class="inline-block h-6 w-12 rounded bg-slate-200 dark:bg-slate-800 animate-pulse"></span></h2>
      </div>
      <span class="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-550"><svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg></span>
    </a>

    <a href="#/customers" class="glass p-6 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex items-center justify-between gap-4 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 cursor-pointer">
      <div>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Shoppers</p>
        <h2 class="text-2xl font-extrabold mt-1" id="stat-users"><span class="inline-block h-6 w-12 rounded bg-slate-200 dark:bg-slate-800 animate-pulse"></span></h2>
      </div>
      <span class="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-550"><svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg></span>
    </a>
  </section>

  <!-- Analytics Charts Grid -->
  <section class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
    <div class="lg:col-span-2 glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40 bg-white dark:bg-slate-900/50">
      <h3 class="font-serif text-lg font-bold border-b border-slate-150 dark:border-slate-800 pb-3 mb-5">Sales Revenue Trend (Last 7 Days)</h3>
      <div class="h-80 w-full relative">
        <canvas id="salesTrendChart"></canvas>
      </div>
    </div>

    <div class="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40 bg-white dark:bg-slate-900/50">
      <h3 class="font-serif text-lg font-bold border-b border-slate-150 dark:border-slate-800 pb-3 mb-5">Sales by Category</h3>
      <div class="h-80 w-full relative flex items-center justify-center">
        <canvas id="categoryShareChart" class="max-h-72"></canvas>
      </div>
    </div>
  </section>

  <!-- Detailed Section -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <section class="lg:col-span-2 glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40">
      <h3 class="font-serif text-lg font-bold border-b border-slate-150 dark:border-slate-800 pb-3 mb-5">Recent Placed Orders</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs font-medium">
          <thead>
            <tr class="text-slate-400 uppercase tracking-wider border-b border-slate-150 dark:border-slate-850">
              <th class="pb-3">Recipient</th>
              <th class="pb-3">Transaction</th>
              <th class="pb-3">Date</th>
              <th class="pb-3">Total Amount</th>
              <th class="pb-3">Status</th>
            </tr>
          </thead>
          <tbody id="recent-orders-rows">
            <!-- Loader -->
          </tbody>
        </table>
      </div>
    </section>

    <section class="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40">
      <h3 class="font-serif text-lg font-bold border-b border-slate-150 dark:border-slate-800 pb-3 mb-5">Sales by Main Category</h3>
      <div class="space-y-4" id="category-breakdown-list">
        <!-- Loader -->
      </div>
    </section>
  </div>
`;

const renderDashboardView = (viewport) => {
  viewport.innerHTML = DASHBOARD_HTML;

  const statSales = document.getElementById('stat-sales');
  const statOrders = document.getElementById('stat-orders');
  const statProducts = document.getElementById('stat-products');
  const statUsers = document.getElementById('stat-users');
  const recentOrdersRows = document.getElementById('recent-orders-rows');
  const categoryBreakdownList = document.getElementById('category-breakdown-list');

  recentOrdersRows.innerHTML = Array(4).fill(0).map(() => `
    <tr class="border-b border-slate-100 dark:border-slate-850 animate-pulse">
      <td class="py-4"><div class="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
      <td class="py-4"><div class="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
      <td class="py-4"><div class="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
      <td class="py-4"><div class="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
      <td class="py-4"><div class="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div></td>
    </tr>
  `).join('');

  categoryBreakdownList.innerHTML = Array(3).fill(0).map(() => `
    <div class="space-y-1.5 animate-pulse">
      <div class="flex justify-between">
        <div class="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div class="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
      </div>
      <div class="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full"></div>
    </div>
  `).join('');

  clovasApi.getAdminAnalytics()
    .then(data => {
      statSales.textContent = `${data.summary.totalSales.toLocaleString()} BDT`;
      statOrders.textContent = data.summary.totalOrders;
      statProducts.textContent = data.summary.totalProducts;
      statUsers.textContent = data.summary.totalUsers;

      recentOrdersRows.innerHTML = '';
      if (data.recentOrders.length === 0) {
        recentOrdersRows.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-slate-500">No orders found.</td></tr>';
      } else {
        data.recentOrders.forEach(order => {
          const tr = document.createElement('tr');
          tr.className = 'border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors';
          tr.innerHTML = `
            <td class="py-4 font-bold">${order.shippingAddress.name}</td>
            <td class="py-4 text-slate-400 font-bold">${order.transactionId}</td>
            <td class="py-4 text-slate-500">${new Date(order.createdAt).toLocaleDateString()}</td>
            <td class="py-4 font-bold text-slate-800 dark:text-white">${order.totalAmount} BDT</td>
            <td class="py-4">
              <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                order.orderStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }">${order.orderStatus}</span>
            </td>
          `;
          recentOrdersRows.appendChild(tr);
        });
      }

      categoryBreakdownList.innerHTML = '';
      const breakdownKeys = Object.keys(data.salesByCategory || {});
      if (breakdownKeys.length === 0) {
        categoryBreakdownList.innerHTML = '<p class="text-xs text-slate-500 italic">No category sales recorded yet.</p>';
      } else {
        breakdownKeys.forEach(cat => {
          const amount = data.salesByCategory[cat];
          const div = document.createElement('div');
          div.className = 'text-xs font-semibold';
          div.innerHTML = `
            <div class="flex justify-between items-center text-slate-700 dark:text-slate-300 mb-1">
              <span>${cat}</span>
              <span>${amount.toLocaleString()} BDT</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div class="bg-primary-600 h-full rounded-full" style="width: 100%"></div>
            </div>
          `;
          categoryBreakdownList.appendChild(div);
        });
      }

      if (typeof Chart !== 'undefined') {
        const trendCanvas = document.getElementById('salesTrendChart');
        if (trendCanvas) {
          const ctxTrend = trendCanvas.getContext('2d');
          if (salesTrendChartInstance) {
            salesTrendChartInstance.destroy();
          }
          
          const trendLabels = (data.dailySales || []).map(item => {
            const d = new Date(item.date);
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          });
          const trendData = (data.dailySales || []).map(item => item.sales);

          const gradient = ctxTrend.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.00)');

          salesTrendChartInstance = new Chart(ctxTrend, {
            type: 'line',
            data: {
              labels: trendLabels,
              datasets: [{
                label: 'Sales (BDT)',
                data: trendData,
                borderColor: '#2563eb',
                borderWidth: 3,
                backgroundColor: gradient,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#2563eb',
                pointHoverRadius: 6,
                pointRadius: 4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                y: {
                  grid: { color: 'rgba(226, 232, 240, 0.1)' },
                  ticks: { font: { family: 'Poppins', size: 10 } }
                },
                x: {
                  grid: { display: false },
                  ticks: { font: { family: 'Poppins', size: 10 } }
                }
              }
            }
          });
        }

        const shareCanvas = document.getElementById('categoryShareChart');
        if (shareCanvas) {
          const ctxShare = shareCanvas.getContext('2d');
          if (categoryShareChartInstance) {
            categoryShareChartInstance.destroy();
          }

          const categoryLabels = Object.keys(data.salesByCategory || {});
          const categoryData = Object.values(data.salesByCategory || {});

          categoryShareChartInstance = new Chart(ctxShare, {
            type: 'doughnut',
            data: {
              labels: categoryLabels,
              datasets: [{
                data: categoryData,
                backgroundColor: [
                  '#3b82f6',
                  '#10b981',
                  '#8b5cf6',
                  '#f59e0b'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    boxWidth: 12,
                    font: { family: 'Poppins', size: 10 }
                  }
                }
              },
              cutout: '65%'
            }
          });
        }
      }
    })
    .catch(err => {
      console.error(err);
      showToast('Error loading stats: ' + err.message, 'error');
    });
};

// --- Panel 2: Products Catalog (Manage Products) ---
const initProductsPanel = () => {
  const rowsContainer = document.getElementById('admin-products-rows');
  const searchInput = document.getElementById('admin-product-search');
  const totalCountEl = document.getElementById('admin-products-count');

  const modal = document.getElementById('product-modal');
  const modalTitle = document.getElementById('modal-title');
  const closeBtn = document.getElementById('close-modal-btn');
  const openBtn = document.getElementById('open-add-modal-btn');
  const form = document.getElementById('product-form');

  const formId = document.getElementById('form-product-id');
  const formSku = document.getElementById('form-sku');
  const skuValidationMsg = document.getElementById('sku-validation-msg');
  const saveBtn = document.getElementById('save-product-btn');
  const formTitle = document.getElementById('form-title');
  const formDesc = document.getElementById('form-desc');
  const formPrice = document.getElementById('form-price');
  const formDiscountPrice = document.getElementById('form-discount-price');
  const formStock = document.getElementById('form-stock');
  const formGender = document.getElementById('form-gender');
  const formCategory = document.getElementById('form-category');
  const formSubcategory = document.getElementById('form-subcategory');
  
  const formFeatured = document.getElementById('form-featured');
  const formTrending = document.getElementById('form-trending');
  const formBestseller = document.getElementById('form-bestseller');
  const formNewArrival = document.getElementById('form-newarrival');

  const formImageUrl = document.getElementById('form-image-url');
  const formImageFile = document.getElementById('form-image-file');
  const uploadStatusMsg = document.getElementById('upload-status-msg');

  const loadAdminProducts = (queryText = '') => {
    rowsContainer.innerHTML = `
      <tr class="border-b border-slate-100 dark:border-slate-850 animate-pulse">
        <td class="p-4 pl-6 flex items-center gap-3">
          <div class="h-10 w-9 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
          <div class="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </td>
        <td class="p-4"><div class="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
        <td class="p-4"><div class="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
        <td class="p-4"><div class="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
        <td class="p-4"><div class="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
        <td class="p-4 pr-6 text-right space-x-2"><div class="inline-block h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div></td>
      </tr>
    `.repeat(4);
    
    clovasApi.getProducts({ search: queryText, limit: 100 })
      .then(data => {
        const products = data.products || [];
        totalCountEl.textContent = products.length;
        rowsContainer.innerHTML = '';

        if (products.length === 0) {
          rowsContainer.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-slate-500">No items matching criteria.</td></tr>';
          return;
        }

        products.forEach(prod => {
          const tr = document.createElement('tr');
          tr.className = 'border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs font-semibold transition-colors';
          tr.innerHTML = `
            <td class="p-4 pl-6 flex items-center gap-3">
              <img src="${prod.images[0]}" class="h-10 w-9 rounded-lg object-cover bg-slate-100">
              <span class="font-bold font-serif text-sm">${prod.title}</span>
            </td>
            <td class="p-4 text-slate-555 font-mono font-bold">${prod.sku || '-'}</td>
            <td class="p-4 text-slate-500">${prod.gender} / ${prod.category}</td>
            <td class="p-4">${prod.price} BDT</td>
            <td class="p-4">${prod.stock}</td>
            <td class="p-4 pr-6 text-right space-x-2">
              <button class="edit-btn px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px]" data-id="${prod._id}">Edit</button>
              <button class="del-btn px-2.5 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-[10px]" data-id="${prod._id}">Delete</button>
            </td>
          `;

          tr.querySelector('.edit-btn').addEventListener('click', () => {
            formId.value = prod._id;
            formSku.value = prod.sku || '';
            formSku.readOnly = true;
            skuValidationMsg.textContent = '';
            
            formTitle.value = prod.title;
            formDesc.value = prod.description;
            formPrice.value = prod.price;
            formDiscountPrice.value = prod.discountPrice || '';
            formStock.value = prod.stock;
            formGender.value = prod.gender;
            formCategory.value = prod.category;
            formSubcategory.value = prod.subcategory || '';
            
            formFeatured.checked = prod.featured || false;
            formTrending.checked = prod.trending || false;
            formBestseller.checked = prod.bestseller || false;
            formNewArrival.checked = prod.newArrival || false;
            
            formImageUrl.value = prod.images.join(', ');
            formImageFile.value = '';
            uploadStatusMsg.textContent = '';

            modalTitle.textContent = 'Edit Product Details';
            saveBtn.textContent = 'Save Changes';
            modal.classList.remove('hidden');
          });

          tr.querySelector('.del-btn').addEventListener('click', () => {
            showConfirm(`Are you sure you want to delete "${prod.title}"?`, async () => {
              try {
                await clovasApi.adminDeleteProduct(prod._id);
                showToast('Product successfully removed from catalog.');
                loadAdminProducts(searchInput.value.trim());
              } catch (err) {
                showToast(err.message, 'error');
              }
            });
          });

          rowsContainer.appendChild(tr);
        });
      });
  };

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      form.reset();
      formId.value = '';
      formSku.readOnly = false;
      skuValidationMsg.textContent = '';
      uploadStatusMsg.textContent = '';
      modalTitle.textContent = 'Add New Product';
      saveBtn.textContent = 'Add Product';
      modal.classList.remove('hidden');
    });
  }

  const hideModal = () => modal.classList.add('hidden');
  if (closeBtn) closeBtn.addEventListener('click', hideModal);

  if (formSku) {
    formSku.addEventListener('input', async (e) => {
      const sku = e.target.value.trim().toUpperCase();
      if (!sku || formId.value) {
        skuValidationMsg.textContent = '';
        return;
      }
      try {
        const isTaken = await clovasApi.checkSkuAvailability(sku);
        if (isTaken) {
          skuValidationMsg.textContent = '⚠️ This SKU code is already taken.';
          skuValidationMsg.className = 'text-[10px] font-bold text-red-500 mt-1';
        } else {
          skuValidationMsg.textContent = '✓ SKU code is available.';
          skuValidationMsg.className = 'text-[10px] font-bold text-emerald-500 mt-1';
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  if (formImageFile) {
    formImageFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      uploadStatusMsg.textContent = 'Uploading asset...';
      uploadStatusMsg.className = 'text-[10px] font-bold text-primary-600 mt-1 animate-pulse';

      try {
        const result = await clovasApi.uploadImage(file);
        if (result && result.url) {
          const currentUrls = formImageUrl.value.trim();
          formImageUrl.value = currentUrls ? `${currentUrls}, ${result.url}` : result.url;
          uploadStatusMsg.textContent = '✓ Upload complete!';
          uploadStatusMsg.className = 'text-[10px] font-bold text-emerald-600 mt-1';
        }
      } catch (err) {
        uploadStatusMsg.textContent = '❌ Upload failed: ' + err.message;
        uploadStatusMsg.className = 'text-[10px] font-bold text-red-600 mt-1';
      }
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = formId.value;
      const imagesList = formImageUrl.value.split(',').map(url => url.trim()).filter(Boolean);

      const productData = {
        sku: formSku.value.trim().toUpperCase(),
        title: formTitle.value.trim(),
        description: formDesc.value.trim(),
        price: Number(formPrice.value),
        discountPrice: formDiscountPrice.value ? Number(formDiscountPrice.value) : undefined,
        stock: Number(formStock.value),
        gender: formGender.value,
        category: formCategory.value,
        subcategory: formSubcategory.value.trim(),
        featured: formFeatured.checked,
        trending: formTrending.checked,
        bestseller: formBestseller.checked,
        newArrival: formNewArrival.checked,
        images: imagesList
      };

      try {
        if (id) {
          await clovasApi.adminUpdateProduct(id, productData);
          showToast('Product details updated successfully!');
        } else {
          await clovasApi.adminAddProduct(productData);
          showToast('New product added to catalog.');
        }
        hideModal();
        loadAdminProducts(searchInput.value.trim());
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      loadAdminProducts(e.target.value.trim());
    });
  }

  loadAdminProducts();
};

// --- Panel 3: Orders List (Manage Orders) ---
const initOrdersPanel = (hash) => {
  const contentContainer = document.getElementById('orders-content-container');
  if (!contentContainer) return;

  let allOrders = [];

  const loadAdminOrders = () => {
    contentContainer.innerHTML = `
      <div class="p-8 text-center text-slate-500 animate-pulse">
        <div class="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded mx-auto mb-4"></div>
        <div class="h-4 w-64 bg-slate-150 dark:bg-slate-800/80 rounded mx-auto"></div>
      </div>
    `;

    clovasApi.adminGetOrders()
      .then(orders => {
        let filteredOrders = orders;
        if (hash === '#/orders/pending') {
          filteredOrders = orders.filter(o => o.paymentStatus === 'Pending');
        } else if (hash === '#/orders/processing') {
          filteredOrders = orders.filter(o => o.orderStatus === 'Processing');
        } else if (hash === '#/orders/shipped') {
          filteredOrders = orders.filter(o => o.orderStatus === 'Shipped');
        } else if (hash === '#/orders/delivered') {
          filteredOrders = orders.filter(o => o.orderStatus === 'Delivered');
        }

        allOrders = filteredOrders;
        renderCustomerListView();
      })
      .catch(err => {
        contentContainer.innerHTML = `<div class="p-8 text-center text-red-500">Error loading orders: ${err.message}</div>`;
      });
  };

  const renderCustomerListView = () => {
    const customerGroups = {};

    allOrders.forEach(order => {
      const userId = order.user ? (order.user._id || order.user) : order.shippingAddress.name;
      if (!customerGroups[userId]) {
        customerGroups[userId] = {
          id: userId,
          name: order.shippingAddress.name,
          email: order.user ? order.user.email : 'Guest User',
          phone: order.shippingAddress.phone || 'N/A',
          orders: [],
          totalSpent: 0
        };
      }
      customerGroups[userId].orders.push(order);
      customerGroups[userId].totalSpent += order.totalAmount;
    });

    const groupsArray = Object.values(customerGroups);

    if (groupsArray.length === 0) {
      contentContainer.innerHTML = '<div class="p-8 text-center text-slate-500 font-semibold">No orders recorded under this status.</div>';
      return;
    }

    let tbodyContent = '';
    groupsArray.forEach(group => {
      tbodyContent += `
        <tr class="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs font-semibold transition-colors">
          <td class="p-4 pl-6 font-bold text-slate-800 dark:text-white">${group.name}</td>
          <td class="p-4 text-slate-500">${group.email}</td>
          <td class="p-4 text-slate-500">${group.phone}</td>
          <td class="p-4 text-center text-slate-700 dark:text-slate-300 font-bold">${group.orders.length}</td>
          <td class="p-4 text-center font-bold text-slate-800 dark:text-white">${group.totalSpent} BDT</td>
          <td class="p-4 pr-6 text-right">
            <button class="view-customer-orders-btn px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[10px] font-bold shadow transition-colors" data-id="${group.id}">
              View Orders
            </button>
          </td>
        </tr>
      `;
    });

    contentContainer.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs font-medium border-collapse">
          <thead>
            <tr class="bg-slate-100 dark:bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-850">
              <th class="p-4 pl-6">Customer Profile</th>
              <th class="p-4">Email</th>
              <th class="p-4">Contact Phone</th>
              <th class="p-4 text-center">Orders Count</th>
              <th class="p-4 text-center">Total Spent</th>
              <th class="p-4 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-850">
            ${tbodyContent}
          </tbody>
        </table>
      </div>
    `;

    contentContainer.querySelectorAll('.view-customer-orders-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        renderCustomerOrdersDetailView(customerGroups[id]);
      });
    });
  };

  const renderCustomerOrdersDetailView = (group) => {
    let tbodyContent = '';
    group.orders.forEach(order => {
      const dateStr = new Date(order.createdAt).toLocaleDateString();
      tbodyContent += `
        <tr class="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs font-semibold transition-colors" data-order-id="${order._id}">
          <td class="p-4 pl-6 font-bold text-slate-400">${order.transactionId}</td>
          <td class="p-4 text-slate-500">${dateStr}</td>
          <td class="p-4 text-slate-550 max-w-xs truncate">${order.items.map(i => `${i.title} x${i.quantity}`).join(', ')}</td>
          <td class="p-4 font-bold text-slate-800 dark:text-white">${order.totalAmount} BDT</td>
          <td class="p-4">
            <select class="pay-select px-2.5 py-1 text-[10px] rounded border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 font-bold focus:outline-none">
              <option value="Pending" ${order.paymentStatus === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Paid" ${order.paymentStatus === 'Paid' ? 'selected' : ''}>Paid</option>
              <option value="Failed" ${order.paymentStatus === 'Failed' ? 'selected' : ''}>Failed</option>
              <option value="Cancelled" ${order.paymentStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td class="p-4">
            <select class="del-select px-2.5 py-1 text-[10px] rounded border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 font-bold focus:outline-none">
              <option value="Processing" ${order.orderStatus === 'Processing' ? 'selected' : ''}>Processing</option>
              <option value="Shipped" ${order.orderStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
              <option value="Delivered" ${order.orderStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
              <option value="Cancelled" ${order.orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td class="p-4 pr-6 text-right">
            <button class="save-status-btn px-2.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[10px]" data-id="${order._id}">Update</button>
          </td>
        </tr>
      `;
    });

    contentContainer.innerHTML = `
      <div class="p-6 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/60">
        <div>
          <h3 class="font-serif text-base font-bold text-slate-800 dark:text-white">${group.name}</h3>
          <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Email: ${group.email} | Phone: ${group.phone}</p>
        </div>
        <button id="back-to-customers-btn" class="px-4 py-2 bg-slate-200 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors">
          ← Back to Customers
        </button>
      </div>
      <div class="overflow-x-auto min-h-[350px]">
        <table class="w-full text-left text-xs font-medium border-collapse">
          <thead>
            <tr class="bg-slate-100 dark:bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-850">
              <th class="p-4 pl-6">Txn ID</th>
              <th class="p-4">Date</th>
              <th class="p-4">Items Summary</th>
              <th class="p-4">Total Amount</th>
              <th class="p-4">Payment</th>
              <th class="p-4">Delivery Status</th>
              <th class="p-4 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-850">
            ${tbodyContent}
          </tbody>
        </table>
      </div>
    `;

    if (window.initCustomSelects) {
      window.initCustomSelects();
    }

    const backBtn = document.getElementById('back-to-customers-btn');
    if (backBtn) {
      backBtn.addEventListener('click', renderCustomerListView);
    }

    contentContainer.querySelectorAll('.save-status-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const actionBtn = e.currentTarget;
        const orderId = actionBtn.getAttribute('data-id');
        const tr = contentContainer.querySelector(`tr[data-order-id="${orderId}"]`);
        if (!tr) return;

        actionBtn.disabled = true;
        actionBtn.textContent = 'Saving...';

        const payStatus = tr.querySelector('.pay-select').value;
        const delStatus = tr.querySelector('.del-select').value;

        try {
          const updated = await clovasApi.adminUpdateOrderStatus(orderId, {
            paymentStatus: payStatus,
            orderStatus: delStatus
          });
          showToast(`Order status updated successfully!`);
          
          const foundOrder = allOrders.find(o => o._id === orderId);
          if (foundOrder) {
            foundOrder.paymentStatus = updated.paymentStatus;
            foundOrder.orderStatus = updated.orderStatus;
          }
          
          actionBtn.disabled = false;
          actionBtn.textContent = 'Update';
        } catch (err) {
          showToast(err.message, 'error');
          actionBtn.disabled = false;
          actionBtn.textContent = 'Update';
        }
      });
    });
  };

  loadAdminOrders();
};

// --- Panel 4: Registered Customers (Shoppers) ---
const initShoppersPanel = () => {
  const rowsContainer = document.getElementById('admin-shoppers-rows');
  const searchInput = document.getElementById('admin-shopper-search');
  const totalCountEl = document.getElementById('admin-shoppers-count');

  let allUsers = [];

  const loadShoppers = () => {
    rowsContainer.innerHTML = `
      <tr class="border-b border-slate-100 dark:border-slate-850 animate-pulse">
        <td class="p-4 pl-6"><div class="h-4 w-6 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
        <td class="p-4 flex items-center gap-3">
          <div class="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800"></div>
          <div class="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </td>
        <td class="p-4"><div class="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
        <td class="p-4"><div class="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
        <td class="p-4"><div class="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div></td>
        <td class="p-4 pr-6 text-right"><div class="inline-block h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div></td>
      </tr>
    `.repeat(4);

    clovasApi.adminGetUsers()
      .then(users => {
        allUsers = [...users].sort((a, b) => {
          if (a.role === 'admin' && b.role !== 'admin') return -1;
          if (a.role !== 'admin' && b.role === 'admin') return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        renderShoppers(allUsers);
      })
      .catch(err => {
        showToast(err.message, 'error');
      });
  };

  const renderShoppers = (usersList) => {
    rowsContainer.innerHTML = '';
    totalCountEl.textContent = usersList.length;

    if (usersList.length === 0) {
      rowsContainer.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-slate-500 font-semibold">No shoppers found.</td></tr>';
      return;
    }

    usersList.forEach((shopper, index) => {
      const regDate = new Date(shopper.createdAt).toLocaleDateString();
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs font-semibold transition-colors cursor-pointer';
      
      const roleBadge = shopper.role === 'admin' 
        ? `<span class="px-2.5 py-1 bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 rounded-full text-[10px] uppercase font-bold tracking-wider">Admin</span>`
        : `<span class="px-2.5 py-1 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-full text-[10px] uppercase font-bold tracking-wider">Shopper</span>`;

      tr.innerHTML = `
        <td class="p-4 pl-6 text-slate-400 font-mono font-bold">${index + 1}</td>
        <td class="p-4 font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <div class="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-855 flex items-center justify-center font-bold text-slate-600 dark:text-slate-350">
            ${shopper.name ? shopper.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span>${shopper.name || 'Anonymous User'}</span>
        </td>
        <td class="p-4 text-slate-550">${shopper.email}</td>
        <td class="p-4 text-slate-500">${regDate}</td>
        <td class="p-4">${roleBadge}</td>
        <td class="p-4 pr-6 text-right">
          <button class="role-toggle-btn px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-150 dark:hover:bg-slate-850 text-xs transition-colors" data-id="${shopper._id}" data-role="${shopper.role}">
            Toggle Role
          </button>
        </td>
      `;

      tr.querySelector('.role-toggle-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = e.target.getAttribute('data-id');
        const currentRole = e.target.getAttribute('data-role');
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        
        showConfirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`, async () => {
          try {
            await clovasApi.adminUpdateUserRole(id, newRole);
            showToast('User access role updated.');
            loadShoppers();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });

      tr.addEventListener('click', () => {
        openShopperDetailModal(shopper);
      });

      rowsContainer.appendChild(tr);
    });
  };

  const openShopperDetailModal = (shopper) => {
    let modal = document.getElementById('shopper-modal');
    if (!modal) return;

    document.getElementById('modal-shopper-avatar').textContent = shopper.name ? shopper.name.charAt(0).toUpperCase() : 'U';
    document.getElementById('modal-shopper-name').textContent = shopper.name || 'Anonymous User';
    document.getElementById('modal-shopper-role').textContent = shopper.role === 'admin' ? 'Admin User' : 'Standard Shopper';
    document.getElementById('modal-shopper-username').textContent = shopper.name || '-';
    document.getElementById('modal-shopper-email').textContent = shopper.email;
    document.getElementById('modal-shopper-id').textContent = shopper._id;
    document.getElementById('modal-shopper-registered').textContent = new Date(shopper.createdAt).toLocaleString();

    modal.classList.remove('hidden');

    const closeBtn = document.getElementById('close-shopper-modal');
    if (closeBtn) {
      closeBtn.onclick = () => modal.classList.add('hidden');
    }
  };

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim().toLowerCase();
      if (!val) {
        renderShoppers(allUsers);
        return;
      }
      const filtered = allUsers.filter(u => 
        (u.name && u.name.toLowerCase().includes(val)) || 
        (u.email && u.email.toLowerCase().includes(val))
      );
      renderShoppers(filtered);
    });
  }

  loadShoppers();
};

// --- Panel 5: Coupon Campaigns (Coupons Management) ---
const initCouponsPanel = () => {
  const rowsContainer = document.getElementById('admin-coupons-rows');
  const form = document.getElementById('coupon-form');

  const loadAdminCoupons = () => {
    rowsContainer.innerHTML = `
      <tr class="border-b border-slate-100 dark:border-slate-850 animate-pulse">
        <td class="p-4"><div class="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
        <td class="p-4"><div class="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
        <td class="p-4"><div class="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
        <td class="p-4"><div class="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div></td>
        <td class="p-4 text-right"><div class="inline-block h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg"></div></td>
      </tr>
    `.repeat(3);

    clovasApi.adminGetCoupons()
      .then(coupons => {
        rowsContainer.innerHTML = '';
        if (coupons.length === 0) {
          rowsContainer.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-500 font-semibold">No promo coupons created.</td></tr>';
          return;
        }

        coupons.forEach(coupon => {
          const statusBadge = new Date(coupon.expiryDate) > new Date()
            ? `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">Active</span>`
            : `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400">Expired</span>`;

          const tr = document.createElement('tr');
          tr.className = 'border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs font-semibold transition-colors';
          tr.innerHTML = `
            <td class="p-4 font-mono font-bold text-primary-600 dark:text-primary-400 text-sm tracking-wider uppercase">${coupon.code}</td>
            <td class="p-4 font-extrabold text-slate-850 dark:text-white">${coupon.discountPercent}% OFF</td>
            <td class="p-4 text-slate-550">${coupon.minPurchaseAmount} BDT</td>
            <td class="p-4 text-slate-500 flex items-center gap-2">
              <span>${new Date(coupon.expiryDate).toLocaleDateString()}</span>
              ${statusBadge}
            </td>
            <td class="p-4 pr-6 text-right">
              <button class="del-coupon-btn px-2 py-1 bg-red-50 text-red-500 hover:bg-red-100 rounded text-[10px]" data-id="${coupon._id}">Delete</button>
            </td>
          `;

          tr.querySelector('.del-coupon-btn').addEventListener('click', () => {
            showConfirm(`Are you sure you want to delete promo coupon "${coupon.code}"?`, async () => {
              try {
                await clovasApi.adminDeleteCoupon(coupon._id);
                showToast('Promo coupon successfully deleted.');
                loadAdminCoupons();
              } catch (err) {
                showToast(err.message, 'error');
              }
            });
          });

          rowsContainer.appendChild(tr);
        });
      })
      .catch(err => {
        showToast('Error fetching promo coupons: ' + err.message, 'error');
      });
  };

  const set7DayDefaultExpiry = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const pad = (n) => String(n).padStart(2, '0');
    const formatted = `${nextWeek.getFullYear()}-${pad(nextWeek.getMonth()+1)}-${pad(nextWeek.getDate())}`;
    document.getElementById('form-expiry-date').value = formatted;
  };

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const code = document.getElementById('form-code').value.trim().toUpperCase();
      const discount = Number(document.getElementById('form-discount').value);
      const minAmount = Number(document.getElementById('form-min-purchase').value);
      const expiryDate = document.getElementById('form-expiry-date').value;

      try {
        await clovasApi.adminAddCoupon({
          code,
          discountPercent: discount,
          minPurchaseAmount: minAmount,
          expiryDate: new Date(expiryDate).toISOString()
        });
        showToast('New promo coupon campaign successfully created!');
        form.reset();
        set7DayDefaultExpiry();
        loadAdminCoupons();
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
  }

  set7DayDefaultExpiry();
  loadAdminCoupons();
};

// --- Panel 6: System Configuration Settings ---
const initSettingsView = () => {
  const settingsForm = document.getElementById('settings-form');
  const flashSaleEnabled = document.getElementById('setting-flash-sale-enabled');
  const flashSaleText = document.getElementById('setting-flash-sale-text');
  const flashSaleDate = document.getElementById('setting-flash-sale-date');
  const shippingStandard = document.getElementById('setting-shipping-standard');
  const shippingOutside = document.getElementById('setting-shipping-outside');
  const shippingThreshold = document.getElementById('setting-shipping-threshold');
  const supportPhone = document.getElementById('setting-support-phone');
  const supportEmail = document.getElementById('setting-support-email');
  const facebookUrl = document.getElementById('setting-facebook-url');
  const instagramUrl = document.getElementById('setting-instagram-url');
  const saveBtn = document.getElementById('save-settings-btn');

  const formatDateForDatetimeLocal = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  clovasApi.getConfig()
    .then(config => {
      flashSaleEnabled.checked = config.flashSaleEnabled;
      flashSaleText.value = config.flashSaleDiscountText || '';
      flashSaleDate.value = formatDateForDatetimeLocal(config.flashSaleEndDate);
      shippingStandard.value = config.shippingFeeStandard || 60;
      shippingOutside.value = config.shippingFeeOutside || 120;
      shippingThreshold.value = config.freeShippingThreshold || 2000;
      supportPhone.value = config.supportPhone || '';
      supportEmail.value = config.supportEmail || '';
      facebookUrl.value = config.facebookUrl || '';
      instagramUrl.value = config.instagramUrl || '';
    })
    .catch(error => {
      showToast('Failed to load system configurations.', 'error');
      console.error(error);
    });

  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const originalText = saveBtn.textContent;
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving Settings...';

      const payload = {
        flashSaleEnabled: flashSaleEnabled.checked,
        flashSaleDiscountText: flashSaleText.value.trim(),
        flashSaleEndDate: flashSaleDate.value ? new Date(flashSaleDate.value).toISOString() : new Date().toISOString(),
        shippingFeeStandard: Number(shippingStandard.value),
        shippingFeeOutside: Number(shippingOutside.value),
        freeShippingThreshold: Number(shippingThreshold.value),
        supportPhone: supportPhone.value.trim(),
        supportEmail: supportEmail.value.trim(),
        facebookUrl: facebookUrl.value.trim(),
        instagramUrl: instagramUrl.value.trim()
      };

      try {
        await clovasApi.updateConfig(payload);
        showToast('System settings saved successfully!');
      } catch (error) {
        showToast(error.message || 'Failed to save settings.', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
      }
    });
  }
};

// --- Custom SPA Module Views implementation ---

const renderCategoriesView = async (viewport) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">Categories Catalog</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage main and nested product category collections</p>
    </header>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Form Column -->
      <section class="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40">
        <h3 class="font-serif text-base font-bold border-b border-slate-150 dark:border-slate-800 pb-3 mb-4">Create Category</h3>
        <form id="category-create-form" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Category Name</label>
            <input type="text" id="cat-name" required placeholder="e.g. Silk Sarees" class="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">URL Slug</label>
            <input type="text" id="cat-slug" required placeholder="e.g. silk-sarees" class="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Parent Department</label>
            <select id="cat-parent" required class="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none">
              <option value="Men">Men</option>
              <option value="Women" selected>Women</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Cover Image URL</label>
            <input type="text" id="cat-image" placeholder="https://images.cloudinary.com/..." class="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none">
          </div>
          <button type="submit" id="save-cat-btn" class="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl transition-colors">
            Add Category
          </button>
        </form>
      </section>

      <!-- List Column -->
      <section class="lg:col-span-2 glass rounded-3xl border border-slate-100 dark:border-slate-800/40 overflow-hidden">
        <div class="p-5 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center">
          <h3 class="font-serif text-base font-bold">Category Directories</h3>
          <span class="px-2 py-0.5 rounded bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 text-[10px] font-bold" id="cat-count">0</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-medium border-collapse">
            <thead>
              <tr class="bg-slate-100 dark:bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-850">
                <th class="p-4 pl-6">Department</th>
                <th class="p-4">Category Name</th>
                <th class="p-4">URL Slug</th>
                <th class="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="categories-rows" class="divide-y divide-slate-100 dark:divide-slate-850">
              <!-- Loaded dynamically -->
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  const rowsContainer = document.getElementById('categories-rows');
  const countEl = document.getElementById('cat-count');
  const form = document.getElementById('category-create-form');

  const loadCategories = () => {
    rowsContainer.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-slate-400 animate-pulse">Loading...</td></tr>';
    clovasApi.getCategories()
      .then(categories => {
        countEl.textContent = categories.length;
        rowsContainer.innerHTML = '';
        if (categories.length === 0) {
          rowsContainer.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-500 font-semibold">No categories registered yet.</td></tr>';
          return;
        }

        categories.forEach(cat => {
          const tr = document.createElement('tr');
          tr.className = 'border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs font-semibold transition-colors';
          tr.innerHTML = `
            <td class="p-4 pl-6 text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider">${cat.parent}</td>
            <td class="p-4 font-bold text-slate-850 dark:text-white flex items-center gap-3">
              ${cat.image ? `<img src="${cat.image}" class="h-7 w-7 rounded-md object-cover bg-slate-150">` : `<div class="h-7 w-7 rounded bg-slate-200 flex items-center justify-center font-bold">C</div>`}
              <span>${cat.name}</span>
            </td>
            <td class="p-4 text-slate-500 font-mono">${cat.slug}</td>
            <td class="p-4 pr-6 text-right">
              <button class="delete-cat-btn px-2.5 py-1 bg-red-50 text-red-500 hover:bg-red-100 rounded text-[10px]" data-id="${cat._id}">Delete</button>
            </td>
          `;

          tr.querySelector('.delete-cat-btn').addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            showConfirm('Are you sure you want to remove this category?', async () => {
              try {
                await clovasApi.adminDeleteCategory(id);
                showToast('Category successfully deleted.');
                loadCategories();
              } catch (err) {
                showToast(err.message, 'error');
              }
            });
          });

          rowsContainer.appendChild(tr);
        });
      })
      .catch(err => {
        showToast(err.message, 'error');
      });
  };

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: document.getElementById('cat-name').value.trim(),
        slug: document.getElementById('cat-slug').value.trim().toLowerCase(),
        parent: document.getElementById('cat-parent').value,
        image: document.getElementById('cat-image').value.trim() || undefined
      };

      try {
        await clovasApi.adminAddCategory(payload);
        showToast('Category added successfully!');
        form.reset();
        loadCategories();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  loadCategories();
};

const renderBrandsView = (viewport) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">Brands Directory</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure designer brands and logo directories</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left Form -->
      <section class="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40">
        <h3 class="font-serif text-base font-bold border-b border-slate-150 dark:border-slate-800 pb-3 mb-4">Register Brand</h3>
        <form id="brand-create-form" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Brand Name</label>
            <input type="text" id="brand-name" required placeholder="e.g. Clova Couture" class="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Logo URL</label>
            <input type="text" id="brand-logo" placeholder="https://..." class="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Brand Website</label>
            <input type="url" id="brand-site" placeholder="https://..." class="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none">
          </div>
          <button type="submit" class="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl transition-colors">
            Register Brand
          </button>
        </form>
      </section>

      <!-- Right list -->
      <section class="lg:col-span-2 glass rounded-3xl border border-slate-100 dark:border-slate-800/40 overflow-hidden">
        <div class="p-5 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center">
          <h3 class="font-serif text-base font-bold">Registered Brands</h3>
          <span class="px-2 py-0.5 rounded bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 text-[10px] font-bold" id="brand-count">0</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-medium border-collapse">
            <thead>
              <tr class="bg-slate-100 dark:bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-850">
                <th class="p-4 pl-6">Logo</th>
                <th class="p-4">Brand Name</th>
                <th class="p-4">Website</th>
                <th class="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="brands-rows" class="divide-y divide-slate-100 dark:divide-slate-850">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  const rowsContainer = document.getElementById('brands-rows');
  const countEl = document.getElementById('brand-count');
  const form = document.getElementById('brand-create-form');

  const defaultBrands = [
    { id: 'b1', name: 'Clova Couture', logo: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=100&auto=format&fit=crop&q=60', website: 'https://clovas.com' },
    { id: 'b2', name: 'Apex Footwear', logo: '', website: 'https://apexfootwear.com' },
    { id: 'b3', name: 'Sailor Outfits', logo: '', website: 'https://sailor.clothing' }
  ];

  const loadBrands = () => {
    let brands = JSON.parse(localStorage.getItem('admin_brands'));
    if (!brands) {
      brands = defaultBrands;
      localStorage.setItem('admin_brands', JSON.stringify(brands));
    }

    countEl.textContent = brands.length;
    rowsContainer.innerHTML = '';

    brands.forEach(brand => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs font-semibold transition-colors';
      tr.innerHTML = `
        <td class="p-4 pl-6">
          ${brand.logo ? `<img src="${brand.logo}" class="h-8 w-8 rounded-lg object-cover bg-slate-150">` : `<div class="h-8 w-8 bg-slate-200 rounded-lg flex items-center justify-center font-bold font-serif">B</div>`}
        </td>
        <td class="p-4 font-bold text-slate-850 dark:text-white">${brand.name}</td>
        <td class="p-4 text-slate-500 font-mono">${brand.website || '-'}</td>
        <td class="p-4 pr-6 text-right">
          <button class="delete-brand-btn px-2.5 py-1 bg-red-50 text-red-500 hover:bg-red-100 rounded text-[10px]" data-id="${brand.id}">Remove</button>
        </td>
      `;

      tr.querySelector('.delete-brand-btn').addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        showConfirm('Remove this brand registration?', () => {
          const currentBrands = JSON.parse(localStorage.getItem('admin_brands') || '[]');
          const filtered = currentBrands.filter(b => b.id !== id);
          localStorage.setItem('admin_brands', JSON.stringify(filtered));
          showToast('Brand registration deleted.');
          loadBrands();
        });
      });

      rowsContainer.appendChild(tr);
    });
  };

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentBrands = JSON.parse(localStorage.getItem('admin_brands') || '[]');
      const newBrand = {
        id: 'brand_' + Date.now(),
        name: document.getElementById('brand-name').value.trim(),
        logo: document.getElementById('brand-logo').value.trim(),
        website: document.getElementById('brand-site').value.trim()
      };

      currentBrands.push(newBrand);
      localStorage.setItem('admin_brands', JSON.stringify(currentBrands));
      showToast('Brand registered successfully!');
      form.reset();
      loadBrands();
    });
  }

  loadBrands();
};

const renderVariantsView = (viewport) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">Product Variants</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure variants options (Colors, Sizes, Materials)</p>
    </header>
    <div class="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40 text-center max-w-lg mx-auto mt-12">
      <div class="h-16 w-16 bg-primary-500/10 text-primary-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🎨</div>
      <h3 class="font-serif text-lg font-bold mb-2">Variant Attribute Configs</h3>
      <p class="text-xs text-slate-500 dark:text-slate-400">Variant combinations (Size: M, L, XL; Color: Black, Maroon) are currently mapped directly on individual Product description pages for simplicity. Extended SKU inventory tables will launch here.</p>
    </div>
  `;
};

const renderReviewsGalleryView = (viewport) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">Reviews Images Gallery</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Inspect product review media attachments submitted by shoppers</p>
    </header>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
      <div class="glass p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
        <img src="https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=200&auto=format&fit=crop&q=60" class="h-32 w-full object-cover rounded-xl mb-2">
        <p class="text-[9px] font-bold text-slate-500">Submitted by: clovas.verify@gmail.com</p>
      </div>
      <div class="glass p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
        <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=60" class="h-32 w-full object-cover rounded-xl mb-2">
        <p class="text-[9px] font-bold text-slate-500">Submitted by: guest.user@clovas.com</p>
      </div>
    </div>
  `;
};

const renderLoyaltyPointsView = (viewport) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">Shopper Loyalty Points</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Allocate and update loyalty reward points to active shopper profiles</p>
    </header>
    <div class="glass rounded-3xl border border-slate-100 dark:border-slate-800/40 overflow-hidden">
      <table class="w-full text-left text-xs font-medium border-collapse">
        <thead>
          <tr class="bg-slate-100 dark:bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-850">
            <th class="p-4 pl-6">Customer</th>
            <th class="p-4">Current Points</th>
            <th class="p-4">Accumulated Orders</th>
            <th class="p-4 pr-6 text-right">Modify Points</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-850">
          <tr class="border-b border-slate-100 dark:border-slate-850 text-xs font-semibold">
            <td class="p-4 pl-6 font-bold">clovas.verify@gmail.com</td>
            <td class="p-4 font-mono font-bold text-primary-600">1,250 Pts</td>
            <td class="p-4">5 Orders</td>
            <td class="p-4 pr-6 text-right"><button class="px-2 py-1 bg-slate-150 dark:bg-slate-800 rounded font-bold">+ Add 100 Pts</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
};

const renderFlashSalesView = (viewport) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">Flash Sales Campaign</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Create mega markdown flash events</p>
    </header>
    <div class="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40 max-w-xl mx-auto space-y-4">
      <h3 class="font-serif text-base font-bold">Configure Flash Timer</h3>
      <p class="text-xs text-slate-500 dark:text-slate-400">Settings to enable flash sale discounts and end times are mapped directly under the main **System Settings** section for unified administration.</p>
      <a href="#/settings" class="inline-block px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-700 transition-colors">Go to Settings</a>
    </div>
  `;
};

const renderPromoBannersView = (viewport) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">Promotional Banners</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure layout campaign banners</p>
    </header>
    <div class="glass p-8 rounded-3xl border border-slate-100 dark:border-slate-850 text-center max-w-lg mx-auto mt-12">
      <div class="h-16 w-16 bg-primary-500/10 text-primary-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📢</div>
      <h3 class="font-serif text-lg font-bold mb-2">Banner Configs</h3>
      <p class="text-xs text-slate-500 dark:text-slate-400">Sliders and homepage promotion tags are configurable directly inside the **Content (CMS)** module for a clean SPA workflow.</p>
      <a href="#/cms/homepage" class="inline-block px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-700 transition-colors mt-3">Go to CMS Homepage</a>
    </div>
  `;
};

const renderInventoryView = (viewport, hash) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">Inventory & Warehouse</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Live stock levels tracking and warehousing logistics</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="glass p-5 rounded-2xl border border-slate-100 dark:border-slate-850">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dhaka Warehouse Capacity</p>
        <h3 class="text-lg font-extrabold mt-1">82% Full</h3>
        <div class="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div class="bg-primary-600 h-full rounded-full" style="width: 82%"></div>
        </div>
      </div>
      <div class="glass p-5 rounded-2xl border border-slate-100 dark:border-slate-850">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chittagong Hub Capacity</p>
        <h3 class="text-lg font-extrabold mt-1">45% Full</h3>
        <div class="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div class="bg-emerald-500 h-full rounded-full" style="width: 45%"></div>
        </div>
      </div>
      <div class="glass p-5 rounded-2xl border border-slate-100 dark:border-slate-850">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Low Stock Alerts</p>
        <h3 class="text-lg font-extrabold mt-1 text-red-500" id="low-stock-count">0</h3>
      </div>
    </div>

    <section class="glass rounded-3xl border border-slate-100 dark:border-slate-800/40 overflow-hidden">
      <div class="p-5 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center">
        <h3 class="font-serif text-base font-bold">${hash === '#/inventory/alerts' ? 'Low Stock Alerts Queue' : 'Stock Levels Directory'}</h3>
        <span class="text-xs text-slate-500">Automatic safety threshold: &lt; 10 units</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs font-medium border-collapse">
          <thead>
            <tr class="bg-slate-100 dark:bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-850">
              <th class="p-4 pl-6">Item</th>
              <th class="p-4">SKU Code</th>
              <th class="p-4">Pricing</th>
              <th class="p-4">Stock Units</th>
              <th class="p-4">Warehouse Status</th>
              <th class="p-4 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody id="inventory-rows" class="divide-y divide-slate-100 dark:divide-slate-850">
            <!-- Populated dynamically -->
          </tbody>
        </table>
      </div>
    </section>
  `;

  const rowsContainer = document.getElementById('inventory-rows');
  const lowCountEl = document.getElementById('low-stock-count');

  clovasApi.getProducts({ limit: 100 })
    .then(data => {
      const products = data.products || [];
      const lowStockProducts = products.filter(p => p.stock < 10);
      lowCountEl.textContent = lowStockProducts.length;

      const targetProducts = hash === '#/inventory/alerts' ? lowStockProducts : products;

      rowsContainer.innerHTML = '';
      if (targetProducts.length === 0) {
        rowsContainer.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-slate-500">No items match this stock criteria.</td></tr>';
        return;
      }

      targetProducts.forEach(prod => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs font-semibold transition-colors';
        
        let stockBadge = '';
        if (prod.stock === 0) {
          stockBadge = '<span class="px-2 py-0.5 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 rounded text-[9px] uppercase font-bold">Out of Stock</span>';
        } else if (prod.stock < 10) {
          stockBadge = '<span class="px-2 py-0.5 bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 rounded text-[9px] uppercase font-bold">Low stock alert</span>';
        } else {
          stockBadge = '<span class="px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 rounded text-[9px] uppercase font-bold">Healthy Stock</span>';
        }

        tr.innerHTML = `
          <td class="p-4 pl-6 font-bold text-slate-850 dark:text-white flex items-center gap-3">
            <img src="${prod.images[0]}" class="h-9 w-8 rounded object-cover bg-slate-100">
            <span>${prod.title}</span>
          </td>
          <td class="p-4 text-slate-500 font-mono font-bold">${prod.sku || '-'}</td>
          <td class="p-4 text-slate-700 dark:text-slate-350">${prod.price} BDT</td>
          <td class="p-4 font-extrabold text-slate-900 dark:text-white">${prod.stock}</td>
          <td class="p-4">${stockBadge}</td>
          <td class="p-4 pr-6 text-right">
            <a href="#/products/all" class="inline-block px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[10px] font-bold rounded-lg transition-colors">Adjust Stock</a>
          </td>
        `;
        rowsContainer.appendChild(tr);
      });
    })
    .catch(err => {
      showToast(err.message, 'error');
    });
};

const renderShippingView = (viewport, hash) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">Shipping & Couriers</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure logistics zones, charges, and delivery tracking integrations</p>
    </header>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 glass rounded-3xl border border-slate-100 dark:border-slate-800/40 overflow-hidden">
        <div class="p-5 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/60">
          <h3 class="font-serif text-base font-bold">Active Shipping Zones</h3>
        </div>
        <div class="p-6 space-y-4">
          <div class="flex justify-between items-center p-4 bg-slate-100/50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/50 dark:border-slate-850">
            <div>
              <h4 class="font-bold text-xs">Dhaka Metro Area</h4>
              <p class="text-[10px] text-slate-400 mt-0.5">Standard home delivery inside capital division</p>
            </div>
            <span class="font-bold text-xs">60 BDT</span>
          </div>
          <div class="flex justify-between items-center p-4 bg-slate-100/50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/50 dark:border-slate-850">
            <div>
              <h4 class="font-bold text-xs">Outside Dhaka City</h4>
              <p class="text-[10px] text-slate-400 mt-0.5">Nationwide home delivery via courier</p>
            </div>
            <span class="font-bold text-xs">120 BDT</span>
          </div>
        </div>
      </div>

      <div class="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40 space-y-4">
        <h3 class="font-serif text-base font-bold border-b border-slate-150 dark:border-slate-800 pb-3">Courier Integrations</h3>
        <div class="space-y-3">
          <div class="p-3 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between">
            <span class="text-xs font-bold text-slate-800 dark:text-white">Pathao Delivery</span>
            <span class="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] uppercase font-bold">API Connected</span>
          </div>
          <div class="p-3 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between">
            <span class="text-xs font-bold text-slate-800 dark:text-white">Steadfast Courier</span>
            <span class="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] uppercase font-bold">API Connected</span>
          </div>
          <div class="p-3 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between text-slate-400">
            <span class="text-xs font-bold">RedX Logistics</span>
            <span class="text-[9px] uppercase font-bold">Configure</span>
          </div>
        </div>
      </div>
    </div>
  `;
};

const renderPaymentView = (viewport, hash) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">Payment Methods & Logs</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure online checkout gateways and audit transaction histories</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Gateways config -->
      <section class="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40 space-y-4">
        <h3 class="font-serif text-base font-bold border-b border-slate-150 dark:border-slate-800 pb-3">Checkout Gateways</h3>
        <form class="space-y-4" id="gateway-config-form">
          <div class="flex justify-between items-center">
            <div>
              <h4 class="font-bold text-xs">SSLCommerz Sandbox</h4>
              <p class="text-[9px] text-slate-400 mt-0.5">Direct redirect checkout sandbox servers</p>
            </div>
            <input type="checkbox" id="gate-ssl" checked class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded">
          </div>
          <div class="flex justify-between items-center">
            <div>
              <h4 class="font-bold text-xs">bKash Personal Wallet</h4>
              <p class="text-[9px] text-slate-400 mt-0.5">Customer payments via manual reference inputs</p>
            </div>
            <input type="checkbox" id="gate-bkash" checked class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded">
          </div>
          <div class="flex justify-between items-center">
            <div>
              <h4 class="font-bold text-xs">Cash on Delivery (COD)</h4>
              <p class="text-[9px] text-slate-400 mt-0.5">Pay standard cash directly to rider on receipt</p>
            </div>
            <input type="checkbox" id="gate-cod" checked class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded">
          </div>
          <button type="submit" class="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl transition-colors">Save Gateways</button>
        </form>
      </section>

      <!-- Logs -->
      <section class="lg:col-span-2 glass rounded-3xl border border-slate-100 dark:border-slate-800/40 overflow-hidden">
        <div class="p-5 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center">
          <h3 class="font-serif text-base font-bold">Transaction Audit Trails</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-medium border-collapse">
            <thead>
              <tr class="bg-slate-100 dark:bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-850">
                <th class="p-4 pl-6">Transaction ID</th>
                <th class="p-4">Customer</th>
                <th class="p-4">Method</th>
                <th class="p-4">Amount</th>
                <th class="p-4 pr-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody id="payment-logs-rows" class="divide-y divide-slate-100 dark:divide-slate-850">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;

  const rowsContainer = document.getElementById('payment-logs-rows');
  const gateForm = document.getElementById('gateway-config-form');

  if (gateForm) {
    gateForm.onsubmit = (e) => {
      e.preventDefault();
      showToast('Payment checkout configuration settings updated successfully!');
    };
  }

  clovasApi.adminGetOrders()
    .then(orders => {
      rowsContainer.innerHTML = '';
      if (orders.length === 0) {
        rowsContainer.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-slate-500">No payment transaction records audit available.</td></tr>';
        return;
      }

      orders.forEach(order => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs font-semibold transition-colors';
        
        let statusTag = '';
        if (order.paymentStatus === 'Paid') {
          statusTag = '<span class="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] uppercase font-bold">Success</span>';
        } else if (order.paymentStatus === 'Failed') {
          statusTag = '<span class="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[9px] uppercase font-bold">Failed</span>';
        } else {
          statusTag = '<span class="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] uppercase font-bold">Pending</span>';
        }

        tr.innerHTML = `
          <td class="p-4 pl-6 font-mono font-bold text-slate-400">${order.transactionId || 'COD-TRX'}</td>
          <td class="p-4 font-bold text-slate-800 dark:text-white">${order.shippingAddress.name}</td>
          <td class="p-4 text-slate-500 font-mono text-[10px]">${order.paymentMethod || 'SSLCommerz'}</td>
          <td class="p-4 font-bold">${order.totalAmount} BDT</td>
          <td class="p-4 pr-6 text-right">${statusTag}</td>
        `;
        rowsContainer.appendChild(tr);
      });
    })
    .catch(err => {
      rowsContainer.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-red-500">Error loading logs</td></tr>';
    });
};

const renderReviewsApprovalView = (viewport, hash) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">Reviews & Ratings Approval</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Moderate buyer product review commentary</p>
    </header>
    
    <section class="glass rounded-3xl border border-slate-100 dark:border-slate-800/40 overflow-hidden">
      <table class="w-full text-left text-xs font-medium border-collapse">
        <thead>
          <tr class="bg-slate-100 dark:bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-850">
            <th class="p-4 pl-6">Reviewer</th>
            <th class="p-4">Product Name</th>
            <th class="p-4">Rating</th>
            <th class="p-4">Comments Text</th>
            <th class="p-4 pr-6 text-right">Actions Approval</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-850">
          <tr class="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/80 text-xs font-semibold">
            <td class="p-4 pl-6 font-bold">clovas.verify@gmail.com</td>
            <td class="p-4">Premium Leather Watch</td>
            <td class="p-4 font-mono font-bold text-amber-500">⭐⭐⭐⭐⭐ 5/5</td>
            <td class="p-4 text-slate-500 max-w-sm">The package was wrapped nicely, watch leather strap quality feels incredibly premium! Highly recommended!</td>
            <td class="p-4 pr-6 text-right space-x-2">
              <button class="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold" onclick="showToast('Review approved.')">Approve</button>
              <button class="px-2.5 py-1 bg-red-50 text-red-500 rounded text-[10px] font-bold" onclick="showToast('Review rejected.')">Reject</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  `;
};

const renderReportsAnalyticsView = (viewport, hash) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">Reports & Financial Statements</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Export audits and print sales reports</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40 space-y-4">
        <h3 class="font-serif text-base font-bold">Export PDF/Excel Sheets</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400">Generate tax invoices, sales margins, and operational costs logs statements.</p>
        <div class="flex gap-4">
          <button class="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-colors" onclick="showToast('Downloading Sales Report PDF...')">Export PDF</button>
          <button class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors" onclick="showToast('Downloading Profit & Loss Sheet...')">Export Excel</button>
        </div>
      </div>
      
      <div class="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40 space-y-4">
        <h3 class="font-serif text-base font-bold">Profitability Breakdown</h3>
        <div class="space-y-2 text-xs font-semibold">
          <div class="flex justify-between border-b pb-2"><span>Gross Revenue</span><span>1,450,200 BDT</span></div>
          <div class="flex justify-between border-b pb-2"><span>Shipping Expenses</span><span>24,800 BDT</span></div>
          <div class="flex justify-between border-b pb-2"><span>Tax & Gateways</span><span>12,400 BDT</span></div>
          <div class="flex justify-between text-primary-600 font-bold"><span>Net Operating Profit</span><span>1,413,000 BDT</span></div>
        </div>
      </div>
    </div>
  `;
};

const renderMarketingView = (viewport, hash) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">Marketing Campaigns</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Broadcast promotional newsletters, emails, and SMS alerts</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Email -->
      <section class="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40">
        <h3 class="font-serif text-base font-bold border-b border-slate-150 dark:border-slate-800 pb-3 mb-4">Compose Broadcast Email</h3>
        <form class="space-y-4" onsubmit="event.preventDefault(); showToast('Email campaign dispatched to active shoppers list!'); this.reset();">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Email Subject Header</label>
            <input type="text" required placeholder="e.g. Exclusive Eid-Ul-Adha Mega Collection Launch!" class="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">HTML Body Content</label>
            <textarea required rows="5" placeholder="Compose promotional newsletter text..." class="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none"></textarea>
          </div>
          <button type="submit" class="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl transition-colors">Dispatch Campaign</button>
        </form>
      </section>

      <!-- SMS -->
      <section class="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40">
        <h3 class="font-serif text-base font-bold border-b border-slate-150 dark:border-slate-800 pb-3 mb-4">Broadcast SMS Alerts</h3>
        <form class="space-y-4" onsubmit="event.preventDefault(); showToast('SMS campaign dispatched to registered numbers list!'); this.reset();">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">SMS Text Content (Max 160 Characters)</label>
            <textarea required rows="4" placeholder="e.g. Clovas Shopping: Mega 20% discount on all leather boots. Use Coupon: EID20." class="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none"></textarea>
          </div>
          <button type="submit" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors">Broadcast SMS</button>
        </form>
      </section>
    </div>
  `;
};

const renderCMSView = (viewport, hash) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">Content Management System (CMS)</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure layout banners, sliders, and FAQs lists</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Homepage sliders -->
      <section class="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40">
        <h3 class="font-serif text-base font-bold border-b border-slate-150 dark:border-slate-800 pb-3 mb-4">Homepage Banner config</h3>
        <form class="space-y-4" onsubmit="event.preventDefault(); showToast('Homepage landing sliders configuration saved.');">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Promo Banner Headline Text</label>
            <input type="text" value="Premium Leather Collections & Casual Styles" class="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Promo Sub-Headline Tag</label>
            <input type="text" value="Grab up to 50% discount on first shopping invoice today!" class="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none">
          </div>
          <button type="submit" class="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl transition-colors">Update Homepage Banner</button>
        </form>
      </section>

      <!-- FAQs -->
      <section class="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40">
        <h3 class="font-serif text-base font-bold border-b border-slate-150 dark:border-slate-800 pb-3 mb-4">FAQ Entries Directory</h3>
        <div class="space-y-3">
          <div class="p-3 border rounded-xl border-slate-150 dark:border-slate-800 text-xs">
            <h4 class="font-bold">Q: What is the estimated courier shipping duration inside Dhaka?</h4>
            <p class="text-slate-400 mt-1">A: Delivery completes within 24 to 48 working hours.</p>
          </div>
          <div class="p-3 border rounded-xl border-slate-150 dark:border-slate-800 text-xs">
            <h4 class="font-bold">Q: Do you accept size replacements inside Bangladesh?</h4>
            <p class="text-slate-400 mt-1">A: Yes, exchanges are valid within 7 calendar days of delivery receipt.</p>
          </div>
        </div>
      </section>
    </div>
  `;
};

const renderStaffManagementView = (viewport, hash) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">Staff Directory & Role Permissions</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage staff portal administrators and browse security activity logs</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Users list -->
      <section class="lg:col-span-2 glass rounded-3xl border border-slate-100 dark:border-slate-800/40 overflow-hidden">
        <div class="p-5 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/60">
          <h3 class="font-serif text-base font-bold">Active Administrators</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs font-medium border-collapse">
            <thead>
              <tr class="bg-slate-100 dark:bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-850">
                <th class="p-4 pl-6">Staff Member</th>
                <th class="p-4">Access Role</th>
                <th class="p-4">Assigned Operations</th>
                <th class="p-4 pr-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-850">
              <tr class="border-b border-slate-100 dark:border-slate-850 text-xs font-semibold">
                <td class="p-4 pl-6 font-bold flex items-center gap-3">
                  <div class="h-8 w-8 bg-slate-200 rounded-full flex items-center justify-center font-bold">SA</div>
                  <div>
                    <p>clovas.verify@gmail.com</p>
                    <p class="text-[9px] text-slate-400 mt-0.5">Joined: Aug 2026</p>
                  </div>
                </td>
                <td class="p-4 text-purple-600 font-bold uppercase tracking-wider text-[10px]">Super Admin</td>
                <td class="p-4 text-slate-500">Full System Access Controls</td>
                <td class="p-4 pr-6 text-right"><span class="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold">Online</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Logs -->
      <section class="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40">
        <h3 class="font-serif text-base font-bold border-b border-slate-150 dark:border-slate-800 pb-3 mb-4">Operations Audit Trails</h3>
        <div class="space-y-4 text-xs">
          <div class="border-l-2 border-primary-600 pl-3">
            <p class="font-bold text-slate-800 dark:text-white">Updated standard shipping charges</p>
            <p class="text-[9px] text-slate-400 mt-0.5">By clovas.verify@gmail.com | 10 mins ago</p>
          </div>
          <div class="border-l-2 border-slate-300 pl-3 text-slate-500">
            <p class="font-bold">Modified price details for Premium Boots SKU</p>
            <p class="text-[9px] mt-0.5">By clovas.verify@gmail.com | 2 hrs ago</p>
          </div>
        </div>
      </section>
    </div>
  `;
};

const renderNotificationsView = (viewport) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">System Alerts & Notifications</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time alerts queue of order activities and inventory level drops</p>
    </header>

    <div class="glass rounded-3xl border border-slate-100 dark:border-slate-800/40 overflow-hidden divide-y divide-slate-100 dark:divide-slate-850">
      <div class="p-5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors text-xs">
        <div class="flex items-center gap-4">
          <span class="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-base">🛒</span>
          <div>
            <p class="font-bold text-slate-850 dark:text-white">New order received from clovas.verify@gmail.com (Txn: SSL6789)</p>
            <p class="text-[10px] text-slate-400 mt-0.5">Order amount: 2,500 BDT | 10 mins ago</p>
          </div>
        </div>
        <button class="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded font-bold hover:bg-slate-200 transition-colors">Mark read</button>
      </div>
      <div class="p-5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors text-xs">
        <div class="flex items-center gap-4">
          <span class="h-8 w-8 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-base">⚠️</span>
          <div>
            <p class="font-bold text-slate-850 dark:text-white">Low stock alert: Classic Leather Oxford Shoe (SKU: SHOE-OX-BL)</p>
            <p class="text-[10px] text-slate-400 mt-0.5">Remaining units: 3 | 1 hour ago</p>
          </div>
        </div>
        <button class="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded font-bold hover:bg-slate-200 transition-colors">Mark read</button>
      </div>
    </div>
  `;
};

const renderSupportView = (viewport, hash) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">Support Tickets & Messages</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Audit customer messages queue and live ticket threads</p>
    </header>

    <div class="glass rounded-3xl border border-slate-100 dark:border-slate-800/40 overflow-hidden">
      <table class="w-full text-left text-xs font-medium border-collapse">
        <thead>
          <tr class="bg-slate-100 dark:bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-850">
            <th class="p-4 pl-6">Sender User</th>
            <th class="p-4">Subject Topic</th>
            <th class="p-4">Message Summary</th>
            <th class="p-4">Thread Date</th>
            <th class="p-4 pr-6 text-right">Status Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-850">
          <tr class="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/80 text-xs font-semibold">
            <td class="p-4 pl-6 font-bold">johndoe@email.com</td>
            <td class="p-4">Size Replacement Issue</td>
            <td class="p-4 text-slate-500 max-w-xs truncate">Hello, I received my boots today but the size is slightly too tight. Can I replacement for Size 43?</td>
            <td class="p-4">Aug 5, 2026</td>
            <td class="p-4 pr-6 text-right">
              <span class="px-2.5 py-1 bg-amber-50 text-amber-600 rounded text-[9px] uppercase font-bold tracking-wider">Open Ticket</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
};

const renderVisitorAnalyticsView = (viewport) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">Visitor Analytics</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Live traffic statistics and customer country origins</p>
    </header>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="glass p-5 rounded-2xl border border-slate-100 dark:border-slate-850 text-center">
        <p class="text-[10px] font-bold text-slate-400 uppercase">Live Active Sessions</p>
        <h3 class="text-3xl font-extrabold mt-1 text-primary-600 animate-pulse">12 Users</h3>
      </div>
      <div class="glass p-5 rounded-2xl border border-slate-100 dark:border-slate-850 text-center">
        <p class="text-[10px] font-bold text-slate-400 uppercase">Average Session Duration</p>
        <h3 class="text-3xl font-extrabold mt-1">4m 32s</h3>
      </div>
      <div class="glass p-5 rounded-2xl border border-slate-100 dark:border-slate-850 text-center">
        <p class="text-[10px] font-bold text-slate-400 uppercase">Conversion Rate</p>
        <h3 class="text-3xl font-extrabold mt-1 text-emerald-500">3.8%</h3>
      </div>
    </div>
  `;
};

const renderShippingSettingsView = (viewport) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">Tax & Shipping Settings</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure default sales tax ratios and free shipping thresholds</p>
    </header>
    <div class="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40 space-y-4 max-w-xl mx-auto">
      <h3 class="font-serif text-base font-bold">Standard Configurations</h3>
      <p class="text-xs text-slate-500 dark:text-slate-400">Settings to update standard shipping charges and city limits thresholds are mapped directly under the main **System Settings** page for a unified admin workflow.</p>
      <a href="#/settings" class="inline-block px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-700 transition-colors">Go to Settings</a>
    </div>
  `;
};

const renderSecurityView = (viewport, hash) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">Portal Security Config</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure Multi-Factor Authentication (MFA/2FA) and inspect authentication trails</p>
    </header>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <section class="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40 space-y-4">
        <h3 class="font-serif text-base font-bold">Two-Factor Authentication (2FA)</h3>
        <div class="flex justify-between items-center p-3 border rounded-xl border-slate-150 dark:border-slate-800">
          <div>
            <h4 class="font-bold text-xs">MFA/2FA Protection</h4>
            <p class="text-[9px] text-slate-400 mt-0.5">Enforces secure verification otp codes on administrator login</p>
          </div>
          <input type="checkbox" id="gate-2fa" class="h-4 w-4 text-primary-600 border-slate-300 rounded" onclick="showToast('2FA security policy configuration updated successfully!')">
        </div>
      </section>
      
      <section class="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40">
        <h3 class="font-serif text-base font-bold border-b border-slate-150 dark:border-slate-800 pb-3 mb-4">Authentication history</h3>
        <div class="space-y-3 text-[11px] font-semibold text-slate-550">
          <div class="flex justify-between border-b pb-2"><span>clovas.verify@gmail.com | Dhaka</span><span class="text-emerald-500">Success (Aug 5)</span></div>
          <div class="flex justify-between border-b pb-2"><span>clovas.verify@gmail.com | Sylhet</span><span class="text-red-500 font-bold">Blocked OTP (Aug 4)</span></div>
        </div>
      </section>
    </div>
  `;
};

const renderMultiFeaturesView = (viewport, hash) => {
  viewport.innerHTML = `
    <header class="pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
      <h1 class="font-serif text-2xl md:text-3xl font-bold">Multi-Language & Multi-Vendor</h1>
      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure multi-currency convert ratios and active portal translation tags</p>
    </header>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <section class="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40 space-y-4">
        <h3 class="font-serif text-base font-bold">Currency Exchange Rates</h3>
        <div class="space-y-3 text-xs font-semibold">
          <div class="flex justify-between border-b pb-2"><span>1 USD (United States Dollar)</span><span>118 BDT</span></div>
          <div class="flex justify-between border-b pb-2"><span>1 EUR (Euro Zone)</span><span>127 BDT</span></div>
        </div>
      </section>
      <section class="glass p-6 rounded-3xl border border-slate-100 dark:border-slate-800/40 space-y-4">
        <h3 class="font-serif text-base font-bold">Active Translation Packs</h3>
        <div class="space-y-2 text-xs">
          <div class="p-2 border rounded-lg flex justify-between items-center font-bold"><span>English (Default)</span><span class="text-emerald-500 text-[10px]">Active</span></div>
          <div class="p-2 border rounded-lg flex justify-between items-center text-slate-400"><span>Bengali (বাংলা)</span><span class="text-[10px]" onclick="showToast('Bengali localization language pack enabled!')">Configure</span></div>
        </div>
      </section>
    </div>
  `;
};

