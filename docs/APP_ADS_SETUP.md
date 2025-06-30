# Setup app-ads.txt Tanpa Domain Sendiri

## ✅ Berhasil di-setup menggunakan Firebase Hosting

### URL app-ads.txt Anda:
```
https://tts-game-624af.web.app/app-ads.txt
```

### Langkah Selanjutnya:

## 1. Update App Store Listing
Anda perlu menambahkan URL Firebase Hosting sebagai "Developer Website" di:

### Google Play Store:
1. Masuk ke [Google Play Console](https://play.google.com/console)
2. Pilih aplikasi Anda
3. Ke **Store presence** → **Store settings**
4. Di **Store listing contact details**, tambahkan:
   ```
   https://tts-game-624af.web.app
   ```

### Apple App Store (jika ada):
1. Masuk ke App Store Connect
2. Pilih aplikasi Anda
3. Di **App Information**, tambahkan URL di **Marketing URL**:
   ```
   https://tts-game-624af.web.app
   ```

## 2. Verifikasi di AdMob
1. Masuk ke [AdMob Console](https://admob.google.com)
2. Ke **Apps** → **View all apps**
3. Klik tab **app-ads.txt**
4. Klik **Check for updates** untuk meminta AdMob crawl file Anda
5. Tunggu hingga 24 jam untuk verifikasi

## 3. Alternative Gratis Lainnya

Jika tidak ingin menggunakan Firebase, alternatif gratis lainnya:

### GitHub Pages:
1. Buat repository public di GitHub
2. Upload file `app-ads.txt` ke root repository
3. Enable GitHub Pages di Settings
4. URL akan menjadi: `https://username.github.io/repository-name/app-ads.txt`

### Netlify:
1. Daftar di [netlify.com](https://netlify.com)
2. Drag & drop folder berisi `app-ads.txt`
3. Dapatkan URL gratis: `https://random-name.netlify.app/app-ads.txt`

### Vercel:
1. Daftar di [vercel.com](https://vercel.com)
2. Deploy folder berisi `app-ads.txt`
3. URL: `https://project-name.vercel.app/app-ads.txt`

## 4. Maintenance
Jika perlu update file app-ads.txt:
1. Edit file di `public/app-ads.txt`
2. Jalankan: `firebase deploy --only hosting`
3. Request crawl ulang di AdMob

## ⚠️ Penting:
- Pastikan URL yang sama digunakan di semua app store listings
- Tunggu 24 jam setelah update store listing sebelum request crawl AdMob
- File app-ads.txt harus dapat diakses publik (tidak perlu login) 