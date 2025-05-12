import { Link, router } from 'expo-router';
import { View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator, Image, TextInput } from 'react-native';
import { useRef, useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, setDoc, query, where, Timestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../../firebaseConfig';
import axios from 'axios';
import { Auth } from 'aws-amplify';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || 'AIzaSyDWetBIR9Z_NrU4WNbNbLLx4L0vRwMghkg';
const GT_LATITUDE = 33.7756;
const GT_LONGITUDE = -84.3963;
const SEARCH_RADIUS = 1600;
const MAX_DISTANCE_KM = 1.6;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Add retry utility function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async (fn, retries = MAX_RETRIES, delay = RETRY_DELAY) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    // Check if it's a quota error
    if (error.response?.data?.status === 'OVER_QUERY_LIMIT') {
      console.log(`API quota exceeded. Retrying in ${delay/1000} seconds... (${retries} retries left)`);
      await sleep(delay);
      return retryWithBackoff(fn, retries - 1, delay * 2); // Exponential backoff
    }
    
    throw error;
  }
};

// Utility functions
const calculateAverage = (reviews, key) => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((total, review) => total + (review[key] || 0), 0);
  return Number((sum / reviews.length).toFixed(2));
};

const calculatePWS = (preferences, ratings) => {
  const { taste: wt, service: ws, value: wv, atmosphere: wa } = preferences;
  const { taste: rt, service: rs, value: rv, atmosphere: ra } = ratings;
  const totalWeight = 0 + +wt + +ws + +wv + +wa;
  const weightedScore = (wt * rt + ws * rs + wv * rv + wa * ra) / totalWeight;
  return weightedScore.toFixed(2);
};

const getScoreColor = (score) => {
  const numScore = parseFloat(score);
  if (numScore >= 3.8) return '#15803d';
  if (numScore >= 2.8) return '#854d0e';
  return '#991b1b';
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const deg2rad = (deg) => deg * (Math.PI / 180);

const formatCategories = (types) => {
  if (!types) return [];
  const excludeTypes = ['restaurant', 'food', 'point_of_interest', 'establishment'];
  return types
    .filter(type => !excludeTypes.includes(type))
    .map(type => type.replace(/_/g, ' '))
    .map(type => type.charAt(0).toUpperCase() + type.slice(1));
};

// Sponsored badge component
const SponsoredBadge = () => (
  <View style={styles.sponsoredBadge}>
    <Text style={styles.sponsoredText}>Sponsored</Text>
  </View>
);

const RestaurantCard = ({ item, onPress, isSponsored }) => (
  <Pressable
    style={[styles.card, isSponsored && styles.sponsoredCard]}
    onPress={onPress}
  >
    <Image
      source={{ uri: item.imageUrl || "/api/placeholder/400/200" }}
      style={styles.cardImage}
    />
    {isSponsored && <SponsoredBadge />}
    {item.isOpenNow !== undefined && (
      <View style={[styles.openStatusBadge, { backgroundColor: item.isOpenNow ? '#059669' : '#DC2626' }]}>
        <Text style={styles.openStatusText}>
          {item.isOpenNow ? 'Open' : 'Closed'}
        </Text>
      </View>
    )}
    <View style={styles.cardContent}>
      <View style={styles.cardHeader}>
        <Text style={styles.restaurantName}>{item.name}</Text>
      </View>

      <View style={styles.ratingContainer}>
        <View style={styles.ratingGroup}>
          <Text style={styles.ratingText}>★ {item.avgOverallRating}</Text>
          {item.personalizedScore && (
            <Text style={[styles.personalizedScore, { color: getScoreColor(item.personalizedScore) }]}>
              ({item.personalizedScore}*)
            </Text>
          )}
        </View>
        <View style={styles.distanceBadge}>
          <Text style={styles.infoText}>
            📍 {item.distance ? `${(item.distance * 0.621371).toFixed(1)} mi` : 'N/A'}
          </Text>
        </View>
      </View>

      {item.categories && item.categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          {item.categories.slice(0, 2).map((category, index) => (
            <Text key={index} style={styles.categoryText}>
              {category}
              {index < Math.min(2, item.categories.length) - 1 ? ' • ' : ''}
            </Text>
          ))}
          <Text style={styles.priceLevel}>
            {item.priceLevel ? '•  ' + '$'.repeat(item.priceLevel) : ''}
          </Text>
        </View>
      )}

      <Text style={styles.descriptionText} numberOfLines={2}>
        {item.address || item.description}
      </Text>
    </View>
  </Pressable>
);

const SearchBar = ({ value, onSearch }) => (
  <View style={styles.searchContainer}>
    <Text style={styles.searchIcon}>🔍</Text>
    <TextInput
      style={styles.searchInput}
      placeholder="Search restaurants near Georgia Tech..."
      value={value}
      onChangeText={onSearch}
      placeholderTextColor="#6b7280"
    />
  </View>
);

