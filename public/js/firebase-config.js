// public/js/firebase-config.js

// Import the functions you need from the SDKs you need via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
// TODO: Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyAA1jFUzkoroxr6Dg4opV_pxqbBKW2xnnY",
  authDomain: "test-db-f6315.firebaseapp.com",
  projectId: "test-db-f6315",
  storageBucket: "test-db-f6315.firebasestorage.app",
  messagingSenderId: "166750781296",
  appId: "1:166750781296:web:47a26779b4ba9441ca59b5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Export the database so shop.js can use it
export { db };
