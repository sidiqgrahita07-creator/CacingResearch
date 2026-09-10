'use strict';

// ══ CONFIG ══
const CFG_KEY = 'cacingresearch_config';

function getConfig() {
  try { return JSON.parse(localStorage.getItem(CFG_KEY)) || {}; }
  catch { return {}; }
}
function saveConfig(cfg) {
  localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
}

// ══ DATA (IndexedDB fallback ke localStorage) ══
const DATA_KEY = 'cacingresearch_data';

function getAllData() {
  try { return JSON.parse(localStorage.getItem(DATA_KEY)) || []; }
  catch { return []; }
}
function saveAllData(arr) {
  localStorage.setItem(DATA_KEY, JSON.stringify(arr));
}
function addRecord(rec) {
  const all = getAllData();
  all.unshift(rec);
  saveAllData(all);
}
function deleteRecord(id) {
  saveAllData(getAllData().filter(r => r.id !== id));
}

// ══ UTILS ══
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function formatDate(ts) {
  return new Date(ts).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
function formatDateShort(ts) {
  return new Date(ts).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function toast(msg, isErr) {
  const t = $('#toast');
  $('#toast-ic').textContent = isErr ? '!' : '✓';
  $('#toast-msg').textContent = msg;
  t.classList.toggle('err', !!isErr);
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 3200);
}

function setView(id) {
  $$('.view').forEach(v => v.classList.remove('active'));
  const v = document.getElementById(id);
  if (v) v.classList.add('active');
  // nav-current
  const labels = { 'view-list': 'Pengamatan', 'view-stats': 'Statistik', 'view-config': 'Pengaturan' };
  $('#nav-current').textContent = labels[id] || '';
}

// ══ FOTO: compress & simpan sebagai base64 ══
function compressPhoto(file, maxPx = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width: w, height: h } = img;
      if (w > maxPx || h > maxPx) {
        if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
        else { w = Math.round(w * maxPx / h); h = maxPx; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = url;
  });
}

// ══ PHOTO STRIP STATE ══
let photosB64 = []; // array of base64 strings

function renderPhotoStrip() {
  const strip = $('#photo-strip');
  // Keep add btn
  strip.innerHTML = '';
  photosB64.forEach((b64, i) => {
    const thumb = document.createElement('div');
    thumb.className = 'photo-thumb';
    thumb.innerHTML = `<img src="${b64}" alt="foto"><button class="rm" data-i="${i}">×</button>`;
    thumb.querySelector('.rm').addEventListener('click', () => {
      photosB64.splice(i, 1);
      renderPhotoStrip();
    });
    strip.appendChild(thumb);
  });
  const addBtn = document.createElement('div');
  addBtn.className = 'photo-add';
  addBtn.id = 'photo-add-btn';
  addBtn.textContent = '📷';
  addBtn.addEventListener('click', () => $('#photo-input').click());
  strip.appendChild(addBtn);
}

// ══ SYNC KE GOOGLE SHEETS ══
async function syncToSheets(record) {
  const cfg = getConfig();
  if (!cfg.sheetsUrl || cfg.sheetsUrl.includes('PASTE')) return { ok: false, err: 'URL belum diconfig' };

  try {
    // Kirim tanpa foto (foto terlalu besar untuk Apps Script)
    const payload = { ...record, foto_count: record.fotos.length, fotos: [] };
    const resp = await fetch(cfg.sheetsUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    });
    const text = await resp.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { success: true }; }
    return json.success !== false ? { ok: true } : { ok: false, err: json.message };
  } catch (e) {
    return { ok: false, err: e.message };
  }
}

