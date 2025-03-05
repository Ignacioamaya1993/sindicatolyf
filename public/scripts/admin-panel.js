import { auth } from "./firebaseConfig.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.getElementById("logout").addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.href = "admin-login.html";
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
});
