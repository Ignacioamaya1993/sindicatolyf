import app from "../scripts/firebaseConfig.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// Inicializar Firebase Auth y Firestore
const auth = getAuth(app);
const db = getFirestore(app);

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");

    try {
        // Autenticar usuario
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Obtener referencia y datos del usuario en Firestore
        const userRef = doc(db, "usuarios", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            
            // Verificar si es administrador
            if (userData.isAdmin === true) {
                window.location.href = "admin-panel.html";
            } else {
                errorMessage.textContent = "No tienes permisos de administrador.";
            }
        } else {
            errorMessage.textContent = "Usuario no encontrado en la base de datos.";
        }
    } catch (error) {
        errorMessage.textContent = "Error: " + error.message;
    }
});