# MongoDB Atlas & Mongoose Architecture - Clovas Shopping

This document provides developer guidelines on how **MongoDB Atlas** (Cloud Database) and **Mongoose ODM** are integrated into the Clovas Shopping project.

## 🔗 Useful Links
- **MongoDB Atlas Cloud Console:** [https://cloud.mongodb.com](https://cloud.mongodb.com)
- **MongoDB Official Site:** [https://www.mongodb.com](https://www.mongodb.com)
- **Mongoose ODM Documentation:** [https://mongoosejs.com/docs](https://mongoosejs.com/docs)

---

## ☁️ Overview of MongoDB in Clovas Shopping

MongoDB is a document-based NoSQL database used to store all dynamic application data for the platform. In production, the database is hosted on **MongoDB Atlas** (Shared Tier Cloud). 

- **Object Modeling (ODM):** We use **Mongoose** to declare strongly-typed database schemas and enforce data validation directly in Express routes.
- **Connection Configuration:** Set via the `MONGODB_URI` environment variable inside the `/backend/.env` file.
- **Database Connection File:** Managed in [backend/config/db.js](file:///e:/Git%20All%20Repo/Clovas-Shopping/backend/config/db.js).

---

## 🔌 Connection Setup & Offline Fallbacks

The backend server is designed to start up even if the MongoDB database is temporarily unreachable, which provides robust fail-safes during offline development:

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.warn('Database is offline. Server will run but database operations will fail.');
  }
};
```

---

## 🗄️ Database Schema Directory & Models

The schemas are declared inside the [backend/models/](file:///e:/Git%20All%20Repo/Clovas-Shopping/backend/models/) folder. Below is the relational structure of all schemas:

### 1. `User` Schema ([User.js](file:///e:/Git%20All%20Repo/Clovas-Shopping/backend/models/User.js))
Stores user profile information, synced shipping destinations, and real-time carts/wishlists.
- **`firebaseUid`:** String (Required, Unique) - Links the database profile directly to Firebase Auth.
- **`role`:** String - Enum `['user', 'admin']` (Default: `user`).
- **`addresses`:** Embedded Array of Address sub-documents (street, city, zip, country).
- **`cart`:** Embedded Array of Product sub-documents (product id, title, image, price, quantity, stock). Syncs live on cart edits.
- **`wishlist`:** Embedded Array of Product sub-documents (product id, title, image, price). Syncs live on liked outfit toggle.

### 2. `Product` Schema ([Product.js](file:///e:/Git%20All%20Repo/Clovas-Shopping/backend/models/Product.js))
Defines the shop catalog listings.
- **`sku`:** String (Required, Unique, Uppercase, Trimmed) - Unique Product Code (e.g. `CLV-MEN-18294`) used for search indexing and vendor codes.
- **`price` & `discountPrice`:** Numbers - Controls normal pricing and active promotional discounts.
- **`stock`:** Number (Default: 0) - Inventory tracking.
- **`isFeatured` / `isTrending` / `isBestSeller` / `isNewArrival`:** Booleans - Homepage dashboard highlight flags.

### 3. `Order` Schema ([Order.js](file:///e:/Git%20All%20Repo/Clovas-Shopping/backend/models/Order.js))
Manages transaction details and shipping state.
- **`user`:** Mongoose ObjectId - References the `User` document.
- **`transactionId`:** String (Required, Unique) - SSLCommerz transaction reference.
- **`items`:** Embedded Array (product, title, quantity, price, image).
- **`totalAmount`:** Number - Cost in BDT.
- **`paymentStatus`:** String - Enum `['Pending', 'Paid', 'Failed', 'Cancelled']`.
- **`orderStatus`:** String - Enum `['Pending', 'Processing', 'Shipped', 'Delivered']`.

### 4. `Coupon` Schema ([Coupon.js](file:///e:/Git%20All%20Repo/Clovas-Shopping/backend/models/Coupon.js))
Manages active promo discounts.
- **`code`:** String (Required, Unique, Uppercase) - Coupon code input by users at checkout.
- **`discountType`:** String - Enum `['percentage', 'fixed']`.
- **`expiryDate`:** Date (Default: 7 days from creation) - Expiry constraint.

### 5. `Config` Schema ([Config.js](file:///e:/Git%20All%20Repo/Clovas-Shopping/backend/models/Config.js))
Global site config document (usually only 1 configuration document exists in the collection).
- **`flashSaleEnabled`:** Boolean.
- **`flashSaleEndDate`:** Date.
- **`shippingFeeStandard` & `shippingFeeOutside`:** Shipping costs in BDT inside/outside Dhaka.
- **`freeShippingThreshold`:** Minimum order price for free delivery.

---

## 🌱 Database Seeding & Migrations

To populate the database with initial dummy listings during installation, run:
```bash
node seed.js
```
This script does the following:
1. Clears existing products and categories.
2. Loops through a pre-compiled JSON catalog containing 47 mock products (spread across Men, Women, Accessories categories).
3. Auto-generates unique SKUs for each product if they don't have one.
4. Inserts them into the database collections.

---

## 🔒 Security & Management on MongoDB Atlas

### 1. IP Whitelisting (Important)
Because serverless functions (like Vercel) deploy dynamically to a range of dynamic IP addresses, you **must enable access from anywhere** on your MongoDB Atlas dashboard:
- Go to **Network Access** tab on Atlas.
- Add an IP address rule: `0.0.0.0/0` (Allows serverless backend API to connect).

### 2. Indexes
Mongoose automatically registers unique indices for:
- `User`: `firebaseUid`, `email`, `username`
- `Product`: `sku`
- `Order`: `transactionId`
- `Coupon`: `code`

Ensure unique indexes are built successfully on Atlas to prevent database entry collisions.