// ══ RENDER DAFTAR PENGAMATAN ══
function renderList() {
  const all = getAllData();
  const cfg = getConfig();
  const container = $('#obs-list');

  // Sync status bar
  const syncBar = $('#sync-status');
  if (!cfg.sheetsUrl) {
    syncBar.innerHTML = `<div class="sync-bar err">⚠️ Sheets belum terhubung — <a href="#" id="go-config" style="color:inherit;font-weight:700;">Setup Config</a></div>`;
    document.getElementById('go-config')?.addEventListener('click', e => {
      e.preventDefault();
      openConfig();
    });
  } else {
    syncBar.innerHTML = `<div class="sync-bar ok">✓ Terhubung ke Google Sheets</div>`;
  }

  if (all.length === 0) {
    container.innerHTML = `
      <div class="empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 12s1.5-3 4-3 4 3 4 3"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
        <p>Belum ada pengamatan.<br>Tap <strong>+</strong> untuk tambah data baru.</p>
      </div>`;
    return;
  }

  container.innerHTML = all.map(r => `
    <div class="obs-card" data-id="${r.id}">
      <div class="obs-meta">
        <span class="obs-badge">${r.jenis_cacing || '?'}</span>
        <span class="obs-date">${formatDate(r.tanggal)}</span>
      </div>
      <div class="obs-grid">
        <div class="obs-item">
          <div class="obs-item-lbl">Bibit</div>
          <div class="obs-item-val">${r.jumlah_bibit || '—'}</div>
        </div>
        <div class="obs-item">
          <div class="obs-item-lbl">Kascing</div>
          <div class="obs-item-val">${r.kascing ? r.kascing + ' kg' : '—'}</div>
        </div>
        <div class="obs-item">
          <div class="obs-item-lbl">Limbah Masuk</div>
          <div class="obs-item-val">${r.jumlah_limbah ? r.jumlah_limbah + ' kg' : '—'}</div>
        </div>
        <div class="obs-item">
          <div class="obs-item-lbl">Pretreatment</div>
          <div class="obs-item-val">${r.pretreatment || '—'}</div>
        </div>
      </div>
      ${r.catatan ? `<div class="obs-notes">📝 ${r.catatan}</div>` : ''}
      ${r.fotos && r.fotos.length ? `
        <div class="obs-photos">
          ${r.fotos.map(b64 => `<img class="obs-photo" src="${b64}" alt="foto">`).join('')}
        </div>` : ''}
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">
        <span style="font-size:10px;color:var(--text3);">
          ${r.synced ? '☁️ Tersimpan di Sheets' : '📱 Lokal saja'}
        </span>
        <button class="obs-del" data-id="${r.id}">🗑 Hapus</button>
      </div>
    </div>
  `).join('');

  // Hapus handler
  $$('.obs-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (confirm('Hapus pengamatan ini?')) {
        deleteRecord(btn.dataset.id);
        renderList();
        toast('Data dihapus');
      }
    });
  });
}

// ══ RENDER STATISTIK ══
function renderStats() {
  const all = getAllData();
  $('#s-total').textContent = all.length;

  const totalLimbah = all.reduce((s, r) => s + (parseFloat(r.jumlah_limbah) || 0), 0);
  $('#s-limbah').textContent = totalLimbah.toFixed(1);

  const perJenis = {};
  all.forEach(r => {
    const j = r.jenis_cacing || 'Tidak disebutkan';
    perJenis[j] = (perJenis[j] || 0) + 1;
  });
  $('#s-jenis').innerHTML = Object.entries(perJenis).length
    ? Object.entries(perJenis).map(([j, c]) =>
        `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--cream3);">
          <span style="font-weight:600;">${j}</span>
          <span style="color:var(--text3);">${c} pengamatan</span>
        </div>`
      ).join('')
    : '<span style="color:var(--text3);font-size:12px;">Belum ada data</span>';
}

// ══ MODAL TAMBAH ══
function openModal() {
  // Reset form
  $('#f-jenis').value = '';
  $('#f-jenis-lain').value = '';
  $('#f-bibit').value = '';
  $('#f-kascing').value = '';
  $('#f-limbah').value = '';
  $('#f-pretreatment').value = '';
  $('#f-treat-lain').value = '';
  $('#f-catatan').value = '';
  photosB64 = [];
  renderPhotoStrip();
  $('#field-jenis-lain').style.display = 'none';
  $('#field-treat-lain').style.display = 'none';
  $('#form-status').innerHTML = '';
  $('#modal-tambah').classList.add('open');
}
function closeModal() {
  $('#modal-tambah').classList.remove('open');
}

function openConfig() {
  const cfg = getConfig();
  $('#cfg-url').value = cfg.sheetsUrl || '';
  $('#cfg-nama').value = cfg.nama || '';
  setView('view-config');
  $('#nav-current').textContent = 'Pengaturan';
  $$('.bot-nav button').forEach(b => b.classList.remove('active'));
  $('#btn-config').style.background = 'var(--navy)';
  $('#btn-config').style.color = '#fff';
}

