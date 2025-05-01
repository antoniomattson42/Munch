import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

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

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Function to calculate the personalized weighted score (PWS)
function calculatePWS(preferences, ratings) {
  const wt = Number(preferences.taste);
  const ws = Number(preferences.service);
  const wv = Number(preferences.value);
  const wa = Number(preferences.atmosphere);

  const rt = Number(ratings.taste);
  const rs = Number(ratings.service);
  const rv = Number(ratings.value);
  const ra = Number(ratings.atmosphere);

  const totalWeight = wt + ws + wv + wa;
  if (totalWeight === 0) return 0;

  const weightedScore = (wt * rt + ws * rs + wv * rv + wa * ra) / totalWeight;
  return weightedScore.toFixed(2);
}

// Function to extract restaurant details from the page
async function extractRestaurantDetails() {
  // console.log("extractRestaurantDetails called");

  // Extract the restaurant name from the document title
  let restaurantName = document.title.split(' - ')[0].trim();
  // console.log('Restaurant Name from title:', restaurantName);

  // Proceed to extract the address as before
  const addressButtonElement = document.querySelector('button[data-item-id="address"]');
  let addressElement = null;

  if (addressButtonElement) {
    addressElement = addressButtonElement.querySelector('div[class*="Io6YTe"]');
  }

  if (restaurantName && addressElement) {
    // Extract only the address text
    const address = addressElement.textContent.trim();
    // console.log('Extracted Address:', address);
    
    // Combine restaurant name and address for Firestore lookup
    const combinedIdentifier = `${restaurantName}_${address}`;
    // console.warn('Combined Identifier:', combinedIdentifier);
    
    return combinedIdentifier;
  }

  // console.error("Failed to extract restaurant details");
  return null;
}

// Function to get restaurant ratings from Firestore
async function getRestaurantRatings(combinedIdentifier) {
  try {
    const restaurantsRef = collection(db, "restaurants");
    const q = query(restaurantsRef, where("combinedIdentifier", "==", combinedIdentifier));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const restaurantDoc = querySnapshot.docs[0];
      const data = restaurantDoc.data();
      console.log('Firestore Data:', data);
      return {
        avgOverallRating: Number(data.avgOverallRating),
        taste: Number(data.avgTaste),
        service: Number(data.avgService),
        value: Number(data.avgValue),
        atmosphere: Number(data.avgAtmosphere)
      };
    } else {
      console.warn('No matching document found for:', combinedIdentifier);
    }
  } catch (error) {
    console.error("Error getting restaurant ratings:", error);
  }
  return null;
}

// Function to get user preferences from Firestore
async function getUserPreferences(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log('User Preferences:', data.preferences);
      return {
        taste: Number(data.preferences.taste),
        service: Number(data.preferences.service),
        value: Number(data.preferences.value),
        atmosphere: Number(data.preferences.atmosphere)
      };
    } else {
      console.warn('User document not found for userId:', userId);
    }
  } catch (error) {
    console.error("Error getting user preferences:", error);
  }
  return null;
}

// Function to inject personalized weighted score into the page
async function injectAvgRating(userId) {
  console.log("injectAvgRating called");
  const combinedIdentifier = await extractRestaurantDetails();
  if (!combinedIdentifier) {
    console.error("Failed to extract restaurant details");
    return;
  }

  // Get restaurant ratings
  const ratings = await getRestaurantRatings(combinedIdentifier);
  if (!ratings) {
    console.warn("No ratings found for this restaurant");
    return;
  }

  // Get user preferences
  const userPreferences = await getUserPreferences(userId);
  if (!userPreferences) {
    console.warn("No user preferences found");
    return;
  }

  // Calculate the personalized weighted score
  const personalizedScore = calculatePWS(userPreferences, {
    taste: ratings.taste,
    service: ratings.service,
    value: ratings.value,
    atmosphere: ratings.atmosphere,
  });

  // Select the rating element
  const ratingElement = document.querySelector('span.ceNzKf[role="img"][aria-label*="stars"]');
  if (ratingElement) {
    // Check if the custom rating has already been injected to avoid duplication
    if (document.getElementById('munch-avg-rating')) {
      return;
    }

    // Create a new span to inject the personalized score
    const avgRatingElement = document.createElement("span");
    avgRatingElement.id = 'munch-avg-rating';
    avgRatingElement.style.fontWeight = "bold";
    avgRatingElement.style.marginLeft = "10px";
    avgRatingElement.style.color = "#FF5722";
    avgRatingElement.textContent = ` | Munch Personalized Score: ${personalizedScore}`;

    // Inject the new span right after the rating element
    ratingElement.parentNode.appendChild(avgRatingElement);
    console.log("Injected personalized score into the page");
  } else {
    console.error("Failed to find Google Maps rating element");
  }
}

// Communicate with background script to get authenticated user
chrome.runtime.sendMessage({ type: 'GET_AUTH_USER' }, (response) => {
  const user = response.user;
  if (user) {
    console.log("User is signed in:", user.uid);
    injectAvgRating(user.uid);
  } else {
    console.log("User is not authenticated");
  }
});

// Observe page changes to inject personalized score
const observer = new MutationObserver(() => {
  chrome.runtime.sendMessage({ type: 'GET_AUTH_USER' }, (response) => {
    const user = response.user;
    if (user) {
      injectAvgRating(user.uid);
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });
