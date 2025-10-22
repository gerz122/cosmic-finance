// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const firestore = getFirestore(app);
