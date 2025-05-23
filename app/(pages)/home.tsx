import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Auth } from 'aws-amplify';
import Slider from '@react-native-community/slider';

const TOTAL_POINTS_LIMIT = 16;

function UserProfile() {
  // Hardcoded user info for display only
  const username = 'johndoe';
  const email = 'johndoe@example.com';
  const description = 'Food lover. Always searching for the best local eats!';
  const bio = 'Passionate about food and travel.';
  const preferences = {
    taste: 4,
    service: 3,
    value: 5,
    atmosphere: 4,
  };
  const totalPoints = preferences.taste + preferences.service + preferences.value + preferences.atmosphere;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileHeader}>
        <Text style={styles.username}>{username}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.descriptionInput}>{description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bio</Text>
        <Text style={styles.descriptionInput}>{bio}</Text>
      </View>

      <View style={styles.preferencesContainer}>
        <Text style={styles.preferencesTitle}>Palate Preferences</Text>
        <Text style={styles.preferencesSubtitle}>
          Help us personalize your restaurant recommendations. Note: You must reload the app for changes to take effect.
        </Text>
        <Text style={styles.pointsRemaining}>
          Total Points: {totalPoints}/{TOTAL_POINTS_LIMIT}
        </Text>
        {Object.entries(preferences).map(([key, value], idx) => (
          // @ts-ignore
          <View style={styles.preferenceContainer} key={idx}>
            <View style={styles.preferenceHeader}>
              <View style={styles.infoIconContainer}>
                <Text style={styles.preferenceTitle}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                <Text style={styles.infoIcon}>ⓘ</Text>
              </View>
              <Text style={styles.preferenceValue}>{value}</Text>
            </View>
          </View>
        ))}
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