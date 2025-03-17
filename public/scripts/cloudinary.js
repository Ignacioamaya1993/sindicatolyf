const cloudinaryWidget = cloudinary.createUploadWidget({
    cloudName: 'ddadtpm2o',  // Reemplaza con tu Cloud Name
    uploadPreset: 'ml_default',  // Este es el upload preset que mencionaste
    multiple: false,  // Si solo permites cargar una imagen
    maxFiles: 1       // Solo permite un archivo
}, (error, result) => {
    if (result.event === "success") {
        console.log("Imagen subida correctamente:", result.info);
        const imageUrl = result.info.secure_url;  // URL de la imagen subida
        
        // Guardar la URL en el input oculto
        document.getElementById("news-image-url").value = imageUrl;

        Swal.fire("Éxito", "Imagen subida correctamente", "success");
    } else if (error) {
        console.error("Error al subir la imagen:", error);
        Swal.fire("Error", "No se pudo subir la imagen", "error");
    }
});

// Asignar el botón al widget de Cloudinary
document.getElementById("upload-image-btn").addEventListener("click", function() {
    cloudinaryWidget.open();
});