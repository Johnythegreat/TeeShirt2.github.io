# Tee Shirt Firebase Secure Admin Build

Fixed:
- Frontend now uses your uploaded logo image from assets/tshirt-logo.jpg
- Admin login now uses Firebase Authentication email + password
- Old admin123 login removed
- Admin access is checked using Firestore collection: admins/{uid}

## How to make your email an admin

1. Firebase Console > Authentication
2. Click your admin email user
3. Copy the UID
4. Firestore Database > Start collection
5. Collection ID: admins
6. Document ID: paste the copied UID
7. Add fields:
   - role = admin
   - email = your admin email

## Publish rules

Copy firestore.rules to Firestore Rules.
Copy storage.rules to Storage Rules.

Important:
If your UID is not inside admins collection, login will be blocked even if the email/password is correct.
