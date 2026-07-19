import clovasAuth from './firebase-config.js';
import { showToast } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
  const authTitle = document.getElementById('auth-title');
  const authSubtitle = document.getElementById('auth-subtitle');
  const errorAlert = document.getElementById('auth-error-alert');
  const errorMessage = document.getElementById('auth-error-message');

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const forgotForm = document.getElementById('forgot-form');

  const toggleAuthBtn = document.getElementById('toggle-auth-btn');
  const toggleText = document.getElementById('toggle-text');
  const googleLoginBtn = document.getElementById('google-login-btn');
  const socialDivider = document.getElementById('social-divider');

  const gotoForgot = document.getElementById('goto-forgot');
  const backToLogin = document.getElementById('back-to-login');

  // OTP elements
  const toggleOtpModeBtn = document.getElementById('toggle-otp-mode-btn');
  const loginPasswordGroup = document.getElementById('login-password-group');
  const loginOtpGroup = document.getElementById('login-otp-group');
  const loginPassword = document.getElementById('login-password');
  const loginOtp = document.getElementById('login-otp');
  const sendOtpBtn = document.getElementById('send-otp-btn');
  const otpTimerMessage = document.getElementById('otp-timer-message');
  const loginEmail = document.getElementById('login-email');

  // Registration OTP Modal elements
  const registerOtpModal = document.getElementById('register-otp-modal');
  const closeOtpModalBtn = document.getElementById('close-otp-modal-btn');
  const otpSentEmail = document.getElementById('otp-sent-email');
  const modalErrorAlert = document.getElementById('modal-error-alert');
  const modalErrorMessage = document.getElementById('modal-error-message');
  const otpVerificationForm = document.getElementById('otp-verification-form');
  const verificationOtpInput = document.getElementById('verification-otp');
  const countdownTimer = document.getElementById('countdown-timer');
  const modalResendBtn = document.getElementById('modal-resend-btn');

  let currentMode = 'login'; // login, register, forgot
  let isOtpMode = false;
  let countdownInterval = null;

  const showError = (msg) => {
    errorMessage.textContent = msg;
    errorAlert.classList.remove('hidden');
  };

  const hideError = () => {
    errorAlert.classList.add('hidden');
  };

  const showModalError = (msg) => {
    modalErrorMessage.textContent = msg;
    modalErrorAlert.classList.remove('hidden');
  };

  const hideModalError = () => {
    modalErrorAlert.classList.add('hidden');
  };

  const getApiBaseUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    return '/api';
  };

  // Toggle Forms
  const switchMode = (mode) => {
    currentMode = mode;
    hideError();

    // Reset OTP mode when switching between forms
    isOtpMode = false;
    loginPasswordGroup.classList.remove('hidden');
    loginPassword.required = true;
    loginOtpGroup.classList.add('hidden');
    loginOtp.required = false;
    toggleOtpModeBtn.textContent = 'Sign In with OTP';

    if (mode === 'login') {
      authTitle.textContent = 'Welcome Back';
      authSubtitle.textContent = 'Sign in to your premium shopping account';
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
      forgotForm.classList.add('hidden');
      toggleText.textContent = "Don't have an account?";
      toggleAuthBtn.textContent = 'Create one';
      googleLoginBtn.classList.remove('hidden');
      socialDivider.classList.remove('hidden');
      document.getElementById('toggle-container').classList.remove('hidden');
    } else if (mode === 'register') {
      authTitle.textContent = 'Create Account';
      authSubtitle.textContent = 'Join Clovas Shopping to get started';
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
      forgotForm.classList.add('hidden');
      toggleText.textContent = 'Already have an account?';
      toggleAuthBtn.textContent = 'Sign In';
      googleLoginBtn.classList.remove('hidden');
      socialDivider.classList.remove('hidden');
      document.getElementById('toggle-container').classList.remove('hidden');
    } else if (mode === 'forgot') {
      authTitle.textContent = 'Reset Password';
      authSubtitle.textContent = "Enter your email to receive a password reset link";
      loginForm.classList.add('hidden');
      registerForm.classList.add('hidden');
      forgotForm.classList.remove('hidden');
      googleLoginBtn.classList.add('hidden');
      socialDivider.classList.add('hidden');
      document.getElementById('toggle-container').classList.add('hidden');
    }
  };

  toggleAuthBtn.addEventListener('click', () => {
    if (currentMode === 'login') {
      switchMode('register');
    } else {
      switchMode('login');
    }
  });

  gotoForgot.addEventListener('click', () => switchMode('forgot'));
  backToLogin.addEventListener('click', () => switchMode('login'));

  // Toggle OTP Sign-in Mode
  toggleOtpModeBtn.addEventListener('click', () => {
    isOtpMode = !isOtpMode;
    hideError();

    if (isOtpMode) {
      loginPasswordGroup.classList.add('hidden');
      loginPassword.required = false;
      loginOtpGroup.classList.remove('hidden');
      loginOtp.required = true;
      toggleOtpModeBtn.textContent = 'Sign In with Password';
    } else {
      loginPasswordGroup.classList.remove('hidden');
      loginPassword.required = true;
      loginOtpGroup.classList.add('hidden');
      loginOtp.required = false;
      toggleOtpModeBtn.textContent = 'Sign In with OTP';
    }
  });

  // Handle Send OTP click
  sendOtpBtn.addEventListener('click', async () => {
    const email = loginEmail.value;
    if (!email) {
      return showError('Please enter your email address first.');
    }

    hideError();
    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = 'Sending...';

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP code.');
      }

      showToast('OTP code sent successfully!');
      
      // Start 60 second timer
      let seconds = 60;
      otpTimerMessage.classList.remove('hidden');
      
      if (data.mockOtp) {
        otpTimerMessage.textContent = `[MOCK] Code: ${data.mockOtp}`;
        console.log(`[MOCK OTP] Code: ${data.mockOtp}`);
      } else {
        otpTimerMessage.textContent = `Resend OTP in ${seconds}s`;
      }

      const interval = setInterval(() => {
        seconds--;
        if (seconds <= 0) {
          clearInterval(interval);
          sendOtpBtn.disabled = false;
          sendOtpBtn.textContent = 'Send OTP';
          otpTimerMessage.classList.add('hidden');
        } else {
          if (!data.mockOtp) {
            otpTimerMessage.textContent = `Resend OTP in ${seconds}s`;
          }
        }
      }, 1000);

    } catch (err) {
      showError(err.message);
      sendOtpBtn.disabled = false;
      sendOtpBtn.textContent = 'Send OTP';
    }
  });

  // Handle Login Form Submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    const email = loginEmail.value;

    if (isOtpMode) {
      const otp = loginOtp.value;
      if (!otp || otp.length < 6) {
        return showError('Please enter a valid 6-digit OTP code.');
      }

      try {
        showToast('Verifying OTP...', 'success');
        
        const response = await fetch(`${getApiBaseUrl()}/auth/verify-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, otp })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'OTP verification failed.');
        }

        // Log in to Firebase using Custom Token
        await clovasAuth.signInWithCustomToken(data.customToken);

        showToast(data.message || 'Logged in successfully!');

        // If it is admin email, redirect to Admin, else standard home
        if (email.includes('admin')) {
          setTimeout(() => window.location.href = 'admin/index.html', 1000);
        } else {
          setTimeout(() => window.location.href = 'index.html', 1000);
        }
      } catch (error) {
        showError(error.message);
      }
    } else {
      const password = loginPassword.value;

      try {
        showToast('Signing in...', 'success');
        await clovasAuth.login(email, password);
        showToast('Logged in successfully!');
        
        // If it is admin email, redirect to Admin, else standard home
        if (email.includes('admin')) {
          setTimeout(() => window.location.href = 'admin/index.html', 1000);
        } else {
          setTimeout(() => window.location.href = 'index.html', 1000);
        }
      } catch (error) {
        showError(error.message);
      }
    }
  });

  // Modal Control Functions
  const openOtpModal = (email) => {
    otpSentEmail.textContent = email;
    verificationOtpInput.value = '';
    hideModalError();
    
    // Reset view states in case of modal reuse
    const formContent = document.getElementById('otp-modal-form-content');
    const successContent = document.getElementById('otp-modal-success-content');
    if (formContent && successContent) {
      formContent.classList.remove('hidden');
      successContent.classList.add('hidden');
    }
    
    registerOtpModal.classList.remove('hidden');
    startModalTimer(email);
  };

  const closeOtpModal = () => {
    registerOtpModal.classList.add('hidden');
    if (countdownInterval) clearInterval(countdownInterval);
  };

  closeOtpModalBtn.addEventListener('click', closeOtpModal);

  const startModalTimer = (email) => {
    if (countdownInterval) clearInterval(countdownInterval);
    modalResendBtn.disabled = true;
    
    let totalSeconds = 300; // 5 minutes

    const updateDisplay = () => {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      countdownTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    updateDisplay();

    countdownInterval = setInterval(() => {
      totalSeconds--;
      updateDisplay();

      if (totalSeconds <= 0) {
        clearInterval(countdownInterval);
        modalResendBtn.disabled = false;
        countdownTimer.textContent = '00:00';
      }
    }, 1000);
  };

  // Handle Resend OTP click inside modal
  modalResendBtn.addEventListener('click', async () => {
    const email = otpSentEmail.textContent;
    modalResendBtn.disabled = true;
    modalResendBtn.textContent = 'Resending...';

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP.');
      }

      showToast('New OTP code sent!');
      if (data.mockOtp) {
        console.log(`[MOCK OTP RESEND] Code: ${data.mockOtp}`);
        showModalError(`[MOCK] Use OTP code: ${data.mockOtp}`);
      } else {
        hideModalError();
      }

      startModalTimer(email);
    } catch (err) {
      showModalError(err.message);
      modalResendBtn.disabled = false;
    } finally {
      modalResendBtn.textContent = 'Resend OTP';
    }
  });

  // Handle Register Form Submit (with OTP verification interception)
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    if (password !== confirmPassword) {
      return showError('Passwords do not match');
    }

    try {
      showToast('Sending verification code...', 'success');
      const response = await fetch(`${getApiBaseUrl()}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code.');
      }

      showToast('Verification code sent successfully!');
      if (data.mockOtp) {
        console.log(`[MOCK OTP] Code: ${data.mockOtp}`);
      }

      // Store form values temporarily on dataset to complete registration later
      registerForm.dataset.name = name;
      registerForm.dataset.email = email;
      registerForm.dataset.password = password;

      // Open the OTP Modal
      openOtpModal(email);

      if (data.mockOtp) {
        showModalError(`[MOCK] Use OTP code: ${data.mockOtp}`);
      }

    } catch (error) {
      showError(error.message);
    }
  });

  // Handle OTP verification Form inside popup modal
  otpVerificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideModalError();

    const otp = verificationOtpInput.value;
    const email = registerForm.dataset.email;
    const name = registerForm.dataset.name;
    const password = registerForm.dataset.password;

    if (!otp || otp.length < 6) {
      return showModalError('Please enter a valid 6-digit OTP code.');
    }

    try {
      showToast('Verifying OTP...', 'success');
      
      const response = await fetch(`${getApiBaseUrl()}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp, verifyOnly: true })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid verification code.');
      }

      // OTP verified successfully! Complete Firebase Registration
      showToast('Email verified! Creating account...', 'success');
      await clovasAuth.register(email, password, name);
      
      // Hide form container, show success checkmark container
      const formContent = document.getElementById('otp-modal-form-content');
      const successContent = document.getElementById('otp-modal-success-content');
      
      if (formContent && successContent) {
        formContent.classList.add('hidden');
        successContent.classList.remove('hidden');
      }
      
      // Wait for checkmark drawing animation before closing modal and redirecting
      setTimeout(() => {
        closeOtpModal();
        showToast('Welcome to Clovas Shopping!');
        window.location.href = 'index.html';
      }, 2400);

    } catch (error) {
      showModalError(error.message);
    }
  });

  // Handle Forgot Password Form Submit
  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    const email = document.getElementById('forgot-email').value;

    try {
      showToast('Sending link...', 'success');
      await clovasAuth.resetPassword(email);
      showToast('Password reset link sent to your email.');
      switchMode('login');
    } catch (error) {
      showError(error.message);
    }
  });

  // Handle Google Sign-in
  googleLoginBtn.addEventListener('click', async () => {
    hideError();
    try {
      showToast('Connecting Google...', 'success');
      await clovasAuth.loginWithGoogle();
      showToast('Logged in via Google!');
      setTimeout(() => window.location.href = 'index.html', 1000);
    } catch (error) {
      showError(error.message);
    }
  });
});
