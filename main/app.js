document.addEventListener('DOMContentLoaded', () => {
    // gunakan base URL backend (Django runserver)
    const API_BASE = 'http://127.0.0.1:8000';
    const apiUrl = API_BASE + '/api/warga/';          // gunakan ini untuk semua request warga
    const pengaduanApi = API_BASE + '/api/pengaduan/'; // endpoint pengaduan
    const wargaListContainer = document.getElementById('warga-list-container');
    const pengaduanListContainer = document.getElementById('pengaduan-list-container');
    const form = document.getElementById('warga-form');
    const formStatus = document.getElementById('form-status');
    const paginationContainer = document.getElementById('pagination-container');
    const pengaduanPaginationContainer = document.getElementById('pengaduan-pagination-container');

    // elemen baru untuk user/logout
    const userInfoEl = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');

    // new elements for pengaduan form control
    const addPengaduanBtn = document.getElementById('add-pengaduan-btn');
    const pengaduanFormCard = document.getElementById('pengaduan-form-card');
    const pengaduanForm = document.getElementById('pengaduan-form');
    const pengaduanFormStatus = document.getElementById('pengaduan-form-status');

    let currentPage = 1;
    let currentPengaduanPage = 1;
    const pageSize = 2;

    // ambil token dari localStorage (set di halaman login)
    const TOKEN = localStorage.getItem('api_token') || '';

    // jika tidak ada token, paksa ke halaman login
    if (!TOKEN) {
        window.location = 'login.html';
        return;
    }

    let isAdmin = false; // akan diisi setelah /api/me/

    function authHeaders(json = false) {
        const h = { 'Authorization': 'Token ' + TOKEN };
        if (json) h['Content-Type'] = 'application/json';
        return h;
    }

    // cek user info (butuh endpoint /api/me/ yang akan dibuat di backend)
    async function fetchMe() {
        try {
            const r = await fetch(API_BASE + '/api/me/', { headers: authHeaders() });
            if (!r.ok) throw new Error('not auth');
            const data = await r.json();
            isAdmin = !!data.is_staff || !!data.is_superuser;
            // tampilkan username dan tombol logout
            if (userInfoEl) {
                userInfoEl.textContent = data.username || 'User';
                userInfoEl.style.display = '';
            }
            if (logoutBtn) logoutBtn.style.display = '';
        } catch (err) {
            // token tidak valid -> kembalikan ke login
            console.warn('fetchMe failed', err);
            localStorage.removeItem('api_token');
            window.location = 'login.html';
        }
    }

    // tombol logout: hapus token dan kembali ke login
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('api_token');
            window.location = 'login.html';
        });
    }

    function renderWarga(warga) {
        const div = document.createElement('div');
        div.className = 'item';
        const nama = document.createElement('h3'); nama.textContent = warga.nama_lengkap;
        const nik = document.createElement('p'); nik.className = 'meta'; nik.textContent = `NIK: ${warga.nik}`;
        const alamat = document.createElement('p'); alamat.className = 'meta'; alamat.textContent = `Alamat: ${warga.alamat}`;
        div.appendChild(nama); div.appendChild(nik); div.appendChild(alamat);
        if (warga.no_telepon) {
            const tel = document.createElement('p'); tel.className = 'meta'; tel.textContent = `No. Telepon: ${warga.no_telepon}`;
            div.appendChild(tel);
        }

        if (isAdmin && warga.id) {
            const actions = document.createElement('div');
            actions.style.marginTop = '8px';
            // Edit button (inline prompt sederhana)
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.style.marginRight = '8px';
            editBtn.addEventListener('click', async () => {
                const newName = prompt('Nama lengkap', warga.nama_lengkap);
                if (newName == null) return;
                const newAlamat = prompt('Alamat', warga.alamat);
                if (newAlamat == null) return;
                const newTel = prompt('No. telepon (kosong untuk hapus)', warga.no_telepon || '');
                const payload = { nama_lengkap: newName, alamat: newAlamat, no_telepon: newTel || '' };
                try {
                    const res = await fetch(apiUrl + warga.id + '/', {
                        method: 'PATCH',
                        headers: authHeaders(true),
                        body: JSON.stringify(payload)
                    });
                    if (!res.ok) throw await res.json();
                    loadWarga(currentPage);
                } catch (e) {
                    console.error(e);
                    alert('Gagal mengedit');
                }
            });

            // Delete button
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Hapus';
            delBtn.style.background = '#ef4444';
            delBtn.addEventListener('click', async () => {
                if (!confirm('Hapus data ini?')) return;
                try {
                    const res = await fetch(apiUrl + warga.id + '/', {
                        method: 'DELETE',
                        headers: authHeaders()
                    });
                    if (res.status !== 204) throw await res.json();
                    loadWarga(currentPage);
                } catch (e) {
                    console.error(e);
                    alert('Gagal menghapus');
                }
            });

            actions.appendChild(editBtn);
            actions.appendChild(delBtn);
            div.appendChild(actions);
        }

        return div;
    }

    function renderPengaduan(item) {
        const div = document.createElement('div');
        div.className = 'item';
        const judul = document.createElement('h3'); judul.textContent = item.judul || '(Tanpa judul)';
        const meta1 = document.createElement('p'); meta1.className = 'meta'; meta1.textContent = `Status: ${item.status || '-'}`;
        const tanggal = document.createElement('p'); tanggal.className = 'meta'; tanggal.textContent = item.tanggal_lapor || '';
        const desc = document.createElement('p'); desc.className = 'meta'; desc.textContent = item.deskripsi || '';
        div.appendChild(judul); div.appendChild(meta1); div.appendChild(tanggal); div.appendChild(desc);

        if (isAdmin && item.id) {
            const actions = document.createElement('div');
            actions.style.marginTop = '8px';
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.style.marginRight = '8px';
            editBtn.addEventListener('click', async () => {
                const newJudul = prompt('Judul', item.judul || '');
                if (newJudul == null) return;
                const newDesc = prompt('Deskripsi', item.deskripsi || '');
                if (newDesc == null) return;
                const newStatus = prompt('Status', item.status || '');
                if (newStatus == null) return;
                const payload = { judul: newJudul, deskripsi: newDesc, status: newStatus };
                try {
                    const res = await fetch(pengaduanApi + item.id + '/', {
                        method: 'PATCH',
                        headers: authHeaders(true),
                        body: JSON.stringify(payload)
                    });
                    if (!res.ok) throw await res.json();
                    loadPengaduan(currentPengaduanPage);
                } catch (e) {
                    console.error(e);
                    alert('Gagal mengedit pengaduan');
                }
            });

            const delBtn = document.createElement('button');
            delBtn.textContent = 'Hapus';
            delBtn.style.background = '#ef4444';
            delBtn.addEventListener('click', async () => {
                if (!confirm('Hapus pengaduan ini?')) return;
                try {
                    const res = await fetch(pengaduanApi + item.id + '/', {
                        method: 'DELETE',
                        headers: authHeaders()
                    });
                    if (res.status !== 204) throw await res.json();
                    loadPengaduan(currentPengaduanPage);
                } catch (e) {
                    console.error(e);
                    alert('Gagal menghapus pengaduan');
                }
            });

            actions.appendChild(editBtn);
            actions.appendChild(delBtn);
            div.appendChild(actions);
        }

        return div;
    }

    function renderPagination(count, page) {
        paginationContainer.innerHTML = '';
        const totalPages = Math.max(1, Math.ceil(count / pageSize));

        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.textContent = 'Prev';
        prevBtn.disabled = page <= 1;
        prevBtn.addEventListener('click', () => loadWarga(page - 1));
        paginationContainer.appendChild(prevBtn);

        // simple page numbers
        const pager = document.createElement('div');
        pager.className = 'pagination-pager';

        const windowSize = 3;
        let start = Math.max(1, page - windowSize);
        let end = Math.min(totalPages, page + windowSize);
        if (page <= windowSize) end = Math.min(totalPages, 1 + windowSize * 2);
        if (page + windowSize >= totalPages) start = Math.max(1, totalPages - windowSize * 2);

        for (let p = start; p <= end; p++) {
            const btn = document.createElement('button');
            btn.className = 'pagination-btn';
            btn.textContent = String(p);
            btn.disabled = p === page;
            btn.style.fontWeight = p === page ? '700' : '400';
            btn.addEventListener('click', () => loadWarga(p));
            pager.appendChild(btn);
        }
        paginationContainer.appendChild(pager);

        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.textContent = 'Next';
        nextBtn.disabled = page >= totalPages;
        nextBtn.addEventListener('click', () => loadWarga(page + 1));
        paginationContainer.appendChild(nextBtn);

        const info = document.createElement('span');
        info.style.marginLeft = '10px';
        info.style.color = '#6b7280';
        info.textContent = `Halaman ${page} dari ${totalPages} — total ${count} data`;
        paginationContainer.appendChild(info);
    }

    function renderPengaduanPagination(count, page) {
        if (!pengaduanPaginationContainer) return;
        pengaduanPaginationContainer.innerHTML = '';
        const totalPages = Math.max(1, Math.ceil(count / pageSize));

        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.textContent = 'Prev';
        prevBtn.disabled = page <= 1;
        prevBtn.addEventListener('click', () => loadPengaduan(page - 1));
        pengaduanPaginationContainer.appendChild(prevBtn);

        const pager = document.createElement('div');
        pager.className = 'pagination-pager';

        const windowSize = 3;
        let start = Math.max(1, page - windowSize);
        let end = Math.min(totalPages, page + windowSize);
        if (page <= windowSize) end = Math.min(totalPages, 1 + windowSize * 2);
        if (page + windowSize >= totalPages) start = Math.max(1, totalPages - windowSize * 2);

        for (let p = start; p <= end; p++) {
            const btn = document.createElement('button');
            btn.className = 'pagination-btn';
            btn.textContent = String(p);
            btn.disabled = p === page;
            btn.style.fontWeight = p === page ? '700' : '400';
            btn.addEventListener('click', () => loadPengaduan(p));
            pager.appendChild(btn);
        }
        pengaduanPaginationContainer.appendChild(pager);

        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.textContent = 'Next';
        nextBtn.disabled = page >= totalPages;
        nextBtn.addEventListener('click', () => loadPengaduan(page + 1));
        pengaduanPaginationContainer.appendChild(nextBtn);

        const info = document.createElement('span');
        info.style.marginLeft = '10px';
        info.style.color = '#6b7280';
        info.textContent = `Halaman ${page} dari ${totalPages} — total ${count} data`;
        pengaduanPaginationContainer.appendChild(info);
    }

    async function loadWarga(page = 1) {
        currentPage = page;
        if (!wargaListContainer) return;
        wargaListContainer.innerHTML = '<p class="empty">Memuat data...</p>';
        const url = new URL(apiUrl);
        url.searchParams.set('page', String(page));
        try {
            const r = await fetch(url.toString(), { headers: authHeaders() });
            if (!r.ok) throw new Error('Network response was not ok');
            const data = await r.json();
            wargaListContainer.innerHTML = '';
            const items = Array.isArray(data) ? data : (data.results || []);
            if (items.length === 0) {
                wargaListContainer.innerHTML = '<p class="empty">Tidak ada data warga.</p>'; paginationContainer.innerHTML = ''; return;
            }
            items.forEach(w => wargaListContainer.appendChild(renderWarga(w)));
            const count = typeof data.count === 'number' ? data.count : items.length;
            renderPagination(count, page);
        } catch (err) {
            console.error(err);
            // token invalid atau server mati -> redirect ke login
            localStorage.removeItem('api_token');
            window.location = 'login.html';
        }
    }

    async function loadPengaduan(page = 1) {
        currentPengaduanPage = page;
        if (!pengaduanListContainer) return;
        pengaduanListContainer.innerHTML = '<p class="empty">Memuat pengaduan...</p>';
        const url = new URL(pengaduanApi);
        url.searchParams.set('page', String(page));
        try {
            const r = await fetch(url.toString(), { headers: authHeaders() });
            if (!r.ok) throw new Error('Network response was not ok');
            const data = await r.json();
            pengaduanListContainer.innerHTML = '';
            const items = Array.isArray(data) ? data : (data.results || []);
            if (items.length === 0) {
                pengaduanListContainer.innerHTML = '<p class="empty">Tidak ada pengaduan.</p>'; pengaduanPaginationContainer.innerHTML = ''; return;
            }
            items.forEach(it => pengaduanListContainer.appendChild(renderPengaduan(it)));
            const count = typeof data.count === 'number' ? data.count : items.length;
            renderPengaduanPagination(count, page);
        } catch (err) {
            console.error('loadPengaduan error', err);
            pengaduanListContainer.innerHTML = '<p class="empty">Gagal memuat pengaduan.</p>';
            if (pengaduanPaginationContainer) pengaduanPaginationContainer.innerHTML = '';
        }
    }

    // init: cek user lalu load data
    (async () => {
        await fetchMe();
        await loadWarga(currentPage);
        await loadPengaduan(currentPengaduanPage);
    })();

    // submit handler: gunakan authHeaders saat POST
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!formStatus) return;
            formStatus.textContent = 'Mengirim...';
            const payload = {
                nik: document.getElementById('nik').value.trim(),
                nama_lengkap: document.getElementById('nama_lengkap').value.trim(),
                alamat: document.getElementById('alamat').value.trim(),
                no_telepon: document.getElementById('no_telepon').value.trim()
            };
            if (!payload.nik || !payload.nama_lengkap || !payload.alamat) { formStatus.textContent = 'Harap isi semua field wajib.'; return; }
            try {
                const res = await fetch(apiUrl, { method: 'POST', headers: authHeaders(true), body: JSON.stringify(payload) });
                if (!res.ok) { const e = await res.json().catch(()=>null); throw e||'error'; }
                form.reset();
                // ambil count terbaru -> lompat ke halaman terakhir
                const resp = await fetch(apiUrl, { headers: authHeaders() });
                const data = await resp.json();
                const count = typeof data.count === 'number' ? data.count : 0;
                const lastPage = Math.max(1, Math.ceil(count / pageSize));
                await loadWarga(lastPage);
                formStatus.textContent = 'Berhasil ditambahkan.';
                setTimeout(()=>formStatus.textContent = '', 3000);
            } catch (e) {
                console.error(e);
                formStatus.textContent = 'Gagal menambahkan warga.';
                setTimeout(()=>formStatus.textContent = '', 3000);
            }
        });
    }

    // show Add Pengaduan button when user info loaded
    // after fetchMe() sets user info and shows logoutBtn, also show addPengaduanBtn
    // (ensure fetchMe() runs before this; fetchMe already makes logout visible)
    function showAddPengaduanControl() {
        if (addPengaduanBtn) addPengaduanBtn.style.display = '';
    }

    if (addPengaduanBtn) {
        addPengaduanBtn.addEventListener('click', () => {
            if (!pengaduanFormCard) return;
            pengaduanFormCard.style.display = pengaduanFormCard.style.display === 'none' ? '' : 'none';
        });
    }

    // handle submit pengaduan
    if (pengaduanForm) {
        pengaduanForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!pengaduanFormStatus) return;
            pengaduanFormStatus.textContent = 'Mengirim...';
            const payload = {
                judul: document.getElementById('judul')?.value.trim() || '',
                deskripsi: document.getElementById('deskripsi')?.value.trim() || '',
                status: document.getElementById('status')?.value || 'BARU'
            };
            if (!payload.judul || !payload.deskripsi) {
                pengaduanFormStatus.textContent = 'Judul dan deskripsi wajib diisi.';
                return;
            }
            try {
                const res = await fetch(pengaduanApi, {
                    method: 'POST',
                    headers: authHeaders(true),
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    const err = await res.json().catch(()=>null);
                    throw err || 'error';
                }
                pengaduanForm.reset();
                pengaduanFormStatus.textContent = 'Berhasil ditambahkan.';
                // reload pengaduan ke halaman 1
                await loadPengaduan(1);
                setTimeout(()=> pengaduanFormStatus.textContent = '', 2500);
                // optionally hide form after success
                if (pengaduanFormCard) pengaduanFormCard.style.display = 'none';
            } catch (err) {
                console.error('Gagal membuat pengaduan', err);
                pengaduanFormStatus.textContent = 'Gagal mengirim pengaduan.';
                setTimeout(()=> pengaduanFormStatus.textContent = '', 2500);
            }
        });
    }

    // call showAddPengaduanControl after successful fetchMe
    const originalFetchMe = fetchMe;
    fetchMe = async function() {
        await originalFetchMe();
        showAddPengaduanControl();
    };
});