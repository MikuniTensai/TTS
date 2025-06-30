# Level Expansion Guide - TTS Game

## Overview
Game TTS saat ini memiliki **15,000 level files** yang tersimpan, tetapi hanya **100 level pertama** yang aktif untuk gameplay. Panduan ini menjelaskan cara mengaktifkan lebih banyak level di masa depan.

## Current Status
- **Total Level Files**: 15,000 (level_000001.json - level_015000.json)
- **Active Levels**: 100 (level 1-100)
- **Ready for Expansion**: 14,900 level siap diaktifkan

## Files to Modify for Level Expansion

### 1. Level Selection Page
**File**: `www/level-select.html`
```javascript
// Ubah nilai maxLevels
const maxLevels = 100; // Ganti dengan jumlah level yang diinginkan
```

### 2. Service Worker
**File**: `www/game/tts_cepat/sw.js`
```javascript
// Update cache name dan jumlah level
const CACHE_NAME = 'tts-game-v5'; // Increment version
for (let i = 1; i <= 200; i++) { // Ganti 200 dengan target level
    const levelNumber = i.toString().padStart(6, '0');
    levelFiles.push(`./levels/level_${levelNumber}.json`);
}
```

### 3. Offline Manager
**File**: `www/game/tts_cepat/offline.js`
```javascript
// Update getAvailableOfflineLevels function
for (let i = 1; i <= 200; i++) { // Ganti dengan target level
    if (this.isLevelCached(i)) {
        levels.push(i);
    }
}
```

### 4. Configuration File
**File**: `www/game/tts_cepat/config.js`
```javascript
// Update ACTIVE_LEVELS
ACTIVE_LEVELS: 200, // Ganti dengan jumlah level yang diinginkan
CACHE_LEVELS: 200,  // Update cache count
```

## Expansion Scenarios

### Scenario 1: Expand to 200 Levels
```javascript
// level-select.html
const maxLevels = 200;

// sw.js
const CACHE_NAME = 'tts-game-v5';
for (let i = 1; i <= 200; i++) { ... }

// offline.js
for (let i = 1; i <= 200; i++) { ... }

// config.js
ACTIVE_LEVELS: 200,
CACHE_LEVELS: 200,
```

### Scenario 2: Expand to 500 Levels
```javascript
// level-select.html
const maxLevels = 500;

// sw.js
const CACHE_NAME = 'tts-game-v6';
for (let i = 1; i <= 500; i++) { ... }

// offline.js
for (let i = 1; i <= 500; i++) { ... }

// config.js
ACTIVE_LEVELS: 500,
CACHE_LEVELS: 100, // Pertimbangkan tetap 100 untuk performa
```

### Scenario 3: Expand to 1000+ Levels
```javascript
// level-select.html
const maxLevels = 1000;

// sw.js - PENTING: Jangan cache semua level untuk performa
const CACHE_NAME = 'tts-game-v7';
for (let i = 1; i <= 100; i++) { ... } // Tetap cache 100 pertama

// offline.js
for (let i = 1; i <= 1000; i++) { ... }

// config.js
ACTIVE_LEVELS: 1000,
CACHE_LEVELS: 100, // Tetap 100 untuk performa optimal
```

## Category System Updates

Untuk ekspansi level, perlu update kategori di `offline.js`:

### For 200 Levels
```javascript
this.categories = {
    'pemula': { levels: Array.from({length: 50}, (_, i) => i + 1) },      // 1-50
    'dasar': { levels: Array.from({length: 50}, (_, i) => i + 51) },      // 51-100
    'menengah': { levels: Array.from({length: 50}, (_, i) => i + 101) },  // 101-150
    'lanjut': { levels: Array.from({length: 50}, (_, i) => i + 151) }     // 151-200
};
```

### For 500 Levels
```javascript
this.categories = {
    'pemula': { levels: Array.from({length: 100}, (_, i) => i + 1) },     // 1-100
    'dasar': { levels: Array.from({length: 100}, (_, i) => i + 101) },    // 101-200
    'menengah': { levels: Array.from({length: 100}, (_, i) => i + 201) }, // 201-300
    'lanjut': { levels: Array.from({length: 100}, (_, i) => i + 301) },   // 301-400
    'ahli': { levels: Array.from({length: 100}, (_, i) => i + 401) }      // 401-500
};
```

## Performance Considerations

### Cache Strategy
- **100-500 levels**: Cache semua level di service worker
- **500-1000 levels**: Cache hanya 100-200 level pertama
- **1000+ levels**: Cache maksimal 100 level untuk performa optimal

### UI Performance
- **100-200 levels**: Render semua level button
- **200-500 levels**: Pertimbangkan pagination atau lazy loading
- **500+ levels**: Implementasi virtual scrolling atau pagination

### Memory Management
- **Monitoring**: Pantau penggunaan memory browser
- **Optimization**: Gunakan lazy loading untuk level tinggi
- **Caching**: Batasi cache sesuai kebutuhan

## Step-by-Step Expansion Process

### 1. Planning Phase
- Tentukan target jumlah level
- Rencanakan kategori baru
- Evaluasi kebutuhan performa

### 2. Implementation Phase
- Update `config.js` terlebih dahulu
- Modify `level-select.html`
- Update `sw.js` dengan cache strategy yang tepat
- Modify `offline.js`
- Update category system

### 3. Testing Phase
- Test performa loading
- Verify level navigation
- Check cache behavior
- Test offline functionality

### 4. Deployment Phase
- Increment service worker version
- Clear browser cache
- Monitor performance metrics

## Quick Expansion Commands

### Expand to 200 Levels
```bash
# Update files dengan find & replace
# level-select.html: maxLevels = 200
# sw.js: CACHE_NAME = 'tts-game-v5', loop to 200
# offline.js: loop to 200
# config.js: ACTIVE_LEVELS = 200
```

### Expand to 500 Levels
```bash
# Similar process but with performance optimizations
# Keep cache limited to first 100-200 levels
```

## Important Notes

1. **Service Worker Version**: Selalu increment version saat update
2. **Cache Limits**: Jangan cache terlalu banyak level sekaligus
3. **Performance**: Monitor performa setelah ekspansi
4. **User Experience**: Pertimbangkan pagination untuk level tinggi
5. **Testing**: Test di berbagai device dan connection speed

## Future Considerations

- **Dynamic Loading**: Implementasi loading level on-demand
- **Progressive Enhancement**: Load level secara bertahap
- **Category Management**: Sistem kategori yang lebih fleksibel
- **Performance Monitoring**: Real-time performance tracking

## Emergency Rollback

Jika ekspansi menyebabkan masalah performa:
1. Revert `maxLevels` ke nilai sebelumnya
2. Increment service worker version
3. Clear browser cache
4. Monitor recovery

---

**Last Updated**: December 2024  
**Current Version**: 15,000 level files, 100 active levels  
**Next Recommended Expansion**: 200 levels 