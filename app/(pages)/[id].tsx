import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, TextInput } from 'react-native';
// import firestore from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';
import { Picker } from '@react-native-picker/picker';
import { fetchPlaceDetails } from './listings';

// Utility Functions
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

// Components
const AdaptiveHeader = ({ title, onBack, onRefresh }) => {
  return (
    <View className="bg-white px-4 py-3 border-b border-gray-100">
      <View className="flex-row items-center">
        <Pressable
          onPress={onBack}
          className="w-12 h-12 rounded-lg bg-gray-100 items-center justify-center"
        >
          <Text className="text-gray-600 text-3xl">←</Text>
        </Pressable>

        <View className="flex-1 px-3">
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="text-xl font-semibold text-gray-800 text-center"
          >
            {title}
          </Text>
        </View>

        <Pressable
          onPress={onRefresh}
          className="w-12 h-12 rounded-lg bg-gray-100 items-center justify-center"
        >
          <Text className="text-gray-600 text-3xl">⟳</Text>
        </Pressable>
      </View>
    </View>
  );
};

const ScoreCard = ({ label, score, subtitle, highlight = false }) => (
  <View className={`rounded-xl p-4 ${highlight ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
    <View className="flex-row items-baseline">
      <Text className={`text-3xl font-bold ${highlight ? 'text-green-600' : 'text-gray-800'}`}>
        {score}
      </Text>
      <Text className="text-sm text-gray-500 ml-1">/5</Text>
    </View>
    <Text className="text-sm text-gray-600 mt-1">{label}</Text>
    {subtitle && <Text className="text-xs text-gray-400 mt-1">{subtitle}</Text>}
  </View>
);

const RatingBar = ({ category, score, maxScore = 5 }) => {
  const percentage = (score / maxScore) * 100;
  const getBarColor = (score) => {
    if (score >= 4) return 'bg-green-500';
    if (score >= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <View className="flex-row items-center space-x-4 mb-3">
      <Text className="text-sm text-gray-600 w-24">{category}</Text>
      <View className="flex-1 bg-gray-100 h-2 rounded-full">
        <View
          className={`h-full rounded-full ${getBarColor(score)}`}
          style={{ width: `${percentage}%` }}
        />
      </View>
      <Text className="text-sm text-gray-600 w-8">{score.toFixed(1)}</Text>
    </View>
  );
};

const ReviewCard = ({ review }) => (
  <View className="bg-white p-4 rounded-xl mb-4 shadow-sm">
    <View className="flex-row justify-between items-center mb-2">
      <View className="flex-row items-center space-x-2">
        <View className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
          <Text className="text-sm font-medium text-gray-600">
            {review.reviewer.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text className="font-medium text-gray-800">{review.reviewer}</Text>
      </View>
      <Text className="text-sm text-gray-400">
        {new Date(review.timestamp).toLocaleDateString()}
      </Text>
    </View>
    <View className="flex-row items-center space-x-2 mb-3">
      <Text className="text-yellow-500 font-bold">★</Text>
      <Text className="text-sm text-gray-600">{review.overallRating}/5 overall</Text>
    </View>
    <Text className="text-gray-700 mb-3">{review.comment}</Text>
    <View className="bg-gray-50 p-3 rounded-lg">
      <View className="grid grid-cols-2 gap-2">
        <Text className="text-sm text-gray-500">Taste: {review.taste}/5</Text>
        <Text className="text-sm text-gray-500">Service: {review.service}/5</Text>
        <Text className="text-sm text-gray-500">Value: {review.value}/5</Text>
        <Text className="text-sm text-gray-500">Atmosphere: {review.atmosphere}/5</Text>
      </View>
    </View>
  </View>
);

const RestaurantDetails = () => {
  const { id, placeId } = useLocalSearchParams();
  const restaurantId = Array.isArray(id) ? id[0] : id;
  const [restaurant, setRestaurant] = useState(null);
  const [placeDetails, setPlaceDetails] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCriteria, setSortCriteria] = useState('date');
  const [sortOrder, setSortOrder] = useState('descending');
  const [userPreferences, setUserPreferences] = useState({
    taste: 5,
    service: 5,
    value: 5,
    atmosphere: 5,
  });

  const user = auth().currentUser;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch place details from Google Places API
        if (placeId) {
          const place = await fetchPlaceDetails(placeId);
          setPlaceDetails(place);
        }

        // Fetch restaurant data from Firestore
        const restaurantDoc = await firestore()
          .collection('restaurants')
          .doc(restaurantId)
          .get();

        if (restaurantDoc.exists) {
          setRestaurant(restaurantDoc.data());
        }

        // Fetch user preferences
        if (user) {
          const userDoc = await firestore().collection('users').doc(user.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            setUserPreferences(userData.preferences);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurantId, placeId, user]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const reviewsSnapshot = await firestore()
        .collection('restaurants')
        .doc(restaurantId)
        .collection('reviews')
        .get();
      const reviewsList = reviewsSnapshot.docs.map(doc => doc.data());
      setReviews(reviewsList);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [restaurantId]);

  useEffect(() => {
    let updatedReviews = [...reviews];
    if (searchTerm) {
      updatedReviews = updatedReviews.filter(review =>
        review.comment.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    updatedReviews.sort((a, b) => {
      if (sortCriteria === 'date') {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortOrder === 'ascending' ? dateA - dateB : dateB - dateA;
      } else {
        const valueA = a[sortCriteria] || 0;
        const valueB = b[sortCriteria] || 0;
        return sortOrder === 'ascending' ? valueA - valueB : valueB - valueA;
      }
    });
    setFilteredReviews(updatedReviews);
  }, [searchTerm, sortCriteria, sortOrder, reviews]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" className="text-green-600" />
      </View>
    );
  }

  if (!restaurant && !placeDetails) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-600">Restaurant not found</Text>
      </View>
    );
  }

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

  const restaurantName = placeDetails?.name || restaurant?.name;

  return (
    <View className="flex-1 bg-white">
      <AdaptiveHeader
        title={restaurantName}
        onBack={() => router.push('/listings')}
        onRefresh={fetchReviews}
      />

      <FlatList
        data={filteredReviews}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={() => (
          <View className="p-4 space-y-6">
            <View className="flex-row space-x-4">
              <View className="flex-1">
                <ScoreCard
                  label="Overall Rating"
                  score={avgOverallRating}
                  subtitle={`Based on ${placeDetails?.user_ratings_total || reviews.length} Ratings`}
                />
              </View>
              <View className="flex-1">
                <ScoreCard
                  label="Your Match"
                  score={personalizedScore}
                  subtitle="Adjusted for You"
                  highlight
                />
              </View>
            </View>

            <View className="bg-white rounded-xl p-4 shadow-sm">
              <RatingBar category="Taste" score={avgTaste} />
              <RatingBar category="Service" score={avgService} />
              <RatingBar category="Value" score={avgValue} />
              <RatingBar category="Atmosphere" score={avgAtmosphere} />
            </View>

            <Pressable
              onPress={() => router.push({
                pathname: '/LeaveReview',
                params: { id: restaurantId, placeId, name: restaurantName }
              })}
              className="bg-green-500 p-4 rounded-xl flex-row justify-center items-center space-x-2"
            >
              <Text className="text-white font-semibold">✏️ Write a Review</Text>
            </Pressable>

            <View className="relative">
              <TextInput
                placeholder="Search reviews..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                className="bg-gray-50 px-4 py-3 rounded-xl text-gray-800"
              />
              <Text className="absolute right-3 top-3 text-gray-400">🔍</Text>
            </View>

            <View className="flex-row space-x-2">
              <View className="flex-1 bg-gray-50 rounded-lg overflow-hidden">
                <Picker
                  selectedValue={sortCriteria}
                  onValueChange={setSortCriteria}
                  className="h-10"
                >
                  <Picker.Item label="Date" value="date" />
                  <Picker.Item label="Taste" value="taste" />
                  <Picker.Item label="Service" value="service" />
                  <Picker.Item label="Value" value="value" />
                  <Picker.Item label="Atmosphere" value="atmosphere" />
                </Picker>
              </View>
              <View className="flex-1 bg-gray-50 rounded-lg overflow-hidden">
                <Picker
                  selectedValue={sortOrder}
                  onValueChange={setSortOrder}
                  className="h-10"
                >
                  <Picker.Item label="Descending" value="descending" />
                  <Picker.Item label="Ascending" value="ascending" />
                </Picker>
              </View>
            </View>

            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Reviews ({filteredReviews.length})
            </Text>
          </View>
        )}
        renderItem={({ item }) => <ReviewCard review={item} />}
        contentContainerClassName="pb-6"
      />
    </View>
  );
};

export default RestaurantDetails;