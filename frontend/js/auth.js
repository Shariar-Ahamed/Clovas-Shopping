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

  let currentMode = 'login'; // login, register, forgot

  const showError = (msg) => {
    errorMessage.textContent = msg;
    errorAlert.classList.remove('hidden');
  };

  const hideError = () => {
    errorAlert.classList.add('hidden');
  };

  // Toggle Forms
  const switchMode = (mode) => {
    currentMode = mode;
    hideError();

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

  // Handle Login Form Submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

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
  });

  // Handle Register Form Submit
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
      showToast('Creating account...', 'success');
      await clovasAuth.register(email, password, name);
      showToast('Account created successfully!');
      setTimeout(() => window.location.href = 'index.html', 1000);
    } catch (error) {
      showError(error.message);
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
