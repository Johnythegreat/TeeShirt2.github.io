# Tee Shirt Firebase Secure Setup

Your Firebase config is already merged.

## Admin security setup

1. Go to Firebase Console > Authentication.
2. Open your admin email user.
3. Copy the UID.
4. Go to Firestore Database.
5. Create collection: admins
6. Create document ID using your copied UID.
7. Add these fields:

role = admin
email = youradminemail@gmail.com

Only users listed inside the admins collection can edit products, POS, inventory, sales, promos, and admin-only records.

## Firestore Rules

Copy the content of firestore.rules into:
Firebase Console > Firestore Database > Rules > Publish

## Storage Rules

Copy the content of storage.rules into:
Firebase Console > Storage > Rules > Publish

## Important

Do not use allow read, write: if true for live business websites.
That is only for testing.
