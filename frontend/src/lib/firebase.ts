import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBbbWvtvI5SxXBChdiZvdrIY76nGfMDCn4",
  authDomain: "mind-ease-e34f8.firebaseapp.com",
  projectId: "mind-ease-e34f8",
  storageBucket: "mind-ease-e34f8.firebasestorage.app",
  messagingSenderId: "554698320272",
  appId: "1:554698320272:web:3c419ab4c25328ae9a2b15",
  measurementId: "G-RDK4DQY2TX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Google Sign In Function
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

// Sign Out Function
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Auth State Observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get Current User
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export default app; 