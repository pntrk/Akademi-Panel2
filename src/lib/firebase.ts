import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence verbose internal Firestore retry/backoff logs
try {
  setLogLevel('silent');
} catch (e) {}

export const app = initializeApp(firebaseConfig);
const dbId = (firebaseConfig as any).firestoreDatabaseId;

// Initialize Firestore with robust local caching
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, (dbId && dbId !== '(default)') ? dbId : undefined);

export { firebaseConfig };

export const auth = getAuth(app);

// Check for redirect results on app load
getRedirectResult(auth).catch((err) => {
  console.warn("Redirect login check:", err?.message || err);
});

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  try {
    await signInWithPopup(auth, provider);
  } catch (error: any) {
    console.warn("Popup login failed or blocked, attempting redirect login:", error);
    try {
      await signInWithRedirect(auth, provider);
    } catch (redirectError) {
      console.error("Login failed completely:", redirectError);
      throw redirectError;
    }
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};
