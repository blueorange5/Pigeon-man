import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyC7UmE-IxB6lEiwRJ65yOUGAlvFXquXCzQ",
  authDomain: "pigeon-man.firebaseapp.com",
  projectId: "pigeon-man",
  storageBucket: "pigeon-man.firebasestorage.app",
  messagingSenderId: "557085342477",
  appId: "1:557085342477:web:6fe800efa554c8b46d8e44"
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)