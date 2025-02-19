import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// -------------- CARRUSEL ---------------- //
let index = 0;
const slides = document.querySelectorAll(".slide");

function showSlide(n) {
    slides.forEach(slide => slide.classList.remove("active"));
    slides[n].classList.add("active");
}

document.querySelector(".prev").addEventListener("click", () => {
    index = (index > 0) ? index - 1 : slides.length - 1;
    showSlide(index);
});

document.querySelector(".next").addEventListener("click", () => {
    index = (index < slides.length - 1) ? index + 1 : 0;
    showSlide(index);
});

// Cambio automático de imágenes cada 5 segundos
setInterval(() => {
    index = (index < slides.length - 1) ? index + 1 : 0;
    showSlide(index);
}, 5000);

// -------------- CARGA DINÁMICA DE NOTICIAS ---------------- //
document.addEventListener("DOMContentLoaded", async () => {
    const noticiasContainer = document.getElementById("noticiasContainer");

    if (!noticiasContainer) {
        console.error("No se encontró el contenedor de noticias.");
        return;
    }

    try {
        const querySnapshot = await getDocs(collection(db, "noticias"));

        querySnapshot.forEach((doc) => {
            const noticia = doc.data();
            const noticiaHTML = `
                <div class="card">
                    <img src="${noticia.imagen}" alt="${noticia.titulo}">
                    <h3>${noticia.titulo}</h3>
                    <p>${noticia.descripcion}</p>
                </div>
            `;
            noticiasContainer.innerHTML += noticiaHTML;
        });
    } catch (error) {
        console.error("Error obteniendo noticias:", error);
    }
});