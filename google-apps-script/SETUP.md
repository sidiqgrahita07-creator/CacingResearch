# Setup Google Sheets Database

## 📝 Langkah Setup (5 menit)

### 1. Buat Google Spreadsheet Baru
1. Buka https://sheets.google.com
2. Klik **+ Blank** (spreadsheet kosong)
3. Rename jadi **"Cacing Research Data"**
4. Copy **ID spreadsheet** dari URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_NYA/edit
   ```
   Contoh: `1a2b3c4d5e6f7g8h9i0j`

### 2. Buka Apps Script
1. Di spreadsheet, klik **Extensions** → **Apps Script**
2. Hapus kode default `function myFunction()`
3. Copy-paste isi file `Code.gs` dari folder ini
4. **Ganti baris 3:** 
   ```javascript
   const SPREADSHEET_ID = 'PASTE_ID_SPREADSHEET_KAMU_DISINI';
   ```

### 3. Setup Header Sheet
1. Di Apps Script editor, pilih function **setupSheet** di dropdown
2. Klik **▶ Run**
3. Kasih permission (klik **Review permissions** → pilih akun Google → **Allow**)
4. Tunggu sampai selesai (check **Execution log** - ada tulisan "Sheet setup complete!")

### 4. Deploy Web App
1. Klik **Deploy** → **New deployment**
2. Klik ⚙️ (gear icon) → pilih **Web app**
3. Setting:
   - **Description:** `Cacing Research API v1`
   - **Execute as:** Me (email kamu)
   - **Who has access:** Anyone
4. Klik **Deploy**
5. **Copy URL Web App** yang muncul (panjang, diakhiri `/exec`)
   ```
   https://script.google.com/macros/s/AKfycbz.../exec
   ```

### 5. Paste URL ke APK Config
1. Buka file `app/src/main/java/com/instech/cacingresearch/data/SheetsConfig.kt`
2. Paste URL Web App di baris:
   ```kotlin
   const val SHEETS_API_URL = "PASTE_URL_WEB_APP_DISINI"
   ```

### 6. Rebuild APK
```bash
cd "C:/Project AI Agents/Cacing/CacingResearch"
./gradlew.bat assembleDebug
```

---

## ✅ Testing

1. Install APK baru
2. Buka app, tambah pengamatan
3. Cek spreadsheet → data langsung muncul!

---

## 🔒 Security Note

URL Web App ini **public** tapi hanya terima POST dari APK kamu. Jangan share URL ke orang lain.

Kalau mau private (butuh API key), edit Apps Script tambah validasi token.

---

## 📊 Format Data di Spreadsheet

| Tanggal | Jenis Cacing | Jumlah Bibit | Kascing (kg) | Pretreatment Pakan | Jumlah Limbah (kg) | Jumlah Foto | Catatan | ID |
|---------|--------------|--------------|--------------|-------------------|-------------------|-------------|---------|-----|
| 10/09/2026 14:30 | BSF | 1000 ekor | 5.5 | Fermentasi 3 hari | 10.5 | 2 | Normal | uuid-123 |

---

## 🛠️ Troubleshooting

**Error "Sheet tidak ditemukan":**
- Pastikan sudah run `setupSheet()`
- Cek nama sheet harus **"Data Pengamatan"** (exact match)

**Data tidak masuk:**
- Test URL dengan browser (harus muncul `{"status":"OK"...}`)
- Cek Apps Script **Executions** log untuk error
- Pastikan spreadsheet ID di `Code.gs` sudah benar

**Permission denied:**
- Re-deploy: Klik **Deploy** → **Manage deployments** → **Edit** → **Deploy**
