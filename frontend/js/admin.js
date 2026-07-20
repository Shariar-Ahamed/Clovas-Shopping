import clovasApi from './api.js';
import clovasAuth from './firebase-config.js';
import { showToast, showConfirm } from './main.js';

// --- Shared Admin Access Verifier ---
const verifyAdminAccess = async () => {
  const user = await clovasAuth.getCurrentUser();
  if (!user) {
    showToast('Authentication required.', 'error');
    window.location.href = '../auth.html';
    return null;
  }
  
  // A simple fallback for dev: email check for admin role
  const isAdmin = (user.email && (user.email.includes('admin') || user.email === 'clovas.verify@gmail.com')) || user.role === 'admin';
  if (!isAdmin) {
    showToast('Unauthorized access. Admin only.', 'error');
    window.location.href = '../dashboard.html';
    return null;
  }
  return user;
};

// --- Panel 1: Analytics Overview ---
export const initAdminDashboard = async () => {
  const user = await verifyAdminAccess();
  if (!user) return;

  const statSales = document.getElementById('stat-sales');
  const statOrders = document.getElementById('stat-orders');
  const statProducts = document.getElementById('stat-products');
  const statUsers = document.getElementById('stat-users');
  const recentOrdersRows = document.getElementById('recent-orders-rows');
  const categoryBreakdownList = document.getElementById('category-breakdown-list');

  clovasApi.getAdminAnalytics()
    .then(data => {
      // Set stats
      statSales.textContent = `${data.summary.totalSales.toLocaleString()} BDT`;
      statOrders.textContent = data.summary.totalOrders;
      statProducts.textContent = data.summary.totalProducts;
      statUsers.textContent = data.summary.totalUsers;

      // Render recent orders
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

      // Render category breakdown
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
    })
    .catch(err => {
      console.error(err);
      showToast('Error loading stats overview.', 'error');
    });
};

