# Unsplash Image Assets Integration - Clovas Shopping

This document provides developer guidelines on how **Unsplash** image assets are utilized in the Clovas Shopping project to render high-resolution product and category cover images.

---

## 🔗 Useful Links
- **Unsplash Website:** [https://unsplash.com](https://unsplash.com)
- **Unsplash Developer Portal:** [https://unsplash.com/developers](https://unsplash.com/developers)
- **Unsplash Image Source CDN:** [https://images.unsplash.com](https://images.unsplash.com)

---

## 📸 Overview of Unsplash in Clovas Shopping

Unsplash is used as the primary source for professional, royalty-free product and banner photos in the Clovas Shopping application. 

Instead of committing large image binary files (like `.jpg` or `.png`) directly into the Git repository—which would increase repository size and slow down Vercel deployment speeds—the application utilizes direct links from Unsplash's global Content Delivery Network (CDN).

---

## ⚙️ Usage Mechanics & CDN Optimization

The mock product listings in [backend/seed.js](file:///e:/Git%20All%20Repo/Clovas-Shopping/backend/seed.js) reference direct Unsplash CDN URLs:

```json
{
  "title": "Premium Classic Linen Shirt",
  "images": ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80"]
}
```

### Dynamic Compression & Resizing
Unsplash images are processed on the fly using query parameters appended to the URLs. Developers can customize these to optimize image loading times:

- **`auto=format`:** Automatically serves the most optimal image format supported by the browser (e.g. WebP).
- **`fit=crop`:** Crops the image to fit the requested dimensions cleanly without distortion.
- **`w=400`:** Dynamic resizing. Sets the width of the image to 400 pixels (reducing file size significantly for cards and grids).
- **`q=80`:** Compression level. Sets the quality to 80% to balance sharpness with fast loading speeds.

---

## 📘 Developer Guidelines for Adding Product Photos

When uploading or editing products in the **Admin Dashboard**:
1. Visit [Unsplash](https://unsplash.com) and search for a suitable product photo.
2. Right-click the image and select **Copy Image Address** (Ensure it starts with `https://images.unsplash.com/...`).
3. Paste the URL directly into the product image input field.
4. **Performance Tip:** Add `?auto=format&fit=crop&w=600&q=80` to the end of the URL to ensure it loads quickly in the product cards without consuming unnecessary user mobile data.
