import { db } from "./firebaseConfig.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

let professionals = [];
let filteredProfessionals = [];
let currentPage = 1;
let recordsPerPage = 10;
const googleMapsApiKey = 'AIzaSyAyjnRLusJVkSsiJyssRPK2L6CB3hD1gN8';

// Cargar datos desde Firestore
async function loadProfessionalsFromFirestore() {
    try {
        const querySnapshot = await getDocs(collection(db, "profesionales"));
        professionals = querySnapshot.docs.map(doc => ({
            id: doc.id,
            apenom: doc.data().apenom || '',
            direccion: doc.data().direccion || '',
            especialidad: doc.data().especialidad || '',
            localidad: doc.data().localidad || '',
            telefono: doc.data().telefono || ''
        }));

        populateSpecialtyFilter();
        updateProfessionals();
    } catch (error) {
        console.error("Error al cargar profesionales desde Firestore:", error);
    }
}

// Poblar el filtro de especialidades
function populateSpecialtyFilter() {
    const specialties = [...new Set(professionals.map(p => p.especialidad))];
    const specialtyFilter = document.getElementById('specialtyFilter');
    specialtyFilter.innerHTML = '<option value="all">TODAS LAS ESPECIALIDADES</option>';

    specialties.forEach(specialty => {
        const option = document.createElement('option');
        option.value = specialty;
        option.textContent = specialty;
        specialtyFilter.appendChild(option);
    });
}

// Actualizar la lista de profesionales
function updateProfessionals() {
    const searchQuery = document.getElementById('search').value.toLowerCase();
    const selectedSpecialty = document.getElementById('specialtyFilter').value;

    filteredProfessionals = professionals.filter(p =>
        (p.apenom?.toLowerCase().includes(searchQuery)) &&
        (selectedSpecialty === 'all' || p.especialidad === selectedSpecialty)
    );

    currentPage = 1;
    renderProfessionals();
    updatePaginationInfo();
}

// Renderizar profesionales en la tabla
function renderProfessionals() {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const paginatedProfessionals = filteredProfessionals.slice(startIndex, startIndex + recordsPerPage);

    const professionalList = document.getElementById('professionalList');
    professionalList.innerHTML = '';

    paginatedProfessionals.forEach(professional => {
        const fullAddress = `${professional.direccion}, ${professional.localidad || 'Olavarría'}, Buenos Aires, Argentina`;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${professional.especialidad || ''}</td>
            <td><span class="professional-link">${professional.apenom || ''}</span></td>
            <td>${professional.direccion || ''}</td>
            <td>${professional.localidad || ''}</td>
            <td>${professional.telefono || ''}</td>
            <td>
                <button class="map-button" data-address="${fullAddress}">
                    <img src="../assets/logos/maps.png" alt="Google Maps" width="40">
                </button>
            </td>`;
        
        professionalList.appendChild(row);
    });

    document.querySelectorAll('.map-button').forEach(button => {
        button.addEventListener('click', function () {
            const address = this.getAttribute('data-address');
            showMap(address);
        });
    });
}

// Mostrar Google Maps en una nueva ventana
// Mostrar Google Maps en un pop-up con SweetAlert2
function showMap(address) {
    const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(address)}`;

    Swal.fire({
        title: 'Ubicación en Google Maps',
        html: `<iframe width="100%" height="400px" style="border:0;" loading="lazy" allowfullscreen 
            referrerpolicy="no-referrer-when-downgrade" src="${mapUrl}"></iframe>`,
        width: 600,
        showCloseButton: true,
        confirmButtonText: 'Cerrar'
    });
}

// Actualizar la información de paginación
function updatePaginationInfo() {
    const pageInfo = document.getElementById('pageInfo');
    pageInfo.textContent = `Página ${currentPage} de ${Math.ceil(filteredProfessionals.length / recordsPerPage)}`;

    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === Math.ceil(filteredProfessionals.length / recordsPerPage);
}

// Cambiar de página
function changePage(direction) {
    currentPage += direction;
    renderProfessionals();
    updatePaginationInfo();
}

// Actualizar registros por página
function updateRecordsPerPage() {
    recordsPerPage = parseInt(document.getElementById('recordsPerPage').value, 10);
    currentPage = 1;
    renderProfessionals();
    updatePaginationInfo();
}

// Inicializa la aplicación cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
    loadProfessionalsFromFirestore();
    document.getElementById('recordsPerPage').addEventListener('change', updateRecordsPerPage);
    document.getElementById('search').addEventListener('input', updateProfessionals);
    document.getElementById('specialtyFilter').addEventListener('change', updateProfessionals);
    document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(1));
});