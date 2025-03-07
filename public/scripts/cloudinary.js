const cloudinaryWidget = cloudinary.createUploadWidget({
    cloudName: 'ddadtpm2o',  // Reemplaza con tu Cloud Name
    uploadPreset: 'ml_default',  // Este es el upload preset que mencionaste
    multiple: false,  // Si solo permites cargar una imagen
    maxFiles: 1       // Solo permite un archivo
}, (error, result) => {
    if (result.event === "success") {
        console.log("Imagen subida correctamente:", result.info);
        const imageUrl = result.info.secure_url;  // URL de la imagen subida
        // Usa la URL de la imagen para agregarla a tu formulario o base de datos
    } else if (error) {
        console.error("Error al subir la imagen:", error);
    }
});

document.getElementById("upload-image-btn").addEventListener("click", function() {
    cloudinaryWidget.open();
});