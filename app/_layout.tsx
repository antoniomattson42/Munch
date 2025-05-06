import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import * as NavigationBar from 'expo-navigation-bar';

const RootLayout = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync('#efefef');
  }, []);

  const handleAuthStateChanged = (user: User | null) => {
    console.log('Auth state changed:', user?.uid);
    setUser(user);
    if (initializing) setInitializing(false);
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChanged);
    return unsubscribe; // unsubscribe on unmount
  }, []);

  useEffect(() => {
    if (initializing) return;

    if (!user) {
      // User is not authenticated, redirect to signIn
      router.replace('/(auth)/signIn');
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
