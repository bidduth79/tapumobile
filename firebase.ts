
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB7Iw_Q4Zhkxj7NLwyzyt2MZS4BIYIgcdc",
  authDomain: "newmediahub.firebaseapp.com",
  projectId: "newmediahub",
  storageBucket: "newmediahub.firebasestorage.app",
  messagingSenderId: "272974302207",
  appId: "1:272974302207:web:2dd3134b6ef3e1ddd5b5ca",
  databaseURL: "https://newmediahub-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
