
# Firebase Integrated Tee Shirt Website

Firebase already connected.

## Features
- Customer Page
- Admin Dashboard
- POS System
- Inventory Monitoring
- Orders
- Cart
- Firebase Firestore Ready
- Firebase Auth Ready
- Firebase Storage Ready

## IMPORTANT FIREBASE RULES

Firestore Rules:
--------------------------------
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
--------------------------------

Storage Rules:
--------------------------------
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
--------------------------------

## Deploy
Upload to:
- Netlify
- GitHub Pages
- Firebase Hosting

