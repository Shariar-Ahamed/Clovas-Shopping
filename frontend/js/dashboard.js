import clovasApi from './api.js';
import clovasAuth from './firebase-config.js';
import { getWishlist, toggleWishlist, addToCart, showToast } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await clovasAuth.getCurrentUser();
  if (!user) {
    window.location.href = 'auth.html';
    return;
  }

  // Set Profile Name/Email metadata
  document.getElementById('avatar-letter').textContent = (user.displayName || user.email || 'U').substring(0, 1).toUpperCase();
  document.getElementById('user-display-name').textContent = user.displayName || user.email.split('@')[0];
  document.getElementById('user-display-email').textContent = user.email;

  // Handle URL Success Notification
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('status') === 'success') {
    const txnId = urlParams.get('txnId') || 'COD';
    document.getElementById('status-notification').classList.remove('hidden');
    document.getElementById('success-txn-id').textContent = txnId;
    showToast('Order placed successfully!', 'success');
  }

  // Dashboard Tabs Toggle
  const tabButtons = document.querySelectorAll('.nav-tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  const switchTab = (tabName) => {
    tabButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.className = 'nav-tab-btn active px-4 py-3 rounded-xl text-left text-xs font-bold transition-all bg-primary-600 text-white shadow-md flex items-center gap-2.5';
      } else {
        btn.className = 'nav-tab-btn px-4 py-3 rounded-xl text-left text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all flex items-center gap-2.5';
      }
    });

    tabPanels.forEach(panel => {
      if (panel.id === `panel-${tabName}`) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });

    if (tabName === 'wishlist') {
      renderWishlist();
    }
  };

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // Check if specific tab requested in URL
  if (urlParams.has('tab')) {
    switchTab(urlParams.get('tab'));
  }

  // --- Orders Tab Handler ---
  const ordersListContainer = document.getElementById('orders-list-container');

  const loadOrders = () => {
    ordersListContainer.innerHTML = '<div class="shimmer h-24 rounded-2xl"></div>';

    clovasApi.getMyOrders()
      .then(orders => {
        if (orders.length === 0) {
          ordersListContainer.innerHTML = `
            <div class="glass p-10 rounded-2xl text-center border border-slate-100 dark:border-slate-800">
              <p class="text-sm text-slate-500">You haven't placed any orders yet.</p>
              <a href="shop.html" class="text-xs font-bold text-primary-600 hover:underline mt-2 inline-block">Shop Premium Outfits</a>
            </div>
          `;
          return;
        }

        ordersListContainer.innerHTML = '';
        orders.forEach(order => {
          const formattedDate = new Date(order.createdAt).toLocaleDateString();
          
          // Generate tracking timeline progress status classes
          const statusOrder = ['Processing', 'Shipped', 'Delivered'];
          const activeIdx = statusOrder.indexOf(order.orderStatus);

          const isCancelled = order.orderStatus === 'Cancelled';

          const card = document.createElement('div');
          card.className = 'glass p-6 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-850/45 shadow-sm flex flex-col gap-6 animate-fade-in';
          card.innerHTML = `
            <!-- Order Header Info -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-150 dark:border-slate-800 pb-4 text-xs font-medium">
              <div>
                <p class="text-slate-400">Transaction ID</p>
                <p class="font-bold text-slate-800 dark:text-white mt-0.5">${order.transactionId}</p>
              </div>
              <div>
                <p class="text-slate-400">Order Date</p>
                <p class="font-bold text-slate-800 dark:text-white mt-0.5">${formattedDate}</p>
              </div>
              <div>
                <p class="text-slate-400">Total BDT</p>
                <p class="font-bold text-slate-800 dark:text-white mt-0.5">${order.totalAmount} BDT</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-1 rounded-md font-bold text-[10px] uppercase ${
                  order.paymentStatus === 'Paid' 
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30' 
                    : order.paymentStatus === 'Failed' || order.paymentStatus === 'Cancelled'
                      ? 'bg-red-50 text-red-650 dark:bg-red-950/20 dark:text-red-450 border border-red-100 dark:border-red-900/30'
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450 border border-amber-100 dark:border-amber-900/30'
                }">${order.paymentStatus}</span>
              </div>
            </div>

            <!-- Order Items -->
            <div class="space-y-4">
              ${order.items.map(item => `
                <div class="flex justify-between items-center gap-4 text-sm font-sans">
                  <div class="flex items-center gap-3">
                    <img src="${item.image}" class="h-10 w-9 rounded-lg object-cover bg-slate-100 dark:bg-slate-900">
                    <p class="font-semibold">${item.title} <span class="text-slate-400 font-normal">x${item.quantity}</span></p>
                  </div>
                  <span class="font-bold">${item.price * item.quantity} BDT</span>
                </div>
              `).join('')}
            </div>

            <!-- Tracking Timeline -->
            ${isCancelled ? `
              <div class="p-4 rounded-xl bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 text-xs text-red-650 font-semibold">
                This order has been cancelled.
              </div>
            ` : `
              <div class="border-t border-slate-150 dark:border-slate-800 pt-6">
                <p class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Tracking Status</p>
                
                <div class="flex items-center justify-between relative max-w-md">
                  <!-- Timeline background bar -->
                  <div class="absolute h-0.5 left-4 right-4 bg-slate-200 dark:bg-slate-800 z-0"></div>
                  <!-- Timeline active fill bar -->
                  <div class="absolute h-0.5 left-4 bg-primary-600 z-0" style="width: ${activeIdx === 0 ? '0%' : activeIdx === 1 ? '50%' : '100%'}"></div>

                  <!-- Dot 1 -->
                  <div class="flex flex-col items-center z-10">
                    <span class="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      activeIdx >= 0 ? 'bg-primary-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }">1</span>
                    <span class="text-[10px] font-bold mt-2">Processing</span>
                  </div>

                  <!-- Dot 2 -->
                  <div class="flex flex-col items-center z-10">
                    <span class="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      activeIdx >= 1 ? 'bg-primary-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }">2</span>
                    <span class="text-[10px] font-bold mt-2">Shipped</span>
                  </div>

                  <!-- Dot 3 -->
                  <div class="flex flex-col items-center z-10">
                    <span class="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      activeIdx >= 2 ? 'bg-primary-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }">3</span>
                    <span class="text-[10px] font-bold mt-2">Delivered</span>
                  </div>
                </div>
              </div>
            `}
          `;
          ordersListContainer.appendChild(card);
        });
      })
      .catch(err => {
        console.error(err);
        ordersListContainer.innerHTML = '<p class="text-red-500 font-medium">Failed to retrieve orders list.</p>';
      });
  };

  loadOrders();

  // --- Wishlist Tab Handler ---
  const wishlistGrid = document.getElementById('wishlist-grid');

  const renderWishlist = () => {
    const wishlist = getWishlist();
    if (wishlist.length === 0) {
      wishlistGrid.innerHTML = `
        <div class="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 italic">
          Your wishlist is empty. Add items in shop catalog.
        </div>
      `;
      return;
    }

    wishlistGrid.innerHTML = '';
    wishlist.forEach(prod => {
      const hasDiscount = prod.discountPrice && prod.discountPrice > 0;
      const priceHtml = hasDiscount 
        ? `<span class="font-bold">${prod.discountPrice} BDT</span>
           <span class="text-xs text-slate-400 line-through ml-2">${prod.price} BDT</span>`
        : `<span class="font-bold">${prod.price} BDT</span>`;

      const card = document.createElement('div');
      card.className = 'group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/40 overflow-hidden shadow-sm hover:shadow relative';
      card.innerHTML = `
        <div class="h-48 overflow-hidden relative">
          <img src="${prod.images[0]}" class="w-full h-full object-cover">
          <button class="remove-wishlist absolute top-3 right-3 h-8 w-8 rounded-lg bg-white/80 dark:bg-slate-950/80 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors">
            &times;
          </button>
        </div>
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <h4 class="font-serif text-sm font-bold line-clamp-1">${prod.title}</h4>
            <div class="mt-1 block text-xs">
              ${priceHtml}
            </div>
          </div>
          <div class="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/40">
            <button class="add-cart-wishlist w-full py-2 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 shadow-sm transition-colors">
              Add to Bag
            </button>
          </div>
        </div>
      `;

      card.querySelector('.remove-wishlist').addEventListener('click', (e) => {
        e.preventDefault();
        toggleWishlist(prod);
        renderWishlist();
      });

      card.querySelector('.add-cart-wishlist').addEventListener('click', (e) => {
        e.preventDefault();
        addToCart(prod, 1);
      });

      wishlistGrid.appendChild(card);
    });
  };

  // --- Profile & Address Book ---
  const profileDetailsForm = document.getElementById('profile-details-form');
  const profileName = document.getElementById('profile-name');
  const profilePhone = document.getElementById('profile-phone');
  const addressBookList = document.getElementById('address-book-list');
  const addAddressForm = document.getElementById('add-address-form');

  const loadProfile = () => {
    clovasApi.syncUser()
      .then(profile => {
        profileName.value = profile.name || '';
        profilePhone.value = profile.phone || '';

        renderAddresses(profile.addresses || []);
      })
      .catch(err => console.error(err));
  };

  const renderAddresses = (addresses) => {
    addressBookList.innerHTML = '';
    if (addresses.length === 0) {
      addressBookList.innerHTML = '<p class="col-span-full text-xs text-slate-500 italic">No saved addresses found.</p>';
      return;
    }

    addresses.forEach(addr => {
      const card = document.createElement('div');
      card.className = 'p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-start gap-4 text-xs';
      card.innerHTML = `
        <div>
          <p class="font-bold text-slate-850 dark:text-slate-200">${addr.street}</p>
          <p class="text-slate-500 dark:text-slate-400 mt-1">${addr.city} - ${addr.zip}, ${addr.country}</p>
        </div>
        <button class="del-addr-btn p-1.5 text-slate-400 hover:text-red-500 transition-colors" data-id="${addr._id}">
          <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      `;

      card.querySelector('.del-addr-btn').addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        try {
          const updated = await clovasApi.deleteAddress(id);
          showToast('Address removed.');
          renderAddresses(updated.addresses);
        } catch (error) {
          showToast(error.message, 'error');
        }
      });

      addressBookList.appendChild(card);
    });
  };

  // Submit Profile Form Updates
  profileDetailsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const updated = await clovasApi.updateProfile({
        name: profileName.value.trim(),
        phone: profilePhone.value.trim()
      });
      showToast('Profile updated successfully!');
      
      // Update display name metadata in sidebar
      document.getElementById('user-display-name').textContent = updated.name;
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  // Submit Add Address Form
  addAddressForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const street = document.getElementById('address-street').value.trim();
    const city = document.getElementById('address-city').value.trim();
    const zip = document.getElementById('address-zip').value.trim();
    const country = document.getElementById('address-country').value.trim();

    try {
      const updated = await clovasApi.addAddress({ street, city, zip, country });
      showToast('New address saved!');
      addAddressForm.reset();
      document.getElementById('address-country').value = 'Bangladesh'; // reset default value
      renderAddresses(updated.addresses);
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  loadProfile();
});
