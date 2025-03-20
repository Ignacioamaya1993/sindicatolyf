import { db } from "./firebaseConfig.js";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

const auth = getAuth();
const professionalList = document.getElementById("professionalList");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");
const addProfessionalBtn = document.getElementById("addProfessional");
let currentPage = 1; // Página actual
const professionalsPerPage = 15; // Profesionales por página

let professionals = [];
let categories = new Set(); // Para almacenar categorías únicas

// **🔹 Cargar profesionales desde Firestore**
async function loadProfessionals() {
    try {
        const querySnapshot = await getDocs(collection(db, "profesionales"));
        professionals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        loadCategories();  // Cargar las categorías después de obtener los profesionales
        renderProfessionals();
    } catch (error) {
        console.error("Error al cargar profesionales:", error);
    }
}

// **🔹 Cargar las categorías únicas**
function loadCategories() {
    categories.clear(); // Reiniciar categorías
    categories.add("Todas las categorías"); // Opción predeterminada

    professionals.forEach(prof => {
        if (prof.especialidad) {
            categories.add(prof.especialidad);
        }
    });

    categoryFilter.innerHTML = ""; // Limpiar opciones previas
    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// **🔹 Renderizar la tabla con profesionales (con paginación)**
function renderProfessionals() {
    professionals.sort((a, b) => {
        if (a.especialidad !== b.especialidad) {
            return a.especialidad.localeCompare(b.especialidad);
        }
        return a.apenom.localeCompare(b.apenom);
    });

    const selectedCategory = categoryFilter.value;
    const searchTerm = searchInput.value.toLowerCase();
    const filteredProfessionals = professionals
        .filter(prof => (selectedCategory === "Todas las categorías" || prof.especialidad === selectedCategory))
        .filter(prof => prof.apenom.toLowerCase().includes(searchTerm));

    const totalProfessionals = filteredProfessionals.length;
    const totalPages = Math.ceil(totalProfessionals / professionalsPerPage);
    
    const startIndex = (currentPage - 1) * professionalsPerPage;
    const endIndex = startIndex + professionalsPerPage;
    const professionalsToShow = filteredProfessionals.slice(startIndex, endIndex);

    professionalList.innerHTML = "";
    professionalsToShow.forEach(prof => {
        const telefonos = Array.isArray(prof.telefono) ? prof.telefono.join(" / ") : prof.telefono || "";
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${prof.especialidad || ""}</td>
            <td contenteditable="true" id="name-${prof.id}" data-original="${prof.apenom || ""}">${prof.apenom || ""}</td>
            <td contenteditable="true" id="address-${prof.id}" data-original="${prof.direccion || ""}">${prof.direccion || ""}</td>
            <td contenteditable="true" id="city-${prof.id}" data-original="${prof.localidad || ""}">${prof.localidad || ""}</td>
            <td contenteditable="true" id="phone-${prof.id}" data-original="${telefonos}">${telefonos}</td>
            <td class="action-buttons">
                <button id="saveBtn-${prof.id}" class="guardar-btn" onclick="saveProfessional('${prof.id}')" disabled>💾</button>
                <button class="eliminar-btn" onclick="deleteProfessional('${prof.id}')">🗑️</button>
            </td>

        `;
        professionalList.appendChild(row);

        // Agregar eventos para detectar cambios y habilitar el botón de guardar
        ["name", "address", "city", "phone"].forEach(field => {
            const cell = document.getElementById(`${field}-${prof.id}`);
            cell.addEventListener("input", () => handleInputChange(prof.id));
        });
    });

    createPaginationButtons(totalPages);
}

// **🔹 Detectar cambios en los campos editables**
function handleInputChange(profId) {
    const saveBtn = document.getElementById(`saveBtn-${profId}`);
    const fields = ["name", "address", "city", "phone"];

    let hasChanges = fields.some(field => {
        const cell = document.getElementById(`${field}-${profId}`);
        return cell.innerText.trim() !== cell.dataset.original.trim();
    });

    saveBtn.disabled = !hasChanges; // Habilitar si hay cambios
    saveBtn.style.backgroundColor = hasChanges ? "green" : ""; // Cambiar a verde si hay cambios
    saveBtn.style.color = hasChanges ? "white" : ""; // Asegurar visibilidad del texto/icono
}

// **🔹 Función para crear los botones de paginación**
function createPaginationButtons(totalPages) {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = "";

    if (currentPage > 1) {
        const prevButton = document.createElement("button");
        prevButton.textContent = "Anterior";
        prevButton.onclick = () => {
            currentPage--;
            renderProfessionals();
        };
        paginationContainer.appendChild(prevButton);
    }

    const pageInfo = document.createElement("span");
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    pageInfo.classList.add("page-info");
    paginationContainer.appendChild(pageInfo);

    if (currentPage < totalPages) {
        const nextButton = document.createElement("button");
        nextButton.textContent = "Siguiente";
        nextButton.onclick = () => {
            currentPage++;
            renderProfessionals();
        };
        paginationContainer.appendChild(nextButton);
    }
}

// **🔹 Guardar profesional actualizado**
async function saveProfessional(id) {
    const updatedProfessional = {
        apenom: document.getElementById(`name-${id}`).innerText.trim(),
        direccion: document.getElementById(`address-${id}`).innerText.trim(),
        localidad: document.getElementById(`city-${id}`).innerText.trim(),
        telefono: document.getElementById(`phone-${id}`).innerText.trim()
    };

    try {
        await updateDoc(doc(db, "profesionales", id), updatedProfessional);
        Swal.fire("Éxito", "Los datos han sido actualizados", "success");
        loadProfessionals();
    } catch (error) {
        console.error("Error al actualizar profesional:", error);
        Swal.fire("Error", "No se pudo actualizar el profesional", "error");
    }
}

// **🔹 Eliminar un profesional**
async function deleteProfessional(id) {
    const confirmDelete = await Swal.fire({
        title: "¿Estás seguro?",
        text: "Esta acción no se puede deshacer",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    });

    if (confirmDelete.isConfirmed) {
        try {
            await deleteDoc(doc(db, "profesionales", id));
            Swal.fire("Eliminado", "El profesional ha sido eliminado", "success");
            loadProfessionals();
        } catch (error) {
            console.error("Error al eliminar profesional:", error);
        }
    }
}

// **🔹 Inicializar eventos**
document.addEventListener("DOMContentLoaded", loadProfessionals);
searchInput.addEventListener("input", renderProfessionals);
categoryFilter.addEventListener("change", renderProfessionals);
addProfessionalBtn.addEventListener("click", addProfessional);

window.saveProfessional = saveProfessional;
window.deleteProfessional = deleteProfessional;