import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, initializeAuth, browserLocalPersistence } from "firebase/auth"; // No 'getReactNativePersistence'

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDSe5YTiM3fyOp0afRulAOTi4CjEzgqAEk",
  authDomain: "coltube-d29f8.firebaseapp.com",
  projectId: "coltube-d29f8",
  storageBucket: "coltube-d29f8.appspot.com",
  messagingSenderId: "154296295482",
  appId: "1:154296295482:android:7b8cf5a426eae77a741503"
};
// Ensure Firebase is initialized only once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ Correct way to set persistence in Firebase v10+
const auth = getApps().length
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: browserLocalPersistence, // Use browser persistence for now
    });

// Firestore Database
const db = getFirestore(app);

export { auth, db };
