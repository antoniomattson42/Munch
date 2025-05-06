// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDkXEZcu4BE1Bcn1AD5XZoVRESDdJTAZeQ",
  authDomain: "munch-2ecdb.firebaseapp.com",
  projectId: "munch-2ecdb",
  storageBucket: "munch-2ecdb.firebasestorage.app",
  messagingSenderId: "121357403687",
  appId: "1:121357403687:web:3ad1ca6d7df05795387002",
  measurementId: "G-Q1DHQYZ8T9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };