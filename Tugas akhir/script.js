// CONSTANTS & API ENDPOINT
const API_URL = 'https://api-web.dnccudinus.org/api/mobil';
const FALLBACK_API_URL = 'https://www.dnccudinus.org/api/mobil';

// MAPPING FOTO SPESIFIK BERDASARKAN NAMA MOBIL (Akurasi Tinggi untuk Tugas Showroom)
const CAR_IMAGE_MAP = {
    'ioniq 5': 'hyundai-ioniq-5.jpg',
    'hyundai ioniq 5': 'Mobil haik.jpg',
    'ioniq': 'Mobil haik.jpg',
    'civic': 'Honda Civic RS Turbo.jpg',
    'hrv': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=8',
    'pajero': 'Mitsubishi Pajero Sport Dakar 4x2.jpg',
    'fortuner': 'fortuner.jpg',
    'avanza': 'avanza 1.5.jpg',
    'alphard': 'suzuki jimny.jpg'
};

// GLOBAL STATE
let carsData = [];
let cartCount = 0;

// DOM ELEMENTS
const carGrid = document.getElementById('carGrid');
const searchInput = document.getElementById('searchInput');
const brandFilter = document.getElementById('brandFilter');
const sortFilter = document.getElementById('sortFilter');
const cartBadge = document.getElementById('cartBadge');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const detailModal = document.getElementById('detailModal');
const modalClose = document.getElementById('modalClose');
const modalBody = document.getElementById('modalBody');

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    fetchCars();
    setupEventListeners();
});

// FETCH DATA FROM API
async function fetchCars() {
    try {
        let response = await fetch(API_URL);
        if (!response.ok) {
            response = await fetch(FALLBACK_API_URL);
        }
        
        const result = await response.json();
        
        // Handle array response or object wrapper response
        carsData = Array.isArray(result) ? result : (result.data || result.mobil || []);
        
        populateBrandOptions(carsData);
        renderCarGrid(carsData);
    } catch (error) {
        console.error('Gagal mengambil data dari API:', error);
        carGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ef4444;">
                <i class="fa-solid fa-circle-exclamation" style="font-size: 3rem; margin-bottom: 12px;"></i>
                <h3>Gagal Memuat Data Mobil</h3>
                <p>Silakan periksa koneksi internet atau ketersediaan endpoint API panitia.</p>
            </div>
        `;
    }
}

// MATCH IMAGE FUNCTION ACCORDING TO CAR NAME
function getCarImage(car) {
    const carName = (car.nama || car.nama_mobil || car.title || '').toLowerCase().trim();
    const carImageFromApi = car.gambar || car.foto || car.image || car.img;

    // Check mapping match
    for (let key in CAR_IMAGE_MAP) {
        if (carName.includes(key)) {
            return CAR_IMAGE_MAP[key];
        }
    }

    // Check if API returns valid image URL
    if (carImageFromApi && carImageFromApi.startsWith('http')) {
        return carImageFromApi;
    }

    // Default Unsplash Fallback
    return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80';
}

// RENDER CAR GRID USING DOM MANIPULATION
function renderCarGrid(cars) {
    carGrid.innerHTML = '';

    if (cars.length === 0) {
        carGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">
                <i class="fa-solid fa-car-side" style="font-size: 3rem; margin-bottom: 12px;"></i>
                <h3>Mobil Tidak Ditemukan</h3>
                <p>Coba kata kunci pencarian atau filter merek yang lain.</p>
            </div>
        `;
        return;
    }

    cars.forEach(car => {
        const name = car.nama || car.nama_mobil || car.title || 'Mobil Showroom';
        const brand = car.merek || car.brand || 'AutoPrime';
        const price = car.harga ? Number(car.harga) : 350000000;
        const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
        const imageUrl = getCarImage(car);
        const transmisi = car.transmisi || 'Otomatis';
        const kapasitas = car.kapasitas || '5 Kursi';

        const card = document.createElement('div');
        card.className = 'car-card';
        card.innerHTML = `
            <div class="card-img-wrapper">
                <span class="brand-badge">${brand}</span>
                <img src="${imageUrl}" alt="${name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80'">
            </div>
            <div class="card-body">
                <h3 class="card-title">${name}</h3>
                <div class="card-specs">
                    <span><i class="fa-solid fa-gear"></i> ${transmisi}</span>
                    <span><i class="fa-solid fa-user-group"></i> ${kapasitas}</span>
                </div>
                <div class="card-price">${formattedPrice}</div>
                <div class="card-actions">
                    <button class="btn btn-outline detail-btn" data-id="${car.id}">Detail</button>
                    <button class="btn btn-primary buy-btn"><i class="fa-solid fa-cart-plus"></i> Pesan</button>
                </div>
            </div>
        `;

        // Add event listeners to card buttons
        card.querySelector('.detail-btn').addEventListener('click', () => openDetailModal(car, imageUrl, formattedPrice));
        card.querySelector('.buy-btn').addEventListener('click', () => {
            cartCount++;
            cartBadge.textContent = cartCount;
            alert(`Berhasil menambahkan "${name}" ke dalam keranjang pesanan!`);
        });

        carGrid.appendChild(card);
    });
}

