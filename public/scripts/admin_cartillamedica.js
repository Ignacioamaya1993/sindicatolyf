import { db } from "./firebaseConfig.js";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

const auth = getAuth();
let professionals = [];
const professionalList = document.getElementById('professionalList');

// Cargar profesionales desde Firestore
async function loadProfessionals() {
    try {
        const querySnapshot = await getDocs(collection(db, "profesionales"));
        professionals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderProfessionals();
    } catch (error) {
        console.error("Error al cargar profesionales:", error);
    }
}

// Renderizar la tabla
function renderProfessionals() {
    professionalList.innerHTML = '';
    professionals.forEach(prof => {
        const telefonos = Array.isArray(prof.telefono) ? prof.telefono.join(" / ") : (prof.telefono || '');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${prof.especialidad || ''}</td>
            <td>${prof.apenom || ''}</td>
            <td>${prof.direccion || ''}</td>
            <td>${prof.localidad || ''}</td>
            <td>${telefonos}</td>
            <td class="action-buttons">
                <button class="edit" onclick="editProfessional('${prof.id}')">Editar</button>
                <button class="delete" onclick="deleteProfessional('${prof.id}')">Eliminar</button>
            </td>
        `;
        professionalList.appendChild(row);
    });
}

// Agregar un profesional con múltiples teléfonos
async function addProfessional() {
    if (!auth.currentUser) {
        Swal.fire("Error", "Debes iniciar sesión para agregar un profesional", "error");
        return;
    }

    const { value: formValues } = await Swal.fire({
        title: "Agregar Profesional",
        html: `
            <input id="swal-apenom" class="swal2-input" placeholder="Nombre y apellido" required>
            <input id="swal-especialidad" class="swal2-input" placeholder="Especialidad" required>
            <input id="swal-direccion" class="swal2-input" placeholder="Dirección" required>
            <input id="swal-localidad" class="swal2-input" placeholder="Localidad" required>
            <div id="phoneContainer">
                <div class="phone-field">
                    <input type="text" class="swal2-input phone-input" placeholder="Teléfono">
                    <button type="button" class="add-phone">+</button>
                </div>
            </div>
        `,
        didOpen: () => {
            document.querySelector(".add-phone").addEventListener("click", addPhoneField);
        },
        showCancelButton: true,
        confirmButtonText: "Guardar",
        preConfirm: () => {
            const phones = [...document.querySelectorAll(".phone-input")]
                .map(input => input.value.trim())
                .filter(phone => phone !== ""); // Filtrar vacíos

            return {
                apenom: document.getElementById('swal-apenom').value.trim(),
                especialidad: document.getElementById('swal-especialidad').value.trim(),
                direccion: document.getElementById('swal-direccion').value.trim(),
                localidad: document.getElementById('swal-localidad').value.trim(),
                telefono: phones.length > 0 ? phones : null
            };
        }
    });

    if (formValues && formValues.apenom && formValues.especialidad && formValues.direccion && formValues.localidad) {
        try {
            // Verificar si ya existe el profesional con esa especialidad
            const querySnapshot = await getDocs(collection(db, "profesionales"));
            const exists = querySnapshot.docs.some(doc => {
                const data = doc.data();
                return data.apenom === formValues.apenom && data.especialidad === formValues.especialidad;
            });

            if (exists) {
                Swal.fire("Error", "El profesional con esta especialidad ya existe", "error");
                return;
            }

            await addDoc(collection(db, "profesionales"), formValues);
            Swal.fire("Éxito", "Profesional agregado", "success");
            loadProfessionals();
        } catch (error) {
            console.error("Error al agregar profesional:", error);
        }
    } else {
        Swal.fire("Error", "Todos los campos son obligatorios excepto el teléfono", "error");
    }
}


// Función para agregar un campo de teléfono dinámico
function addPhoneField() {
    const phoneContainer = document.getElementById("phoneContainer");
    const div = document.createElement("div");
    div.classList.add("phone-field");
    div.innerHTML = `
        <input type="text" class="swal2-input phone-input" placeholder="Teléfono">
        <button type="button" class="remove-phone">-</button>
    `;
    phoneContainer.appendChild(div);

    div.querySelector(".remove-phone").addEventListener("click", function () {
        div.remove();
    });
}

// Eliminar un profesional
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

// Inicializar eventos
document.getElementById('addProfessional').addEventListener('click', addProfessional);
document.addEventListener('DOMContentLoaded', loadProfessionals);