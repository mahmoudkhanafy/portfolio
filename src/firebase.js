import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCqb3Z2Iq_pE42bbrH4G_ZozUadedoZnW4",
  authDomain: "mahmoud-khaled-a05a8.firebaseapp.com",
  projectId: "mahmoud-khaled-a05a8",
  storageBucket: "mahmoud-khaled-a05a8.firebasestorage.app",
  messagingSenderId: "78833822207",
  appId: "1:78833822207:web:50859a4befdaa023f29fca",
  measurementId: "G-E7L6QRHD3Q"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in supported browser environments)
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
