import { Slot, Stack, useRouter, useSegments } from 'expo-router';

const RootLayout = () => {

  return (
    <>
      <Stack>
        <Stack.Screen name="authHome" options={{ headerShown: false }} />
        <Stack.Screen name="signIn" options={{ headerShown: false }} />
        <Stack.Screen name="signUp" options={{ headerShown: false }} />
      </Stack>
    </>
  )
}

export default RootLayout
