import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Amplify } from 'aws-amplify';
import awsconfig from '../src/aws-exports';

try {
  Amplify.configure(awsconfig);
} catch (error) {
  console.warn('Failed to configure Amplify:', error);
}

export default function Index() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Loading...</Text>
    </View>
  );
}
