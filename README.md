# T-Trend | SHEIN-Style Aesthetic Graphic Tee Shop

An interactive, responsive, and beautifully designed single-page e-commerce storefront and admin POS terminal optimized for rapid graphic tee launches. Built with vanilla HTML5, Tailwind CSS, FontAwesome, and directly powered by Firebase Firestore and Authentication.

## Features & Upgrades Included

- **Customer Storefront (`index.html`)**:
  - Live, real-time product grid syncing instantly with Firebase Firestore.
  - Advanced filtering system (by category, price range, sizing, and in-stock only).
  - Search bar that query-filters active catalog items.
  - Interactive product detail modal with size and accent color selectors, and real-time size stock displays.
  - Drawer-based shopping cart calculating discounts and free shipping dynamic caps ($49 threshold).
  - Sandbox secure checkout modal with automated coupon validation (`TRENDY15` for 15% off, `SHEIN20` for 20% off).
  - **Firebase Authentication** integrated: users can log in, register, and trace their live order history inside their account space.
  - **Dynamic Wishlist**: Persistent favorites tray that saves state via localStorage.
  
- **Logistics Admin Dashboard & POS Terminal (`admin.html`)**:
  - Locked under a staff security check gate, restricting management functions to `admin@ttrend.com`.
  - **Product Manager**: Complete CRUD operations (Add, Modify, and Delete wardrobe items) directly updating Firestore.
  - **Dynamic Sizing Stock Matrix**: Manage stock pools per size (`S`, `M`, `L`, `XL`) individually.
  - **POS Dispatch Terminal**: Tracks customer orders in real-time, displays item specifics, totals, and addresses. Enables staff to dispatch orders, log arrivals, or refund orders with real-time customer state sync.
  - **Ledger Stat Panel**: Displays total gross revenue from all non-cancelled orders automatically.
  - **Unsplash Auto-Image Generator**: Dynamically sources premium streetwear and minimalist model catalog photos based on the selected category inside the product creation modal.

## Firebase Database Security Rules Configuration

To secure your e-commerce shop, deploy these Firestore security rules in your Firebase Console. They ensure that normal customers can read products and write new orders, but only authenticated administrator accounts can mutate the product collection or update order dispatch statuses:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Products rules: anyone can read; only authenticated admin can write
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.email == 'admin@ttrend.com';
    }
    
    // Orders rules: anyone can create an order; users can read their own orders; admins can manage everything
    match /orders/{orderId} {
      allow create: if true;
      allow read: if request.auth != null && (request.auth.token.email == 'admin@ttrend.com' || resource.data.customerEmail == request.auth.token.email);
      allow update, delete: if request.auth != null && request.auth.token.email == 'admin@ttrend.com';
    }
  }
}
```

## Local Development & Setup

1. Simply copy the files to your machine.
2. The Firebase connection has been pre-configured using your active Firebase Project details:
   - **Project ID**: `tee-shirt-2`
   - **Authentication**: Set up standard email/password authentication in the Firebase console. Create an account with the email `admin@ttrend.com` and a password of your choice (e.g. `admin12345`) to gain immediate dashboard access.
3. Open `index.html` in your web browser, or serve it using any simple local server:
   ```bash
   # Using python
   python3 -m http.server 8000
   
   # Or using Node.js
   npx serve .
   ```
4. Deploy easily to **GitHub Pages** by pushing this repository to a GitHub repository and turning on Pages in settings!

