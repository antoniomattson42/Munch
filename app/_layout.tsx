import React from 'react';
import { Slot, Stack, useRouter, useSegments } from 'expo-router';
// import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useEffect, useState } from 'react';
import * as NavigationBar from 'expo-navigation-bar';

const RootLayout = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync('#efefef');
  }, []);

  const onAuthStateChanged = (user) => {
    // console.log('onAuthStateChanged', user);
    setUser(user);
    if (initializing) setInitializing(false);
  };

  useEffect(() => {
    // Mock auth state change for now
    const mockUser = null; // or { uid: '123', email: 'user@example.com' } for testing
    onAuthStateChanged(mockUser);
  }, []);

  useEffect(() => {
    if (initializing) return;

    // const inAuthGroup = segments[0] === '(pages)';

    if (!user) {
      // User is not authenticated, redirect to signIn
      router.replace('/(auth)/authHome');
    } else if (user) {
      // User is authenticated, redirect to home page
      router.replace('/(pages)/listings');
    }
  }, [user, initializing]);

  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ headerShown: false }} 
        key="index"
      />
      <Stack.Screen 
        name="(auth)" 
        options={{ headerShown: false }} 
        key="auth"
      />
      <Stack.Screen 
        name="(pages)" 
        options={{ headerShown: false }} 
        key="pages"
      />
    </Stack>
  );
};

export default RootLayout;
