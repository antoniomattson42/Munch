import React, { useState } from 'react';
import { auth, db } from './firebase.ts';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import './App.css';

const SignUp: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validationSchema = Yup.object().shape({
    email: Yup.string().email('Please enter a valid email').required('Email is required'),
    password: Yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
  });

  const handleSignUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: serverTimestamp(),
        description: '',
        preferences: {
          atmosphere: '1',
          service: '1',
          taste: '1',
          value: '1',
        },
        profileInfo: {
          username: '',
          bio: '',
        },
      });
      alert('Sign up successful');
      navigate('/');
    } catch (error: any) {
      alert('Registration Failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Munch</h1>
      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={validationSchema}
        onSubmit={(values) => handleSignUp(values.email, values.password)}
      >
        {({ handleChange, handleBlur, values, errors, touched, handleSubmit }) => (
          <form onSubmit={handleSubmit}>
            <div>
              <label>Email</label>
              <input
                name="email"
                type="email"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.email}
              />
              {touched.email && errors.email && <span>{errors.email}</span>}
            </div>
            <div>
              <label>Password</label>
              <input
                name="password"
                type="password"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.password}
              />
              {touched.password && errors.password && <span>{errors.password}</span>}
            </div>
            <button type="submit" disabled={loading}>Create Account</button>
          </form>
        )}
      </Formik>
      <p>
        Already have an account?{' '}
        <button onClick={() => navigate('/')}>Sign In</button>
      </p>
    </div>
  );
};

export default SignUp;
