import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useLocalSearchParams, router } from 'expo-router';
import auth from '@react-native-firebase/auth';

const LeaveReview = () => {
  const { id, name } = useLocalSearchParams(); // Receive ID and name
  const restaurantId = Array.isArray(id) ? id[0] : id;
  const restaurantNameFromParams = Array.isArray(name) ? name[0] : name;

  const user = auth().currentUser;

  const [taste, setTaste] = useState('');
  const [service, setService] = useState('');
  const [value, setValue] = useState('');
  const [atmosphere, setAtmosphere] = useState('');
  const [comment, setComment] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [restaurantName, setRestaurantName] = useState(name); // Use param name as initial state
  const [loading, setLoading] = useState(true);

  // Update restaurantName when params change
  useEffect(() => {
    setRestaurantName(name); // Ensure restaurantName reflects the latest params
  }, [name]);

  useEffect(() => {
    console.log('Params on Leave Review Page:', { id, name }); // Print params to the console
  }, [id, name]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const userDoc = await firestore().collection('users').doc(user.uid).get();
          if (userDoc.exists) {
            setUserProfile(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };

    const fetchRestaurantName = async () => {
      try {
        const restaurantDoc = await firestore().collection('restaurants').doc(restaurantId).get();
        if (restaurantDoc.exists) {
          setRestaurantName(restaurantDoc.data().name || restaurantNameFromParams);
        }
      } catch (error) {
        console.error("Error fetching restaurant name:", error);
        setRestaurantName(restaurantNameFromParams || 'Unnamed Restaurant');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
    fetchRestaurantName();
  }, [user, restaurantId, restaurantNameFromParams]);

  const isValidRating = (rating) => {
    const num = Number(rating);
    return !isNaN(num) && num >= 1 && num <= 5;
  };

  const handleSubmitReview = async () => {
    if (!user) {
      Alert.alert("Not Logged In", "Please log in to submit a review.");
      return;
    }

    if (
      !isValidRating(taste) ||
      !isValidRating(service) ||
      !isValidRating(value) ||
      !isValidRating(atmosphere)
    ) {
      Alert.alert("Invalid Ratings", "All ratings must be numbers between 1 and 5.");
      return;
    }

    if (!comment) {
      Alert.alert("Incomplete Review", "Please fill out all fields.");
      return;
    }

    const preferences = userProfile?.preferences || {
      taste: 5,
      service: 5,
      value: 5,
      atmosphere: 5,
    };

    const reviewerName = userProfile?.username || user.email;

    try {
      const restaurantRef = firestore().collection('restaurants').doc(restaurantId);

      const restaurantDoc = await restaurantRef.get();
      if (!restaurantDoc.exists) {
        // Create the restaurant with the provided ID and name
        await restaurantRef.set({
          name: restaurantName,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      await restaurantRef.collection('reviews').add({
        reviewer: reviewerName,
        taste: Number(taste),
        service: Number(service),
        value: Number(value),
        atmosphere: Number(atmosphere),
        overallRating: (Number(taste) + Number(service) + Number(value) + Number(atmosphere)) / 4,
        comment,
        timestamp: new Date().toISOString(),
        preferences: {
          taste: preferences.taste,
          service: preferences.service,
          value: preferences.value,
          atmosphere: preferences.atmosphere,
        },
      });

      Alert.alert("Review Submitted", "Thank you for your review!");
      setTaste('');
      setService('');
      setValue('');
      setAtmosphere('');
      setComment('');

      router.replace('/listings');

    } catch (error) {
      console.error("Error submitting review:", error);
      Alert.alert("Error", "There was an issue submitting your review.");
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#6200ee" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.restaurantName}>Leave a Review for {restaurantName}</Text>

      <TextInput
        placeholder="Taste (1-5)"
        style={styles.input}
        keyboardType="numeric"
        value={taste}
        onChangeText={setTaste}
      />
      <TextInput
        placeholder="Service (1-5)"
        style={styles.input}
        keyboardType="numeric"
        value={service}
        onChangeText={setService}
      />
      <TextInput
        placeholder="Value (1-5)"
        style={styles.input}
        keyboardType="numeric"
        value={value}
        onChangeText={setValue}
      />
      <TextInput
        placeholder="Atmosphere (1-5)"
        style={styles.input}
        keyboardType="numeric"
        value={atmosphere}
        onChangeText={setAtmosphere}
      />
      <TextInput
        placeholder="Comments"
        style={[styles.input, styles.commentInput]}
        value={comment}
        onChangeText={setComment}
        multiline
      />

      <Button title="Submit Review" onPress={handleSubmitReview} color="#4CAF50" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: '#fff',
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  commentInput: {
    height: 80,
    textAlignVertical: 'top',
  },
});

export default LeaveReview;
