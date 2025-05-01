import { Link, router } from 'expo-router';
import { View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator, Image, TextInput } from 'react-native';
import { useRef, useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import axios from 'axios';

const GOOGLE_PLACES_API_KEY = 'AIzaSyDWetBIR9Z_NrU4WNbNbLLx4L0vRwMghkg';
const GT_LATITUDE = 33.7756;
const GT_LONGITUDE = -84.3963;
const SEARCH_RADIUS = 1600;
const MAX_DISTANCE_KM = 1.6;

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

const fetchPlaceDetails = async (placeId) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json?` +
      `place_id=${placeId}` +
      `&fields=opening_hours,price_level,user_ratings_total,types,website,formatted_phone_number` +
      `&key=${GOOGLE_PLACES_API_KEY}`
    );

    return response.data.result;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
};

export { fetchPlaceDetails };

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
    const fetchUserPreferences = async () => {
      const user = auth().currentUser;
      if (user) {
        try {
          const userDoc = await firestore().collection('users').doc(user.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            setUserPreferences(userData.preferences);
          }
        } catch (error) {
          console.error('Error fetching user preferences:', error);
        }
      }
    };
    fetchUserPreferences();
  }, []);

  const processRestaurantData = async (places) => {
    const processedPlaces = await Promise.all(places.map(async (place) => {
      const details = await fetchPlaceDetails(place.place_id);

      const reviewsSnapshot = await firestore()
        .collection('restaurants')
        .doc(place.place_id)
        .collection('reviews')
        .get();

      const reviews = reviewsSnapshot.docs.map(doc => doc.data());

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
          place.geometry.location.lat,
          place.geometry.location.lng
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

    return processedPlaces;
  };

  const fetchSearchResults = async (query) => {
    if (!query) {
      setSearchResults(restaurantData);
      return;
    }
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
        `query=${query}` +
        `&type=restaurant` +
        `&location=${GT_LATITUDE},${GT_LONGITUDE}` +
        `&radius=${SEARCH_RADIUS}` +
        `&key=${GOOGLE_PLACES_API_KEY}`
      );

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
      console.error('Error fetching search results:', error);
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const fetchInitialRestaurants = async () => {
      if (!userPreferences) return;

      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
          `location=${GT_LATITUDE},${GT_LONGITUDE}` +
          `&radius=${SEARCH_RADIUS}` +
          `&type=restaurant` +
          `&key=${GOOGLE_PLACES_API_KEY}`
        );

        const processedResults = await processRestaurantData(response.data.results.slice(1));
        const sponsoredPlace = await processRestaurantData([response.data.results[0]]);
        setSponsoredRestaurant(sponsoredPlace[0]);

        setRestaurantData(processedResults);
        setSearchResults(processedResults);
      } catch (error) {
        console.error('Error fetching initial restaurants:', error);
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