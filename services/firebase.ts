// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// Fix: Import missing firestore functions (getDoc, setDoc, deleteDoc) to be used in dbService.ts.
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
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Export firestore functions for use in db.ts
// Fix: Export the newly imported functions so they can be used in dbService.ts.
export { db, collection, doc, getDocs, writeBatch, query, where, getDoc, setDoc, deleteDoc };