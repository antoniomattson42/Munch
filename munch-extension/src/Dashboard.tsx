import React, { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/'); // Redirect to Sign In after sign out
    } catch (error: any) {
      alert('Error signing out: ' + error.message);
    }
  };

  return (
    <div className="container">
      <h1>Welcome to Munch!</h1>
      <p>You are signed in as: {currentUser?.email}</p>
      <button onClick={handleSignOut}>Sign Out</button>
    </div>
  );
};

export default Dashboard;
