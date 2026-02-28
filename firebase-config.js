import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyAjxr-5XZgYWKsUwPskXQc5WxzOqtR5pnY",
    authDomain: "story-line-d2849.firebaseapp.com",
    projectId: "story-line-d2849",
    storageBucket: "story-line-d2849.firebasestorage.app",
    messagingSenderId: "100849395388",
    appId: "1:100849395388:web:8d7410c67b7206957692b9"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Make Firebase available globally
window.firebaseApp = firebaseApp;
window.db = db;