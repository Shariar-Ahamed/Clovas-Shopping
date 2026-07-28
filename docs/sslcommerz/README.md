# SSLCommerz Payment Gateway Integration - Clovas Shopping

This document provides developer guidelines on how the **SSLCommerz** payment gateway is integrated into the Clovas Shopping project for processing card and mobile banking payments in Bangladesh.

## 🔗 Useful Links
- **SSLCommerz Sandbox Dashboard:** [https://sandbox.sslcommerz.com](https://sandbox.sslcommerz.com)
- **SSLCommerz Merchant Panel (Live):** [https://merchant.sslcommerz.com](https://merchant.sslcommerz.com)
- **SSLCommerz Developer Documentation:** [https://developer.sslcommerz.com](https://developer.sslcommerz.com)

---

## 💳 Overview of SSLCommerz in Clovas Shopping

SSLCommerz is the largest payment gateway aggregator in Bangladesh. The Clovas Shopping platform integrates it to handle digital transactions:
1. **Checkout Flow:** The shopper places an order, select "Online Payment", and gets redirected to the secure SSLCommerz Gateway portal.
2. **Payment Processing:** The shopper completes payment via Visa, Mastercard, AMEX, bKash, Nagad, Rocket, or Net Banking.
3. **Transaction Callback:** SSLCommerz redirects the customer back to our backend callback APIs, which verify the transaction, update the order status in MongoDB, and redirect the customer back to their web dashboard.

---

## 🛠️ Backend Routing & Controller Mappings

The backend endpoints are implemented in the file [backend/routes/payments.js](https://github.com/Shariar-Ahamed/Clovas-Shopping/blob/main/backend/routes/payments.js).

### 1. SSLCommerz Credentials Initializer
```javascript
const SSLCommerzPayment = require('sslcommerz-lts');

const store_id = process.env.SSLCOMMERZ_STORE_ID || 'testbox';
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD || 'testbox';
const isSandboxMode = process.env.SSLCOMMERZ_SANDBOX !== 'false';
```

---

## 📡 API Reference Directory

### 1. Initiate Payment Session
- **Endpoint:** `POST /api/payments/initiate/:orderId`
- **Access:** Private (Authenticated users only)
- **Function:** Initializes a payment session for an order.
  - Generates the payload containing transaction ID, BDT amount, customer details, and redirect links.
  - If `MOCK_PAYMENT=true` or `store_id="testbox"`, it bypasses the gateway API and automatically mocks a redirect to the success handler for rapid developer testing.
  - Otherwise, it queries `SSLCommerzPayment.init(paymentData)` and returns a redirection link `GatewayPageURL` to the client.

### 2. Success Handler
- **Endpoint:** `POST/GET /api/payments/success`
- **Access:** Public (Redirected by SSLCommerz)
- **Parameters:** `tranId` (Transaction ID), `frontend` (Target client URL)
- **Function:** 
  - Locates the matching order by transaction ID.
  - Updates the Mongoose order `paymentStatus` to `'Paid'`.
  - Redirects (302) the shopper back to the frontend:
    `${frontend}/dashboard.html?status=success&txnId=${tranId}`

### 3. Failure Handler
- **Endpoint:** `POST/GET /api/payments/fail`
- **Access:** Public
- **Function:** 
  - Locates the order.
  - Sets the `paymentStatus` to `'Failed'`.
  - Redirects the shopper back to the dashboard with error status:
    `${frontend}/dashboard.html?status=failed`

### 4. Cancellation Handler
- **Endpoint:** `POST/GET /api/payments/cancel`
- **Access:** Public
- **Function:** 
  - Sets the `paymentStatus` to `'Cancelled'`.
  - Redirects back with cancellation status:
    `${frontend}/dashboard.html?status=cancelled`

---

## 📁 Environment Variables Configuration

Ensure the following variables are configured inside your `/backend/.env` file:

- **`SSLCOMMERZ_STORE_ID`:** Your merchant Store ID issued by SSLCommerz. Set to `'testbox'` for sandbox mockups.
- **`SSLCOMMERZ_STORE_PASSWORD`:** Your store password.
- **`SSLCOMMERZ_SANDBOX`:** Set to `true` for testing/sandbox mode, or `false` for live production transactions.
- **`MOCK_PAYMENT`:** Set to `true` in local development to automatically mock successful checkouts without hitting SSLCommerz sandbox networks.
- **`BACKEND_URL`:** The public URL of your backend server (e.g. `https://clovas-shopping.vercel.app` in production). Used by SSLCommerz to send callbacks.
- **`FRONTEND_URL`:** The redirect location of the frontend dashboard.

---

## 📘 Developer Sandbox Testing Guidelines

1. **Card Simulation:**
   When redirected to the SSLCommerz Sandbox payment page during checkout:
   - Select the **Test Card** tab.
   - Use any provided test credentials (or click any success button) to simulate a successful card payment.
2. **Mobile Financial Services (MFS) Simulation:**
   - Select the **MFS** tab to simulate bKash, Nagad, or Rocket checkouts using dummy PINs/OTPs.
3. **Local Testing via Tunneling:**
   Because SSLCommerz needs to send HTTP POST callback requests directly to your backend, local testing of *real* payment gateways requires a public tunnel (like `ngrok` or `localtunnel`). Set `BACKEND_URL` in `.env` to your ngrok tunnel address (e.g. `https://xxxx.ngrok-free.app`).
