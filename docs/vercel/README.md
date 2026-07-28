# Vercel Deployment & Routing Architecture - Clovas Shopping

This document provides developer guidelines on how **Vercel** is used in the Clovas Shopping project, explaining its configuration, serverless routing rules, and deployment mechanics.

## 🔗 Useful Links
- **Vercel Official Website:** [https://vercel.com](https://vercel.com)
- **Vercel Console/Dashboard:** [https://vercel.com/dashboard](https://vercel.com/dashboard)
- **Live Project URL:** [https://clovas-shopping.vercel.app](https://clovas-shopping.vercel.app)
- **Vercel Configuration Documentation:** [https://vercel.com/docs/projects/project-configuration](https://vercel.com/docs/projects/project-configuration)

---

## 🚀 Overview of Vercel in Clovas Shopping

Vercel acts as the primary deployment host for both the **Frontend** static web files and the **Backend** Express server. Because the project is structured as a monorepo (containing both `/frontend` and `/backend` directories in a single repository), Vercel is configured to build and serve both environments seamlessly.

- **Frontend Hosting:** Served as static files with optimized clean URLs (extensions like `.html` are hidden from the browser address bar).
- **Backend Hosting:** Run as a serverless Node.js function (`@vercel/node`) that processes all incoming REST API requests starting with `/api`.

---

## 🛠️ Configuration File: `vercel.json`

The file [vercel.json](file:///e:/Git%20All%20Repo/Clovas-Shopping/vercel.json) in the project root dictates build parameters, serverless mappings, and URL redirection rules. Below is a detailed breakdown of its architecture:

```json
{
  "version": 2,
  "cleanUrls": false,
  "builds": [
    { "src": "backend/server.js", "use": "@vercel/node" },
    { "src": "frontend/**", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "backend/server.js" },
    { "src": "/__/auth/(.*)", "dest": "https://clovas-shop.firebaseapp.com/__/auth/$1" },
    { "src": "/Home", "dest": "frontend/index.html" },
    { "src": "/css/(.*)", "dest": "frontend/css/$1" },
    { "src": "/js/(.*)", "dest": "frontend/js/$1" },
    { "src": "/admin$", "status": 308, "headers": { "Location": "/admin/" } },
    { "src": "/admin/([^./]+)", "dest": "frontend/admin/$1.html" },
    { "src": "/admin/(.*)", "dest": "frontend/admin/$1" },
    { "src": "/([^./]+)", "dest": "frontend/$1.html" },
    { "src": "/(.*)", "dest": "frontend/$1" }
  ]
}
```

### 1. Builds Definition
- `{ "src": "backend/server.js", "use": "@vercel/node" }`
  Instructs Vercel to bundle the Express server (`server.js`) and run it as an asynchronous serverless function on every API request.
- `{ "src": "frontend/**", "use": "@vercel/static" }`
  Instructs Vercel to host all assets, scripts, stylesheets, and pages inside the `/frontend` directory as static files.

### 2. Clean URLs & Routing Mechanics
Because we disabled Vercel's native `cleanUrls` (`"cleanUrls": false`), we prevent automated redirect loops and manually control exact file lookups inside the routes.

---

## 🛣️ API & Page Route Directory Mapping

Here is the exact routing flow for all user paths:

### 📡 Backend API & Auth Proxy
| Request Path Pattern | Rewrite Destination | Description |
| :--- | :--- | :--- |
| `/api/(.*)` | `backend/server.js` | Proxies any database or server call (e.g. `/api/products`, `/api/orders`) directly to the Express backend server. |
| `/__/auth/(.*)` | `https://clovas-shop.firebaseapp.com/__/auth/$1` | Acts as a proxy for Firebase Authentication, allowing OAuth sign-ins (like Google Login) to callback smoothly without domain mismatch issues. |

### 🎨 Asset and Resource Routing
| Request Path Pattern | Rewrite Destination | Description |
| :--- | :--- | :--- |
| `/css/(.*)` | `frontend/css/$1` | Serves global style sheets (e.g. `/css/style.css` looks up `frontend/css/style.css`). |
| `/js/(.*)` | `frontend/js/$1` | Serves customer-facing scripts (e.g. `/js/main.js` looks up `frontend/js/main.js`). |

### 🔒 Admin Panel Redirection & Page Mappings
To ensure browser relative paths (like `href="products.html"`) resolve correctly relative to the `/admin/` directory instead of the root `/`, specific directory normalization rules are enforced:

| Request Path Pattern | Rewrite Destination / Action | Description |
| :--- | :--- | :--- |
| `/admin` | `308 Redirect` to `/admin/` | **Critical Fix:** If a user visits `/admin` (without a trailing slash), Vercel forces a permanent redirect to `/admin/` (with a trailing slash) so the browser sets the correct base folder context. |
| `/admin/([^./]+)` | `frontend/admin/$1.html` | **Clean URL Rule:** Maps clean subpages inside the admin directory (e.g. `/admin/shoppers` or `/admin/orders`) to their actual physical HTML files (`frontend/admin/shoppers.html` or `frontend/admin/orders.html`). |
| `/admin/(.*)` | `frontend/admin/$1` | **Admin Assets Rule:** Serves files with extensions inside the admin folder (like scripts inside `/admin/js/` or styling sheets) as-is without appending `.html`. |

### 🏠 Customer-Facing Site Mappings
| Request Path Pattern | Rewrite Destination | Description |
| :--- | :--- | :--- |
| `/Home` | `frontend/index.html` | Maps `/Home` directly to the landing page. |
| `/` | `frontend/index.html` (via wildcard) | Serves the main landing page of Clovas Shopping. |
| `/([^./]+)` | `frontend/$1.html` | **Customer Clean URL:** Maps clean root paths (e.g. `/shop` or `/cart`) to their matching HTML templates (`frontend/shop.html` or `frontend/cart.html`). |
| `/(.*)` | `frontend/$1` | **Fallback Rule:** Serves static files and directories inside the `/frontend` root exactly as requested. |

---

## 🛠️ Local Development vs. Production Deployment

When developers work on this project locally, they run:
1. **Backend Server:** Run `npm run dev` or `node server.js` in the `/backend` folder (running on port `http://localhost:5000`).
2. **Frontend Runner:** Live Server, Python SimpleHTTPServer, or similar local runner.
3. **Cross-Origin (CORS):** The backend is configured to accept CORS requests from local origins. On Vercel production, all calls go through the `/api` route, eliminating CORS requirements completely.

---

## 📘 Guidelines for Adding New Pages
If you are a developer adding a new page to the system:
1. **Adding an Admin Page:**
   Place the new HTML file in `frontend/admin/my-new-page.html`. Vercel will automatically resolve the clean URL `https://clovas-shopping.vercel.app/admin/my-new-page` through the regular expression `([^./]+)` without requiring modifications to `vercel.json`.
2. **Adding a Root/Client Page:**
   Place the HTML file in `frontend/my-new-page.html`. It will resolve to `https://clovas-shopping.vercel.app/my-new-page` dynamically.
3. **Static Scripts/Styles:**
   Place static resources in their respective subdirectories (e.g., `frontend/js/` or `frontend/css/`). The routes rule will fetch them automatically.
