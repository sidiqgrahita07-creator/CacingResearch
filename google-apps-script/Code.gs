// Google Apps Script - Cacing Research API
const SPREADSHEET_ID = '1P924bH-iwOSimCRj5bbJA_QFpKGf9WhEuDZyxtXEbhU';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (data.type === 'research') {
      // Simpan ke sheet "Research"
      const sheet = ss.getSheetByName('Research');
      if (!sheet) return jsonResp(false, 'Sheet "Research" tidak ditemukan');
      sheet.appendRow([
        new Date(data.created_at),
        data.nama,
        data.jenis_cacing,
        data.jumlah_bibit,
        data.kascing,
        data.pretreatment,
        'Aktif',
        data.id
      ]);
    } else if (data.type === 'log') {
      // Simpan ke sheet "Log Harian"
      const sheet = ss.getSheetByName('Log Harian');
      if (!sheet) return jsonResp(false, 'Sheet "Log Harian" tidak ditemukan');
      sheet.appendRow([
        new Date(data.tanggal),
        data.research_nama,
        data.jenis_cacing,
        data.hari_ke,
        data.jumlah_limbah,
        data.foto_count || 0,
        data.catatan,
        data.research_id,
        data.id
      ]);
    }

    return jsonResp(true, 'Data berhasil disimpan');
  } catch (err) {
    return jsonResp(false, err.toString());
  }
}

function doGet(e) {
  return jsonResp(true, 'Cacing Research API v2.0');
}

function jsonResp(success, message) {
  return ContentService
    .createTextOutput(JSON.stringify({ success, message }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Jalankan sekali untuk setup sheet
function setupSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Sheet: Research
  let s1 = ss.getSheetByName('Research');
  if (!s1) s1 = ss.insertSheet('Research');
  s1.getRange(1, 1, 1, 8).setValues([[
    'Tanggal Mulai', 'Nama Research', 'Jenis Cacing',
    'Jumlah Bibit', 'Kascing (kg)', 'Pretreatment', 'Status', 'ID'
  ]]);
  s1.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#1B2B4B').setFontColor('#FFFFFF');
  s1.setFrozenRows(1);
  s1.setColumnWidths(1, 8, 150);

  // Sheet: Log Harian
  let s2 = ss.getSheetByName('Log Harian');
  if (!s2) s2 = ss.insertSheet('Log Harian');
  s2.getRange(1, 1, 1, 9).setValues([[
    'Tanggal', 'Nama Research', 'Jenis Cacing',
    'Hari ke-', 'Limbah (kg)', 'Jumlah Foto', 'Catatan', 'Research ID', 'Log ID'
  ]]);
  s2.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#1B2B4B').setFontColor('#FFFFFF');
  s2.setFrozenRows(1);
  s2.setColumnWidths(1, 9, 140);
  s2.setColumnWidth(7, 300);

  Logger.log('Setup selesai! 2 sheet dibuat: Research + Log Harian');
}
