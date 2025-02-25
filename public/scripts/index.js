import { getFirestore, collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Script cargado correctamente.");
    
    const noticiasContainer = document.getElementById("noticiasContainer");
    const verMasBtn = document.getElementById("verMasBtn"); // El botón "Ver más noticias"
    const maxNoticias = 6; // Número máximo de noticias a mostrar
    
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

        // Crear una consulta para obtener las noticias ordenadas por fecha de creación (de más reciente a más antigua)
        const q = query(noticiasRef, orderBy("fechaCreacion", "desc")); // Ordena por fechaCreacion (de más reciente a más antigua)

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.warn("⚠️ No se encontraron noticias en Firestore.");
        }

        let count = 0; // Contador de noticias mostradas

        querySnapshot.forEach((doc) => {
            if (count < maxNoticias) { // Solo mostrar las primeras 8 noticias
                const noticia = doc.data();
                const noticiaId = doc.id; // Obtener el ID de la noticia

                const noticiaElement = document.createElement("div");
                noticiaElement.classList.add("noticia");
                noticiaElement.setAttribute("data-id", noticiaId); // Asignar el ID al elemento

                noticiaElement.innerHTML = `
                    <h3 class="titulo-noticia">${noticia.titulo || "Sin título"}</h3>
                    <p>${noticia.shortext || "Sin descripción"}</p>
                    ${noticia.imagen ? `<img src="${noticia.imagen}" alt="Imagen de la noticia">` : ""}
                `;

                noticiasContainer.appendChild(noticiaElement);
                count++;
            }
        });

        // Si hay más de 8 noticias, mostrar el botón "ver más noticias"
        if (querySnapshot.size > maxNoticias) {
            verMasBtn.style.display = "inline-block"; // Mostrar el botón
        } else {
            verMasBtn.style.display = "none"; // Ocultar el botón si no hay más noticias
        }

        console.log("✅ Noticias cargadas correctamente.");
    } catch (error) {
        console.error("❌ ERROR al obtener noticias de Firestore:", error);
    }

    // Agregar evento de clic para redirigir al detalle de la noticia
    const noticias = document.querySelectorAll(".noticia");
    noticias.forEach((noticiaElement) => {
        noticiaElement.addEventListener("click", (e) => {
            const noticiaId = e.currentTarget.getAttribute("data-id");
            window.location.href = `pages/noticia.html?id=${noticiaId}`; // Redirige a la página de detalle
        });
    });
});