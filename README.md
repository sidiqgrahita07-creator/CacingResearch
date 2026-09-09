# Cacing Research - APK Input Data Riset Cacing ANC

APK Android untuk input dan monitoring data riset cacing ANC (budidaya maggot BSF).

## 📱 Fitur

### 1. Tambah Pengamatan Baru
Form lengkap dengan field:
- **Jenis Cacing** (contoh: BSF, ANC)
- **Jumlah Bibit** (ekor)
- **Kascing** (kg)
- **Pretreatment Pakan** (metode preparasi)
- **Jumlah Limbah Masuk** (kg)
- **Foto Dokumentasi** (multi foto dari kamera/galeri)
- **Catatan** pengamatan harian

### 2. Daftar Pengamatan
- List semua pengamatan dengan tanggal
- Info lengkap: bibit, kascing, limbah, jumlah foto
- Hapus data dengan konfirmasi
- Data tersimpan lokal (JSON)

### 3. Statistik
- Total pengamatan
- Total limbah masuk (kg)
- Breakdown per jenis cacing

## 🔧 Teknologi
- **Kotlin** + **Jetpack Compose**
- **Material Design 3**
- **Coil** untuk image loading
- **Gson** untuk JSON storage
- **FileProvider** untuk camera/gallery
- Simpan data lokal: `pengamatan_data.json`

## 📦 Build

```bash
cd "C:/Project AI Agents/Cacing/CacingResearch"
./gradlew.bat assembleDebug
```

APK output: `app/build/outputs/apk/debug/app-debug.apk`

## 🎨 UI Style
- Warna hijau (#4CAF50) - tema cacing/organik
- Clean Material Design
- Form dialog full-screen
- Tab navigation

## 📸 Permission
- `READ_MEDIA_IMAGES` (Android 13+)
- `READ_EXTERNAL_STORAGE` (Android 12 ke bawah)
- `CAMERA` (opsional, untuk ambil foto)

## 🔐 Package
`com.instech.cacingresearch`

## 📄 Data Model

```kotlin
{
  "id": "uuid",
  "tanggal": 1234567890,
  "jenis_cacing": "BSF",
  "jumlah_bibit": "1000 ekor",
  "kascing": "5.5",
  "pretreatment": "Fermentasi 3 hari",
  "jumlah_limbah": "10.5",
  "foto_paths": ["/path/photo1.jpg"],
  "catatan": "Pertumbuhan normal"
}
```

## 🚀 Development Notes

- **minSdk 26**, **targetSdk 34**
- Gradle 8.4, AGP 8.2.2, Kotlin 1.9.20
- Java 8 target (hindari jlink error JDK 21)
- Storage: `context.filesDir` (private app data)
- Icon: Adaptive icon hijau dengan vector foreground

---
**Dibuat untuk**: PT Instech Solusi Nusantara  
**Versi**: 1.0  
**Build Date**: September 2026
