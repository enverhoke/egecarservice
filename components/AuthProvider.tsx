'use client';

import { auth, db } from '@/lib/firebase';
import { AppUser } from '@/lib/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext<{
  firebaseUser: User | null;
  profile: AppUser | null;
  loading: boolean;
  reloadProfile: () => Promise<void>;
  logout: () => Promise<void>;
}>({
  firebaseUser: null,
  profile: null,
  loading: true,
  reloadProfile: async () => undefined,
  logout: async () => undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(uid?: string) {
    const activeUid = uid || auth.currentUser?.uid;
    if (!activeUid) {
      setProfile(null);
      return;
    }
    const ref = doc(db, 'users', activeUid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as AppUser;
      setProfile(data);
      await setDoc(ref, { lastLoginAt: new Date().toISOString() }, { merge: true });
    } else {
      setProfile(null);
    }
  }

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await loadProfile(user.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      loading,
      reloadProfile: async () => loadProfile(),
      logout: async () => signOut(auth),
    }),
    [firebaseUser, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
