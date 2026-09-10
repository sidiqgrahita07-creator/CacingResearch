# 🚀 Setup Google Sheets - QUICK START

## Step 1: Buat Spreadsheet (1 menit)
1. Buka https://sheets.google.com
2. Klik **+ Blank**
3. Rename: **"Cacing Research Data"**
4. Copy **ID** dari URL:
   ```
   https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit
                                          ^^^^^^^^^^^^^^^^^^
                                          INI ID-NYA
   ```

## Step 2: Setup Apps Script (2 menit)
1. Di spreadsheet, klik **Extensions** → **Apps Script**
2. Hapus kode default
3. Copy isi file `google-apps-script/Code.gs` dari GitHub
4. **GANTI BARIS 3:**
   ```javascript
   const SPREADSHEET_ID = 'PASTE_ID_TADI_DISINI';
   ```
5. **CTRL+S** (save)

## Step 3: Jalankan Setup (1 menit)
1. Di Apps Script, dropdown pilih **setupSheet**
2. Klik **▶ Run**
3. Popup minta permission → **Review permissions** → pilih akun → **Allow**
4. Tunggu sampai log bilang "Sheet setup complete!"
5. Cek spreadsheet → ada sheet baru "Data Pengamatan" dengan header

## Step 4: Deploy Web App (1 menit)
1. Klik **Deploy** → **New deployment**
2. Klik ⚙️ → pilih **Web app**
3. Setting:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. **Deploy**
5. **COPY URL** yang muncul (panjang, akhiran `/exec`)

## Step 5: Paste URL ke APK
1. Buka file ini:
   ```
   app/src/main/java/com/instech/cacingresearch/data/SheetsConfig.kt
   ```
2. Ganti:
   ```kotlin
   const val SHEETS_API_URL = "PASTE_URL_WEB_APP_DISINI"
   ```
   Jadi:
   ```kotlin
   const val SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbz.../exec"
   ```

## Step 6: Build APK Baru
```bash
cd "C:/Project AI Agents/Cacing/CacingResearch"
./gradlew.bat assembleDebug
```

## Step 7: Test!
1. Install APK
2. Tambah pengamatan
3. Cek spreadsheet → **DATA LANGSUNG MUNCUL!** ✨

---

**KALAU BINGUNG:** Bilang di step mana stuck, aku bantu!
