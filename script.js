/* =====================================================================
   SCRIPT.JS — Full Stack Logic: Data Engine, Search, Auth, Booking & Bot
   ===================================================================== */

// 1. PARSING DATA WISATA DARI HTML KE ARRAY OBJECT
const rawArticles = document.querySelectorAll('#raw-wisata-data article');
const daftarWisataData = [];

rawArticles.forEach((art, index) => {
    const nama = art.querySelector('h2')?.textContent.trim() || '';
    const kategoriClass = art.className.trim();
    const imgEl = art.querySelector('img');
    const foto = imgEl ? imgEl.getAttribute('src') : '';
    const mapAnchor = art.querySelector('a');
    const lokasiTeks = mapAnchor ? mapAnchor.textContent.trim() : 'Lombok, Nusa Tenggara Barat';
    const lokasiUrl = mapAnchor ? mapAnchor.getAttribute('href').replace(/^- /, '').trim() : '#';

    let kategoriLabel = 'Wisata';
    let deskripsi = '';
    let jamBuka = 'Buka setiap hari 24 Jam';
    const tiketList = [];
    let sedangBacaTiket = false;

    art.querySelectorAll('p').forEach((p) => {
        const teks = p.textContent.trim();
        if (teks.startsWith('Kategori:')) {
            kategoriLabel = teks.replace('Kategori:', '').trim();
            sedangBacaTiket = false;
        } else if (teks.startsWith('Deskripsi Wisata:')) {
            deskripsi = teks.replace('Deskripsi Wisata:', '').replace(/^- /, '').trim();
            sedangBacaTiket = false;
        } else if (teks.startsWith('Jam Buka:')) {
            jamBuka = teks.replace('Jam Buka:', '').trim();
            sedangBacaTiket = false;
        } else if (teks.startsWith('Tiket Masuk')) {
            sedangBacaTiket = true;
        } else if (teks.startsWith('Foto Wisata') || teks.startsWith('Fasilitas Wisata')) {
            sedangBacaTiket = false;
        } else if (sedangBacaTiket && teks.length > 0) {
            tiketList.push(teks);
        }
    });

    const fasilitas = Array.from(art.querySelectorAll('ul li')).map(li => li.textContent.trim());

    // Ekstrak harga dasar angka untuk kalkulasi booking
    let hargaDasar = 10000;
    const gabungTiket = tiketList.join(' ');
    const matchHarga = gabungTiket.match(/Rp\s?([\d.]+)/i);
    if (matchHarga && matchHarga[1]) {
        hargaDasar = parseInt(matchHarga[1].replace(/\./g, ''), 10) || 0;
    }

    daftarWisataData.push({
        id: index,
        nama,
        kategoriClass,
        kategoriLabel,
        lokasiTeks,
        lokasiUrl,
        deskripsi,
        jamBuka,
        tiketList: tiketList.length ? tiketList : ['Rp 10.000,-/orang'],
        hargaDasar,
        foto,
        fasilitas
    });
});

// 2. RENDER KARTU WISATA CLEAN DESIGN (Foto + Nama + VISIT NOW)
const containerClean = document.getElementById('daftarClean');
const infoJumlah = document.getElementById('jumlah');
const infoKosong = document.getElementById('kosong');
let kategoriAktif = 'semua';
let kataKunciAktif = '';

function renderKartuWisata() {
    containerClean.innerHTML = '';
    const hasil = daftarWisataData.filter((item) => {
        const cocokKat = kategoriAktif === 'semua' || item.kategoriClass === kategoriAktif;
        const cocokKata = item.nama.toLowerCase().includes(kataKunciAktif.toLowerCase());
        return cocokKat && cocokKata;
    });

    infoJumlah.textContent = `Menampilkan ${hasil.length} destinasi wisata terbaik`;
    infoKosong.style.display = hasil.length === 0 ? 'block' : 'none';

    hasil.forEach((w) => {
        const card = document.createElement('div');
        card.className = 'clean-card';
        card.id = `wisata-card-${w.id}`;
        card.innerHTML = `
            <img src="${w.foto}" alt="${w.nama}" loading="lazy">
            <span class="clean-badge">${w.kategoriLabel}</span>
            <div class="clean-card-gradient">
                <h3>${w.nama}</h3>
                <div class="visit-now-overlay">VISIT NOW &rarr;</div>
            </div>
        `;
        card.addEventListener('click', () => bukaModalDetail(w.id));
        containerClean.appendChild(card);
    });
}
renderKartuWisata();

