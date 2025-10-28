// FIX: Changed to a namespace import to resolve potential module resolution issues with the bundler.
import { initializeApp } from 'firebase/app';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// FIX: Use namespace import for auth to fix module resolution errors.
import * as firebaseAuth from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfXlr7wEvXR4bMyd_DeTC-5NLgiRBdPfw",
  authDomain: "finanz-10bcd.firebaseapp.com",
  projectId: "finanz-10bcd",
  storageBucket: "finanz-10bcd.appspot.com",
  messagingSenderId: "196366472563",
  appId: "1:196366472563:web:a46437b52c118102032106"
};

// Initialize Firebase
// FIX: Used initializeApp directly from firebase/app.
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);
const auth = firebaseAuth.getAuth(app);

// Export services and providers for use in the app
export { db, storage, auth, firebaseAuth };
export type User = firebaseAuth.User;
