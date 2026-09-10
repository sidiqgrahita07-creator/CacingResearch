// Google Apps Script - Deploy sebagai Web App
// URL Spreadsheet: ganti dengan ID spreadsheet kamu
const SPREADSHEET_ID = 'GANTI_DENGAN_ID_SPREADSHEET_KAMU';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Data Pengamatan');
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Sheet "Data Pengamatan" tidak ditemukan'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Tambah row baru
    sheet.appendRow([
      new Date(data.tanggal),
      data.jenis_cacing || '',
      data.jumlah_bibit || '',
      data.kascing || '',
      data.pretreatment || '',
      data.jumlah_limbah || '',
      data.foto_paths ? data.foto_paths.length : 0,
      data.catatan || '',
      data.id
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data berhasil disimpan'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'OK',
    message: 'Cacing Research API v1.0'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Setup sheet dengan header (run once)
function setupSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Data Pengamatan');
  
  if (!sheet) {
    sheet = ss.insertSheet('Data Pengamatan');
  }
  
  // Header row
  const headers = [
    'Tanggal',
    'Jenis Cacing',
    'Jumlah Bibit',
    'Kascing (kg)',
    'Pretreatment Pakan',
    'Jumlah Limbah (kg)',
    'Jumlah Foto',
    'Catatan',
    'ID'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // Format kolom
  sheet.setColumnWidth(1, 150); // Tanggal
  sheet.setColumnWidth(2, 120); // Jenis
  sheet.setColumnWidth(3, 120); // Bibit
  sheet.setColumnWidth(4, 100); // Kascing
  sheet.setColumnWidth(5, 200); // Pretreatment
  sheet.setColumnWidth(6, 120); // Limbah
  sheet.setColumnWidth(7, 80);  // Foto
  sheet.setColumnWidth(8, 300); // Catatan
  
  Logger.log('Sheet setup complete!');
}
