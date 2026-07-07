# 🛒 Clovas Shopping

> **Premium Fashion • Trusted Shopping • Fast Delivery**

Clovas Shopping is a modern, premium, and fully responsive e-commerce web platform. It is engineered with a mobile-first UI, smooth micro-animations, clean glassmorphic components, and robust backend integrations.

---

## 🚀 Key Features

* **Elegant Home Page**: Features premium hero banners, countdown timers for flash sales, curated category cards, and trending selections.
* **Smart Catalog & Filter**: Supports instantaneous search, category and subcategory filtering, price range sliders, and sorting options.
* **Product Details**: Complete overview page displaying dynamic galleries, main-image hover zooms, related products, and verified user reviews.
* **Persistent Shopping Cart & Wishlist**: Fast, local-storage persistent cart manager with coupon discounts.
* **Interactive Checkout**: Pre-populates shipping addresses, handles coupon validation, and manages order summary totals.
* **Secure Checkout & Payments**: Integrated with **SSLCommerz** (sandbox/production) payment gateway redirects.
* **Interactive Dashboard**: Track order history, track deliveries via visual timelines, update profiles, and manage shipping addresses.
* **Advanced Admin Portal**: Rich sales dashboard analytics, full CRUD operations for products (with dynamic Cloudinary uploads), order management, and coupon code generators.
* **Aesthetic Animations**: Outfitted with bespoke CSS keyframe animations (fade-in, slide-left, slide-right, scale-up, buttons pulse-glow) and Google Poppins typography.

---

## 🛠️ Technology Stack

### Frontend
- **Structure & Layout**: Semantic HTML5, CSS3 Custom Variables.
- **Styling**: Tailwind CSS.
- **Logic**: Vanilla ES6+ JavaScript modules.
- **Identity & Auth**: Firebase Client SDK & authentication API fallback.

### Backend
- **Framework**: Node.js & Express.js.
- **Database**: MongoDB (via Mongoose ODM).
- **Files & Media**: Cloudinary API (image cloud upload).
- **Payment Processor**: SSLCommerz.

---

## 📂 Project Directory Structure

```text
Clovas-Shopping/
├── frontend/
│   ├── index.html          # Main landing storefront
│   ├── shop.html           # Catalog browsing and filtering
│   ├── product.html        # Detailed product gallery & reviews
│   ├── cart.html           # Items list and coupon manager
│   ├── checkout.html       # Saved address book & gateway redirections
│   ├── auth.html           # Firebase & local mockup registration
│   ├── dashboard.html      # Visual order tracking timeline
│   ├── about.html          # Brand story page
│   ├── contact.html        # Interactive contact form
│   ├── faq.html            # Help Center accordions
│   ├── admin/              # Admin dashboard, products, coupons & orders tables
│   ├── css/
│   │   └── style.css       # Animations, Poppins typeface, custom highlights
│   └── js/
│       ├── api.js          # Unified client-side API requests
│       ├── main.js         # Header/footer injections & state managers
│       └── ...             # Page-specific scripts
│
└── backend/
    ├── server.js           # Server initializer
    ├── seed.js             # Seeding script for products
    ├── config/             # DB, Cloudinary & Firebase Admin setups
    ├── models/             # Mongoose Schemas (User, Product, Order, etc.)
    ├── middleware/         # Auth & role checking rules
    └── routes/             # REST endpoints (auth, products, payments, etc.)
```

---

## 💾 Offline Mock Database Fallback (Super Power)
To allow immediate testing without setting up third-party credentials (Firebase, Cloudinary, SSLCommerz, MongoDB), the application includes a **simulated client-side database layer** inside `frontend/js/api.js`.

If the database or node server is offline, the client:
- Automatically loads 12 dummy products on the Homepage & Shop views.
- Enables add to cart, checkout, mock payment completion, and visual tracking.
- Enables admin actions (adding/updating/deleting products, creating coupons) and saves states inside the browser's `localStorage` so data persists on refresh.

---

## ⚙️ Local Development Setup

### Prerequisite
Ensure [Node.js](https://nodejs.org/) and [MongoDB community server](https://www.mongodb.com/try/download/community) are installed on your computer.

### Step 1: Set up Backend Config
1. Open your terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Copy the `.env.example` file and name it `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and fill in your MongoDB connection URI (or leave the default local URI).

### Step 2: Install dependencies & Seed Data
1. Install Node modules:
   ```bash
   npm install
   ```
2. Seed the database with initial products:
   ```bash
   node seed.js
   ```

### Step 3: Launch Express Server
Start the development server:
```bash
node server.js
```
*(The backend server will run on `http://localhost:5000`)*

### Step 4: Run Frontend
Simply host the `frontend/` folder using a static file runner (like VS Code **Live Server** extension or Python HTTP server). Open it in your browser (e.g. `http://127.0.0.1:5500/frontend`).

---

## 🔒 License
This project is proprietary and custom-tailored as a premium storefront design for **Clovas Shopping**.
