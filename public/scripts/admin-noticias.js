import { db } from "./firebaseConfig.js";
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

// Esta es la URL de tu cuenta de Cloudinary
const cloudinaryUrl = 'https://api.cloudinary.com/v1_1/ddadtpm2o/image/upload';
const cloudinaryPreset = 'ml_default'; // El preset de carga de imágenes que debes generar en Cloudinary

const auth = getAuth();
const addNewsBtn = document.getElementById('add-news-btn');
const newsContainer = document.getElementById('news-container');
const newsModal = document.getElementById('news-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const newsForm = document.getElementById('news-form');
const modalTitle = document.getElementById('modal-title');
const submitBtn = document.getElementById('submit-btn');
const newsIdInput = document.getElementById('news-id');
const newsTitleInput = document.getElementById('news-title');
const newsImageInput = document.getElementById('news-image');

// ✅ Esperar a que TinyMCE se inicialice antes de cualquier acción
const waitForTinyMCE = () => {
    return new Promise(resolve => {
        if (tinymce.get("news-content")) {
            resolve();
        } else {
            setTimeout(() => resolve(waitForTinyMCE()), 100);
        }
    });
};

// Cargar todas las noticias
const loadNews = async () => {
    const snapshot = await getDocs(collection(db, 'noticias'));
    newsContainer.innerHTML = ''; // Limpiar el contenedor

    snapshot.forEach(doc => {
        const news = doc.data();

        // Obtener los datos de la noticia
        const title = news.titulo || "Sin título";
        const content = news.descripcion || "Contenido no disponible";
        const categoria = news.categoria || "Categoría no disponible";
        const image = news.imagen || "";

        // Crear la tarjeta de la noticia
        const newsCard = document.createElement('div');
        newsCard.classList.add('news-card');
        newsCard.innerHTML = `
            <h3>${title}</h3>
            <p><strong>Categoría:</strong> ${categoria}</p>
            <p><strong>Contenido:</strong> ${content.slice(0, 50)}...</p>
            ${image ? `<img src="${image}" alt="Imagen de la noticia">` : ""}
            <button class="edit-btn" data-id="${doc.id}">Editar</button>
            <button class="delete-btn" data-id="${doc.id}">Eliminar</button>
        `;
        newsContainer.appendChild(newsCard);
    });
};

// Abrir el modal para agregar una noticia
addNewsBtn.addEventListener('click', async () => {
    modalTitle.textContent = 'Agregar Noticia';
    newsModal.style.display = 'flex';
    newsIdInput.value = ''; // Limpiar los campos
    newsTitleInput.value = '';

    // ✅ Esperar a que TinyMCE esté listo antes de limpiar el contenido
    await waitForTinyMCE();
    tinymce.get("news-content").setContent("");

    newsImageInput.value = '';  // Limpiar el campo de imagen
    submitBtn.textContent = 'Guardar';
});

// Cerrar el modal
closeModalBtn.addEventListener('click', () => {
    newsModal.style.display = 'none';
});

// Agregar o editar noticia
newsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = newsTitleInput.value.trim();
    const content = tinymce.get("news-content").getContent().trim(); // ✅ Obtener y limpiar contenido

    // ✅ Validar manualmente si TinyMCE está vacío
    if (!content) {
        Swal.fire('Error', 'El contenido no puede estar vacío', 'error');
        return; // 🚫 Detiene el envío si está vacío
    }

    const imageUrl = document.getElementById('news-image-url').value;

    if (newsIdInput.value) {
        // ✅ Editar noticia
        const newsRef = doc(db, 'noticias', newsIdInput.value);
        await updateDoc(newsRef, { titulo: title, descripcion: content, imagen: imageUrl });
        Swal.fire('Éxito', 'Noticia actualizada', 'success');
    } else {
        // ✅ Agregar nueva noticia
        await addDoc(collection(db, 'noticias'), { titulo: title, descripcion: content, imagen: imageUrl });
        Swal.fire('Éxito', 'Noticia agregada', 'success');
    }

    // ✅ Cerrar el modal y recargar noticias
    newsModal.style.display = 'none';
    loadNews();
});

// Editar una noticia
newsContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('edit-btn')) {
        const docId = e.target.getAttribute('data-id');
        const docRef = doc(db, 'noticias', docId);
        const docSnapshot = await getDoc(docRef);
        const news = docSnapshot.data();

        modalTitle.textContent = 'Editar Noticia';
        newsIdInput.value = docId;
        newsTitleInput.value = news.titulo || "";

        // ✅ Esperar a que TinyMCE esté listo antes de modificar su contenido
        await waitForTinyMCE();
        tinymce.get("news-content").setContent(news.descripcion || "");

        submitBtn.textContent = 'Actualizar';
        newsModal.style.display = 'flex';
    }

    // Eliminar una noticia
    if (e.target.classList.contains('delete-btn')) {
        const docId = e.target.getAttribute('data-id');
        const docRef = doc(db, 'noticias', docId);
        await deleteDoc(docRef);
        Swal.fire('Éxito', 'Noticia eliminada', 'success');
        loadNews();
    }
});

// Cargar las noticias al cargar la página
window.onload = loadNews;