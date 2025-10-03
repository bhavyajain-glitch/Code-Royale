// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBcj4PI8BRilrOyJYYnN8x1DkZBZxEOecc",
  authDomain: "code-royale-118ec.firebaseapp.com",
  projectId: "code-royale-118ec",
  storageBucket: "code-royale-118ec.firebasestorage.app",
  messagingSenderId: "1063693881281",
  appId: "1:1063693881281:web:c6deb96c097554165d6940",
  measurementId: "G-4DVH2JLV93"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