// --- Panel 2: Products CRUD Management ---
export const initProductsPanel = async () => {
  const user = await verifyAdminAccess();
  if (!user) return;

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

  // Load products list
  const loadAdminProducts = (queryText = '') => {
    const productSkeleton = `
      <tr class="border-b border-slate-100 dark:border-slate-850 animate-pulse">
        <td class="p-4 pl-6 flex items-center gap-3">
          <div class="h-10 w-9 rounded-lg shimmer bg-slate-200 dark:bg-slate-800"></div>
          <div class="h-4 w-32 rounded shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
        <td class="p-4">
          <div class="h-4 w-20 rounded shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
        <td class="p-4">
          <div class="h-4 w-28 rounded shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
        <td class="p-4">
          <div class="h-4 w-16 rounded shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
        <td class="p-4">
          <div class="h-4 w-12 rounded shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
        <td class="p-4 pr-6 text-right space-x-2">
          <div class="inline-block h-8 w-12 rounded-lg shimmer bg-slate-200 dark:bg-slate-800"></div>
          <div class="inline-block h-8 w-14 rounded-lg shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
      </tr>
    `;
    rowsContainer.innerHTML = productSkeleton.repeat(4);
    
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
            <td class="p-4 text-slate-500 font-mono font-bold">${prod.sku || '-'}</td>
            <td class="p-4 text-slate-550 dark:text-slate-400">${prod.gender} / ${prod.category}</td>
            <td class="p-4">${prod.price} BDT</td>
            <td class="p-4">${prod.stock}</td>
            <td class="p-4 pr-6 text-right space-x-2">
              <button class="edit-btn px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px]" data-id="${prod._id}">Edit</button>
              <button class="del-btn px-2.5 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-[10px]" data-id="${prod._id}">Delete</button>
            </td>
          `;

          tr.querySelector('.edit-btn').addEventListener('click', () => {
            // Populate Modal Form
            formId.value = prod._id;
            formSku.value = prod.sku || '';
            skuValidationMsg.classList.add('hidden');
            saveBtn.disabled = false;
            formTitle.value = prod.title;
            formDesc.value = prod.description;
            formPrice.value = prod.price;
            formDiscountPrice.value = prod.discountPrice || 0;
            formStock.value = prod.stock;
            formGender.value = prod.gender;
            formCategory.value = prod.category;
            formSubcategory.value = prod.subCategory;

            formFeatured.checked = prod.isFeatured || false;
            formTrending.checked = prod.isTrending || false;
            formBestseller.checked = prod.isBestSeller || false;
            formNewArrival.checked = prod.isNewArrival !== false;
            
            formImageUrl.value = prod.images[0] || '';

            modalTitle.textContent = 'Edit Product Details';
            modal.classList.remove('hidden');
          });

          // Delete Action
          tr.querySelector('.del-btn').addEventListener('click', () => {
            showConfirm(`Are you sure you want to delete ${prod.title}?`, async () => {
              try {
                await clovasApi.adminDeleteProduct(prod._id);
                showToast('Product deleted.');
                loadAdminProducts(searchInput.value);
              } catch (e) {
                showToast(e.message, 'error');
              }
            });
          });

          rowsContainer.appendChild(tr);
        });
      })
      .catch(err => {
        console.error(err);
        rowsContainer.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-red-500">Failed to load catalogue. Make sure server is running.</td></tr>';
      });
  };

  // Image Upload handler
  formImageFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      uploadStatusMsg.textContent = 'Uploading file to Cloudinary...';
      uploadStatusMsg.className = 'text-xs font-semibold mt-2 text-primary-500 block';
      
      const res = await clovasApi.adminUploadImage(formData);
      
      formImageUrl.value = res.url;
      uploadStatusMsg.textContent = 'Image upload completed successfully!';
      uploadStatusMsg.className = 'text-xs font-semibold mt-2 text-emerald-500 block';
      showToast('Image uploaded successfully.');
    } catch (err) {
      console.error(err);
      uploadStatusMsg.textContent = err.message || 'Image upload failed.';
      uploadStatusMsg.className = 'text-xs font-semibold mt-2 text-red-500 block';
      showToast('Cloudinary upload failed.', 'error');
    }
  });

  // Modal controls
  openBtn.addEventListener('click', () => {
    form.reset();
    formId.value = '';
    skuValidationMsg.classList.add('hidden');
    saveBtn.disabled = false;
    uploadStatusMsg.classList.add('hidden');
    modalTitle.textContent = 'Add New Product';
    modal.classList.remove('hidden');
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Handle SKU Real-time validation check
  let skuCheckTimeout = null;
  formSku.addEventListener('input', () => {
    if (skuCheckTimeout) clearTimeout(skuCheckTimeout);
    
    const sku = formSku.value.trim().toUpperCase();
    if (!sku) {
      skuValidationMsg.classList.add('hidden');
      saveBtn.disabled = false;
      return;
    }
    
    skuValidationMsg.textContent = 'Checking availability...';
    skuValidationMsg.className = 'text-[10px] font-semibold mt-1 text-slate-505 dark:text-slate-400 block';
    skuValidationMsg.classList.remove('hidden');
    saveBtn.disabled = true;
    
    skuCheckTimeout = setTimeout(async () => {
      try {
        const id = formId.value;
        const res = await clovasApi.checkSkuAvailability(sku, id);
        if (res.available) {
          skuValidationMsg.textContent = '✓ Code is available!';
          skuValidationMsg.className = 'text-[10px] font-semibold mt-1 text-emerald-500 block';
          saveBtn.disabled = false;
        } else {
          skuValidationMsg.textContent = '✗ Code already taken by another product.';
          skuValidationMsg.className = 'text-[10px] font-semibold mt-1 text-red-500 block';
          saveBtn.disabled = true;
        }
      } catch (err) {
        skuValidationMsg.textContent = 'Failed to check code availability.';
        skuValidationMsg.className = 'text-[10px] font-semibold mt-1 text-amber-500 block';
        saveBtn.disabled = false;
      }
    }, 400);
  });

  // Submit Product Form (Create/Update)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = formId.value;
    const productData = {
      sku: formSku.value.trim().toUpperCase(),
      title: formTitle.value.trim(),
      description: formDesc.value.trim(),
      price: Number(formPrice.value),
      discountPrice: Number(formDiscountPrice.value),
      stock: Number(formStock.value),
      gender: formGender.value,
      category: formCategory.value.trim(),
      subCategory: formSubcategory.value.trim(),
      isFeatured: formFeatured.checked,
      isTrending: formTrending.checked,
      isBestSeller: formBestseller.checked,
      isNewArrival: formNewArrival.checked,
      images: [formImageUrl.value.trim()]
    };

    try {
      if (id) {
        // Update
        await clovasApi.adminUpdateProduct(id, productData);
        showToast('Product details updated successfully!');
      } else {
        // Create
        await clovasApi.adminAddProduct(productData);
        showToast('New product added to catalog.');
      }
      modal.classList.add('hidden');
      loadAdminProducts(searchInput.value);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Search input change
  searchInput.addEventListener('input', (e) => {
    loadAdminProducts(e.target.value.trim());
  });

  // Initial load
  loadAdminProducts();
};

// --- Panel 3: Orders Management Dashboard ---
export const initOrdersPanel = async () => {
  const user = await verifyAdminAccess();
  if (!user) return;

  const rowsContainer = document.getElementById('admin-orders-rows');

  const loadAdminOrders = () => {
    const orderSkeleton = `
      <tr class="border-b border-slate-100 dark:border-slate-850 animate-pulse">
        <td class="p-4 pl-6">
          <div class="h-4 w-28 rounded shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
        <td class="p-4">
          <div class="h-4 w-32 rounded shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
        <td class="p-4">
          <div class="h-4 w-24 rounded shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
        <td class="p-4">
          <div class="h-4 w-16 rounded shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
        <td class="p-4">
          <div class="h-4 w-20 rounded shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
        <td class="p-4">
          <div class="h-6 w-16 rounded-full shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
        <td class="p-4 pr-6 text-right">
          <div class="inline-block h-8 w-24 rounded-lg shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
      </tr>
    `;
    rowsContainer.innerHTML = orderSkeleton.repeat(4);

    clovasApi.adminGetOrders()
      .then(orders => {
        rowsContainer.innerHTML = '';
        if (orders.length === 0) {
          rowsContainer.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-slate-500">No orders recorded yet.</td></tr>';
          return;
        }

        orders.forEach(order => {
          const dateStr = new Date(order.createdAt).toLocaleDateString();
          
          const tr = document.createElement('tr');
          tr.className = 'border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs font-semibold transition-colors';
          tr.innerHTML = `
            <td class="p-4 pl-6">
              <p class="font-bold text-slate-800 dark:text-white">${order.shippingAddress.name}</p>
              <p class="text-[10px] text-slate-400 mt-0.5">${order.transactionId}</p>
            </td>
            <td class="p-4 text-slate-500">${dateStr}</td>
            <td class="p-4 text-slate-500 max-w-xs truncate">${order.items.map(i => `${i.title} x${i.quantity}`).join(', ')}</td>
            <td class="p-4 font-bold text-slate-800 dark:text-white">${order.totalAmount} BDT</td>
            <td class="p-4">
              <!-- Payment Status Select -->
              <select class="pay-select px-2.5 py-1 text-[10px] rounded border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 font-bold focus:outline-none">
                <option value="Pending" ${order.paymentStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Paid" ${order.paymentStatus === 'Paid' ? 'selected' : ''}>Paid</option>
                <option value="Failed" ${order.paymentStatus === 'Failed' ? 'selected' : ''}>Failed</option>
                <option value="Cancelled" ${order.paymentStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
            </td>
            <td class="p-4">
              <!-- Order Delivery Status Select -->
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
          `;

          // Update action triggers
          tr.querySelector('.save-status-btn').addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.textContent = 'Saving...';

            const payStatus = tr.querySelector('.pay-select').value;
            const delStatus = tr.querySelector('.del-select').value;

            try {
              await clovasApi.adminUpdateOrderStatus(order._id, {
                paymentStatus: payStatus,
                orderStatus: delStatus
              });
              showToast(`Order status updated successfully!`);
              loadAdminOrders();
            } catch (err) {
              showToast(err.message, 'error');
              btn.disabled = false;
              btn.textContent = 'Update';
            }
          });

          rowsContainer.appendChild(tr);
        });
      });
  };

  loadAdminOrders();
};

// --- Panel 4: Coupons Management Campaign ---
export const initCouponsPanel = async () => {
  const user = await verifyAdminAccess();
  if (!user) return;

  const rowsContainer = document.getElementById('admin-coupons-rows');
  const form = document.getElementById('coupon-form');

  const loadAdminCoupons = () => {
    const couponSkeleton = `
      <tr class="border-b border-slate-100 dark:border-slate-850 animate-pulse">
        <td class="p-4">
          <div class="h-4 w-20 rounded shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
        <td class="p-4">
          <div class="h-4 w-16 rounded shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
        <td class="p-4">
          <div class="h-4 w-16 rounded shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
        <td class="p-4">
          <div class="h-4 w-24 rounded shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
        <td class="p-4 text-right">
          <div class="inline-block h-8 w-16 rounded-lg shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
      </tr>
    `;
    rowsContainer.innerHTML = couponSkeleton.repeat(3);

    clovasApi.adminGetCoupons()
      .then(coupons => {
        rowsContainer.innerHTML = '';
        if (coupons.length === 0) {
          rowsContainer.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-500">No promo coupons created.</td></tr>';
          return;
        }

        coupons.forEach(coupon => {
          const expDate = new Date(coupon.expiryDate).toLocaleDateString();
          const tr = document.createElement('tr');
          tr.className = 'border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs font-semibold transition-colors';
          tr.innerHTML = `
            <td class="p-4 font-bold text-slate-800 dark:text-white uppercase tracking-wider">${coupon.code}</td>
            <td class="p-4 text-slate-550">${coupon.discountValue} ${coupon.discountType === 'percentage' ? '%' : 'BDT'}</td>
            <td class="p-4">${coupon.minPurchase} BDT</td>
            <td class="p-4 text-slate-500">${expDate}</td>
            <td class="p-4 text-right">
              <button class="del-coupon-btn px-2 py-1 rounded bg-red-50 text-red-500 hover:bg-red-100 text-[10px]" data-id="${coupon._id}">&times; Delete</button>
            </td>
          `;

          // Delete Action
          tr.querySelector('.del-coupon-btn').addEventListener('click', () => {
            showConfirm(`Remove coupon code ${coupon.code}?`, async () => {
              try {
                await clovasApi.adminDeleteCoupon(coupon._id);
                showToast('Coupon removed.');
                loadAdminCoupons();
              } catch (e) {
                showToast(e.message, 'error');
              }
            });
          });

          rowsContainer.appendChild(tr);
        });
      });
  };

  // Helper to set default 7-day expiry date
  const set7DayDefaultExpiry = () => {
    const expiryInput = document.getElementById('coupon-expiry');
    if (expiryInput) {
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 7);
      const yyyy = defaultExpiry.getFullYear();
      const mm = String(defaultExpiry.getMonth() + 1).padStart(2, '0');
      const dd = String(defaultExpiry.getDate()).padStart(2, '0');
      expiryInput.value = `${yyyy}-${mm}-${dd}`;
    }
  };

  // Submit Add Coupon Form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('coupon-code').value.trim();
    const discountType = document.getElementById('coupon-type').value;
    const discountValue = Number(document.getElementById('coupon-value').value);
    const minPurchase = Number(document.getElementById('coupon-min-purchase').value);
    const expiryDate = document.getElementById('coupon-expiry').value;

    try {
      await clovasApi.adminAddCoupon({
        code,
        discountType,
        discountValue,
        minPurchase,
        expiryDate
      });
      showToast('Promo coupon created successfully!');
      form.reset();
      set7DayDefaultExpiry();
      loadAdminCoupons();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Set default on load
  set7DayDefaultExpiry();
  loadAdminCoupons();
};

// --- Panel 5: Registered Shoppers Management Panel ---
export const initShoppersPanel = async () => {
  const user = await verifyAdminAccess();
  if (!user) return;

  const rowsContainer = document.getElementById('admin-shoppers-rows');
  const searchInput = document.getElementById('admin-shopper-search');
  const totalCountEl = document.getElementById('admin-shoppers-count');

  let allUsers = [];

  const loadShoppers = () => {
    // Premium shimmer loader
    const userSkeleton = `
      <tr class="border-b border-slate-100 dark:border-slate-850 animate-pulse">
        <td class="p-4 pl-6">
          <div class="h-4 w-32 rounded shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
        <td class="p-4">
          <div class="h-4 w-40 rounded shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
        <td class="p-4">
          <div class="h-4 w-28 rounded shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
        <td class="p-4">
          <div class="h-6 w-16 rounded-full shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
        <td class="p-4 pr-6 text-right">
          <div class="inline-block h-8 w-24 rounded-lg shimmer bg-slate-200 dark:bg-slate-800"></div>
        </td>
      </tr>
    `;
    rowsContainer.innerHTML = userSkeleton.repeat(4);

    clovasApi.adminGetUsers()
      .then(users => {
        allUsers = users;
        renderShoppers(users);
      })
      .catch(err => {
        showToast(err.message, 'error');
      });
  };

  const renderShoppers = (usersList) => {
    rowsContainer.innerHTML = '';
    totalCountEl.textContent = usersList.length;

    if (usersList.length === 0) {
      rowsContainer.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-slate-500 font-semibold">No shoppers found.</td></tr>';
      return;
    }

    usersList.forEach(shopper => {
      const regDate = new Date(shopper.createdAt).toLocaleDateString();
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 text-xs font-semibold transition-colors';
      
      const roleBadge = shopper.role === 'admin' 
        ? `<span class="px-2.5 py-1 bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 rounded-full text-[10px] uppercase font-bold tracking-wider">Admin</span>`
        : `<span class="px-2.5 py-1 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-full text-[10px] uppercase font-bold tracking-wider">Shopper</span>`;

      tr.innerHTML = `
        <td class="p-4 pl-6 font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <div class="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center font-bold text-slate-600 dark:text-slate-350">
            ${shopper.name ? shopper.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span>${shopper.name || 'Anonymous User'}</span>
        </td>
        <td class="p-4 text-slate-550">${shopper.email}</td>
        <td class="p-4 text-slate-500">${regDate}</td>
        <td class="p-4">${roleBadge}</td>
        <td class="p-4 pr-6 text-right">
          <button class="role-toggle-btn px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-xs transition-colors" data-id="${shopper._id}" data-role="${shopper.role}">
            Toggle Role
          </button>
        </td>
      `;

      // Event Listener for toggling roles
      tr.querySelector('.role-toggle-btn').addEventListener('click', async (e) => {
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

      rowsContainer.appendChild(tr);
    });
  };

  // Search filter keyup listener
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

  loadShoppers();
};