// 3. FILTER KATEGORI (Navbar Dropdown, Filter Chips & Kartu Tentang)
function setKategoriFilter(kat) {
    kategoriAktif = kat;
    kataKunciAktif = '';
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.classList.toggle('aktif', btn.dataset.kat === kat);
    });
    renderKartuWisata();
}

document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => setKategoriFilter(btn.dataset.kat));
});

document.querySelectorAll('.navbar a[data-kat]').forEach(link => {
    link.addEventListener('click', () => {
        setKategoriFilter(link.dataset.kat);
        document.getElementById('dropdown').classList.remove('buka');
    });
});

document.querySelectorAll('.kategori-info li[data-filter]').forEach(li => {
    li.addEventListener('click', () => {
        setKategoriFilter(li.dataset.filter);
        document.getElementById('wisata').scrollIntoView({ behavior: 'smooth' });
    });
});

// Dropdown Kategori di Navbar
const dropdown = document.getElementById('dropdown');
const tombolDropdown = document.getElementById('dropdownTombol');
tombolDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('buka');
});
document.addEventListener('click', () => dropdown.classList.remove('buka'));

// 4. SEARCH ENGINE NAVBAR KANAN + AUTOCOMPLETE + EFEK HIGHLIGHT KHUSUS
const navSearchInput = document.getElementById('navSearchInput');
const searchSuggestions = document.getElementById('searchSuggestions');

navSearchInput.addEventListener('input', () => {
    const q = navSearchInput.value.trim().toLowerCase();
    searchSuggestions.innerHTML = '';

    if (!q) {
        searchSuggestions.classList.remove('tampil');
        kataKunciAktif = '';
        renderKartuWisata();
        return;
    }

    const cocok = daftarWisataData.filter(w =>
        w.nama.toLowerCase().includes(q) || w.kategoriLabel.toLowerCase().includes(q)
    );

    if (cocok.length > 0) {
        cocok.slice(0, 7).forEach(w => {
            const div = document.createElement('div');
            div.className = 'sug-item';
            div.innerHTML = `
                <img src="${w.foto}" alt="${w.nama}">
                <div class="sug-info">
                    <strong>${w.nama}</strong>
                    <span>${w.kategoriLabel} · Klik untuk menuju wisata</span>
                </div>
            `;
            div.addEventListener('click', () => {
                searchSuggestions.classList.remove('tampil');
                navSearchInput.value = w.nama;
                fokusKeKartuWisata(w.id);
            });
            searchSuggestions.appendChild(div);
        });
        searchSuggestions.classList.add('tampil');
    } else {
        searchSuggestions.innerHTML = `<div class="sug-item"><div class="sug-info"><strong>Tidak ditemukan</strong><span>Coba kata kunci lain</span></div></div>`;
        searchSuggestions.classList.add('tampil');
    }
});

function fokusKeKartuWisata(id) {
    // Pastikan semua kategori tampil agar kartu target selalu ada
    kategoriAktif = 'semua';
    kataKunciAktif = '';
    renderKartuWisata();

    const targetCard = document.getElementById(`wisata-card-${id}`);
    if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetCard.classList.add('highlight-search', 'terpilih');
        setTimeout(() => {
            targetCard.classList.remove('highlight-search');
        }, 4200);
    }
}

document.addEventListener('click', (e) => {
    if (!document.getElementById('navSearchBox').contains(e.target)) {
        searchSuggestions.classList.remove('tampil');
    }
});

// 5. MODAL DETAIL WISATA, BOOKING NOW & CETAK STRUK
const wisataModal = document.getElementById('wisataModal');
const viewDetailWisata = document.getElementById('viewDetailWisata');
const viewBookingForm = document.getElementById('viewBookingForm');
const viewReceipt = document.getElementById('viewReceipt');
let wisataTerpilih = null;

