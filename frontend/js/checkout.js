import clovasApi from './api.js';
import clovasAuth from './firebase-config.js';
import { getCart, clearCart, showToast } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await clovasAuth.getCurrentUser();
  if (!user) {
    window.location.href = 'auth.html';
  }

  let siteConfig = null;
  try {
    siteConfig = await clovasApi.getConfig();
  } catch (err) {
    console.error('Failed to load site config:', err);
    siteConfig = { freeShippingThreshold: 5000, shippingFeeStandard: 100 };
  }

  const cart = getCart();
  if (cart.length === 0) {
    window.location.href = 'cart.html';
    return;
  }

  // DOM elements
  const recapItems = document.getElementById('recap-items');
  const recapSubtotal = document.getElementById('recap-subtotal');
  const recapDiscountRow = document.getElementById('recap-discount-row');
  const recapDiscount = document.getElementById('recap-discount');
  const recapShipping = document.getElementById('recap-shipping');
  const recapTotal = document.getElementById('recap-total');

  const shipName = document.getElementById('ship-name');
  const shipPhone = document.getElementById('ship-phone');
  const shipStreet = document.getElementById('ship-street');
  const shipCity = document.getElementById('ship-city');
  const shipZip = document.getElementById('ship-zip');
  const shipCountry = document.getElementById('ship-country');

  const savedAddressesSection = document.getElementById('saved-addresses-section');
  const addressOptionsList = document.getElementById('address-options-list');

  const paymentSslCard = document.getElementById('payment-ssl-card');
  const paymentCodCard = document.getElementById('payment-cod-card');
  const placeOrderBtn = document.getElementById('place-order-btn');

  let activePaymentMethod = 'SSLCommerz';
  let totals = JSON.parse(localStorage.getItem('checkout_totals') || 'null');

  // Load Totals Overview
  if (!totals) {
    // Recalculate
    const sub = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    const freeShippingLimit = siteConfig ? siteConfig.freeShippingThreshold : 5000;
    const shippingFee = siteConfig ? siteConfig.shippingFeeStandard : 100;
    const ship = sub > freeShippingLimit ? 0 : shippingFee;
    totals = { subtotal: sub, discountAmount: 0, shipping: ship, total: sub + ship, couponCode: '' };
  }

  recapSubtotal.textContent = `${totals.subtotal} BDT`;
  if (totals.discountAmount > 0) {
    recapDiscount.textContent = totals.discountAmount;
    recapDiscountRow.classList.remove('hidden');
  }
  recapShipping.textContent = totals.shipping === 0 ? 'FREE' : `${totals.shipping} BDT`;
  recapTotal.textContent = `${totals.total} BDT`;

  // Render Recap items list
  recapItems.innerHTML = '';
  cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'flex justify-between items-center text-xs';
    div.innerHTML = `
      <span class="text-slate-550 dark:text-slate-450 line-clamp-1">${item.title} <span class="font-bold">x${item.quantity}</span></span>
      <span class="font-bold text-slate-800 dark:text-white">${item.price * item.quantity} BDT</span>
    `;
    recapItems.appendChild(div);
  });

  // Fetch saved addresses from profile
  try {
    const profile = await clovasApi.syncUser();
    
    // Autofill name and phone
    shipName.value = profile.name || '';
    shipPhone.value = profile.phone || '';

    if (profile.addresses && profile.addresses.length > 0) {
      savedAddressesSection.classList.remove('hidden');
      addressOptionsList.innerHTML = '';
      
      profile.addresses.forEach((addr, idx) => {
        const card = document.createElement('div');
        card.className = 'p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-500 cursor-pointer text-xs font-medium transition-all relative flex flex-col justify-between h-28';
        card.innerHTML = `
          <div>
            <p class="font-bold text-slate-800 dark:text-white">${addr.street}</p>
            <p class="text-slate-500 dark:text-slate-400 mt-1">${addr.city} - ${addr.zip}, ${addr.country}</p>
          </div>
          <button class="select-addr-btn text-[10px] font-bold text-primary-600 dark:text-primary-400 hover:underline mt-2 self-start" data-idx="${idx}">Select Address</button>
        `;
        
        card.querySelector('.select-addr-btn').addEventListener('click', (e) => {
          e.preventDefault();
          shipStreet.value = addr.street;
          shipCity.value = addr.city;
          shipZip.value = addr.zip;
          shipCountry.value = addr.country;
          showToast('Address autofilled!');
        });

        addressOptionsList.appendChild(card);
      });
    }
  } catch (error) {
    console.warn('Could not sync user profile addresses:', error.message);
  }

  // Toggle active styling of payment cards
  const paymentSslInput = paymentSslCard.querySelector('input');
  const paymentCodInput = paymentCodCard.querySelector('input');

  paymentSslCard.addEventListener('click', () => {
    activePaymentMethod = 'SSLCommerz';
    paymentSslInput.checked = true;
    paymentCodInput.checked = false;
    
    paymentSslCard.className = 'flex items-center gap-4 p-4 rounded-xl border-2 border-primary-600 bg-primary-50/10 dark:bg-primary-950/10 cursor-pointer transition-all relative';
    paymentCodCard.className = 'flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-350 transition-all relative';
    
    paymentSslCard.querySelector('span span').classList.replace('bg-transparent', 'bg-primary-600');
    paymentCodCard.querySelector('span span').classList.replace('bg-primary-600', 'bg-transparent');
    
    placeOrderBtn.textContent = 'Place Order & Pay';
  });

  paymentCodCard.addEventListener('click', () => {
    activePaymentMethod = 'COD';
    paymentCodInput.checked = true;
    paymentSslInput.checked = false;

    paymentCodCard.className = 'flex items-center gap-4 p-4 rounded-xl border-2 border-primary-600 bg-primary-50/10 dark:bg-primary-950/10 cursor-pointer transition-all relative';
    paymentSslCard.className = 'flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-350 transition-all relative';
    
    paymentCodCard.querySelector('span span').classList.replace('bg-transparent', 'bg-primary-600');
    paymentSslCard.querySelector('span span').classList.replace('bg-primary-600', 'bg-transparent');
    
    placeOrderBtn.textContent = 'Confirm Order (COD)';
  });

  // Handle Order Placement
  placeOrderBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const name = shipName.value.trim();
    const phone = shipPhone.value.trim();
    const street = shipStreet.value.trim();
    const city = shipCity.value.trim();
    const zip = shipZip.value.trim();
    const country = shipCountry.value.trim();

    if (!name || !phone || !street || !city || !zip) {
      showToast('Please fill in all shipping details.', 'error');
      return;
    }

    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Processing...';

    const orderPayload = {
      items: cart.map(item => ({
        product: item.product,
        title: item.title,
        image: item.image,
        quantity: item.quantity,
        price: item.price
      })),
      shippingAddress: { name, phone, street, city, zip, country },
      paymentMethod: activePaymentMethod,
      couponCode: totals.couponCode || '',
      discountAmount: totals.discountAmount || 0
    };

    try {
      const orderResult = await clovasApi.createOrder(orderPayload);
      clearCart();
      localStorage.removeItem('checkout_totals');

      if (activePaymentMethod === 'SSLCommerz') {
        showToast('Initiating secure payment redirect...');
        const paymentResult = await clovasApi.initiatePayment(orderResult._id);
        
        // Redirect to SSLCommerz gateway URL
        window.location.href = paymentResult.GatewayPageURL;
      } else {
        // COD path
        showToast('Order confirmed successfully!');
        setTimeout(() => {
          window.location.href = 'dashboard.html?status=success&method=cod&tab=orders';
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Order placement failed.', 'error');
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = activePaymentMethod === 'SSLCommerz' ? 'Place Order & Pay' : 'Confirm Order (COD)';
    }
  });

});
