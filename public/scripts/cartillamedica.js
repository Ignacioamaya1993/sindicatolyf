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
    specialtyFilter.innerHTML = '<option value="all">Todas las especialidades</option>';

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
            <td><span class="professional-link" data-id="${professional.id}">${professional.apenom || ''}</span></td>
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

    // Agregar eventos a los botones de mapa
    document.querySelectorAll('.map-button').forEach(button => {
        button.addEventListener('click', function () {
            const address = this.getAttribute('data-address');
            showMap(address);
        });
    });

    if (window.innerWidth <= 776) {
        document.querySelectorAll('.professional-link').forEach(link => {
            link.addEventListener('click', function () {
                const specialty = this.parentElement.previousElementSibling.textContent;
                const address = this.parentElement.nextElementSibling.textContent;
                const city = this.parentElement.nextElementSibling.nextElementSibling.textContent;
                const phone = this.parentElement.nextElementSibling.nextElementSibling.nextElementSibling.textContent;

                // Construye la dirección completa con la ciudad y el país para la versión móvil
                const fullAddress = `${address}, ${city}, Buenos Aires, Argentina`;
                console.log('Dirección completa (móvil):', fullAddress); // Log para verificar la dirección en móvil

                const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(fullAddress)}`;
                console.log('Mapa URL (móvil):', mapUrl);

                Swal.fire({
                    icon: 'info',
                    title: this.textContent,
                    html: `
                        <p><strong>Especialidad:</strong> ${specialty}</p>
                        <p><strong>Dirección:</strong> ${address}</p>
                        <p><strong>Localidad:</strong> ${city}</p>
                        <p><strong>Teléfono:</strong> ${phone}</p>
                        <iframe id="map" width="100%" height="200" frameborder="0" style="border:0" src="${mapUrl}" allowfullscreen></iframe>
                    `,
                    confirmButtonText: 'Cerrar',
                    customClass: {
                        popup: 'swal2-popup-custom',
                        title: 'swal2-title-custom',
                        htmlContainer: 'swal2-html-custom',
                    }
                });
            });
        });
    }
}

    // Agregar eventos a los nombres de los profesionales
    document.querySelectorAll('.professional-link').forEach(link => {
        link.addEventListener('click', function () {
            const professionalId = this.getAttribute('data-id');
            const professional = professionals.find(p => p.id === professionalId);
            if (professional) {
                showProfessionalDetails(professional);
            }
        });
    });

// Función para mostrar detalles del profesional en un pop-up
function showProfessionalDetails(professional) {
    Swal.fire({
        title: professional.apenom,
        html: `
            <p><strong>Especialidad:</strong> ${professional.especialidad}</p>
            <p><strong>Dirección:</strong> ${professional.direccion}</p>
            <p><strong>Localidad:</strong> ${professional.localidad}</p>
            <p><strong>Teléfono:</strong> ${professional.telefono}</p>
        `,
        confirmButtonText: 'Cerrar'
    });
}

// Llama a la función initMap cuando se necesita mostrar el mapa
function showMap(address) {
    var geocoder = new google.maps.Geocoder();

    // Log para verificar la dirección
    console.log('Dirección enviada a geocoder:', address);

    geocoder.geocode({ 'address': address }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            var lat = results[0].geometry.location.lat();
            var lng = results[0].geometry.location.lng();

            // Imprime las coordenadas en la consola para verificar
            console.log('Latitud:', lat, 'Longitud:', lng);

            Swal.fire({
                title: 'Ubicación',
                html: `<div id="map-container" style="width: 100%; height: 300px;">
                           <iframe id="map" width="100%" height="100%" frameborder="0" style="border:0" allowfullscreen></iframe>
                       </div>`,
                confirmButtonText: 'Cerrar',
                didOpen: () => {
                    const mapIframe = document.getElementById('map');
                    if (mapIframe) {
                        mapIframe.src = `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${lat},${lng}`;
                    }
                },
                customClass: {
                    popup: 'swal2-popup-custom',
                    title: 'swal2-title-custom',
                    htmlContainer: 'swal2-html-custom',
                }
            });
        } else {
            console.error('Geocode no tuvo éxito debido a: ' + status);
            Swal.fire('Error', 'No se pudo mostrar la ubicación en el mapa', 'error');
        }
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