function bukaModalDetail(id) {
    wisataTerpilih = daftarWisataData.find(w => w.id === id);
    if (!wisataTerpilih) return;

    document.getElementById('detailImg').src = wisataTerpilih.foto;
    document.getElementById('detailKategori').textContent = `Kategori: ${wisataTerpilih.kategoriLabel}`;
    document.getElementById('detailNama').textContent = wisataTerpilih.nama;
    const mapLink = document.getElementById('detailMapLink');
    mapLink.textContent = wisataTerpilih.lokasiTeks;
    mapLink.href = wisataTerpilih.lokasiUrl;
    document.getElementById('detailJam').textContent = wisataTerpilih.jamBuka;
    document.getElementById('detailDeskripsi').textContent = wisataTerpilih.deskripsi;

    const ulTiket = document.getElementById('detailTiket');
    ulTiket.innerHTML = '';
    wisataTerpilih.tiketList.forEach(t => {
        const li = document.createElement('li');
        li.textContent = t;
        ulTiket.appendChild(li);
    });

    const divFas = document.getElementById('detailFasilitas');
    divFas.innerHTML = '';
    wisataTerpilih.fasilitas.forEach(f => {
        const span = document.createElement('span');
        span.textContent = f;
        divFas.appendChild(span);
    });

    viewDetailWisata.classList.remove('sembunyi');
    viewBookingForm.classList.add('sembunyi');
    viewReceipt.classList.add('sembunyi');
    wisataModal.classList.add('buka');
}

document.getElementById('closeWisataModal').addEventListener('click', () => {
    wisataModal.classList.remove('buka');
});

// Buka Form Booking
const bookJumlah = document.getElementById('bookJumlah');
const bookKendaraan = document.getElementById('bookKendaraan');
const bookTotalHarga = document.getElementById('bookTotalHarga');

function hitungTotalBooking() {
    if (!wisataTerpilih) return 0;
    const jml = parseInt(bookJumlah.value, 10) || 1;
    const biayaKendaraan = parseInt(bookKendaraan.value, 10) || 0;
    const total = (wisataTerpilih.hargaDasar * jml) + biayaKendaraan;
    bookTotalHarga.textContent = `Rp ${total.toLocaleString('id-ID')}`;
    return total;
}

bookJumlah.addEventListener('input', hitungTotalBooking);
bookKendaraan.addEventListener('change', hitungTotalBooking);

document.getElementById('btnOpenBooking').addEventListener('click', () => {
    viewDetailWisata.classList.add('sembunyi');
    viewBookingForm.classList.remove('sembunyi');
    document.getElementById('bookingSubtitle').textContent = `Destinasi: ${wisataTerpilih.nama}`;
    document.getElementById('bookTanggal').valueAsDate = new Date();
    if (currentUser) {
        document.getElementById('bookNama').value = currentUser.nama;
    }
    hitungTotalBooking();
});

document.getElementById('btnBackToDetail').addEventListener('click', () => {
    viewBookingForm.classList.add('sembunyi');
    viewDetailWisata.classList.remove('sembunyi');
});

// Submit Pembayaran -> Tampilkan Struk
document.getElementById('formBookingWisata').addEventListener('submit', (e) => {
    e.preventDefault();
    const total = hitungTotalBooking();
    const kode = 'LMB-' + Math.floor(100000 + Math.random() * 900000);
    const metode = document.querySelector('input[name="metodeBayar"]:checked').value;
    const opsiKendaraan = bookKendaraan.options[bookKendaraan.selectedIndex].text;

    document.getElementById('strukKode').textContent = kode;
    document.getElementById('strukWaktu').textContent = new Date().toLocaleString('id-ID');
    document.getElementById('strukWisata').textContent = wisataTerpilih.nama;
    document.getElementById('strukNama').textContent = document.getElementById('bookNama').value;
    document.getElementById('strukHp').textContent = document.getElementById('bookHp').value;
    document.getElementById('strukAlamat').textContent = document.getElementById('bookAlamat').value;
    document.getElementById('strukTanggal').textContent = document.getElementById('bookTanggal').value;
    document.getElementById('strukJumlah').textContent = `${bookJumlah.value} Orang`;
    document.getElementById('strukKendaraan').textContent = opsiKendaraan;
    document.getElementById('strukMetode').textContent = metode;
    document.getElementById('strukTotal').textContent = `Rp ${total.toLocaleString('id-ID')}`;

    viewBookingForm.classList.add('sembunyi');
    viewReceipt.classList.remove('sembunyi');
});

