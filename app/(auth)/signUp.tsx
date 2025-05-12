import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Auth } from 'aws-amplify';

const validationSchema = Yup.object().shape({
  email: Yup.string().email('Please enter a valid email').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

type RootStackParamList = {
  signIn: undefined;
  signUp: undefined;
  '(pages)': undefined;
};

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [fontsLoaded] = useFonts({
    'ZenAntiqueSoft': require('../../assets/fonts/ZenAntiqueSoft-Regular.ttf'),
  });

  useEffect(() => {
    async function hideSplashScreen() {
      if (fontsLoaded) {
        await SplashScreen.hideAsync();
      }
    }

    hideSplashScreen();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      await Auth.signUp({
        username: email,
        password,
        attributes: { email },
      });
      alert('Account created. Please check your email for a verification code.');
      navigation.navigate('signIn');
    } catch (error: any) {
      alert('Registration Failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: 'center', backgroundColor: '#efefef', padding: 16 }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: '100%', alignItems: 'center', marginBottom: 60 }}>
          <Text style={{ fontSize: 84, color: '#1a1a1a', fontFamily: 'ZenAntiqueSoft' }}>Munch</Text>
        </View>

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={validationSchema}
          onSubmit={(values, { setSubmitting }) => {
            signUp(values.email, values.password);
            setSubmitting(false);
          }}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
            <>
              <TextInput
                label="Email"
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                value={values.email}
                mode="outlined"
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ marginBottom: 8, width: '100%' }}
                error={touched.email && Boolean(errors.email)}
              />
              {touched.email && errors.email && (
                <Text style={{ color: 'red', alignSelf: 'flex-start', marginLeft: 12, marginTop: -6 }}>
                  {errors.email}
                </Text>
              )}

              <TextInput
                label="Password"
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                value={values.password}
                mode="outlined"
                secureTextEntry
                style={{ marginBottom: 8, width: '100%' }}
                error={touched.password && Boolean(errors.password)}
              />
              {touched.password && errors.password && (
                <Text style={{ color: 'red', alignSelf: 'flex-start', marginLeft: 12, marginTop: -6 }}>
                  {errors.password}
                </Text>
              )}

              <Button
                mode="contained"
                onPress={() => handleSubmit()}
                loading={isSubmitting || loading}
                disabled={isSubmitting || loading}
                contentStyle={{ paddingVertical: 8 }}
                style={{ borderRadius: 25, marginBottom: 20, marginTop: 10, width: '100%' }}
                buttonColor="#1a1a1a"
              >
                Create Account
              </Button>
            </>
          )}
        </Formik>
      </View>

      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity onPress={() => navigation.navigate('signIn')}>
          <Text style={{ textAlign: 'center', color: '#6200ee' }}>
            Already have an account?
          </Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}
