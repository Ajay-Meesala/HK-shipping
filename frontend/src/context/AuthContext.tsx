import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'driver';
  idToken: string;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AppUser>;
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fetch or create a Firestore user profile document and return the role. */
async function getOrCreateUserProfile(
  firebaseUser: FirebaseUser,
  overrideRole?: 'admin' | 'driver'
): Promise<'admin' | 'driver'> {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return (snap.data().role as 'admin' | 'driver') || 'driver';
  }

  // First time — create profile with the provided role (or default to 'driver')
  const role: 'admin' | 'driver' = overrideRole || 'driver';
  await setDoc(ref, {
    email: firebaseUser.email,
    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
    role,
    createdAt: new Date().toISOString(),
  });
  return role;
}

/** Build a display name from email if displayName is not set. */
function buildDisplayName(firebaseUser: FirebaseUser): string {
  if (firebaseUser.displayName) return firebaseUser.displayName;
  const local = firebaseUser.email?.split('@')[0] || 'User';
  return local
    .split('.')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for Firebase auth state changes (handles page refresh)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const [idToken, role] = await Promise.all([
            firebaseUser.getIdToken(),
            getOrCreateUserProfile(firebaseUser),
          ]);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            displayName: buildDisplayName(firebaseUser),
            role,
            idToken,
          });
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  /** Login with Firebase email/password. Accepts an optional role to set/verify. */
  const login = async (email: string, password: string): Promise<AppUser> => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await cred.user.getIdToken();
    const role = await getOrCreateUserProfile(cred.user);
    const appUser: AppUser = {
      uid: cred.user.uid,
      email: cred.user.email ?? '',
      displayName: buildDisplayName(cred.user),
      role,
      idToken,
    };
    setUser(appUser);
    return appUser;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
