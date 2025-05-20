import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// import auth from '@react-native-firebase/auth';

const Settings = () => {
  const router = useRouter();

  const handleSignOut = () => {
    auth().signOut();
  };

  const renderSettingItem = (icon: string, title: string, onPress: () => void) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingContent}>
        <Text>
          <Ionicons name={icon} size={24} color="#4B5563" />
        </Text>
        <Text style={styles.settingText}>{title}</Text>
      </View>
      <Text>
        <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          {renderSettingItem('person-outline', 'Profile', () => router.push('/(pages)/home'))}
          {renderSettingItem('information-circle-outline', 'About', () => router.push('/(pages)/about'))}
        </View>

        {/* Sign Out Section */}
        <View style={[styles.section, styles.signOutSection]}>
          <TouchableOpacity
            style={[styles.settingItem, styles.signOutButton]}
            onPress={handleSignOut}
          >
            <View style={styles.settingContent}>
              <Text>
                <Ionicons name="log-out-outline" size={24} color="#DC2626" />
              </Text>
              <Text style={[styles.settingText, styles.signOutText]}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  signOutSection: {
    marginTop: 'auto',
    marginBottom: 24,
  },
  signOutButton: {
    borderBottomWidth: 0,
  },
  signOutText: {
    color: '#DC2626',
  },
});

export default Settings;