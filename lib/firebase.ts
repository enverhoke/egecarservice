import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAL32SjAcsTPhDTUzjLn_n3BJUkNwblv6M",
  authDomain: "egecarservice.firebaseapp.com",
  projectId: "egecarservice",
  storageBucket: "egecarservice.firebasestorage.app",
  messagingSenderId: "430690149216",
  appId: "1:430690149216:web:4a0c7a0be613d379d0b405",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
