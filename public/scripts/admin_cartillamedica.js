import { db } from "./firebaseConfig.js";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

const auth = getAuth();
const professionalList = document.getElementById("professionalList");
const searchInput = document.getElementById("search");
const addProfessionalBtn = document.getElementById("addProfessional");

let professionals = [];

// **🔹 Cargar profesionales desde Firestore**
async function loadProfessionals() {
    try {
        const querySnapshot = await getDocs(collection(db, "profesionales"));
        professionals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderProfessionals();
    } catch (error) {
        console.error("Error al cargar profesionales:", error);
    }
}

// **🔹 Renderizar la tabla con profesionales**
function renderProfessionals() {
    professionalList.innerHTML = "";
    professionals.forEach(prof => {
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

// **🔹 Función para agregar un profesional**
async function addProfessional() {
    const { value: formValues } = await Swal.fire({
        title: "Agregar Profesional",
        html: `
            <input id="swal-apenom" class="swal2-input" placeholder="Nombre y apellido">
            <input id="swal-especialidad" class="swal2-input" placeholder="Especialidad">
            <input id="swal-direccion" class="swal2-input" placeholder="Dirección">
            <input id="swal-localidad" class="swal2-input" placeholder="Localidad">
            <input id="swal-telefono" class="swal2-input" placeholder="Teléfono (separados por coma)">
        `,
        showCancelButton: true,
        confirmButtonText: "Guardar",
        preConfirm: () => {
            return {
                apenom: document.getElementById('swal-apenom').value.trim(),
                especialidad: document.getElementById('swal-especialidad').value.trim(),
                direccion: document.getElementById('swal-direccion').value.trim(),
                localidad: document.getElementById('swal-localidad').value.trim(),
                telefono: document.getElementById('swal-telefono').value.trim().split(",").map(t => t.trim()).filter(Boolean)
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
            <p id="error-message" class="error-message">Todos los campos son obligatorios (excepto teléfono)</p>
        `,
        showCancelButton: true,
        confirmButtonText: "Actualizar",
        didOpen: () => {
            // Detectar inputs y agregar eventos de validación
            const inputs = document.querySelectorAll(".swal2-input");
            inputs.forEach(input => {
                input.addEventListener("input", () => {
                    if (input.value.trim() === "" && input.id !== "swal-telefono") {
                        input.classList.add("input-error");
                    } else {
                        input.classList.remove("input-error");
                    }
                });
            });
        },
        preConfirm: () => {
            const apenom = document.getElementById('swal-apenom').value.trim();
            const especialidad = document.getElementById('swal-especialidad').value.trim();
            const direccion = document.getElementById('swal-direccion').value.trim();
            const localidad = document.getElementById('swal-localidad').value.trim();
            const telefono = document.getElementById('swal-telefono').value.trim().split(",").map(t => t.trim()).filter(Boolean);

            // Verificar que todos los campos obligatorios estén llenos
            if (!apenom || !especialidad || !direccion || !localidad) {
                document.getElementById("error-message").style.display = "block";
                return false;
            }

            // Verificar si hubo cambios en los datos
            const sinCambios = (
                apenom === professional.apenom &&
                especialidad === professional.especialidad &&
                direccion === professional.direccion &&
                localidad === professional.localidad &&
                JSON.stringify(telefono) === JSON.stringify(professional.telefono)
            );

            if (sinCambios) {
                Swal.fire("Sin cambios", "No realizaste modificaciones.", "info");
                return false;
            }

            return { apenom, especialidad, direccion, localidad, telefono };
        }
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

// **🔹 Función para validar los campos**
function validateFields() {
    const inputs = document.querySelectorAll(".swal2-input");
    let allValid = true;

    inputs.forEach(input => {
        if (input.placeholder !== "Teléfono (opcional)" && input.value.trim() === "") {
            input.style.border = "2px solid red";
            allValid = false;
        } else {
            input.style.border = "";
        }
    });

    const confirmButton = document.querySelector(".swal2-confirm");
    confirmButton.disabled = !allValid;
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

// **🔹 Función para filtrar profesionales**
searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredProfessionals = professionals.filter(prof => prof.apenom.toLowerCase().includes(searchTerm));
    professionalList.innerHTML = "";
    filteredProfessionals.forEach(prof => {
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
});

// **🔹 Inicializar eventos**
addProfessionalBtn.addEventListener("click", addProfessional);
document.addEventListener("DOMContentLoaded", loadProfessionals);

// **🔹 Hacer funciones accesibles en `window`**
window.editProfessional = editProfessional;
window.deleteProfessional = deleteProfessional;
