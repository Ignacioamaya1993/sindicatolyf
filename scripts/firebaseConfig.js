// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAM_56DNp0L-RVxTeHDFV_xANjCRtFoyPU",
  authDomain: "luzyfuerza-1cce2.firebaseapp.com",
  projectId: "luzyfuerza-1cce2",
  storageBucket: "luzyfuerza-1cce2.firebasestorage.app",
  messagingSenderId: "88993465271",
  appId: "1:88993465271:web:e46da0ec2cdab068c59e32",
  measurementId: "G-HSJ9DJJYRW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);