// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDkXEZcu4BE1Bcn1AD5XZoVRESDdJTAZeQ",
  authDomain: "munch-2ecdb.firebaseapp.com",
  projectId: "munch-2ecdb",
  storageBucket: "munch-2ecdb.firebasestorage.app",
  messagingSenderId: "121357403687",
  appId: "1:121357403687:web:fb156876034cf562387002",
  measurementId: "G-BQFZ2KPSD4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };