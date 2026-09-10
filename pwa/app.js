'use strict';

// ══════════════════════════════════════════
//  CONFIG & DATA
// ══════════════════════════════════════════
const CFG_KEY  = 'cacingresearch_config';
const DATA_KEY = 'cacingresearch_v2';

function getConfig() {
  try { return JSON.parse(localStorage.getItem(CFG_KEY)) || {}; } catch { return {}; }
}
function saveConfig(cfg) { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); }

// Data shape:
// [{ id, nama, jenis_cacing, jumlah_bibit, kascing, pretreatment,
//    status: 'aktif'|'selesai', created_at,
//    logs: [{ id, tanggal, hari_ke, jumlah_limbah, catatan, fotos[], synced }] }]
function getAllData() {
  try { return JSON.parse(localStorage.getItem(DATA_KEY)) || []; } catch { return []; }
}
function saveAllData(arr) { localStorage.setItem(DATA_KEY, JSON.stringify(arr)); }

function getResearch(id) { return getAllData().find(r => r.id === id); }

function updateResearch(id, patch) {
  const all = getAllData();
  const i = all.findIndex(r => r.id === id);
  if (i !== -1) { all[i] = { ...all[i], ...patch }; saveAllData(all); }
}

function addResearch(rec) {
  const all = getAllData();
  all.unshift(rec);
  saveAllData(all);
}

function deleteResearch(id) { saveAllData(getAllData().filter(r => r.id !== id)); }

function addLog(researchId, log) {
  const all = getAllData();
  const i = all.findIndex(r => r.id === researchId);
  if (i !== -1) { all[i].logs.push(log); saveAllData(all); }
}

function deleteLog(researchId, logId) {
  const all = getAllData();
  const i = all.findIndex(r => r.id === researchId);
  if (i !== -1) { all[i].logs = all[i].logs.filter(l => l.id !== logId); saveAllData(all); }
}

// ══════════════════════════════════════════
//  UTILS
// ══════════════════════════════════════════
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function fmtDateShort(ts) {
  return new Date(ts).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
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
  toast._t = setTimeout(() => t.classList.remove('show'), 3000);
}

async function compressPhoto(file, maxPx = 800, q = 0.72) {
  return new Promise(resolve => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width: w, height: h } = img;
      if (w > maxPx || h > maxPx) {
        if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
        else { w = Math.round(w * maxPx / h); h = maxPx; }
      }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', q));
    };
    img.src = url;
  });
}

// ══════════════════════════════════════════
//  NAVIGATION STATE
// ══════════════════════════════════════════
let currentView = 'view-home';
let currentResearchId = null;

function setView(id) {
  $$('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  currentView = id;

  const isDetail = id === 'view-detail';
  const isHome   = id === 'view-home';
  const isStats  = id === 'view-stats';
  const isCfg    = id === 'view-config';

  // Header
  $('#h-back').style.display = isDetail ? 'flex' : 'none';
  $('#btn-config').style.display = isCfg ? 'none' : '';

  // Bottom nav visibility
  $('#bot-nav').style.display = isDetail ? 'none' : '';

  // FAB
  const fab = $('#fab');
  if (isDetail) {
    const res = getResearch(currentResearchId);
    fab.classList.toggle('hidden', res?.status === 'selesai');
    fab.title = 'Tambah Pengamatan Hari Ini';
  } else if (isHome) {
    fab.classList.remove('hidden');
    fab.title = 'Buat Research Baru';
  } else {
    fab.classList.add('hidden');
  }

  // Sub label
  const labels = { 'view-home': 'Daftar Research', 'view-stats': 'Statistik', 'view-config': 'Pengaturan' };
  $('#h-sub').textContent = labels[id] || '';
  $('#h-title').textContent = isDetail ? (getResearch(currentResearchId)?.nama || 'Detail Research') : 'Cacing Research';

  // Nav active
  $$('.bot-nav button[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === id));
}

// ══════════════════════════════════════════
//  SYNC KE SHEETS
// ══════════════════════════════════════════
async function syncToSheets(payload) {
  const cfg = getConfig();
  if (!cfg.sheetsUrl || cfg.sheetsUrl.includes('PASTE')) return { ok: false, err: 'URL belum diconfig' };
  try {
    await fetch(cfg.sheetsUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    });
    return { ok: true };
  } catch (e) { return { ok: false, err: e.message }; }
}

// ══════════════════════════════════════════
//  RENDER HOME
// ══════════════════════════════════════════
function renderHome() {
  const all = getAllData();
  const cfg = getConfig();

  // Sync bar
  const sb = $('#sync-status');
  if (!cfg.sheetsUrl) {
    sb.innerHTML = `<div class="sync-bar err">⚠️ Sheets belum terhubung — <a href="#" id="go-config">Setup Config</a></div>`;
    $('#go-config')?.addEventListener('click', e => { e.preventDefault(); openConfig(); });
  } else {
    sb.innerHTML = `<div class="sync-bar ok">☁️ Terhubung ke Google Sheets</div>`;
  }

  if (all.length === 0) {
    $('#res-list').innerHTML = `<div class="empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22C17.523 22 22 17.523 22 12S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
      <p>Belum ada research.<br>Tap <strong>+</strong> untuk mulai research baru.</p>
    </div>`;
    return;
  }

  $('#res-list').innerHTML = all.map(r => {
    const hariKe = r.logs.length;
    const isSelesai = r.status === 'selesai';
    return `<div class="res-card ${isSelesai ? 'selesai' : ''}" data-id="${r.id}">
      <div class="res-header">
        <div class="res-nama">${r.nama}</div>
        <span class="res-jenis ${isSelesai ? 'selesai' : ''}">${r.jenis_cacing.split(' ')[0]}</span>
      </div>
      <div class="res-grid">
        <div class="res-item"><div class="res-item-lbl">Bibit</div><div class="res-item-val">${r.jumlah_bibit || '—'}</div></div>
        <div class="res-item"><div class="res-item-lbl">Kascing</div><div class="res-item-val">${r.kascing ? r.kascing + ' kg' : '—'}</div></div>
        <div class="res-item"><div class="res-item-lbl">Pretreatment</div><div class="res-item-val">${r.pretreatment || '—'}</div></div>
      </div>
      <div class="res-footer">
        <span class="res-days">${isSelesai ? '✓ Selesai' : `📅 Hari ke-${hariKe}`} · ${hariKe} log</span>
        <span class="res-date">${fmtDateShort(r.created_at)}</span>
      </div>
    </div>`;
  }).join('');

  $$('.res-card').forEach(card => {
    card.addEventListener('click', () => openDetail(card.dataset.id));
  });
}

// ══════════════════════════════════════════
//  RENDER DETAIL RESEARCH
// ══════════════════════════════════════════
function openDetail(id) {
  currentResearchId = id;
  const res = getResearch(id);
  if (!res) return;

  setView('view-detail');
  renderDetail();
}

function renderDetail() {
  const res = getResearch(currentResearchId);
  if (!res) return;

  // Update header title
  $('#h-title').textContent = res.nama;

  // Info card
  const isSelesai = res.status === 'selesai';
  $('#detail-info').innerHTML = `
    <div class="detail-info">
      <div class="detail-grid">
        <div class="detail-item"><div class="detail-lbl">Jenis Cacing</div><div class="detail-val">${res.jenis_cacing}</div></div>
        <div class="detail-item"><div class="detail-lbl">Jumlah Bibit</div><div class="detail-val">${res.jumlah_bibit || '—'}</div></div>
        <div class="detail-item"><div class="detail-lbl">Kascing</div><div class="detail-val">${res.kascing ? res.kascing + ' kg' : '—'}</div></div>
        <div class="detail-item"><div class="detail-lbl">Pretreatment</div><div class="detail-val">${res.pretreatment || '—'}</div></div>
      </div>
      <div class="detail-actions">
        <button class="btn btn-sm ${isSelesai ? 'btn-ghost' : 'btn-primary'}" id="btn-toggle-status">
          ${isSelesai ? '🔄 Aktifkan Lagi' : '✓ Tandai Selesai'}
        </button>
        <button class="btn btn-sm btn-danger" id="btn-del-research">🗑 Hapus</button>
      </div>
    </div>`;

  document.getElementById('btn-toggle-status')?.addEventListener('click', () => {
    const res = getResearch(currentResearchId);
    updateResearch(currentResearchId, { status: res.status === 'selesai' ? 'aktif' : 'selesai' });
    renderDetail();
    // Update FAB
    const updatedRes = getResearch(currentResearchId);
    $('#fab').classList.toggle('hidden', updatedRes.status === 'selesai');
    toast(updatedRes.status === 'selesai' ? 'Research ditandai selesai' : 'Research diaktifkan kembali');
  });

  document.getElementById('btn-del-research')?.addEventListener('click', () => {
    if (confirm(`Hapus research "${res.nama}" beserta semua log pengamatannya?`)) {
      deleteResearch(currentResearchId);
      toast('Research dihapus');
      goHome();
    }
  });

  // Render logs (timeline)
  if (res.logs.length === 0) {
    $('#log-list').innerHTML = `<div class="empty" style="padding:24px 0;">
      <p>Belum ada pengamatan harian.<br>${isSelesai ? '' : 'Tap <strong>+</strong> untuk tambah hari pertama.'}</p>
    </div>`;
    return;
  }

  // Tampilkan dari terbaru ke terlama
  const sortedLogs = [...res.logs].sort((a, b) => b.tanggal - a.tanggal);

  $('#log-list').innerHTML = sortedLogs.map(log => `
    <div class="log-item">
      <div class="log-card">
        <div class="log-head">
          <span class="log-hari">Hari ke-${log.hari_ke}</span>
          <span class="log-date">${fmtDateShort(log.tanggal)}</span>
        </div>
        <div class="log-grid">
          <div class="log-item-box"><div class="log-item-lbl">Limbah</div><div class="log-item-val">${log.jumlah_limbah ? log.jumlah_limbah + ' kg' : '—'}</div></div>
          <div class="log-item-box"><div class="log-item-lbl">Foto</div><div class="log-item-val">${log.fotos.length} foto</div></div>
        </div>
        ${log.catatan ? `<div class="log-notes">📝 ${log.catatan}</div>` : ''}
        ${log.fotos.length ? `<div class="log-photos">${log.fotos.map(b => `<img class="log-photo" src="${b}">`).join('')}</div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
          <span style="font-size:10px;color:var(--text3);">${log.synced ? '☁️ Tersimpan di Sheets' : '📱 Lokal'}</span>
          <button class="log-del" data-lid="${log.id}">🗑 Hapus</button>
        </div>
      </div>
    </div>
  `).join('');

  $$('.log-del').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Hapus log hari ini?')) {
        deleteLog(currentResearchId, btn.dataset.lid);
        renderDetail();
        toast('Log dihapus');
      }
    });
  });
}

function goHome() {
  currentResearchId = null;
  setView('view-home');
  renderHome();
}

// ══════════════════════════════════════════
//  RENDER STATISTIK
// ══════════════════════════════════════════
function renderStats() {
  const all = getAllData();
  $('#s-total').textContent = all.length;
  $('#s-aktif').textContent = all.filter(r => r.status === 'aktif').length;
  $('#s-hari').textContent = all.reduce((s, r) => s + r.logs.length, 0);

  const perJenis = {};
  all.forEach(r => { perJenis[r.jenis_cacing] = (perJenis[r.jenis_cacing] || 0) + 1; });
  $('#s-jenis').innerHTML = Object.keys(perJenis).length
    ? Object.entries(perJenis).map(([j, c]) =>
        `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--cream3);font-size:13px;">
          <span style="font-weight:600;">${j}</span>
          <span style="color:var(--text3);">${c} research</span>
        </div>`).join('')
    : '<span style="color:var(--text3);font-size:12px;">Belum ada data</span>';
}

// ══════════════════════════════════════════
//  CONFIG
// ══════════════════════════════════════════
function openConfig() {
  const cfg = getConfig();
  $('#cfg-url').value = cfg.sheetsUrl || '';
  $('#cfg-nama').value = cfg.nama || '';
  $('#cfg-test-result').innerHTML = '';
  setView('view-config');
}

// ══════════════════════════════════════════
//  FOTO HELPER
// ══════════════════════════════════════════
let logPhotosB64 = [];

function renderLogPhotoStrip() {
  const strip = $('#log-photo-strip');
  strip.innerHTML = '';
  logPhotosB64.forEach((b64, i) => {
    const div = document.createElement('div');
    div.className = 'photo-thumb';
    div.innerHTML = `<img src="${b64}"><button class="rm" data-i="${i}">×</button>`;
    div.querySelector('.rm').addEventListener('click', () => { logPhotosB64.splice(i, 1); renderLogPhotoStrip(); });
    strip.appendChild(div);
  });
  const add = document.createElement('div');
  add.className = 'photo-add'; add.id = 'log-photo-add'; add.textContent = '📷';
  add.addEventListener('click', () => $('#log-photo-input').click());
  strip.appendChild(add);
}

// ══════════════════════════════════════════
//  MODAL HELPERS
// ══════════════════════════════════════════
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  // Back button
  $('#h-back').addEventListener('click', goHome);

  // Config button
  $('#btn-config').addEventListener('click', openConfig);

  // Bottom nav
  $$('.bot-nav button[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.view;
      setView(v);
      if (v === 'view-home') renderHome();
      if (v === 'view-stats') renderStats();
    });
  });

  // FAB
  $('#fab').addEventListener('click', () => {
    if (currentView === 'view-home') {
      // Reset form research
      $('#r-nama').value = ''; $('#r-jenis').value = ''; $('#r-jenis-lain').value = '';
      $('#r-bibit').value = ''; $('#r-kascing').value = ''; $('#r-pretreatment').value = ''; $('#r-treat-lain').value = '';
      $('#r-field-jenis-lain').style.display = 'none';
      $('#r-field-treat-lain').style.display = 'none';
      openModal('modal-research');
    } else if (currentView === 'view-detail') {
      // Reset form log
      const res = getResearch(currentResearchId);
      const hariKe = res.logs.length + 1;
      $('#modal-log-title').textContent = `Pengamatan Hari ke-${hariKe}`;
      $('#l-limbah').value = ''; $('#l-catatan').value = '';
      logPhotosB64 = []; renderLogPhotoStrip();
      openModal('modal-log');
    }
  });

  // Close modals
  $$('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });
  $$('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', e => { if (e.target === ov) closeModal(ov.id); });
  });

  // Jenis cacing custom
  $('#r-jenis').addEventListener('change', () => {
    $('#r-field-jenis-lain').style.display = $('#r-jenis').value === 'Lainnya' ? 'block' : 'none';
  });
  $('#r-pretreatment').addEventListener('change', () => {
    $('#r-field-treat-lain').style.display = $('#r-pretreatment').value === 'Lainnya' ? 'block' : 'none';
  });

  // Foto log
  $('#log-photo-input').addEventListener('change', async e => {
    for (const f of Array.from(e.target.files)) logPhotosB64.push(await compressPhoto(f));
    renderLogPhotoStrip();
    e.target.value = '';
  });

  // ── SIMPAN RESEARCH BARU ──
  $('#btn-simpan-research').addEventListener('click', async () => {
    const jenis = $('#r-jenis').value === 'Lainnya' ? $('#r-jenis-lain').value : $('#r-jenis').value;
    const treat = $('#r-pretreatment').value === 'Lainnya' ? $('#r-treat-lain').value : $('#r-pretreatment').value;
    const nama  = $('#r-nama').value.trim();

    if (!nama) { toast('Isi nama research dulu!', true); return; }
    if (!jenis) { toast('Pilih jenis cacing dulu!', true); return; }

    const rec = {
      id: genId(), nama, jenis_cacing: jenis,
      jumlah_bibit: $('#r-bibit').value.trim(),
      kascing: $('#r-kascing').value,
      pretreatment: treat,
      status: 'aktif',
      created_at: Date.now(),
      logs: []
    };

    addResearch(rec);
    closeModal('modal-research');
    toast(`Research "${nama}" dimulai! 🪱`);

    // Sync header research ke Sheets
    const cfg = getConfig();
    if (cfg.sheetsUrl) {
      syncToSheets({ type: 'research', ...rec, foto_count: 0, catatan: '' });
    }

    openDetail(rec.id);
  });

  // ── SIMPAN LOG HARIAN ──
  $('#btn-simpan-log').addEventListener('click', async () => {
    const res = getResearch(currentResearchId);
    if (!res) return;

    const btn = $('#btn-simpan-log');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-sm"></span> Menyimpan...';

    const log = {
      id: genId(),
      tanggal: Date.now(),
      hari_ke: res.logs.length + 1,
      jumlah_limbah: $('#l-limbah').value,
      catatan: $('#l-catatan').value.trim(),
      fotos: [...logPhotosB64],
      synced: false
    };

    addLog(currentResearchId, log);
    closeModal('modal-log');
    renderDetail();

    // Sync ke Sheets
    const syncPayload = {
      type: 'log',
      research_id: currentResearchId,
      research_nama: res.nama,
      jenis_cacing: res.jenis_cacing,
      ...log,
      fotos: [],
      foto_count: log.fotos.length
    };
    const result = await syncToSheets(syncPayload);
    if (result.ok) {
      // Update synced flag
      const all = getAllData();
      const ri = all.findIndex(r => r.id === currentResearchId);
      if (ri !== -1) {
        const li = all[ri].logs.findIndex(l => l.id === log.id);
        if (li !== -1) { all[ri].logs[li].synced = true; saveAllData(all); }
      }
      toast('✓ Tersimpan di Google Sheets!');
    } else {
      toast('Tersimpan lokal' + (result.err ? ` (${result.err})` : ''), !result.ok && result.err !== 'URL belum diconfig');
    }

    renderDetail();
    btn.disabled = false;
    btn.innerHTML = '✓ Simpan Pengamatan';
  });

  // ── CONFIG SAVE ──
  $('#btn-save-config').addEventListener('click', () => {
    const url = $('#cfg-url').value.trim();
    if (!url) { toast('URL tidak boleh kosong!', true); return; }
    saveConfig({ sheetsUrl: url, nama: $('#cfg-nama').value.trim() });
    toast('Config tersimpan!');
    setView('view-home');
    $$('.bot-nav button[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === 'view-home'));
    renderHome();
  });

  // ── TEST KONEKSI ──
  $('#btn-test-conn').addEventListener('click', async () => {
    const url = $('#cfg-url').value.trim();
    if (!url) { toast('Isi URL dulu!', true); return; }
    const btn = $('#btn-test-conn'); btn.disabled = true; btn.textContent = 'Testing...';
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const txt = await r.text();
      $('#cfg-test-result').innerHTML = `<div style="background:var(--success-bg);color:var(--success-tx);padding:8px 12px;border-radius:6px;">✓ Koneksi OK!</div>`;
    } catch (e) {
      $('#cfg-test-result').innerHTML = `<div style="background:var(--warn-bg);color:var(--warn-tx);padding:8px 12px;border-radius:6px;">✗ Gagal: ${e.message}</div>`;
    }
    btn.disabled = false; btn.textContent = '🔗 Test Koneksi';
  });

  // Initial render
  renderHome();
});
