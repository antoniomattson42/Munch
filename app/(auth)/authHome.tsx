import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  signIn: undefined;
  signUp: undefined;
};

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Load the custom font
  const [fontsLoaded] = useFonts({
    'ZenAntiqueSoft': require('../../assets/fonts/ZenAntiqueSoft-Regular.ttf'),
  });

  // Callback to hide splash screen when fonts are loaded
  useEffect(() => {
    async function hideSplashScreen() {
      if (fontsLoaded) {
        await SplashScreen.hideAsync();
      }
    }

    hideSplashScreen();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // Don't render anything until fonts are loaded
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: 'center', backgroundColor: '#efefef', padding: 16 }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: '100%', alignItems: 'center', marginBottom: 60 }}>
          <Text style={{ fontSize: 84, color: '#1a1a1a', fontFamily: 'ZenAntiqueSoft' }}>Munch</Text>
        </View>

        <View style={{ width: '100%' }}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('signIn')}
            contentStyle={{ paddingVertical: 8 }}
            style={{ borderRadius: 25, marginBottom: 20 }}
            buttonColor="#1a1a1a"
          >
            Sign In
          </Button>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('signUp')}
            contentStyle={{ paddingVertical: 8 }}
            style={{ borderRadius: 25, marginBottom: 20 }}
            buttonColor="#1a1a1a"
          >
            Create Account
          </Button>
        </View>
      </View>

      <View style={{ marginBottom: 40, alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: '#1a1a1a', fontFamily: 'ZenAntiqueSoft', lineHeight: 24, textAlign: 'center' }}>
          Restaurant Discovery{'\n'}Personalized for your Palate.
        </Text>
      </View>

      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}
