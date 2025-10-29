// FIX: Use named imports for Firebase v9+ modular SDK
import { initializeApp } from 'firebase/app';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// FIX: Use named imports for Firebase v9+ modular SDK
import {
    getAuth,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut,
    updateProfile,
    type User as FirebaseUserType
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfXlr7wEvXR4bMyd_DeTC-5NLgiRBdPfw",
  authDomain: "finanz-10bcd.firebaseapp.com",
  projectId: "finanz-10bcd",
  storageBucket: "finanz-10bcd.appspot.com",
  messagingSenderId: "196366472563",
  appId: "1:196366472563:web:a46437b52c118102032106"
};

// FIX: Call initializeApp directly
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
// FIX: Call getAuth directly
const auth = getAuth(app);

export { db, storage, auth };

export const firebaseAuth = {
    // FIX: Use the directly imported functions
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut,
    updateProfile,
};

// FIX: Export the User type from Firebase auth, aliased to avoid conflicts.
export type User = FirebaseUserType;
