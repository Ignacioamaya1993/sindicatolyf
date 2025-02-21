import { db } from "./firebaseConfig.js"; // Importa Firestore desde tu config
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Script cargado correctamente.");

    const noticiasContainer = document.getElementById("noticiasContainer");

    if (!noticiasContainer) {
        console.error("❌ ERROR: No se encontró el contenedor de noticias.");
        return;
    }

    console.log("📌 Contenedor de noticias encontrado:", noticiasContainer);

    try {
        const noticiasRef = collection(db, "noticias"); // Asegúrate de que "noticias" es el nombre correcto
        console.log("📡 Obteniendo noticias de Firestore...");

        const querySnapshot = await getDocs(noticiasRef);
        
        if (querySnapshot.empty) {
            console.warn("⚠️ No se encontraron noticias en Firestore.");
        }

        querySnapshot.forEach((doc) => {
            console.log("📰 Noticia encontrada:", doc.id, doc.data());

            const noticia = doc.data();
            const noticiaElement = document.createElement("div");
            noticiaElement.classList.add("noticia");

            noticiaElement.innerHTML = `
                <h3>${noticia.titulo || "Sin título"}</h3>
                <p>${noticia.descripcion || "Sin descripción"}</p>
                ${noticia.imagen ? `<img src="${noticia.imagen}" alt="Imagen de la noticia">` : ""}
            `;

            noticiasContainer.appendChild(noticiaElement);
        });

        console.log("✅ Noticias cargadas correctamente.");
    } catch (error) {
        console.error("❌ ERROR al obtener noticias de Firestore:", error);
    }
});
