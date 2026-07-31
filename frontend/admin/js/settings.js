import clovasApi from '../../js/api.js';
import clovasAuth from '../../js/firebase-config.js';
import { showToast } from '../../js/main.js';

const verifyAdminAccess = async () => {
  // 1. Quick check cached session for instant load
  const cachedUser = clovasAuth.getCachedUser();
  if (cachedUser) {
    const isCachedAdmin = (cachedUser.email && (cachedUser.email.includes('admin') || cachedUser.email === 'clovas.verify@gmail.com')) || cachedUser.role === 'admin';
    if (isCachedAdmin) {
      // Run background check to verify session, but don't block the UI
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

  // 2. Block and load if no cache is present
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

const formatDateForDatetimeLocal = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

document.addEventListener('DOMContentLoaded', async () => {
  const user = await verifyAdminAccess();
  if (!user) return;

  // Bind Form elements
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

  // Load Current Config Settings
  try {
    const config = await clovasApi.getConfig();

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

  } catch (error) {
    showToast('Failed to load system configurations.', 'error');
    console.error(error);
  }

  // Handle Form Submission
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
});
