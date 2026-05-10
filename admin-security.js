
// Admin Security Helper
// Admin access is controlled by Firestore document: admins/{AUTH_USER_UID}
async function checkAdminAccess() {
  try {
    if (!window.firebase || !firebase.auth || !firebase.firestore) return false;
    const user = firebase.auth().currentUser;
    if (!user) return false;
    const snap = await firebase.firestore().collection('admins').doc(user.uid).get();
    return snap.exists;
  } catch (err) {
    console.warn('Admin security check failed:', err);
    return false;
  }
}
