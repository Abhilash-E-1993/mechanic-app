import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { createOrUpdateUserProfile, getUserProfile } from '../services/firestoreService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUpWithEmail = async (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const signInWithEmail = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const existing = await getUserProfile(user.uid);
    if (!existing) {
      await createOrUpdateUserProfile(user.uid, {
        name: user.displayName || 'Google User',
        email: user.email,
        role: null,
      });
    }

    return result;
  };

  const logout = async () => signOut(auth);

  const refreshProfile = async (uid) => {
    const userProfile = await getUserProfile(uid || currentUser?.uid);
    setProfile(userProfile);
    return userProfile;
  };

  const value = useMemo(
    () => ({
      currentUser,
      profile,
      loading,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      logout,
      refreshProfile,
    }),
    [currentUser, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
