import { db } from "./firebaseConfig.js";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

const auth = getAuth();
const professionalList = document.getElementById("professionalList");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");
const addProfessionalBtn = document.getElementById("addProfessional");

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

// **🔹 Renderizar la tabla con profesionales (con filtro)**
function renderProfessionals() {
    professionalList.innerHTML = "";
    const selectedCategory = categoryFilter.value;
    const searchTerm = searchInput.value.toLowerCase();

    professionals
        .filter(prof => (selectedCategory === "Todas las categorías" || prof.especialidad === selectedCategory))
        .filter(prof => prof.apenom.toLowerCase().includes(searchTerm))
        .forEach(prof => {
            const telefonos = Array.isArray(prof.telefono) ? prof.telefono.join(" / ") : prof.telefono || "";
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${prof.especialidad || ""}</td>
                <td>${prof.apenom || ""}</td>
                <td>${prof.direccion || ""}</td>
                <td>${prof.localidad || ""}</td>
                <td>${telefonos}</td>
                <td class="action-buttons">
                    <button class="edit" onclick="editProfessional('${prof.id}')"><i class="fas fa-edit"></i></button>
                    <button class="delete" onclick="deleteProfessional('${prof.id}')"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            professionalList.appendChild(row);
        });
}

async function addProfessional() {
    // Convertir el Set de categorías en un array y agregar opción para nueva especialidad
    const categoriesArray = Array.from(categories).filter(c => c !== "Todas las categorías");
    categoriesArray.push("NUEVA ESPECIALIDAD");

    // Construir opciones del select
    const categoryOptions = categoriesArray.map(category =>
        `<option value="${category}">${category}</option>`
    ).join("");

    const { value: formValues } = await Swal.fire({
        title: "Agregar Profesional",
        html: `
            <input id="swal-apenom" class="swal2-input" placeholder="Nombre y apellido">
            <select id="swal-especialidad" class="swal2-input">
                ${categoryOptions}
            </select>
            <input id="swal-nueva-especialidad" class="swal2-input" placeholder="Nueva especialidad" style="display: none;">
            <input id="swal-direccion" class="swal2-input" placeholder="Dirección">
            <input id="swal-localidad" class="swal2-input" placeholder="Localidad">
            <input id="swal-telefono" class="swal2-input" placeholder="Teléfono (separados por coma)">
        `,
        showCancelButton: true,
        confirmButtonText: "Guardar",
        didOpen: () => {
            const selectEspecialidad = document.getElementById("swal-especialidad");
            const nuevaEspecialidadInput = document.getElementById("swal-nueva-especialidad");

            // Mostrar el input si se selecciona "Nueva especialidad"
            selectEspecialidad.addEventListener("change", () => {
                if (selectEspecialidad.value === "NUEVA ESPECIALIDAD") {
                    nuevaEspecialidadInput.style.display = "block";
                    nuevaEspecialidadInput.value = ""; // Limpiar campo
                } else {
                    nuevaEspecialidadInput.style.display = "none";
                }
            });
        },
        preConfirm: () => {
            const especialidadSeleccionada = document.getElementById("swal-especialidad").value;
            const nuevaEspecialidad = document.getElementById("swal-nueva-especialidad").value.trim();

            return {
                apenom: document.getElementById("swal-apenom").value.trim(),
                especialidad: especialidadSeleccionada === "NUEVA ESPECIALIDAD" ? nuevaEspecialidad : especialidadSeleccionada,
                direccion: document.getElementById("swal-direccion").value.trim(),
                localidad: document.getElementById("swal-localidad").value.trim(),
                telefono: document.getElementById("swal-telefono").value.trim().split(",").map(t => t.trim()).filter(Boolean)
            };
        }
    });

    if (formValues) {
        try {
            await addDoc(collection(db, "profesionales"), formValues);
            Swal.fire("Éxito", "Profesional agregado", "success");
            loadProfessionals();
        } catch (error) {
            console.error("Error al agregar profesional:", error);
        }
    }
}   

// **🔹 Función para editar un profesional**
async function editProfessional(id) {
    const professional = professionals.find(prof => prof.id === id);
    if (!professional) {
        Swal.fire("Error", "No se encontró el profesional", "error");
        return;
    }

    const { value: formValues } = await Swal.fire({
        title: "Editar Profesional",
        html: `
            <input id="swal-apenom" class="swal2-input" placeholder="Nombre y apellido" value="${professional.apenom || ''}">
            <input id="swal-especialidad" class="swal2-input" placeholder="Especialidad" value="${professional.especialidad || ''}">
            <input id="swal-direccion" class="swal2-input" placeholder="Dirección" value="${professional.direccion || ''}">
            <input id="swal-localidad" class="swal2-input" placeholder="Localidad" value="${professional.localidad || ''}">
            <input id="swal-telefono" class="swal2-input" placeholder="Teléfono (separados por coma)" value="${(professional.telefono || []).join(', ')}">
        `,
        showCancelButton: true,
        confirmButtonText: "Actualizar",
        preConfirm: () => ({
            apenom: document.getElementById('swal-apenom').value.trim(),
            especialidad: document.getElementById('swal-especialidad').value.trim(),
            direccion: document.getElementById('swal-direccion').value.trim(),
            localidad: document.getElementById('swal-localidad').value.trim(),
            telefono: document.getElementById('swal-telefono').value.trim().split(",").map(t => t.trim()).filter(Boolean)
        })
    });

    if (formValues) {
        try {
            await updateDoc(doc(db, "profesionales", id), formValues);
            Swal.fire("Éxito", "Profesional actualizado", "success");
            loadProfessionals();
        } catch (error) {
            console.error("Error al actualizar profesional:", error);
        }
    }
}

// **🔹 Función para eliminar un profesional**
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

// **🔹 Eventos de filtro**
searchInput.addEventListener("input", renderProfessionals);
categoryFilter.addEventListener("change", renderProfessionals);

// **🔹 Inicializar eventos**
addProfessionalBtn.addEventListener("click", addProfessional);
document.addEventListener("DOMContentLoaded", loadProfessionals);

// **🔹 Hacer funciones accesibles en `window`**
window.editProfessional = editProfessional;
window.deleteProfessional = deleteProfessional;