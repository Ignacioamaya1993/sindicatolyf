import { db } from "./firebaseConfig.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    const dbInstance = getFirestore();
    const urlParams = new URLSearchParams(window.location.search);
    const noticiaId = urlParams.get('id'); // Obtener el ID de la noticia desde la URL

    if (noticiaId) {
        try {
            const noticiaRef = doc(dbInstance, "noticias", noticiaId); // Referencia al documento de la noticia
            const noticiaSnap = await getDoc(noticiaRef); // Obtener el documento

            if (noticiaSnap.exists()) {
                const noticia = noticiaSnap.data(); // Obtener los datos de la noticia

                // Crear elementos y mostrar solo los campos requeridos: Título, Imagen y Descripción
                const noticiaContainer = document.getElementById("noticiaContainer");

                const noticiaElement = document.createElement("div");
                noticiaElement.classList.add("noticia");

                noticiaElement.innerHTML = `
                    <h1>${noticia.titulo || "Sin título"}</h1>
                    <img src="${noticia.imagen || ""}" alt="Imagen de la noticia">
                    <p>${noticia.descripcion || "Sin descripción"}</p>
                `;

                noticiaContainer.appendChild(noticiaElement);
            } else {
                console.warn("⚠️ No se encontró la noticia.");
            }
        } catch (error) {
            console.error("❌ ERROR al obtener la noticia de Firestore:", error);
        }
    } else {
        console.error("❌ No se proporcionó un ID de noticia.");
    }
});