// ══ SIMPAN PENGAMATAN ══
async function simpanPengamatan() {
  const jenis = $('#f-jenis').value === 'Lainnya' ? $('#f-jenis-lain').value : $('#f-jenis').value;
  const pretreat = $('#f-pretreatment').value === 'Lainnya' ? $('#f-treat-lain').value : $('#f-pretreatment').value;

  if (!jenis) { toast('Pilih jenis cacing dulu!', true); return; }

  const record = {
    id: genId(),
    tanggal: Date.now(),
    jenis_cacing: jenis,
    jumlah_bibit: $('#f-bibit').value.trim(),
    kascing: $('#f-kascing').value,
    jumlah_limbah: $('#f-limbah').value,
    pretreatment: pretreat,
    catatan: $('#f-catatan').value.trim(),
    fotos: [...photosB64],
    synced: false
  };

  // Simpan lokal
  addRecord(record);

  // Tampil loading
  const btn = $('#btn-simpan');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-sm"></span> Menyimpan...';

  // Sync ke Sheets
  const result = await syncToSheets(record);
  if (result.ok) {
    // Update record dengan synced=true
    const all = getAllData();
    const idx = all.findIndex(r => r.id === record.id);
    if (idx !== -1) { all[idx].synced = true; saveAllData(all); }
    toast('✓ Tersimpan di Google Sheets!');
  } else {
    toast('Tersimpan lokal — Sheets: ' + (result.err || 'gagal'), true);
  }

  btn.disabled = false;
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Simpan Pengamatan`;

  closeModal();
  renderList();
}

// ══ INIT ══
document.addEventListener('DOMContentLoaded', () => {

  // Bottom nav
  $$('.bot-nav button[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.bot-nav button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $('#btn-config').style.background = 'var(--cream2)';
      $('#btn-config').style.color = 'var(--steel)';
      const viewId = btn.dataset.view;
      setView(viewId);
      if (viewId === 'view-list') renderList();
      if (viewId === 'view-stats') renderStats();
    });
  });

  // Config button (header)
  $('#btn-config').addEventListener('click', openConfig);

  // FAB
  $('#fab-add').addEventListener('click', openModal);
  $('#modal-close').addEventListener('click', closeModal);
  $('#modal-tambah').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Jenis cacing — show/hide custom
  $('#f-jenis').addEventListener('change', () => {
    $('#field-jenis-lain').style.display = $('#f-jenis').value === 'Lainnya' ? 'block' : 'none';
  });
  // Pretreatment — show/hide custom
  $('#f-pretreatment').addEventListener('change', () => {
    $('#field-treat-lain').style.display = $('#f-pretreatment').value === 'Lainnya' ? 'block' : 'none';
  });

  // Foto
  $('#photo-input').addEventListener('change', async e => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const b64 = await compressPhoto(file);
      photosB64.push(b64);
    }
    renderPhotoStrip();
    e.target.value = '';
  });
  // Foto add btn (initial)
  document.addEventListener('click', e => {
    if (e.target.id === 'photo-add-btn') $('#photo-input').click();
  });

  // Simpan
  $('#btn-simpan').addEventListener('click', simpanPengamatan);

  // Config save
  $('#btn-save-config').addEventListener('click', () => {
    const url = $('#cfg-url').value.trim();
    const nama = $('#cfg-nama').value.trim();
    if (!url) { toast('URL tidak boleh kosong!', true); return; }
    saveConfig({ sheetsUrl: url, nama });
    toast('Config tersimpan!');
    setView('view-list');
    $$('.bot-nav button').forEach(b => b.classList.remove('active'));
    $('#nav-list').classList.add('active');
    $('#btn-config').style.background = 'var(--cream2)';
    $('#btn-config').style.color = 'var(--steel)';
    renderList();
  });

  // Test koneksi
  $('#btn-test-conn').addEventListener('click', async () => {
    const url = $('#cfg-url').value.trim();
    if (!url) { toast('Isi URL dulu!', true); return; }
    const btn = $('#btn-test-conn');
    btn.textContent = 'Testing...';
    btn.disabled = true;
    try {
      const resp = await fetch(url);
      const text = await resp.text();
      $('#cfg-test-result').innerHTML = `<div class="sync-bar ok">✓ Koneksi OK! Response: ${text.slice(0, 80)}</div>`;
    } catch (e) {
      $('#cfg-test-result').innerHTML = `<div class="sync-bar err">✗ Gagal: ${e.message}</div>`;
    }
    btn.textContent = '🔗 Test Koneksi Sheets';
    btn.disabled = false;
  });

  // Initial render
  renderList();
});
