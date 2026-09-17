import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDd7GrKM2SjQvsSgQ8hTvoHhPo3C2yFLvk",
  authDomain: "ariel-5d296.firebaseapp.com",
  projectId: "ariel-5d296",
  storageBucket: "ariel-5d296.firebasestorage.app",
  messagingSenderId: "878136418851",
  appId: "1:878136418851:web:0d71214704072b1a7c8796",
  measurementId: "G-FRHX0RXQS4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