document.getElementById('btnDoneReceipt').addEventListener('click', () => {
    wisataModal.classList.remove('buka');
});

// 6. TOMBOL "TANYA WISATA" -> OTOMATIS BUKA CHATBOT LOMBOK24JAMSUPPORT
document.getElementById('btnTanyaWisata').addEventListener('click', () => {
    if (!wisataTerpilih) return;
    wisataModal.classList.remove('buka');
    chatbotWindow.classList.add('buka');
    kirimPesanKeBot(`Tolong jelaskan lengkap tentang ${wisataTerpilih.nama}`);
});

// 7. FITUR LOGIN / BUAT AKUN (IN-MEMORY TEMPORARY DATABASE)
const tempUsersDB = [
    { username: 'admin', password: '123', passAlt: 'admin123', nama: 'Administrator Lombok', role: 'Admin' },
    { username: 'user', password: '123', passAlt: 'user123', nama: 'Wisatawan Nusantara', role: 'Pengguna' }
];
let currentUser = null;

const authModal = document.getElementById('authModal');
const authArea = document.getElementById('authArea');
const formLogin = document.getElementById('formLogin');
const formRegister = document.getElementById('formRegister');
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');

function renderAuthNavbar() {
    if (currentUser) {
        authArea.innerHTML = `
            <div class="user-pill">
                <span>👤 ${currentUser.nama} (${currentUser.role})</span>
                <button class="btn-logout" id="btnLogout" type="button">Keluar</button>
            </div>
        `;
        document.getElementById('btnLogout').addEventListener('click', () => {
            currentUser = null;
            renderAuthNavbar();
        });
    } else {
        authArea.innerHTML = `<button class="btn-auth" id="btnOpenAuth" type="button">👤 Login / Daftar</button>`;
        document.getElementById('btnOpenAuth').addEventListener('click', () => authModal.classList.add('buka'));
    }
}
renderAuthNavbar();

document.getElementById('closeAuthModal').addEventListener('click', () => authModal.classList.remove('buka'));

tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('aktif');
    tabRegister.classList.remove('aktif');
    formLogin.classList.remove('sembunyi');
    formRegister.classList.add('sembunyi');
});

tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('aktif');
    tabLogin.classList.remove('aktif');
    formRegister.classList.remove('sembunyi');
    formLogin.classList.add('sembunyi');
});

formLogin.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('loginUser').value.trim();
    const p = document.getElementById('loginPass').value.trim();
    const found = tempUsersDB.find(acc => acc.username.toLowerCase() === u.toLowerCase() && (acc.password === p || acc.passAlt === p));

    if (found) {
        currentUser = found;
        authModal.classList.remove('buka');
        renderAuthNavbar();
    } else {
        document.getElementById('authMsg').textContent = 'Username atau password salah! Coba admin / admin123';
    }
});

formRegister.addEventListener('submit', (e) => {
    e.preventDefault();
    const nama = document.getElementById('regNama').value.trim();
    const username = document.getElementById('regUser').value.trim();
    const password = document.getElementById('regPass').value.trim();

    if (tempUsersDB.some(acc => acc.username.toLowerCase() === username.toLowerCase())) {
        document.getElementById('regMsg').textContent = 'Username sudah terdaftar di sesi ini!';
        return;
    }

    const userBaru = { username, password, passAlt: password, nama, role: 'Pengguna' };
    tempUsersDB.push(userBaru);
    currentUser = userBaru;
    authModal.classList.remove('buka');
    renderAuthNavbar();
});

