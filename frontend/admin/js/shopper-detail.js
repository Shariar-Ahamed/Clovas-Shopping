import clovasApi from '../../js/api.js';
import clovasAuth from '../../js/firebase-config.js';
import { showToast, showConfirm } from '../../js/main.js';

// --- Shared Admin Access Verifier ---
const verifyAdminAccess = async () => {
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

document.addEventListener('DOMContentLoaded', async () => {
  const user = await verifyAdminAccess();
  if (!user) return;

  // Get URL parameter id
  const urlParams = new URLSearchParams(window.location.search);
  const shopperId = urlParams.get('id');
  if (!shopperId) {
    showToast('Shopper ID not specified.', 'error');
    setTimeout(() => { window.location.href = 'shoppers.html'; }, 1500);
    return;
  }

  // Bind DOM elements
  const dAvatar = document.getElementById('detail-shopper-avatar');
  const dName = document.getElementById('detail-shopper-name');
  const dRole = document.getElementById('detail-shopper-role');
  const dUsername = document.getElementById('detail-shopper-username');
  const dEmail = document.getElementById('detail-shopper-email');
  const dPhone = document.getElementById('detail-shopper-phone');
  const dJoined = document.getElementById('detail-shopper-joined');
  const dAddresses = document.getElementById('detail-shopper-addresses');
  
  const dCartList = document.getElementById('detail-shopper-cart-list');
  const dWishlistList = document.getElementById('detail-shopper-wishlist-list');
  const dOrdersList = document.getElementById('detail-shopper-orders-list');
  
  const roleToggleBtn = document.getElementById('detail-role-toggle-btn');
  const tabButtons = document.querySelectorAll('.tab-btn');

  let shopperData = null;

  // Tab Switcher Controller
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const selectedTab = e.currentTarget.getAttribute('data-tab');
      
      // Update tab styles
      tabButtons.forEach(b => {
        b.classList.remove('border-primary-600', 'text-primary-600');
        b.classList.add('border-transparent', 'text-slate-400');
      });
      e.currentTarget.classList.add('border-primary-600', 'text-primary-600');
      e.currentTarget.classList.remove('border-transparent', 'text-slate-400');

      // Hide all pane content
      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.add('hidden'));
      // Show matching content
      document.getElementById(`tab-content-${selectedTab}`).classList.remove('hidden');
    });
  });

  const loadShopperProfile = async () => {
    try {
      shopperData = await clovasApi.adminGetUserDetails(shopperId);
      renderProfile(shopperData);
    } catch (err) {
      showToast('Failed to load user profile.', 'error');
      console.error(err);
    }
  };

  const renderProfile = (shopper) => {
    dAvatar.textContent = shopper.name ? shopper.name.charAt(0).toUpperCase() : 'U';
    dName.textContent = shopper.name || 'Anonymous User';
    dRole.textContent = shopper.role === 'admin' ? 'Admin Access Account' : 'User/Shopper Account';
    dUsername.textContent = shopper.username || '-';
    dEmail.textContent = shopper.email || '-';
    dPhone.textContent = shopper.phone || 'Not provided';
    dJoined.textContent = new Date(shopper.createdAt).toLocaleDateString() + ' ' + new Date(shopper.createdAt).toLocaleTimeString();

    // Toggle Role status config
    roleToggleBtn.setAttribute('data-role', shopper.role);

    // Addresses
    dAddresses.innerHTML = '';
    if (shopper.addresses && shopper.addresses.length > 0) {
      shopper.addresses.forEach((addr, i) => {
        const div = document.createElement('div');
        div.className = 'bg-slate-100/50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-150 dark:border-slate-850/50';
        div.innerHTML = `<span class="text-primary-500 font-bold font-mono text-[9px] block mb-1">SHIPPING LOCATION ${i+1}</span>
          <p class="font-semibold text-xs leading-normal">${addr.street}, ${addr.city}, ${addr.zip} (${addr.country})</p>`;
        dAddresses.appendChild(div);
      });
    } else {
      dAddresses.innerHTML = '<p class="text-slate-400 italic font-semibold text-center py-2">No registered address locations found.</p>';
    }

    // Render active cart items
    const cart = shopper.cart || [];
    dCartList.innerHTML = '';
    if (cart.length > 0) {
      let subTotal = 0;
      cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subTotal += itemTotal;

        const div = document.createElement('div');
        div.className = 'glass p-4 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center justify-between gap-4 transition-all hover:translate-x-1 duration-300';
        div.innerHTML = `
          <div class="flex items-center gap-4">
            <div class="h-16 w-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 flex-shrink-0">
              <img src="${item.image}" class="h-full w-full object-cover">
            </div>
            <div>
              <p class="font-serif text-sm font-bold text-slate-800 dark:text-white line-clamp-1">${item.title}</p>
              <p class="text-[10px] font-bold text-slate-400 mt-0.5">${item.price} BDT x ${item.quantity}</p>
            </div>
          </div>
          <span class="font-bold text-sm text-slate-800 dark:text-white">${itemTotal} BDT</span>
        `;
        dCartList.appendChild(div);
      });

      // Total Cart Summary Card
      const summaryCard = document.createElement('div');
      summaryCard.className = 'glass p-5 rounded-2xl border border-primary-500/20 bg-primary-50/5 dark:bg-primary-950/5 flex justify-between items-center text-xs font-bold';
      summaryCard.innerHTML = `
        <span class="text-slate-400 uppercase tracking-wider">Estimated Bag Value</span>
        <span class="text-primary-600 dark:text-primary-400 font-extrabold text-sm">${subTotal} BDT</span>
      `;
      dCartList.appendChild(summaryCard);
    } else {
      dCartList.innerHTML = `
        <div class="glass p-8 rounded-3xl border border-slate-100 dark:border-slate-850 text-center space-y-2">
          <span class="inline-flex h-10 w-10 bg-slate-100 dark:bg-slate-900 rounded-xl items-center justify-center text-slate-400">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          </span>
          <p class="text-xs text-slate-400 italic font-semibold">Active shopping bag is currently empty.</p>
        </div>
      `;
    }

    // Render liked outfits (wishlist)
    const wishlist = shopper.wishlist || [];
    dWishlistList.innerHTML = '';
    if (wishlist.length > 0) {
      wishlist.forEach(item => {
        const div = document.createElement('div');
        div.className = 'glass p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850 flex items-center gap-3.5 transition-all hover:scale-[1.01] duration-300';
        div.innerHTML = `
          <div class="h-16 w-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 flex-shrink-0">
            <img src="${item.image}" class="h-full w-full object-cover">
          </div>
          <div class="flex-grow min-w-0">
            <p class="font-serif text-xs font-bold text-slate-800 dark:text-white truncate">${item.title}</p>
            <p class="text-[10px] font-bold text-slate-400 mt-1">${item.price} BDT</p>
          </div>
        `;
        dWishlistList.appendChild(div);
      });
    } else {
      dWishlistList.innerHTML = `
        <div class="col-span-full glass p-8 rounded-3xl border border-slate-100 dark:border-slate-850 text-center space-y-2">
          <span class="inline-flex h-10 w-10 bg-slate-100 dark:bg-slate-900 rounded-xl items-center justify-center text-slate-400">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
          </span>
          <p class="text-xs text-slate-400 italic font-semibold">No loved outfits in wishlist yet.</p>
        </div>
      `;
    }

    // Render purchase history orders
    dOrdersList.innerHTML = '<p class="text-xs text-slate-500 py-4 text-center">Loading past transactions...</p>';
    clovasApi.adminGetOrders()
      .then(orders => {
        const userOrders = orders.filter(o => 
          (o.user && o.user._id === shopper._id) || 
          (o.shippingAddress && o.shippingAddress.email && o.shippingAddress.email.toLowerCase() === shopper.email.toLowerCase())
        );

        dOrdersList.innerHTML = '';
        if (userOrders.length > 0) {
          userOrders.forEach(o => {
            const dateStr = new Date(o.createdAt).toLocaleDateString() + ' ' + new Date(o.createdAt).toLocaleTimeString();
            const div = document.createElement('div');
            div.className = 'glass p-5 rounded-3xl border border-slate-100 dark:border-slate-850/60 bg-white/40 dark:bg-slate-900/10 space-y-3';
            
            const payBadge = o.paymentStatus === 'Paid'
              ? `<span class="px-2.5 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg text-[9px] font-bold uppercase tracking-wider">Paid</span>`
              : `<span class="px-2.5 py-1 bg-yellow-50 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-400 rounded-lg text-[9px] font-bold uppercase tracking-wider">${o.paymentStatus}</span>`;

            const itemsListText = o.items.map(i => `<span class="font-bold text-slate-800 dark:text-white">${i.title}</span> (x${i.quantity})`).join(', ');

            div.innerHTML = `
              <div class="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100 dark:border-slate-850/40 pb-2">
                <span>TXN: ${o.transactionId}</span>
                <span>${dateStr}</span>
              </div>
              <div class="text-xs font-semibold text-slate-650 dark:text-slate-350 leading-relaxed">
                <span class="text-slate-400 font-medium">Purchased Items:</span> ${itemsListText}
              </div>
              <div class="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-850/40">
                <span class="font-extrabold text-sm text-slate-800 dark:text-white">Amount: ${o.totalAmount} BDT</span>
                <div class="flex items-center gap-2">
                  ${payBadge}
                  <span class="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[9px] font-bold uppercase tracking-wider">${o.orderStatus}</span>
                </div>
              </div>
            `;
            dOrdersList.appendChild(div);
          });
        } else {
          dOrdersList.innerHTML = `
            <div class="glass p-8 rounded-3xl border border-slate-100 dark:border-slate-850 text-center space-y-2">
              <span class="inline-flex h-10 w-10 bg-slate-100 dark:bg-slate-900 rounded-xl items-center justify-center text-slate-400">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </span>
              <p class="text-xs text-slate-400 italic font-semibold">No purchase history records found.</p>
            </div>
          `;
        }
      })
      .catch(err => {
        dOrdersList.innerHTML = `<p class="text-xs text-red-500 py-2 text-center">Failed to load order history: ${err.message}</p>`;
      });
  };

  // Wire Role change trigger
  roleToggleBtn.addEventListener('click', () => {
    if (!shopperData) return;
    const currentRole = roleToggleBtn.getAttribute('data-role');
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    showConfirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`, async () => {
      try {
        await clovasApi.adminUpdateUserRole(shopperId, newRole);
        showToast('User access role updated.');
        loadShopperProfile();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  // Load profile details
  loadShopperProfile();
});
