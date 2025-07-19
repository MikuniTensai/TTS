# Template Implementasi AdMob untuk Cordova/PhoneGap

Template ini berisi implementasi AdMob yang sudah diperbaiki dan siap pakai untuk proyek Visual Novel atau game Cordova lainnya.

## 📁 Struktur Template

```
admob-template/
├── README.md              # Dokumentasi ini
├── index.html             # Template HTML utama dengan integrasi AdMob
├── js/
│   └── admob.js          # Script AdMob yang sudah diperbaiki
├── css/
│   └── admob-styles.css  # CSS untuk banner AdMob
└── config/
    └── config-example.xml # Contoh konfigurasi plugin
```

## 🚀 Cara Implementasi untuk Proyek Baru

### 1. Install Plugin AdMob
```bash
cordova plugin add emi-indo-cordova-plugin-admob
```

### 2. Konfigurasi config.xml
Tambahkan konfigurasi berikut ke `config.xml`:
```xml
<plugin name="emi-indo-cordova-plugin-admob" spec="^2.3.9" />
```

### 3. Copy File Template
- Copy `index.html` sebagai template dasar (sesuaikan dengan kebutuhan proyek)
- Copy `js/admob.js` ke folder `www/js/` proyek Anda
- Copy CSS dari `css/admob-styles.css` ke file CSS utama Anda
- Sesuaikan ID aplikasi dan unit iklan di `admob.js`

### 4. Integrasi ke HTML
Tambahkan ke `index.html`:
```html
<!-- Di dalam <head> -->
<script src="js/admob.js"></script>

<!-- Di dalam <body> untuk testing -->
<div id="admobTest" class="screen" style="display: none;">
    <!-- UI testing AdMob -->
</div>
```

### 5. Inisialisasi
Panggil fungsi inisialisasi setelah device ready:
```javascript
document.addEventListener('deviceready', function() {
    initializeAdMob();
}, false);
```

## 🔧 Konfigurasi ID Iklan

### Konfigurasi Production (sudah dikonfigurasi):
- App ID: `ca-app-pub-8770525488772470~3355625727`
- Banner ID: `ca-app-pub-8770525488772470/6220783595`
- Interstitial ID: `ca-app-pub-8770525488772470/4187045990`
- Rewarded ID: `ca-app-pub-8770525488772470/7533865266`

### Untuk Testing:
Gunakan ID testing Google jika diperlukan untuk development.

## 📋 File Template yang Disertakan

### 1. `index.html`
- Template HTML lengkap dengan struktur visual novel
- Sudah terintegrasi dengan AdMob Test Menu
- Menyertakan semua elemen UI yang diperlukan
- Path CSS dan JS sudah disesuaikan untuk struktur folder yang rapi

### 2. `js/admob.js`
- Konfigurasi AdMob lengkap dengan ID test
- Fungsi untuk banner, interstitial, dan rewarded ads
- Sistem logging untuk debugging
- Mode simulasi web untuk testing di browser
- Event handling yang komprehensif

### 3. `css/style.css`
- Styling lengkap untuk visual novel
- **Perbaikan khusus untuk AdMob banner**
- Responsive design untuk berbagai ukuran layar
- Styling untuk AdMob Test Menu

## ✅ Fitur yang Sudah Diperbaiki

### 1. Masalah UI Kacau
- ✅ Z-index banner dikurangi dari 9999 ke 100
- ✅ Tinggi banner dibatasi 50px
- ✅ Dialog box disesuaikan posisinya
- ✅ CSS tidak lagi mengganggu layout utama

### 2. Banner AdMob
- ✅ Auto-loading setelah SDK initialized
- ✅ Posisi fixed di bottom
- ✅ Tidak menutupi konten utama
- ✅ Event handling lengkap

### 3. Interstitial & Rewarded Ads
- ✅ Auto-loading setelah inisialisasi
- ✅ Auto-reload setelah ditutup
- ✅ Error handling yang baik
- ✅ Logging untuk debugging

### 4. Debugging & Monitoring
- ✅ Log area untuk monitoring
- ✅ Status display real-time
- ✅ Error tracking
- ✅ Copy log functionality

## 🎯 Fungsi Utama yang Tersedia

### Inisialisasi
- `initializeAdMob()` - Inisialisasi SDK AdMob

### Banner
- `loadBanner()` - Load banner ad
- `showBanner()` - Tampilkan banner
- `hideBanner()` - Sembunyikan banner
- `removeBanner()` - Hapus banner

