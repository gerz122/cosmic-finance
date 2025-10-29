// FIX: Changed imports to use Firebase v8 namespaced/compat syntax
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';
import 'firebase/auth';
import type { User as FirebaseUserType } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfXlr7wEvXR4bMyd_DeTC-5NLgiRBdPfw",
  authDomain: "finanz-10bcd.firebaseapp.com",
  projectId: "finanz-10bcd",
  storageBucket: "finanz-10bcd.appspot.com",
  messagingSenderId: "196366472563",
  appId: "1:196366472563:web:a46437b52c118102032106"
};

// FIX: Initialize Firebase using v8 syntax and ensure it's only done once.
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// FIX: Get services using v8 syntax
const db = firebase.firestore();
const storage = firebase.storage();
const auth = firebase.auth();

export { db, storage, auth };

// FIX: Provide GoogleAuthProvider through a simplified firebaseAuth object for compatibility.
// Other auth methods will be called directly on the `auth` instance.
export const firebaseAuth = {
    GoogleAuthProvider: firebase.auth.GoogleAuthProvider,
};

export type User = FirebaseUserType;