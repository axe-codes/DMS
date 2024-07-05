import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, serverTimestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAke4Xo_2dYB6jXPbqq5PCgt6tziw80NPg",
  authDomain: "auth---development-54a74.firebaseapp.com",
  databaseURL: "https://auth---development-54a74.firebaseio.com/",
  projectId: "auth---development-54a74",
  storageBucket: "auth---development-54a74.appspot.com",
  messagingSenderId: "445576410398",
  appId: "1:445576410398:web:1f56aa311fd8f94d42450f",
};

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore and Storage
const firestore = getFirestore(app);
const storage = getStorage(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Export Firestore collections
const foldersCollection = collection(firestore, "folders");
const filesCollection = collection(firestore, "files");

// Define the database object
const database = {
  folders: foldersCollection,
  files: filesCollection,
  formatDoc: (doc) => {
    return { id: doc.id, ...doc.data() };
  },
  getCurrentTimestamp: serverTimestamp,
};

export { auth, storage, database, firestore };
export default app;