const fetchFromCache = async (placeId) => {
  try {
    const docRef = doc(db, 'restaurants', placeId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Check if cache is still valid
      if (data.cachedAt && (Date.now() - data.cachedAt.toMillis()) < CACHE_DURATION) {
        console.log('Using cached data for:', placeId);
        return data;
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching from cache:', error);
    return null;
  }
};

const saveToCache = async (placeId, data) => {
  try {
    const docRef = doc(db, 'restaurants', placeId);
    await setDoc(docRef, {
      ...data,
      cachedAt: Timestamp.now()
    });
    console.log('Saved to cache:', placeId);
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
};

const fetchPlaceDetails = async (placeId) => {
  try {
    if (!placeId) {
      console.error('No place_id provided');
      return null;
    }

    // Try to get from cache first
    const cachedData = await fetchFromCache(placeId);
    if (cachedData) {
      return cachedData;
    }

    // If not in cache or expired, fetch from API
    const response = await retryWithBackoff(async () => {
      const result = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`, {
          params: {
            place_id: placeId,
            fields: 'opening_hours,price_level,user_ratings_total,types,website,formatted_phone_number,photos',
            key: GOOGLE_PLACES_API_KEY
          }
        }
      );
      return result;
    });

    if (response.data.status !== 'OK') {
      console.error('Place details API error:', response.data.status);
      return null;
    }

    const result = response.data.result;
    // Save to cache
    await saveToCache(placeId, result);
    return result;
  } catch (error) {
    console.error('Error fetching place details:', error.response?.data || error.message);
    return null;
  }
};

const Listings = () => {
  const [restaurantData, setRestaurantData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sponsoredRestaurant, setSponsoredRestaurant] = useState(null);
  const [userPreferences, setUserPreferences] = useState({
    taste: 5,
    service: 5,
    value: 5,
    atmosphere: 5,
  });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User is signed in:', user.uid);
        fetchUserPreferences(user);
      } else {
        console.log('No user is signed in');
        router.replace('/(auth)/signIn');
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserPreferences = async (user) => {
    try {
      console.log('Fetching preferences for user:', user.uid);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User preferences:', userData.preferences);
        setUserPreferences(userData.preferences);
      } else {
        console.log('No user document found');
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };

  const processRestaurantData = async (places) => {
    try {
      if (!places || !Array.isArray(places) || places.length === 0) {
        console.log('No places data received');
        return [];
      }

      const processedPlaces = await Promise.all(places.map(async (place) => {
        if (!place || !place.place_id) {
          console.log('Invalid place data:', place);
          return null;
        }

        // Try to get from cache first
        const cachedData = await fetchFromCache(place.place_id);
        if (cachedData) {
          console.log('Using cached data for restaurant:', place.place_id);
          return {
            id: place.place_id,
            name: place.name,
            address: place.vicinity || place.formatted_address,
            avgOverallRating: cachedData.rating || 0,
            personalizedScore: null, // Will be calculated below
            distance: calculateDistance(
              GT_LATITUDE,
              GT_LONGITUDE,
              place.geometry?.location?.lat,
              place.geometry?.location?.lng
            ),
            imageUrl: place.photos?.[0]?.photo_reference
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
              : null,
            isOpenNow: cachedData.opening_hours?.open_now,
            priceLevel: cachedData.price_level,
            userRatingsTotal: cachedData.user_ratings_total,
            categories: formatCategories(cachedData.types),
            features: [
              cachedData.opening_hours?.open_now ? '✓ Currently Open' : '✗ Currently Closed',
              cachedData.website ? '🌐 Website Available' : null,
              cachedData.formatted_phone_number ? '📞 Phone Available' : null,
            ].filter(Boolean),
          };
        }

        const details = await fetchPlaceDetails(place.place_id);
        console.log('Processing restaurant:', place.place_id);

        const reviewsSnapshot = await getDocs(collection(db, 'restaurants', place.place_id, 'reviews'));
        const reviews = reviewsSnapshot.docs.map(doc => doc.data());
        console.log('Found reviews:', reviews.length);

        const avgTaste = calculateAverage(reviews, 'taste');
        const avgService = calculateAverage(reviews, 'service');
        const avgAtmosphere = calculateAverage(reviews, 'atmosphere');
        const avgValue = calculateAverage(reviews, 'value');

        const avgOverallRating = calculateAverage(reviews, 'overallRating');
        const personalizedScore = calculatePWS(userPreferences, {
          taste: avgTaste,
          service: avgService,
          value: avgValue,
          atmosphere: avgAtmosphere,
        });

        return {
          id: place.place_id,
          name: place.name,
          address: place.vicinity || place.formatted_address,
          avgOverallRating,
          personalizedScore,
          distance: calculateDistance(
            GT_LATITUDE,
            GT_LONGITUDE,
            place.geometry?.location?.lat,
            place.geometry?.location?.lng
          ),
          imageUrl: place.photos?.[0]?.photo_reference
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
            : null,
          isOpenNow: details?.opening_hours?.open_now,
          priceLevel: details?.price_level,
          userRatingsTotal: details?.user_ratings_total,
          categories: formatCategories(details?.types),
          features: [
            details?.opening_hours?.open_now ? '✓ Currently Open' : '✗ Currently Closed',
            details?.website ? '🌐 Website Available' : null,
            details?.formatted_phone_number ? '📞 Phone Available' : null,
          ].filter(Boolean),
        };
      }));

      return processedPlaces.filter(place => place !== null);
    } catch (error) {
      console.error('Error processing restaurant data:', error);
      return [];
    }
  };

  const fetchSearchResults = async (query) => {
    if (!query) {
      setSearchResults(restaurantData);
      return;
    }
    try {
      const response = await retryWithBackoff(async () => {
        const result = await axios.get(
          `https://maps.googleapis.com/maps/api/place/textsearch/json`, {
            params: {
              query: query,
              type: 'restaurant',
              location: `${GT_LATITUDE},${GT_LONGITUDE}`,
              radius: SEARCH_RADIUS,
              key: GOOGLE_PLACES_API_KEY
            }
          }
        );
        return result;
      });

      if (response.data.status !== 'OK') {
        console.error('Search API error:', response.data.status);
        setSearchResults([]);
        return;
      }

      const filteredResults = response.data.results
        .filter(result => result.geometry?.location)
        .filter(result => {
          const distance = calculateDistance(
            GT_LATITUDE,
            GT_LONGITUDE,
            result.geometry.location.lat,
            result.geometry.location.lng
          );
          return distance !== null && distance <= MAX_DISTANCE_KM;
        });

      const processedResults = await processRestaurantData(filteredResults);
      setSearchResults(processedResults.sort((a, b) => a.distance - b.distance));
    } catch (error) {
      console.error('Error fetching search results:', error.response?.data || error.message);
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const fetchInitialRestaurants = async () => {
      if (!userPreferences) return;

      try {
        console.log('Fetching initial restaurants...');
        const response = await retryWithBackoff(async () => {
          const result = await axios.get(
            `https://maps.googleapis.com/maps/api/place/nearbysearch/json`, {
              params: {
                location: `${GT_LATITUDE},${GT_LONGITUDE}`,
                radius: SEARCH_RADIUS,
                type: 'restaurant',
                key: GOOGLE_PLACES_API_KEY
              }
            }
          );
          return result;
        });

        if (response.data.status !== 'OK') {
          console.error('Nearby search API error:', response.data.status);
          setRestaurantData([]);
          setSearchResults([]);
          return;
        }

        if (!response.data.results || !Array.isArray(response.data.results)) {
          console.error('Invalid response format:', response.data);
          return;
        }

        console.log('Found restaurants:', response.data.results.length);
        
        if (response.data.results.length === 0) {
          console.log('No restaurants found');
          setRestaurantData([]);
          setSearchResults([]);
          return;
        }

        const processedResults = await processRestaurantData(response.data.results.slice(1));
        const sponsoredPlace = response.data.results[0] ? 
          await processRestaurantData([response.data.results[0]]) : 
          null;

        setSponsoredRestaurant(sponsoredPlace?.[0] || null);
        setRestaurantData(processedResults);
        setSearchResults(processedResults);
      } catch (error) {
        console.error('Error fetching initial restaurants:', error.response?.data || error.message);
        setRestaurantData([]);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialRestaurants();
  }, [userPreferences]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchQuery}
        onSearch={(text) => {
          setSearchQuery(text);
          fetchSearchResults(text);
        }}
      />
      <FlatList
        data={searchResults}
        ListHeaderComponent={() =>
          sponsoredRestaurant ? (
            <RestaurantCard
              item={sponsoredRestaurant}
              onPress={() => router.push(`/${sponsoredRestaurant.id}`)}
              isSponsored={true}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <RestaurantCard
            item={item}
            onPress={() => router.push(`/${item.id}`)}
            isSponsored={false}
          />
        )}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          searchQuery ? (
            <Text style={styles.noResultsText}>
              No restaurants found within 1 mile of Georgia Tech
            </Text>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingTop: 8,
  },
  openStatusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  categoriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    color: '#4b5563',
    fontSize: 14,
  },
  distanceBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reviewCount: {
    color: '#6b7280',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    padding: 0,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    height: 160,
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontWeight: '600',
    color: '#1f2937',
  },
  personalizedScore: {
    fontWeight: '600',
    marginLeft: 4,
  },
  priceLevel: {
    color: '#2563eb',
    fontWeight: '600',
    marginLeft: 8,
  },
  infoText: {
    color: '#6b7280',
    fontSize: 14,
  },
  descriptionText: {
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
  },
  tagText: {
    color: '#4b5563',
    fontSize: 12,
  },
  sponsoredCard: {
    borderWidth: 2,
    borderColor: '#2563eb',
    backgroundColor: '#f0f9ff',
  },
  sponsoredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  sponsoredText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#6b7280',
    fontSize: 16,
  },
});

export default Listings;