// 8. CHATBOT "Lombok24jamSupport" (TERHUBUNG KE PYTHON + FALLBACK JS)
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotWindow = document.getElementById('chatbotWindow');
const chatbotClose = document.getElementById('chatbotClose');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotForm = document.getElementById('chatbotForm');
const chatbotInput = document.getElementById('chatbotInput');

chatbotToggle.addEventListener('click', () => chatbotWindow.classList.toggle('buka'));
chatbotClose.addEventListener('click', () => chatbotWindow.classList.remove('buka'));

function tambahBubbleChat(teks, pengirim = 'bot') {
    const div = document.createElement('div');
    div.className = `chat-bubble ${pengirim}`;
    div.innerHTML = teks.replace(/\n/g, '<br>');
    chatbotMessages.appendChild(div);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Sambutan Awal Chatbot
tambahBubbleChat(
    `Halo! Selamat datang di <strong>Lombok24jamSupport</strong> 🏝️.\nSaya asisten virtual 24 jam Anda. Silakan klik tombol <strong>Template Chat</strong> di bawah untuk mengeksplorasi seluruh wisata tanpa harus klik satu per satu, atau ketik nama wisata yang ingin Anda tanyakan!`
);

// Jawaban Cerdas Lokal (Digunakan jika server Python belum dinyalakan)
function jawabanLokalBot(pesan) {
    const teks = pesan.toLowerCase();

    // Cek apakah menanyakan salah satu dari 31 destinasi wisata
    const cocokWisata = daftarWisataData.find(w => teks.includes(w.nama.toLowerCase()));
    if (cocokWisata) {
        return `✨ <strong>${cocokWisata.nama}</strong> (${cocokWisata.kategoriLabel})\n\n` +
               `📍 <strong>Lokasi:</strong> ${cocokWisata.lokasiTeks}\n` +
               `🕒 <strong>Jam Buka:</strong> ${cocokWisata.jamBuka}\n` +
               `🎟️ <strong>Tiket:</strong> ${cocokWisata.tiketList.join(' | ')}\n` +
               `📖 <strong>Info:</strong> ${cocokWisata.deskripsi}\n` +
               `✅ <strong>Fasilitas:</strong> ${cocokWisata.fasilitas.join(', ')}.\n\n` +
               `<em>Tip: Klik kartu ${cocokWisata.nama} lalu pilih BOOKING NOW untuk memesan tiket!</em>`;
    }

    if (teks.includes('pantai')) {
        const list = daftarWisataData.filter(w => w.kategoriClass === 'pantai').map(w => `• ${w.nama}`).join('\n');
        return `🏖️ <strong>Daftar 8 Pantai Terbaik di Lombok:</strong>\n${list}\n\nKetik nama pantainya (misal: <em>"Pantai Pink"</em>) untuk penjelasan detail!`;
    }
    if (teks.includes('bukit') || teks.includes('sunset')) {
        const list = daftarWisataData.filter(w => w.kategoriClass === 'bukit').map(w => `• ${w.nama}`).join('\n');
        return `🌄 <strong>Daftar 7 Bukit & Spot Panorama di Lombok:</strong>\n${list}\n\nKetik nama bukit untuk melihat harga tiket & jam bukanya.`;
    }
    if (teks.includes('air terjun')) {
        const list = daftarWisataData.filter(w => w.kategoriClass === 'air-terjun').map(w => `• ${w.nama}`).join('\n');
        return `💧 <strong>Daftar 8 Air Terjun Asri di Lombok:</strong>\n${list}\n\nKetik nama air terjun yang ingin Anda ketahui!`;
    }
    if (teks.includes('gunung') || teks.includes('rinjani')) {
        const list = daftarWisataData.filter(w => w.kategoriClass === 'gunung').map(w => `• ${w.nama}`).join('\n');
        return `🌋 <strong>Destinasi Gunung di Lombok:</strong>\n${list}\n\nTiket TNGR Rinjani mulai Rp 25.000 (pelajar) hingga Rp 75.000 (weekend).`;
    }
    if (teks.includes('danau') || teks.includes('telaga')) {
        const list = daftarWisataData.filter(w => w.kategoriClass === 'danau').map(w => `• ${w.nama}`).join('\n');
        return `🏞️ <strong>Daftar 4 Danau & Telaga di Lombok:</strong>\n${list}`;
    }
    if (teks.includes('gratis') || teks.includes('murah')) {
        return `💸 <strong>Rekomendasi Wisata Tiket Gratis / Mulai Rp 0 - Rp 5.000:</strong>\n• Pantai Tanjung Aan\n• Pantai Kuta Mandalika\n• Pantai Selong Belanak\n• Pantai Mangsit\n• Bukit Malimbu & Bukit Nipah\n• Bukit Selong (Rp 3.000)\n• Air Terjun Timponan (Rp 2.000)`;
    }
    if (teks.includes('booking') || teks.includes('pesan')) {
        return `🎟️ <strong>Cara Booking Tiket di Website Ini:</strong>\n1. Klik kartu wisata pilihan Anda (<strong>VISIT NOW</strong>).\n2. Klik tombol <strong>BOOKING NOW</strong> di bagian bawah.\n3. Isi identitas & pilih metode pembayaran (QRIS/Bank/E-Wallet).\n4. Struk E-Ticket otomatis tercetak!`;
    }

    return `Terima kasih telah menghubungi <strong>Lombok24jamSupport</strong>! 😊\nAnda bisa menanyakan nama wisata spesifik (contoh: <em>Pantai Tanjung Aan, Bukit Merese, Gunung Rinjani</em>) atau klik tombol kategori di bawah chat ini.`;
}

async function kirimPesanKeBot(pesanUser) {
    tambahBubbleChat(pesanUser, 'user');

    // Coba panggil Backend Python terlebih dahulu (http://127.0.0.1:5000/api/chat)
    try {
        const res = await fetch('http://127.0.0.1:5000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: pesanUser })
        });
        if (res.ok) {
            const data = await res.json();
            tambahBubbleChat(data.reply, 'bot');
            return;
        }
    } catch (err) {
        // Jika server Python belum dijalankan, otomatis gunakan mesin cerdas lokal
    }

    setTimeout(() => {
        const balasan = jawabanLokalBot(pesanUser);
        tambahBubbleChat(balasan, 'bot');
    }, 300);
}

chatbotForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const teks = chatbotInput.value.trim();
    if (!teks) return;
    chatbotInput.value = '';
    kirimPesanKeBot(teks);
});

document.querySelectorAll('#chatbotTemplates button').forEach(btn => {
    btn.addEventListener('click', () => {
        kirimPesanKeBot(btn.dataset.prompt);
    });
});

// 9. SLIDESHOW HERO & ANIMASI ANGKA KATEGORI (DARI KODE ASLI)
const slide = document.querySelectorAll('.slide');
const titik = document.getElementById('titik');
const keterangan = document.getElementById('keterangan');
let aktif = 0, timer;

slide.forEach((s, i) => {
    const t = document.createElement('button');
    t.setAttribute('aria-label', 'Foto ' + (i + 1));
    t.addEventListener('click', () => { tampil(i); mulai(); });
    titik.appendChild(t);
});

function tampil(i) {
    aktif = i;
    slide.forEach((s, n) => s.classList.toggle('aktif', n === i));
    titik.querySelectorAll('button').forEach((t, n) => t.classList.toggle('aktif', n === i));
    keterangan.textContent = slide[i].dataset.nama;
}

function mulai() {
    clearInterval(timer);
    timer = setInterval(() => tampil((aktif + 1) % slide.length), 5500);
}
tampil(0);
mulai();

const pengamat = new IntersectionObserver((daftar) => {
    daftar.forEach((x) => {
        if (!x.isIntersecting) return;
        const el = x.target, tujuan = Number(el.dataset.angka);
        let n = 0;
        const t = setInterval(() => {
            n++;
            el.textContent = n;
            if (n >= tujuan) clearInterval(t);
        }, 110);
        pengamat.unobserve(el);
    });
}, { threshold: 0.6 });

document.querySelectorAll('.kategori-info b').forEach((b) => {
    b.textContent = 0;
    pengamat.observe(b);
});