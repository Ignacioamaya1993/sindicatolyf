import { getFirestore, collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {

    const noticiasContainer = document.getElementById("noticiasContainer");
    const verMasBtn = document.getElementById("verMasBtn");
    const maxNoticias = 8;

    if (!noticiasContainer) {
        console.error("❌ ERROR: No se encontró el contenedor de noticias.");
        return;
    }

    console.log("📌 Contenedor de noticias encontrado:", noticiasContainer);

    try {
        console.log("🔍 Obteniendo datos de Firestore...");

        const dbInstance = getFirestore();
        const noticiasRef = collection(dbInstance, "noticias");

        console.log("📂 Referencia a la colección creada:", noticiasRef);

        const q = query(noticiasRef, orderBy("fechaCreacion", "desc"));
        console.log("📋 Query generada:", q);

        const querySnapshot = await getDocs(q);
        console.log("📦 Snapshot recibido:", querySnapshot);

        if (querySnapshot.empty) {
            console.warn("⚠️ No se encontraron noticias en Firestore.");
            return;
        }

        let count = 0;

        querySnapshot.forEach((doc) => {
            console.log(`📄 Documento encontrado (ID: ${doc.id}):`, doc.data());

            if (count < maxNoticias) {
                const noticia = doc.data();
                const noticiaId = doc.id;

                console.log("📰 Noticia procesada:", noticia);

                const noticiaElement = document.createElement("div");
                noticiaElement.classList.add("noticia");

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

        console.log(`✅ Se han cargado ${count} noticias en el contenedor.`);

        if (verMasBtn) {
            if (querySnapshot.size > maxNoticias) {
                verMasBtn.style.display = "inline-block";
            } else {
                verMasBtn.style.display = "none";
            }
        } else {
            console.warn("⚠️ Advertencia: No se encontró el botón 'ver más'.");
        }

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

        document.querySelectorAll(".noticia").forEach((noticiaElement) => {
            noticiaElement.addEventListener("click", (e) => {
                const noticiaId = e.currentTarget.getAttribute("data-id");
                console.log(`🔗 Redirigiendo a noticia con ID: ${noticiaId}`);
                window.location.href = `pages/noticia.html?id=${noticiaId}`;
            });
        });

    } catch (error) {
        console.error("❌ ERROR al obtener noticias de Firestore:", error);
    }
});
