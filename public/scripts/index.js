import { getFirestore, collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Script cargado correctamente.");

    const noticiasContainer = document.getElementById("noticiasContainer");
    const verMasBtn = document.getElementById("verMasBtn");
    const maxNoticias = 8;

    if (!noticiasContainer) {
        console.error("❌ ERROR: No se encontró el contenedor de noticias.");
        return;
    }

    console.log("📌 Contenedor de noticias encontrado:", noticiasContainer);

    try {
        const dbInstance = getFirestore();
        const noticiasRef = collection(dbInstance, "noticias");
        const q = query(noticiasRef, orderBy("fechaCreacion", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.warn("⚠️ No se encontraron noticias en Firestore.");
        }

        let count = 0;

        querySnapshot.forEach((doc) => {
            if (count < maxNoticias) {
                const noticia = doc.data();
                const noticiaId = doc.id;

                const noticiaElement = document.createElement("div");
                noticiaElement.classList.add("noticia");

                // Alternar clases para animaciones (dos a la izquierda, dos a la derecha)
                if (count % 4 < 2) {
                    noticiaElement.classList.add("entrada-derecha");
                    noticiaElement.style.setProperty("--direction", "100px");
                } else {
                    noticiaElement.classList.add("entrada-izquierda");
                    noticiaElement.style.setProperty("--direction", "-100px");
                }

                noticiaElement.setAttribute("data-id", noticiaId);
                noticiaElement.innerHTML = `
                    <h3 class="titulo-noticia">${noticia.titulo || "Sin título"}</h3>
                    ${noticia.imagen ? `<img src="${noticia.imagen}" alt="Imagen de la noticia">` : ""}
                `;

                noticiasContainer.appendChild(noticiaElement);
                count++;
            }
        });

        if (querySnapshot.size > maxNoticias) {
            verMasBtn.style.display = "inline-block";
        } else {
            verMasBtn.style.display = "none";
        }

        console.log("✅ Noticias cargadas correctamente.");

        // Aplicar Intersection Observer para mostrar y ocultar al scrollear
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    entry.target.classList.remove("hidden");
                } else {
                    entry.target.classList.remove("visible");
                    entry.target.classList.add("hidden");
                }
            });
        }, { threshold: 0.2 });

        document.querySelectorAll(".noticia").forEach((noticia) => {
            observer.observe(noticia);
        });

        // Evento para redirigir al hacer clic en la noticia
        document.querySelectorAll(".noticia").forEach((noticiaElement) => {
            noticiaElement.addEventListener("click", (e) => {
                const noticiaId = e.currentTarget.getAttribute("data-id");
                window.location.href = `pages/noticia.html?id=${noticiaId}`;
            });
        });

    } catch (error) {
        console.error("❌ ERROR al obtener noticias de Firestore:", error);
    }
});