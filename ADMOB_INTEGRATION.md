# AdMob Integration untuk TTS Game

## Implementasi yang Telah Ditambahkan

### 1. File yang Dimodifikasi/Ditambahkan:
- `www/js/admob.js` - Script utama untuk mengelola AdMob
- `www/index.html` - Ditambahkan script admob.js dan modifikasi tombol Play
- `config.xml` - Ditambahkan plugin AdMob dan dependensinya

### 2. Fitur yang Diimplementasikan:
- **Interstitial Ad pada Main Menu**: Iklan akan muncul ketika user menekan tombol "Play" di main menu
- **Auto-initialization**: AdMob akan otomatis diinisialisasi saat aplikasi dimulai
- **Web Simulation Mode**: Untuk testing di browser tanpa plugin Cordova
- **Auto-reload**: Iklan akan otomatis dimuat ulang setelah ditampilkan

### 3. Konfigurasi AdMob:
```javascript
const ADMOB_CONFIG = {
    APP_ID: 'ca-app-pub-8770525488772470~3355625727',
    BANNER_ID: 'ca-app-pub-8770525488772470/6220783595',
    INTERSTITIAL_ID: 'ca-app-pub-8770525488772470/4187045990',
    REWARDED_ID: 'ca-app-pub-8770525488772470/7533865266'
};
```

### 4. Plugin yang Diperlukan:
- `emi-indo-cordova-plugin-admob` - Plugin utama AdMob
- `cordova-plugin-statusbar` - Untuk mengatur status bar
- `cordova-plugin-device` - Plugin device info

### 5. Cara Kerja:
1. Saat aplikasi dimulai, AdMob akan otomatis diinisialisasi
2. Interstitial ad akan dimuat di background
3. Ketika user menekan tombol "Play", iklan akan ditampilkan
4. Setelah iklan selesai/ditutup, user akan diarahkan ke level-select.html
5. Iklan baru akan otomatis dimuat untuk penggunaan berikutnya

### 6. Testing:
- **Di Browser**: Mode simulasi akan aktif, log akan muncul di console
- **Di Device**: Plugin AdMob akan berfungsi penuh dengan iklan asli

### 7. Logging:
Semua aktivitas AdMob akan dicatat di console dengan prefix "AdMob:" untuk memudahkan debugging.

### 8. Build Instructions:
Untuk build aplikasi dengan AdMob:
```bash
cordova platform add android
cordova plugin add emi-indo-cordova-plugin-admob
cordova plugin add cordova-plugin-statusbar
cordova plugin add cordova-plugin-device
cordova build android
```

### 9. Catatan Penting:
- ID AdMob yang digunakan adalah ID production yang sudah ada
- Mode testing diaktifkan untuk development
- Iklan akan muncul setiap kali user menekan "Play" dari main menu
- Implementasi ini mengikuti best practices untuk user experience