// DYNAMIC BRAND FILTER POPULATION
function populateBrandOptions(cars) {
    const brands = [...new Set(cars.map(c => c.merek || c.brand).filter(Boolean))];
    brandFilter.innerHTML = '<option value="all">Semua Merek</option>';
    brands.forEach(b => {
        const option = document.createElement('option');
        option.value = b.toLowerCase();
        option.textContent = b;
        brandFilter.appendChild(option);
    });
}

// FILTER & SORT LOGIC
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedBrand = brandFilter.value;
    const selectedSort = sortFilter.value;

    let filtered = carsData.filter(car => {
        const name = (car.nama || car.nama_mobil || car.title || '').toLowerCase();
        const brand = (car.merek || car.brand || '').toLowerCase();
        
        const matchesSearch = name.includes(searchTerm) || brand.includes(searchTerm);
        const matchesBrand = selectedBrand === 'all' || brand === selectedBrand;

        return matchesSearch && matchesBrand;
    });

    if (selectedSort === 'price-asc') {
        filtered.sort((a, b) => (Number(a.harga) || 0) - (Number(b.harga) || 0));
    } else if (selectedSort === 'price-desc') {
        filtered.sort((a, b) => (Number(b.harga) || 0) - (Number(a.harga) || 0));
    }

    renderCarGrid(filtered);
}

// DETAIL MODAL LOGIC
function openDetailModal(car, imageUrl, formattedPrice) {
    const name = car.nama || car.nama_mobil || car.title || 'Mobil Showroom';
    const brand = car.merek || car.brand || 'AutoPrime';
    const deskripsi = car.deskripsi || 'Mobil kualitas terbaik dengan inspeksi lengkap 150+ titik standar pabrikan.';

    modalBody.innerHTML = `
        <img src="${imageUrl}" alt="${name}" class="modal-img">
        <span class="brand-badge" style="position:static; display:inline-block; margin-bottom:8px;">${brand}</span>
        <h2 style="margin-bottom:8px;">${name}</h2>
        <h3 style="color:var(--primary); margin-bottom:16px;">${formattedPrice}</h3>
        <p style="color:var(--text-muted); margin-bottom:20px;">${deskripsi}</p>
        <button class="btn btn-primary" style="width:100%; justify-content:center;" id="modalOrderBtn">Pesan Mobil Ini Sekarang</button>
    `;

    detailModal.classList.add('active');

    document.getElementById('modalOrderBtn').addEventListener('click', () => {
        cartCount++;
        cartBadge.textContent = cartCount;
        alert(`Pesanan untuk "${name}" berhasil diproses!`);
        detailModal.classList.remove('active');
    });
}

// SETUP EVENT LISTENERS
function setupEventListeners() {
    searchInput.addEventListener('input', applyFilters);
    brandFilter.addEventListener('change', applyFilters);
    sortFilter.addEventListener('change', applyFilters);

    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    modalClose.addEventListener('click', () => {
        detailModal.classList.remove('active');
    });

    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) {
            detailModal.classList.remove('active');
        }
    });
}