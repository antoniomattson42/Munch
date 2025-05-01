import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useEffect, useState } from 'react';
import * as NavigationBar from 'expo-navigation-bar';

const RootLayout = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync('#efefef');
  }, []);

  const onAuthStateChanged = (user: FirebaseAuthTypes.User | null) => {
    // console.log('onAuthStateChanged', user);
    setUser(user);
    if (initializing) setInitializing(false);
  };

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
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
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(pages)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

export default RootLayout;
