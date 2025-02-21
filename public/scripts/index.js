import { db } from "./firebaseConfig.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Script cargado correctamente.");
    
    const noticiasContainer = document.getElementById("noticiasContainer");
    if (!noticiasContainer) {
        console.error("❌ ERROR: No se encontró el contenedor de noticias.");
        return;
    }
    
    console.log("📌 Contenedor de noticias encontrado:", noticiasContainer);

    try {
        const dbInstance = getFirestore(); // 🔹 Asegura que la instancia sea válida
        console.log("✅ Firestore DB Instance:", dbInstance);
        
        const noticiasRef = collection(dbInstance, "noticias"); // Usa getFirestore()
        console.log("📡 Referencia a noticias creada:", noticiasRef);

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
