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

    // 2. RENDER KARTU WISATA CLEAN DESIGN
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

    // 3. FILTER KATEGORI
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

    const dropdown = document.getElementById('dropdown');
    const tombolDropdown = document.getElementById('dropdownTombol');
    tombolDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('buka');
    });
    document.addEventListener('click', () => dropdown.classList.remove('buka'));

    // 4. SEARCH ENGINE NAVBAR
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

    // 5. MODAL DETAIL WISATA & BOOKING
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

    document.getElementById('btnTanyaWisata').addEventListener('click', () => {
        if (!wisataTerpilih) return;
        wisataModal.classList.remove('buka');
        chatbotWindow.classList.add('buka');
        kirimPesanKeBot(`Tolong jelaskan lengkap tentang ${wisataTerpilih.nama}`);
    });

    // 7. AUTH LOGIN & REGISTER
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
            document.getElementById('authMsg').textContent = 'Username atau password salah!';
        }
    });

    formRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        const nama = document.getElementById('regNama').value.trim();
        const username = document.getElementById('regUser').value.trim();
        const password = document.getElementById('regPass').value.trim();

        if (tempUsersDB.some(acc => acc.username.toLowerCase() === username.toLowerCase())) {
            document.getElementById('regMsg').textContent = 'Username sudah terdaftar!';
            return;
        }

        const userBaru = { username, password, passAlt: password, nama, role: 'Pengguna' };
        tempUsersDB.push(userBaru);
        currentUser = userBaru;
        authModal.classList.remove('buka');
        renderAuthNavbar();
    });

    // =====================================================================
// ==== 8. CHATBOT AI GEMINI + LIVE CHAT 2 ARAH CS VIA TELEGRAM     ====
// =====================================================================

const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotWindow = document.getElementById('chatbotWindow');
const chatbotClose = document.getElementById('chatbotClose');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotForm = document.getElementById('chatbotForm');
const chatbotInput = document.getElementById('chatbotInput');

// State untuk sesi Live CS Manusia
let modeLiveCS = false;
let timerPollingCS = null;
let lastTelegramMsgId = 0;
let sessionIdCS = localStorage.getItem('lombok_cs_session');
if (!sessionIdCS) {
    sessionIdCS = 'CS' + Math.floor(10000 + Math.random() * 90000);
    localStorage.setItem('lombok_cs_session', sessionIdCS);
}

if (chatbotToggle && chatbotWindow && chatbotClose) {
    chatbotToggle.addEventListener('click', () => chatbotWindow.classList.toggle('buka'));
    chatbotClose.addEventListener('click', () => chatbotWindow.classList.remove('buka'));
}

function tambahBubbleChat(teks, pengirim = 'bot') {
    const div = document.createElement('div');
    div.className = `chat-bubble ${pengirim}`;
    div.innerHTML = teks.replace(/\n/g, '<br>');
    chatbotMessages.appendChild(div);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    return div;
}

tambahBubbleChat(
    `Halo! Selamat datang di <strong>Lombok24jamSupport</strong> 🏝️.\nSaya asisten virtual Anda. Silakan tanya seputar wisata Lombok, atau ketik <strong>"CS" / "Komplain"</strong> jika butuh terhubung langsung dengan Admin CS Manusia di ruang chat ini!`
);

function bukaWisataDariChat(idWisata) {
    fokusKeKartuWisata(idWisata);
    setTimeout(() => {
        bukaModalDetail(idWisata);
    }, 600);
}

// Deteksi apakah user sedang komplain atau mengalami kendala
function cekButuhCSManusia(pesan) {
    const teks = pesan.toLowerCase();
    const kataKunciMasalah = [
        'kendala', 'komplain', 'masalah', 'gagal', 'error', 'eror',
        'bayar', 'pembayaran', 'refund', 'uang kembali', 'struk',
        'tiket tidak', 'belum masuk', 'cs', 'customer service',
        'admin', 'manusia', 'orang asli', 'bantuan', 'tolong'
    ];
    return kataKunciMasalah.some(kata => teks.includes(kata));
}

