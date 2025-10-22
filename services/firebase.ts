// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDtJ21sMk1mnxNZ0GfnB2axMGxIANjd_J4",
  authDomain: "cosmic-finance.firebaseapp.com",
  projectId: "cosmic-finance",
  storageBucket: "cosmic-finance.firebasestorage.app",
  messagingSenderId: "544529485599",
  appId: "1:544529485599:web:67c3eebcc2db50ad47aa2a",
  measurementId: "G-7W0PKC3ZQW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const firestore = getFirestore(app);
