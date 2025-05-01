import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, browserLocalPersistence } from 'firebase/auth';

// Firebase configuration
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

// Set auth persistence
auth.setPersistence(browserLocalPersistence)
  .then(() => {
    console.log('Auth persistence set to local');
  })
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

// Sign in or listen to auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User authenticated:", user.uid);
  } else {
    console.warn("User is not authenticated");
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_AUTH_USER') {
    sendResponse({ user: auth.currentUser });
  }
});
