import { db } from "./firebaseConfig.js";
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

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

// Cargar todas las noticias
const loadNews = async () => {
    const snapshot = await getDocs(collection(db, 'noticias'));
    newsContainer.innerHTML = ''; // Limpiar el contenedor

    snapshot.forEach(doc => {
        const news = doc.data();

        // Obtener los datos de la noticia
        const title = news.titulo || "Sin título"; // Título de la noticia
        const shortext = news.shortext || "Contenido no disponible"; // Descripción breve o resumen
        const categoria = news.categoria || "Categoría no disponible"; // Categoría de la noticia
        const image = news.imagen || ""; // Imagen de la noticia

        // Crear la tarjeta de la noticia
        const newsCard = document.createElement('div');
        newsCard.classList.add('news-card');
        newsCard.innerHTML = `
            <h3>${title}</h3>
            <p><strong>Categoría:</strong> ${categoria}</p>
            <p><strong>Resumen:</strong> ${shortext.slice(0, 50)}...</p>
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

    if (newsIdInput.value) {
        // Editar noticia
        const newsRef = doc(db, 'noticias', newsIdInput.value);
        await updateDoc(newsRef, { 
            titulo: title,      // Corregido a 'titulo'
            descripcion: content // Corregido a 'descripcion'
        });
        Swal.fire('Éxito', 'Noticia actualizada', 'success');
    } else {
        // Agregar nueva noticia
        await addDoc(collection(db, 'noticias'), { 
            titulo: title,       // Corregido a 'titulo'
            descripcion: content, // Corregido a 'descripcion'
            shortext: content.slice(0, 50), // Puede ser útil agregar un resumen corto
            categoria: "General"  // Puedes ajustar la categoría según necesites
        });
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
        newsTitleInput.value = news.titulo;  // Aquí usamos 'titulo' en lugar de 'title'
        newsContentInput.value = news.descripcion;  // Usamos 'descripcion' en lugar de 'content'
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
