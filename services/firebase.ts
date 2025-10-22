// Import the functions you need from the SDKs you need
// FIX: Use Firebase v8 compat imports to resolve the 'initializeApp' export error.
import firebase from "firebase/app";
import "firebase/firestore";

// Your web app's Firebase configuration from your prompt
const firebaseConfig = {
  apiKey: "AIzaSyDfXlr7wEvXR4bMyd_DeTC-5NLgiRBdPfw",
  authDomain: "finanz-10bcd.firebaseapp.com",
  projectId: "finanz-10bcd",
  storageBucket: "finanz-10bcd.firebasestorage.app",
  messagingSenderId: "196366472563",
  appId: "1:196366472563:web:a46437b52c118102032106"
};

// Initialize Firebase
// FIX: Use v8 initialization syntax. Added a check to prevent re-initialization.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Cloud Firestore and get a reference to the service
// FIX: Use v8 syntax to get firestore instance.
export const firestore = firebase.firestore();