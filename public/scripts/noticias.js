import { db } from "./firebaseConfig.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Script cargado correctamente.");

    const noticiasContainer = document.getElementById("noticiasContainer");
    const buscarTitulo = document.getElementById("buscarTitulo");
    const buscarCategoria = document.getElementById("buscarCategoria");

    if (!noticiasContainer || !buscarCategoria) {
        console.error("❌ ERROR: No se encontraron los elementos.");
        return;
    }

    const dbInstance = getFirestore(); // 🔹 Asegura que la instancia sea válida

    // Función para eliminar acentos
    function eliminarAcentos(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    // Cargar las categorías dinámicamente
    const cargarCategorias = async () => {
        try {
            const noticiasRef = collection(dbInstance, "noticias");
            const querySnapshot = await getDocs(noticiasRef);
            const categorias = new Set(); // Usamos un Set para evitar categorías duplicadas

            querySnapshot.forEach((doc) => {
                const noticia = doc.data();
                if (noticia.categoria) {
                    categorias.add(noticia.categoria); // Agregar la categoría al Set
                }
            });

            // Agregar las categorías al select
            categorias.forEach((categoria) => {
                const option = document.createElement("option");
                option.value = categoria;
                option.textContent = categoria;
                buscarCategoria.appendChild(option);
            });

            // Añadir una opción "Todas" para que se pueda filtrar por todas las categorías
            const todasOption = document.createElement("option");
            todasOption.value = "";
            todasOption.textContent = "Todas las categorías";
            buscarCategoria.insertBefore(todasOption, buscarCategoria.firstChild);

            // Seleccionar "Todas" por defecto
            buscarCategoria.value = "";

        } catch (error) {
            console.error("❌ ERROR al obtener las categorías:", error);
        }
    };

    // Cargar noticias desde Firestore sin filtrado inicial
    const cargarNoticias = async (filtroTitulo = "", filtroCategoria = "") => {
        noticiasContainer.innerHTML = ''; // Limpiar el contenedor de noticias
        try {
            const noticiasRef = collection(dbInstance, "noticias");
            const querySnapshot = await getDocs(noticiasRef);

            if (querySnapshot.empty) {
                console.warn("⚠️ No se encontraron noticias.");
                return;
            }

            // Filtrar los resultados localmente
            const noticiasFiltradas = [];

            querySnapshot.forEach((doc) => {
                const noticia = doc.data();

            // Eliminar acentos y convertir a minúsculas tanto el título como el filtro
            const tituloLower = noticia.titulo ? eliminarAcentos(noticia.titulo.toLowerCase()) : "";
            const filtroTituloLower = filtroTitulo ? eliminarAcentos(filtroTitulo.toLowerCase()) : "";

            // Verificar si el filtro está presente en el título
            if (tituloLower.includes(filtroTituloLower) &&
                (filtroCategoria === "" || noticia.categoria.toLowerCase() === filtroCategoria.toLowerCase())) {
                noticiasFiltradas.push(noticia);
            }
});

            // Mostrar las noticias filtradas
            noticiasFiltradas.forEach((noticia) => {
                const noticiaElement = document.createElement("div");
                noticiaElement.classList.add("noticia");

            // Asigna el ID correctamente al div principal
            noticiaElement.setAttribute("data-id", noticia.id);

            noticiaElement.innerHTML = `
                <h3 class="titulo-noticia">${noticia.titulo || "Sin título"}</h3>
                ${noticia.imagen ? `<img src="${noticia.imagen}" alt="Imagen de la noticia">` : ""}
            `;

                // Agregar el contenedor al DOM
                noticiasContainer.appendChild(noticiaElement);
            });

            // Agregar evento de clic para redirigir al detalle de la noticia
            document.querySelectorAll(".noticia").forEach((noticiaElement) => {
                noticiaElement.addEventListener("click", (e) => {
                    const noticiaId = e.currentTarget.getAttribute("data-id");
                    console.log(`🔗 Redirigiendo a noticia con ID: ${noticiaId}`);
                    window.location.href = `noticia.html?id=${noticiaId}`;
                });
            });

        } catch (error) {
            console.error("❌ ERROR al obtener noticias de Firestore:", error);
        }
    };

    // Función de debounce
    let debounceTimeout;
    const debounce = (func, delay) => {
        return (...args) => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                func(...args);
            }, delay);
        };
    };

    // Ejecutar búsqueda al seleccionar una categoría o escribir un título
    const buscarNoticias = () => {
        const titulo = buscarTitulo.value.trim();  // Sin toLowerCase() aquí, ya se hace en la búsqueda
        const categoria = buscarCategoria.value;
        cargarNoticias(titulo, categoria);
    };

    // Evento para buscar noticias al cambiar la categoría (con debounce)
    buscarCategoria.addEventListener("change", debounce(buscarNoticias, 500));

    // Evento para buscar noticias al escribir en el título (con debounce)
    buscarTitulo.addEventListener("input", debounce(buscarNoticias, 500));

    // Cargar las categorías y noticias al cargar la página
    cargarCategorias();
    cargarNoticias();
});