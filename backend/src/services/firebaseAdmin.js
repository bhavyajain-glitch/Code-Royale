// This module initializes the Firebase Admin SDK and exports Firebase services.
const admin = require('firebase-admin');

// This is the secret key file you downloaded from Firebase
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Initialize Firestore
const db = admin.firestore();
const auth = admin.auth();

console.log('✅ Firebase Admin SDK initialized.');

module.exports = { db, auth };