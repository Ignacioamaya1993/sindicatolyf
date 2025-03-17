import { db } from "./firebaseConfig.js";
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

const auth = getAuth();

// Elementos del DOM
const addNewsBtn = document.getElementById('add-news-btn');
const newsContainer = document.getElementById('news-container');
const newsModal = document.getElementById('news-modal');
const newsForm = document.getElementById('news-form');
const modalTitle = document.getElementById('modal-title');
const submitBtn = document.getElementById('submit-btn');
const newsIdInput = document.getElementById('news-id');
const newsTitleInput = document.getElementById('news-title');
const closeModalBtn = document.getElementById('close-modal-btn');
const newsImageUrl = document.getElementById('news-image-url');
const uploadImageBtn = document.getElementById('upload-image-btn');
const newsCategorySelect = document.getElementById('news-category');

// Esperar a que TinyMCE cargue
const waitForTinyMCE = () => {
    return new Promise(resolve => {
        if (tinymce.get("news-content")) {
            resolve();
        } else {
            setTimeout(() => resolve(waitForTinyMCE()), 100);
        }
    });
};

// Inicializar TinyMCE
tinymce.init({
    selector: '#news-content',
    plugins: 'advlist autolink lists link image charmap print preview anchor',
    toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | removeformat | image',
    image_uploadtab: true,
    images_upload_handler: function (blobInfo, success, failure) {
        console.log("Intentando subir imagen en TinyMCE...");
        
        const blob = blobInfo.blob();
        console.log("Blob obtenido:", blob);

        // Verificar si el archivo es válido
        if (!blob) {
            console.error("Error: No se pudo obtener el archivo.");
            failure("No se pudo obtener el archivo.");
            return;
        }

        // Subir a Cloudinary
        const formData = new FormData();
        formData.append("file", blob);
        formData.append("upload_preset", "ml_default"); // Reemplaza con tu preset en Cloudinary

        console.log("Enviando imagen a Cloudinary...");

        fetch("https://api.cloudinary.com/v1_1/ddadtpm2o/image/upload", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log("Respuesta de Cloudinary:", data);
            if (data.secure_url) {
                console.log("Imagen subida con éxito:", data.secure_url);
                success(data.secure_url);
            } else {
                console.error("Error en Cloudinary:", data);
                failure("No se pudo subir la imagen a Cloudinary.");
            }
        })
        .catch(error => {
            console.error("Error al subir la imagen:", error);
            failure("Error en la subida de imagen.");
        });
    }
});


// Función para subir imágenes a Cloudinary
uploadImageBtn.addEventListener('click', () => {
    const cloudinaryWidget = cloudinary.createUploadWidget({
        cloudName: 'ddadtpm2o',
        uploadPreset: 'ml_default',
        multiple: false,
        maxFiles: 1
    }, (error, result) => {
        if (result.event === "success") {
            newsImageUrl.value = result.info.secure_url;
        }
    });

    cloudinaryWidget.open();
});

// Cargar noticias
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

// Cargar categorías disponibles
const loadCategories = async () => {
    const snapshot = await getDocs(collection(db, 'noticias'));
    const categories = new Set();

    snapshot.forEach(doc => {
        const categoria = doc.data().categoria;
        if (categoria) {
            categories.add(categoria);
        }
    });

    newsCategorySelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.textContent = "No determinada";
    defaultOption.selected = true;
    newsCategorySelect.appendChild(defaultOption);

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        newsCategorySelect.appendChild(option);
    });
};

// Confirmar cierre si hay cambios sin guardar
const confirmCloseModal = async () => {
    if (newsTitleInput.value.trim() !== '' || 
        tinymce.get("news-content").getContent().trim() !== '' || 
        newsImageUrl.value.trim() !== '') {
        
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

// Cerrar el modal con confirmación
const closeModal = async () => {
    if (await confirmCloseModal()) {
        newsModal.style.display = 'none';
        newsForm.reset();
        tinymce.get("news-content").setContent("");
        newsImageUrl.value = "";
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

    await loadCategories();
    newsImageUrl.value = '';
    submitBtn.textContent = 'Guardar';
});

// Cerrar modal con la X o Escape
closeModalBtn.addEventListener('click', closeModal);
document.addEventListener('keydown', async (event) => {
    if (event.key === 'Escape' && newsModal.style.display === 'flex') {
        closeModal();
    }
});

// Guardar o actualizar noticia
newsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = newsTitleInput.value.trim();
    const content = tinymce.get("news-content").getContent().trim();
    const category = newsCategorySelect.value;
    const imageUrl = newsImageUrl.value.trim();

    if (!content) {
        Swal.fire('Error', 'El contenido no puede estar vacío', 'error');
        return;
    }

    if (newsIdInput.value) {
        const newsRef = doc(db, 'noticias', newsIdInput.value);
        await updateDoc(newsRef, { titulo: title, descripcion: content, imagen: imageUrl, categoria: category });
        Swal.fire('Éxito', 'Noticia actualizada', 'success');
    } else {
        await addDoc(collection(db, 'noticias'), { 
            titulo: title, 
            descripcion: content, 
            imagen: imageUrl, 
            categoria: category,
            fechaCreacion: serverTimestamp() 
        });
        Swal.fire('Éxito', 'Noticia agregada', 'success');
    }

    closeModal();
    loadNews();
});

// Eliminar noticia
newsContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const docId = e.target.getAttribute('data-id');
        if (await Swal.fire({ title: '¿Eliminar?', icon: 'warning', showCancelButton: true })) {
            await deleteDoc(doc(db, 'noticias', docId));
            Swal.fire('Eliminado', '', 'success');
            loadNews();
        }
    }
});

window.onload = loadNews;
