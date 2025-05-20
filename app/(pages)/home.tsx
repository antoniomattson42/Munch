import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
// import auth from '@react-native-firebase/auth';
// import firestore from '@react-native-firebase/firestore';
import Slider from '@react-native-community/slider';

const TOTAL_POINTS_LIMIT = 16;

function UserProfile() {
  const user = auth().currentUser;
  const [profile, setProfile] = useState({
    email: user?.email || '',
    description: '',
    profileInfo: {
      username: '',
      bio: '',
    },
    preferences: {
      taste: '3',
      service: '3',
      value: '3',
      atmosphere: '3',
    },
  });
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(12);
  const [expandedPreference, setExpandedPreference] = useState(null);

  useEffect(() => {
    if (user) {
      const uid = user.uid;

      const fetchProfile = async () => {
        try {
          const profileDoc = await firestore().collection('users').doc(uid).get();

          if (profileDoc.exists) {
            const data = profileDoc.data();
            const newProfile = {
              ...profile,
              email: data.email || profile.email,
              description: data.description || profile.description,
              profileInfo: {
                ...profile.profileInfo,
                ...data.profileInfo,
              },
              preferences: {
                ...profile.preferences,
                ...data.preferences,
              },
            };
            setProfile(newProfile);

            // Calculate initial total points
            const initialTotal = Object.values(newProfile.preferences)
              .reduce((sum, value) => sum + parseInt(value, 10), 0);
            setTotalPoints(initialTotal);
          } else {
            console.log("No profile found. Please complete your profile information.");
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          Alert.alert("Error", "Could not load your profile information.");
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    }
  }, [user]);

  const updateProfile = async () => {
    if (user) {
      const uid = user.uid;

      try {
        await firestore().collection('users').doc(uid).set(
          {
            email: profile.email,
            description: profile.description,
            profileInfo: {
              username: profile.profileInfo.username,
              bio: profile.profileInfo.bio,
            },
            preferences: profile.preferences,
            updated_at: firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        Alert.alert("Success", "Profile updated successfully");
      } catch (error) {
        console.error("Error updating profile:", error);
        Alert.alert("Error", "Failed to update profile");
      }
    } else {
      Alert.alert("Error", "You must be logged in to update your profile");
    }
  };

  const handlePreferenceChange = (preference, newValue) => {
    const currentValue = parseInt(profile.preferences[preference], 10);
    const newTotal = totalPoints - currentValue + newValue;

    if (newTotal <= TOTAL_POINTS_LIMIT) {
      setProfile({
        ...profile,
        preferences: {
          ...profile.preferences,
          [preference]: newValue.toString()
        },
      });
      setTotalPoints(newTotal);
    } else {
        Alert.alert(
          "Point Limit Reached",
          "You can only allocate up to 16 total points across all preferences. Try lowering other preferences first.",
          [{ text: "OK" }]
        );
    }
  };

  const preferenceDescriptions = {
    taste: "Rate how much you value the flavor of a restaurant's food",
    service: "Rate how important good customer service is to your dining experience",
    value: "Rate how much you care about getting good value for your money",
    atmosphere: "Rate how much the restaurant's ambiance matters to you",
  };

  const toggleDescription = (preference) => {
    setExpandedPreference(expandedPreference === preference ? null : preference);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileHeader}>
        <TextInput
          style={[styles.username, profile.profileInfo.username ? null : styles.usernamePlaceholder]}
          value={profile.profileInfo.username}
          onChangeText={(text) => setProfile({
            ...profile,
            profileInfo: {
              ...profile.profileInfo,
              username: text
            }
          })}
          placeholder="Enter your username"
        />
        <Text style={styles.email}>{profile.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <TextInput
          style={styles.descriptionInput}
          value={profile.description}
          onChangeText={(text) => setProfile({ ...profile, description: text })}
          multiline={true}
          textAlignVertical="top"
          placeholder="Tell us about yourself..."
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.preferencesContainer}>
        <Text style={styles.preferencesTitle}>Palate Preferences</Text>
        <Text style={styles.preferencesSubtitle}>
          Help us personalize your restaurant recommendations. Note: You must reload the app for changes to take effect.
        </Text>
        <Text style={styles.pointsRemaining}>
          Total Points: {totalPoints}/{TOTAL_POINTS_LIMIT}
        </Text>

        {Object.keys(profile.preferences).map((preference) => (
          <View key={preference}>
            <TouchableOpacity
              style={styles.preferenceContainer}
              onPress={() => toggleDescription(preference)}
              activeOpacity={0.8}
            >
              <View style={styles.preferenceHeader}>
                <View style={styles.infoIconContainer}>
                  <Text style={styles.preferenceTitle}>
                    {preference.charAt(0).toUpperCase() + preference.slice(1)}
                  </Text>
                  <Text style={styles.infoIcon}>ⓘ</Text>
                </View>
                <Text style={styles.preferenceValue}>
                  {profile.preferences[preference]}
                </Text>
              </View>

              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={5}
                  step={1}
                  value={parseInt(profile.preferences[preference], 10)}
                  onValueChange={(value) => handlePreferenceChange(preference, value)}
                  minimumTrackTintColor="#4CAF50"
                  maximumTrackTintColor="#E0E0E0"
                  thumbTintColor="#4CAF50"
                />
              </View>
            </TouchableOpacity>

            {expandedPreference === preference && (
              <View style={styles.descriptionDropdown}>
                <Text style={styles.descriptionText}>
                  {preferenceDescriptions[preference]}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.updateButton]}
          onPress={updateProfile}
        >
          <Text style={styles.buttonText}>UPDATE PROFILE</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 4,
  },
  usernamePlaceholder: {
    color: '#9CA3AF',
  },
  email: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 16,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  descriptionInput: {
    backgroundColor: '#F3F4F6',
    borderWidth: 0,
    borderRadius: 12,
    padding: 12,
    height: 100,
    fontSize: 14,
    color: '#374151',
    textAlignVertical: 'top',
  },
  preferencesContainer: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  preferencesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  preferencesSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  pointsRemaining: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 8,
  },
  preferenceContainer: {
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 12,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  preferenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 11,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  preferenceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  sliderContainer: {
    width: '100%',
    paddingHorizontal: 10,
  },
  slider: {
    width: '100%',
    height: 25,
    marginVertical: 0,
  },
  buttonContainer: {
    padding: 16,
    marginTop: 8,
    gap: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  infoIcon: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 6,
  },
  descriptionDropdown: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14, 
    color: '#6B7280',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});

export default UserProfile;