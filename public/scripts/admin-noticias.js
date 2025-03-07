import { db } from "./firebaseConfig.js";
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

const auth = getAuth();
const addNewsBtn = document.getElementById('add-news-btn');
const newsContainer = document.getElementById('news-container');
const newsModal = document.getElementById('news-modal');
const newsForm = document.getElementById('news-form');
const modalTitle = document.getElementById('modal-title');
const submitBtn = document.getElementById('submit-btn');
const newsIdInput = document.getElementById('news-id');
const newsTitleInput = document.getElementById('news-title');
const closeModalBtn = document.getElementById('close-modal-btn'); // Ahora tomamos el botón del HTML

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
    newsContainer.innerHTML = ''; 

    snapshot.forEach(doc => {
        const news = doc.data();
        const title = news.titulo || "Sin título";
        const content = news.descripcion || "Contenido no disponible";
        const categoria = news.categoria || "Categoría no disponible";
        const image = news.imagen || "";

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

// Verifica si hay contenido en los campos del formulario
const hasUnsavedChanges = () => {
    return newsTitleInput.value.trim() !== '' || 
           tinymce.get("news-content").getContent().trim() !== '' || 
           document.getElementById('news-image-url').value.trim() !== '';
};

// Confirmar cierre si hay cambios sin guardar
const confirmCloseModal = async () => {
    if (hasUnsavedChanges()) {
        const result = await Swal.fire({
            title: "¿Estás seguro?",
            text: "Si cierras el popup, se perderán los cambios.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, cerrar",
            cancelButtonText: "Cancelar"
        });
        return result.isConfirmed;
    }
    return true;
};

// Función para cerrar el modal con confirmación
const closeModal = async () => {
    const canClose = await confirmCloseModal();
    if (canClose) {
        newsModal.style.display = 'none';
        newsForm.reset();
        tinymce.get("news-content").setContent("");
        document.getElementById('news-image-url').value = "";
    }
};

// Evento para abrir el modal
addNewsBtn.addEventListener('click', async () => {
    modalTitle.textContent = 'Agregar Noticia';
    newsModal.style.display = 'flex';
    newsIdInput.value = '';
    newsTitleInput.value = '';

    await waitForTinyMCE();
    tinymce.get("news-content").setContent("");

    // Llamamos para cargar las categorías
    await loadCategories();

    document.getElementById('news-image-url').value = '';
    submitBtn.textContent = 'Guardar';
});

// Cerrar modal con la X
closeModalBtn.addEventListener('click', closeModal);

// Cerrar modal con la tecla Escape
document.addEventListener('keydown', async (event) => {
    if (event.key === 'Escape' && newsModal.style.display === 'flex') {
        closeModal();
    }
});

// Agregar o editar noticia
newsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = newsTitleInput.value.trim();
    const content = tinymce.get("news-content").getContent().trim();
    const category = document.getElementById('news-category').value;  // Obtenemos la categoría seleccionada

    if (!content) {
        Swal.fire('Error', 'El contenido no puede estar vacío', 'error');
        return;
    }

    const imageUrl = document.getElementById('news-image-url').value;

    if (newsIdInput.value) {
        const newsRef = doc(db, 'noticias', newsIdInput.value);
        await updateDoc(newsRef, { titulo: title, descripcion: content, imagen: imageUrl, categoria: category });
        Swal.fire('Éxito', 'Noticia actualizada', 'success');
    } else {
        await addDoc(collection(db, 'noticias'), { titulo: title, descripcion: content, imagen: imageUrl, categoria: category });
        Swal.fire('Éxito', 'Noticia agregada', 'success');
    }

    newsModal.style.display = 'none';
    loadNews();
});

// Eliminar una noticia con confirmación de SweetAlert
newsContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('edit-btn')) {
        const docId = e.target.getAttribute('data-id');
        const docRef = doc(db, 'noticias', docId);
        const docSnapshot = await getDoc(docRef);
        const news = docSnapshot.data();

        modalTitle.textContent = 'Editar Noticia';
        newsIdInput.value = docId;
        newsTitleInput.value = news.titulo || "";

        await waitForTinyMCE();
        tinymce.get("news-content").setContent(news.descripcion || "");

        // Cargar categoría en el select
        document.getElementById('news-category').value = news.categoria || '';

        submitBtn.textContent = 'Actualizar';
        newsModal.style.display = 'flex';
    }

    if (e.target.classList.contains('delete-btn')) {
        const docId = e.target.getAttribute('data-id');
        const docRef = doc(db, 'noticias', docId);

        // Confirmar antes de eliminar
        const result = await Swal.fire({
            title: '¿Estás seguro de eliminar esta noticia?',
            html: `<p class="swal-text">No podrás deshacer esta acción.</p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            // Proceder con la eliminación si el usuario confirma
            await deleteDoc(docRef);
            Swal.fire('Éxito', 'Noticia eliminada', 'success');
            loadNews();
        } else {
            // Si el usuario cancela, no hacer nada
            Swal.fire('Cancelado', 'La noticia no fue eliminada', 'info');
        }
    }
});


// Cargar categorías disponibles
const loadCategories = async () => {
    const snapshot = await getDocs(collection(db, 'noticias')); 
    const categories = new Set();  // Usamos un Set para evitar categorías duplicadas

    snapshot.forEach(doc => {
        const categoria = doc.data().categoria;
        if (categoria) {
            categories.add(categoria);  // Añadimos cada categoría al Set
        }
    });

    // Ahora cargamos las categorías en el campo select del formulario
    const categorySelect = document.getElementById('news-category');
    categorySelect.innerHTML = '';  // Limpiamos el select antes de agregar las nuevas opciones

    // Añadimos la opción por defecto "No determinada"
    const defaultOption = document.createElement('option');
    defaultOption.textContent = "No determinada";
    defaultOption.selected = true;
    categorySelect.appendChild(defaultOption);

    // Añadimos las otras categorías al select
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
};

window.onload = loadNews;