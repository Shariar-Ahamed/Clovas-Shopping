# EmailJS SMTP Integration - Clovas Shopping

This document provides developer guidelines on how **EmailJS** is integrated into the Clovas Shopping project for sending OTP emails during customer sign-in or registration.

## 🔗 Useful Links
- **EmailJS Account Dashboard:** [https://dashboard.emailjs.com](https://dashboard.emailjs.com)
- **EmailJS Official Documentation:** [https://www.emailjs.com/docs](https://www.emailjs.com/docs)
- **EmailJS REST API Reference:** [https://www.emailjs.com/docs/rest-api/send](https://www.emailjs.com/docs/rest-api/send)

---

## ✉️ Overview of EmailJS in Clovas Shopping

EmailJS is a cloud-based email delivery service that enables sending transactional emails directly via REST APIs without configuring custom SMTP nodes in Node.js. 

In Clovas Shopping, EmailJS is used in the **OTP (One-Time Password) Login flow**:
1. The shopper requests to sign-in via email.
2. The server generates a random 6-digit verification code.
3. The server triggers the EmailJS API to securely send the code to the shopper's inbox.
4. If EmailJS credentials are not configured, the server defaults to **Mock Mode** for offline local development.

---

## 📡 API Integration & Backend Controller

The logic is implemented inside the OTP sender endpoint `/api/auth/send-otp` in [backend/routes/auth.js](https://github.com/Shariar-Ahamed/Clovas-Shopping/blob/main/backend/routes/auth.js).

### 1. Verification of Configuration
Before sending an email, the backend checks for required environment variables:
```javascript
const { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY } = process.env;
const hasEmailConfig = EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY;
```

### 2. EmailJS REST API Request
If the configuration variables are set, the backend triggers a POST request to EmailJS's official gateway:
- **API URL:** `https://api.emailjs.com/api/v1.0/email/send`
- **Request Payload Structure:**
```json
{
  "service_id": "EMAILJS_SERVICE_ID",
  "template_id": "EMAILJS_TEMPLATE_ID",
  "user_id": "EMAILJS_PUBLIC_KEY",
  "accessToken": "EMAILJS_PRIVATE_KEY",
  "template_params": {
    "to_email": "recipient@gmail.com",
    "user_name": "John Doe",
    "otp_code": "193854",
    "app_name": "Clovas Shopping"
  }
}
```

### 3. Sandbox / Mock Mode Fallback
If the EmailJS parameters are missing or the API returns an error:
- The system automatically reverts to **Mock Mode**.
- The generated OTP is printed to the node terminal logs.
- The OTP is returned directly in the JSON response payload (`mockOtp`), allowing developers to copy-paste the verification code directly in their browser console for offline logins:
  ```json
  {
    "message": "OTP generated (Mock Mode)",
    "mockOtp": "193854"
  }
  ```

---

## 📁 Environment Variables Configuration

To run live email messaging, ensure the following variables are configured inside your `/backend/.env` file:

- **`EMAILJS_SERVICE_ID`:** Your EmailJS service connection ID (linked to your Gmail, Outlook, or SMTP service).
- **`EMAILJS_TEMPLATE_ID`:** The EmailJS template ID designed in your EmailJS dashboard.
- **`EMAILJS_PUBLIC_KEY`:** Your account Public Key.
- **`EMAILJS_PRIVATE_KEY`:** Your account Private Key / Access Token (used for backend authorization).

---

## 🎨 Recommended Email Template Parameters in EmailJS

When setting up your HTML template in the EmailJS dashboard, ensure you declare the following template variables to match the backend payload:

- **`{{to_email}}`:** Maps the recipient's target email address.
- **`{{user_name}}`:** Maps the recipient's full name.
- **`{{otp_code}}`:** Displays the generated 6-digit security code.
- **`{{app_name}}`:** App name string ("Clovas Shopping").

Example Template Body:
```html
<p>Hello {{user_name}},</p>
<p>Your verification code for {{app_name}} is <strong>{{otp_code}}</strong>.</p>
<p>This code is valid for 10 minutes. Please do not share it with anyone.</p>
```
