import { db, storage } from "./firebaseConfig.js";
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-storage.js";

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
const newsContentInput = document.getElementById('news-content');
const newsImageInput = document.getElementById('news-image');

// Cargar todas las noticias
const loadNews = async () => {
    const snapshot = await getDocs(collection(db, 'noticias'));
    newsContainer.innerHTML = ''; // Limpiar el contenedor

    snapshot.forEach(doc => {
        const news = doc.data();

        // Obtener los datos de la noticia
        const title = news.titulo || "Sin título"; // Título de la noticia
        const content = news.descripcion || "Contenido no disponible"; // Descripción
        const categoria = news.categoria || "Categoría no disponible"; // Categoría de la noticia
        const image = news.imagen || ""; // Imagen de la noticia

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
addNewsBtn.addEventListener('click', () => {
    modalTitle.textContent = 'Agregar Noticia';
    newsModal.style.display = 'flex';
    newsIdInput.value = ''; // Limpiar los campos
    newsTitleInput.value = '';
    newsContentInput.value = '';
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
    const title = newsTitleInput.value;
    const content = newsContentInput.value;
    const imageFile = newsImageInput.files[0]; // Obtenemos el archivo de la imagen

    let imageUrl = ''; // Inicializamos la variable de imagen

    // Subir imagen a Firebase Storage si hay una imagen seleccionada
    if (imageFile) {
        const imageRef = ref(storage, `news-images/${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef); // Obtener la URL de la imagen subida
    }

    if (newsIdInput.value) {
        // Editar noticia
        const newsRef = doc(db, 'noticias', newsIdInput.value);
        await updateDoc(newsRef, { titulo: title, descripcion: content, imagen: imageUrl });
        Swal.fire('Éxito', 'Noticia actualizada', 'success');
    } else {
        // Agregar nueva noticia
        await addDoc(collection(db, 'noticias'), { titulo: title, descripcion: content, imagen: imageUrl });
        Swal.fire('Éxito', 'Noticia agregada', 'success');
    }

    newsModal.style.display = 'none';
    loadNews(); // Recargar noticias
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
        newsTitleInput.value = news.titulo;
        newsContentInput.value = news.descripcion;
        newsImageInput.value = '';  // Limpiar el campo de imagen
        submitBtn.textContent = 'Actualizar';

        newsModal.style.display = 'flex';
    }

    // Eliminar una noticia
    if (e.target.classList.contains('delete-btn')) {
        const docId = e.target.getAttribute('data-id');
        const docRef = doc(db, 'noticias', docId);
        await deleteDoc(docRef);
        Swal.fire('Éxito', 'Noticia eliminada', 'success');
        loadNews(); // Recargar noticias
    }
});

// Cargar las noticias al cargar la página
window.onload = loadNews;