// Mengaktifkan Mode Live Chat CS Manusia & Memulai Pengecekan Balasan Telegram
function aktifkanModeLiveCS(pesanAwalUser = '') {
    if (!modeLiveCS) {
        modeLiveCS = true;
        tambahBubbleChat(
            `🔔 <strong>Mode Live CS Aktif (ID: #${sessionIdCS})</strong><br>` +
            `Anda kini terhubung langsung dengan <strong>Customer Service Manusia</strong> kami. Pesan Anda telah diteruskan ke HP Admin, mohon tunggu balasan di ruang chat ini.<br>` +
            `<button onclick="matikanModeLiveCS()" style="margin-top:8px; background:#e74c3c; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; font-size:0.8rem;">❌ Akhiri Sesi CS & Kembali ke AI</button>`,
            'bot'
        );

        // Cek balasan dari Telegram setiap 3 detik
        if (timerPollingCS) clearInterval(timerPollingCS);
        timerPollingCS = setInterval(cekBalasanDariTelegram, 3000);
    }

    if (pesanAwalUser) {
        kirimPesanKeTelegram(pesanAwalUser);
    }
}

function matikanModeLiveCS() {
    modeLiveCS = false;
    if (timerPollingCS) clearInterval(timerPollingCS);
    tambahBubbleChat(`✅ Sesi dengan CS Manusia telah diakhiri. Anda kembali terhubung dengan Asisten AI Lombok24jamSupport.`, 'bot');
}

async function kirimPesanKeTelegram(pesanUser) {
    const namaUser = currentUser ? currentUser.nama : 'Pengunjung Web';
    try {
        const res = await fetch('/api/cs-telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: sessionIdCS,
                nama: namaUser,
                message: pesanUser
            })
        });
        if (!res.ok) {
            tambahBubbleChat(`⚠️ Gagal meneruskan pesan ke Telegram CS. Pastikan token sudah diatur.`, 'bot');
        }
    } catch (err) {
        console.error(err);
    }
}

async function cekBalasanDariTelegram() {
    if (!modeLiveCS) return;
    try {
        const res = await fetch(`/api/cs-telegram?sessionId=${sessionIdCS}&after=${lastTelegramMsgId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.replies && data.replies.length > 0) {
            data.replies.forEach(item => {
                if (item.id > lastTelegramMsgId) {
                    lastTelegramMsgId = item.id;
                    tambahBubbleChat(`👨‍💻 <strong>Admin CS:</strong><br>${item.text}`, 'bot');
                }
            });
        }
    } catch (err) {
        console.error(err);
    }
}

async function kirimPesanKeBot(pesanUser) {
    tambahBubbleChat(pesanUser, 'user');

    // 1. Jika sedang dalam Mode Live CS, langsung kirim ke Telegram Admin
    if (modeLiveCS) {
        await kirimPesanKeTelegram(pesanUser);
        return;
    }

    // 2. Jika terdeteksi komplain/kendala, otomatis alihkan ke Mode Live CS
    if (cekButuhCSManusia(pesanUser)) {
        aktifkanModeLiveCS(pesanUser);
        return;
    }

    // 3. Jika pertanyaan wisata normal, dijawab oleh AI Gemini
    const bubbleLoading = tambahBubbleChat('<em>⏳ Lombok24jamSupport sedang mengetik...</em>', 'bot');

    try {
        const katalogWisataUntukAI = daftarWisataData.map(w => 
            `[ID:${w.id}] ${w.nama} | Kategori: ${w.kategoriLabel} | Lokasi: ${w.lokasiTeks} | Tiket: ${w.tiketList.join(', ')} | Deskripsi: ${w.deskripsi}`
        ).join('\n');

        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: pesanUser,
                katalog: katalogWisataUntukAI
            })
        });

        const data = await res.json();

        if (res.ok && data.reply) {
            bubbleLoading.innerHTML = data.reply.replace(/\n/g, '<br>');
            if (data.auto_focus_id !== null && data.auto_focus_id !== undefined) {
                fokusKeKartuWisata(data.auto_focus_id);
            }
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
            return;
        } else {
            bubbleLoading.innerHTML = `⚠️ Kendala sistem AI. Ketik <strong>"CS"</strong> untuk berbicara langsung dengan Admin kami.`;
        }
    } catch (err) {
        console.error(err);
        bubbleLoading.innerHTML = `Maaf, terjadi kendala jaringan. Ketik <strong>"CS"</strong> untuk terhubung dengan Admin manusia.`;
    }
}

if (chatbotForm && chatbotInput) {
    chatbotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const teks = chatbotInput.value.trim();
        if (!teks) return;
        chatbotInput.value = '';
        kirimPesanKeBot(teks);
    });
}

document.querySelectorAll('#chatbotTemplates button').forEach(btn => {
    btn.addEventListener('click', () => {
        kirimPesanKeBot(btn.dataset.prompt);
    });
});

    // 9. SLIDESHOW HERO & ANIMASI ANGKA
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