
// FIX: Changed to a namespace import to resolve potential module resolution issues with the bundler.
import * as firebaseApp from 'firebase/app';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// FIX: Use named imports for Firebase v9+ modular SDK to resolve errors.
// FIX: Switched to namespace import to resolve module resolution errors for auth functions and User type.
import * as firebaseAuthNs from "firebase/auth";

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
// FIX: Using initializeApp from the imported namespace.
const app = firebaseApp.initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);
// FIX: Call getAuth directly after named import.
// FIX: Using getAuth from the imported namespace.
const auth = firebaseAuthNs.getAuth(app);

// Export services and providers for use in the app
// FIX: Re-export auth functions in a namespace-like object to match usage in other files.
// FIX: Referencing functions from the imported namespace.
export { db, storage, auth };
export const firebaseAuth = {
    sendPasswordResetEmail: firebaseAuthNs.sendPasswordResetEmail,
    signInWithEmailAndPassword: firebaseAuthNs.signInWithEmailAndPassword,
    createUserWithEmailAndPassword: firebaseAuthNs.createUserWithEmailAndPassword,
    GoogleAuthProvider: firebaseAuthNs.GoogleAuthProvider,
    signInWithPopup: firebaseAuthNs.signInWithPopup,
    onAuthStateChanged: firebaseAuthNs.onAuthStateChanged,
    signOut: firebaseAuthNs.signOut,
};
// FIX: Export the aliased User type from firebase/auth.
// FIX: Exporting User type from the imported namespace.
export type User = firebaseAuthNs.User;
