import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, setLogLevel } from 'firebase/firestore';

// Direct production configuration for Akademi Panel 2
export const firebaseConfig = {
  projectId: "gen-lang-client-0721174346",
  appId: "1:255785106721:web:b6d6f8ede6ea17b5989260",
  apiKey: "AIzaSyDvcV8VKNtKgRNs9rfHjXPt7it6pduoiX8",
  authDomain: "gen-lang-client-0721174346.firebaseapp.com",
  firestoreDatabaseId: "(default)",
  storageBucket: "gen-lang-client-0721174346.firebasestorage.app",
  messagingSenderId: "255785106721"
};

// Silence verbose internal Firestore retry/backoff logs
try {
  setLogLevel('silent');
} catch (e) {}

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with robust local caching
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

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
