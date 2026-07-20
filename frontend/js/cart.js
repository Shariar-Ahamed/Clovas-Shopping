import { getCart, updateCartQuantity, removeFromCart, getCartTotal, saveCart, showToast } from './main.js';
import clovasApi from './api.js';
import clovasAuth from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('cart-items-container');
  const summarySubtotal = document.getElementById('summary-subtotal');
  const summaryDiscount = document.getElementById('summary-discount');
  const summaryShipping = document.getElementById('summary-shipping');
  const summaryTotal = document.getElementById('summary-total');
  const couponDiscountRow = document.getElementById('coupon-discount-row');
  const activeCouponCode = document.getElementById('active-coupon-code');

  const couponInput = document.getElementById('coupon-input');
  const applyCouponBtn = document.getElementById('apply-coupon-btn');
  const couponMessage = document.getElementById('coupon-message');
  const checkoutBtn = document.getElementById('checkout-btn');

  let discountAmount = 0;
  let appliedCoupon = null;

  const renderCart = () => {
    const cart = getCart();
    
    if (cart.length === 0) {
      container.innerHTML = `
        <div class="glass p-12 rounded-3xl text-center border border-slate-100 dark:border-slate-800">
          <span class="inline-flex h-16 w-16 bg-slate-100 dark:bg-slate-900 rounded-2xl items-center justify-center text-slate-400 mb-4">
            <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          </span>
          <h3 class="font-serif text-xl font-bold mb-2">Your Bag is Empty</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-6">Looks like you haven't added anything premium yet.</p>
          <a href="shop.html" class="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs rounded-xl shadow-md transition-colors inline-block">Discover Outfits</a>
        </div>
      `;
      summarySubtotal.textContent = '0 BDT';
      summaryDiscount.textContent = '0';
      summaryTotal.textContent = '0 BDT';
      checkoutBtn.disabled = true;
      checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
      return;
    }

    checkoutBtn.disabled = false;
    checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    container.innerHTML = '';

    cart.forEach(item => {
      const card = document.createElement('div');
      card.className = 'glass p-5 md:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6 border border-slate-100 dark:border-slate-850/40 relative animate-fade-in';
      card.innerHTML = `
        <!-- Left: Image & Title -->
        <div class="flex items-center gap-4">
          <div class="h-20 w-16 md:h-24 md:w-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 flex-shrink-0">
            <img src="${item.image}" class="w-full h-full object-cover">
          </div>
          <div>
            <h4 class="font-serif text-sm font-bold text-slate-800 dark:text-white line-clamp-2">${item.title}</h4>
            <span class="text-xs text-slate-500 dark:text-slate-400 mt-1 block">${item.price} BDT</span>
          </div>
        </div>

        <!-- Right: Qty Controls, Price, Remove -->
        <div class="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 dark:border-slate-800/20">
          <!-- Counter -->
          <div class="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden h-9">
            <button class="dec-btn w-8 h-full flex items-center justify-center font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" data-id="${item.product}">-</button>
            <span class="qty-val px-3 font-semibold text-xs">${item.quantity}</span>
            <button class="inc-btn w-8 h-full flex items-center justify-center font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" data-id="${item.product}">+</button>
          </div>

          <!-- Total price per item -->
          <span class="text-sm font-bold text-slate-800 dark:text-white w-20 sm:w-24 text-right">${item.price * item.quantity} BDT</span>

          <!-- Delete -->
          <button class="remove-btn p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0" data-id="${item.product}">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      `;

      // Event binding
      card.querySelector('.dec-btn').addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        updateCartQuantity(id, item.quantity - 1);
        recalcTotals();
        renderCart();
      });

      card.querySelector('.inc-btn').addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        updateCartQuantity(id, item.quantity + 1);
        recalcTotals();
        renderCart();
      });

      card.querySelector('.remove-btn').addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        removeFromCart(id);
        recalcTotals();
        renderCart();
      });

      container.appendChild(card);
    });

    recalcTotals();
  };

  const recalcTotals = () => {
    const subtotal = getCartTotal();
    summarySubtotal.textContent = `${subtotal} BDT`;

    // Calculate coupon discount
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percentage') {
        discountAmount = (subtotal * appliedCoupon.discountValue) / 100;
      } else {
        discountAmount = appliedCoupon.discountValue;
      }
      // Coupon validation check
      if (subtotal < appliedCoupon.minPurchase) {
        // Discard coupon
        appliedCoupon = null;
        discountAmount = 0;
        couponDiscountRow.classList.add('hidden');
        couponMessage.textContent = 'Subtotal fell below the coupon min purchase limit. Coupon removed.';
        couponMessage.className = 'text-xs font-semibold mt-2 text-red-500';
      } else {
        summaryDiscount.textContent = discountAmount;
        couponDiscountRow.classList.remove('hidden');
        activeCouponCode.textContent = appliedCoupon.code;
      }
    }

    const shipping = subtotal > 5000 ? 0 : 100;
    summaryShipping.textContent = shipping === 0 ? 'FREE' : `${shipping} BDT`;

    const total = Math.max(0, subtotal - discountAmount + shipping);
    summaryTotal.textContent = `${total} BDT`;

    // Persist totals for checkout
    localStorage.setItem('checkout_totals', JSON.stringify({
      subtotal,
      discountAmount,
      shipping,
      total,
      couponCode: appliedCoupon ? appliedCoupon.code : ''
    }));
  };

  // Coupon application
  applyCouponBtn.addEventListener('click', async () => {
    const code = couponInput.value.trim().toUpperCase();
    if (!code) {
      couponMessage.textContent = 'Please enter a coupon code.';
      couponMessage.className = 'text-xs font-semibold mt-2 text-red-550';
      couponMessage.classList.remove('hidden');
      return;
    }

    const user = await clovasAuth.getCurrentUser();
    if (!user) {
      showToast('You must be signed in to apply coupons.', 'error');
      couponMessage.textContent = 'Sign in to apply coupons.';
      couponMessage.className = 'text-xs font-semibold mt-2 text-red-500';
      couponMessage.classList.remove('hidden');
      return;
    }

    try {
      applyCouponBtn.disabled = true;
      applyCouponBtn.textContent = 'Checking...';
      const subtotal = getCartTotal();

      const couponDetails = await clovasApi.validateCoupon(code, subtotal);
      
      appliedCoupon = {
        code: couponDetails.code,
        discountType: couponDetails.discountType,
        discountValue: couponDetails.discountValue,
        minPurchase: couponDetails.minPurchase || 0
      };

      couponMessage.textContent = `Coupon ${code} applied! Saved ${couponDetails.discountAmount} BDT.`;
      couponMessage.className = 'text-xs font-semibold mt-2 text-emerald-500';
      couponMessage.classList.remove('hidden');
      
      recalcTotals();
    } catch (err) {
      appliedCoupon = null;
      discountAmount = 0;
      couponDiscountRow.classList.add('hidden');
      couponMessage.textContent = err.message || 'Invalid Coupon Code.';
      couponMessage.className = 'text-xs font-semibold mt-2 text-red-500';
      couponMessage.classList.remove('hidden');
      recalcTotals();
    } finally {
      applyCouponBtn.disabled = false;
      applyCouponBtn.textContent = 'Apply';
    }
  });

  // Proceed Checkout
  checkoutBtn.addEventListener('click', async () => {
    const user = await clovasAuth.getCurrentUser();
    if (!user) {
      showToast('Authentication required. Redirecting to sign in...', 'error');
      setTimeout(() => window.location.href = 'auth.html', 1200);
      return;
    }

    window.location.href = 'checkout.html';
  });

  renderCart();
});
