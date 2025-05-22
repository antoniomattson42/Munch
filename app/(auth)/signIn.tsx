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
  username: Yup.string().required('Username is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

type RootStackParamList = {
  signIn: undefined;
  signUp: undefined;
  '(pages)': undefined;
};

SplashScreen.preventAutoHideAsync();

export default function SignInScreen() {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [fontsLoaded] = useFonts({ 'ZenAntiqueSoft': require('../../assets/fonts/ZenAntiqueSoft-Regular.ttf') });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const signIn = async (username: string, password: string) => {
    setLoading(true);
    try {
      await Auth.signIn(username, password);
      navigation.navigate('(pages)');
    } catch (error: any) {
      alert('Sign in failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: 'center', backgroundColor: '#efefef', padding: 16 }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 84, color: '#1a1a1a', fontFamily: 'ZenAntiqueSoft', marginBottom: 60 }}>Munch</Text>
        <Formik
          initialValues={{ username: '', password: '' }}
          validationSchema={validationSchema}
          onSubmit={(values, { setSubmitting }) => {
            signIn(values.username, values.password);
            setSubmitting(false);
          }}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
            <>
              <TextInput
                label="Username"
                onChangeText={handleChange('username')}
                onBlur={handleBlur('username')}
                value={values.username}
                mode="outlined"
                autoCapitalize="none"
                style={{ marginBottom: 8, width: '100%' }}
                error={touched.username && !!errors.username}
              />
              {touched.username && errors.username && (
                <Text style={{ color: 'red', alignSelf: 'flex-start' }}>{errors.username}</Text>
              )}
              <TextInput
                label="Password"
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                value={values.password}
                mode="outlined"
                secureTextEntry
                style={{ marginBottom: 8, width: '100%' }}
                error={touched.password && !!errors.password}
              />
              {touched.password && errors.password && (
                <Text style={{ color: 'red', alignSelf: 'flex-start' }}>{errors.password}</Text>
              )}
              <Button
                mode="contained"
                onPress={() => handleSubmit()}
                loading={loading || isSubmitting}
                disabled={loading || isSubmitting}
                style={{ borderRadius: 25, marginVertical: 10, width: '100%' }}
                buttonColor="#1a1a1a"
              >
                Sign In
              </Button>
            </>
          )}
        </Formik>
      </View>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity onPress={() => navigation.navigate('signUp')}>
          <Text style={{ color: '#6200ee' }}>Don't have an account?</Text>
        </TouchableOpacity>
      </View>
      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}