### Interstitial
- `loadInterstitial()` - Load interstitial ad
- `showInterstitial()` - Tampilkan interstitial

### Rewarded
- `loadRewarded()` - Load rewarded ad
- `showRewarded()` - Tampilkan rewarded ad

### Debugging
- `showAdMobTest()` - Tampilkan UI testing
- `logToAdMob(message)` - Log custom message
- `clearAdMobLog()` - Bersihkan log
- `copyAdMobLog()` - Copy log ke clipboard

## 🛠️ Cara Menggunakan Template

### Untuk Proyek Baru
1. **Salin seluruh folder `admob-template`** ke lokasi proyek baru Anda
2. **Rename folder** sesuai nama proyek
3. **Edit `index.html`**:
   - Ubah title, description, dan meta tags
   - Tambahkan script story Anda
   - Sesuaikan menu dan fitur yang dibutuhkan
4. **Konfigurasi AdMob** di `js/admob.js`:
   - ID produksi sudah dikonfigurasi dengan benar
   - Sesuaikan timing dan frequency iklan sesuai kebutuhan
5. **Customize CSS** di `css/style.css` sesuai tema game Anda

### Untuk Proyek Existing
1. **Backup proyek** Anda terlebih dahulu
2. **Merge file-file template**:
   - Salin fungsi AdMob dari `js/admob.js`
   - Merge CSS AdMob dari `css/style.css`
   - Tambahkan AdMob Test Menu dari `index.html`
3. **Test integrasi** secara bertahap

## 🧪 Testing

### Browser Testing
1. Buka proyek di browser
2. Akses menu "Test AdMob" 
3. Test semua fungsi AdMob
4. Periksa log untuk debugging

### Device Testing
1. Build APK dengan `cordova build android`
2. Install di device Android
3. Test semua jenis iklan
4. Verifikasi tidak ada masalah UI

## 🔍 Mode Testing

### Mode Web Browser
Script akan otomatis masuk mode simulasi jika dijalankan di browser.

### Mode Device
Gunakan UI testing yang tersedia dengan memanggil `showAdMobTest()`.

## 📂 Struktur Folder yang Direkomendasikan

```
your-project/
├── www/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── admob.js
│   │   ├── script.js
│   │   └── assetload.js
│   ├── img/
│   ├── audio/
│   └── story files...
├── config.xml
└── platforms/
```

## 🔧 Tips Maintenance

### Update AdMob SDK
- Periksa update plugin Cordova AdMob secara berkala
- Test compatibility setelah update
- Backup sebelum update major version

### Monitoring Performance
- Monitor crash reports terkait AdMob
- Periksa revenue dan impression di AdMob Console
- Analisis user behavior dengan iklan

### Debugging
- Gunakan AdMob Test Menu untuk troubleshooting
- Periksa log secara berkala
- Test di berbagai device dan OS version

## ⚠️ Catatan Penting

1. **ID Production**: Template sudah dikonfigurasi dengan ID produksi yang benar
2. **Testing**: Gunakan ID testing Google jika diperlukan untuk development
3. **CSS Conflicts**: Pastikan tidak ada CSS yang menggunakan z-index > 100 untuk elemen fixed
4. **Layout**: Banner akan mengambil 50px di bagian bawah layar
5. **Selalu test di device fisik** untuk memastikan iklan berfungsi dengan benar
6. **Monitor performa** aplikasi setelah integrasi AdMob
7. **Backup proyek** sebelum implementasi
8. **Periksa Google Play Policy** terkait iklan dalam aplikasi

## 🐛 Troubleshooting

### Banner Tidak Muncul
1. Cek log di console
2. Pastikan plugin terinstall
3. Cek ID unit iklan
4. Pastikan CSS tidak menyembunyikan banner

### UI Kacau
1. Cek z-index elemen lain
2. Pastikan dialog-box memiliki margin bottom yang cukup
3. Cek CSS conflicts

### Iklan Tidak Load
1. Cek koneksi internet
2. Cek ID aplikasi dan unit iklan
3. Tunggu beberapa saat (iklan test kadang delay)

## 📝 Changelog

### v1.0 (Current)
- ✅ Implementasi dasar AdMob
- ✅ Perbaikan UI conflicts
- ✅ Auto-loading semua jenis iklan
- ✅ Debugging tools
- ✅ Error handling
- ✅ Web simulation mode

---

**Template ini siap pakai dan sudah teruji!** 🎉

Untuk pertanyaan atau masalah, cek bagian troubleshooting atau review log debugging.