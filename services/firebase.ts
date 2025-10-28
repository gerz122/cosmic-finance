// Import the functions you need from the SDKs you need
// FIX: The original named import for `initializeApp` was causing a module resolution error.
// Using a namespace import (`* as firebaseApp`) is a common workaround for such build tool or dependency version issues.
import * as firebaseApp from "firebase/app";
import { getFirestore, collection, doc, getDocs, writeBatch, query, where, getDoc, setDoc, deleteDoc } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfXlr7wEvXR4bMyd_DeTC-5NLgiRBdPfw",
  authDomain: "finanz-10bcd.firebaseapp.com",
  projectId: "finanz-10bcd",
  storageBucket: "finanz-10bcd.firebasestorage.app",
  messagingSenderId: "196366472563",
  appId: "1:196366472563:web:a46437b52c118102032106"
};

// Initialize Firebase
const app = firebaseApp.initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Export firestore functions for use in db.ts
export { db, collection, doc, getDocs, writeBatch, query, where, getDoc, setDoc, deleteDoc };