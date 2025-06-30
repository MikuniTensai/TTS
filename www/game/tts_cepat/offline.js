// Offline functionality and caching system
class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.offlineIndicator = document.getElementById('offline-indicator');
        this.cachedLevels = new Set();
        this.init();
    }

    init() {
        // Register service worker for caching
        if ('serviceWorker' in navigator) {
            this.registerServiceWorker();
        }

        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.hideOfflineIndicator();
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showOfflineIndicator();
        });

        // Check initial state
        if (!this.isOnline) {
            this.showOfflineIndicator();
        }

        // Preload essential data
        this.preloadEssentialData();
    }

    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registered:', registration);
        } catch (error) {
            console.log('Service Worker registration failed:', error);
        }
    }

    showOfflineIndicator() {
        if (this.offlineIndicator) {
            this.offlineIndicator.classList.add('show');
        }
    }

    hideOfflineIndicator() {
        if (this.offlineIndicator) {
            this.offlineIndicator.classList.remove('show');
        }
    }

    async preloadEssentialData() {
        // Cache first 5 levels for offline play
        for (let i = 1; i <= 5; i++) {
            try {
                const response = await fetch(`levels/level_${String(i).padStart(6, '0')}.json`);
                if (response.ok) {
                    const levelData = await response.json();
                    this.cacheLevelData(i, levelData);
                    this.cachedLevels.add(i);
                }
            } catch (error) {
                console.log(`Failed to cache level ${i}:`, error);
            }
        }
    }

    cacheLevelData(levelId, data) {
        const cacheKey = `tts-level-${levelId}`;
        localStorage.setItem(cacheKey, JSON.stringify(data));
    }

    getCachedLevelData(levelId) {
        const cacheKey = `tts-level-${levelId}`;
        const cached = localStorage.getItem(cacheKey);
        return cached ? JSON.parse(cached) : null;
    }

    async loadLevel(levelId) {
        // Try to load from network first
        if (this.isOnline) {
            try {
                const response = await fetch(`levels/level_${String(levelId).padStart(6, '0')}.json`);
                if (response.ok) {
                    const levelData = await response.json();
                    this.cacheLevelData(levelId, levelData);
                    return levelData;
                }
            } catch (error) {
                console.log('Network request failed, trying cache:', error);
            }
        }

        // Fallback to cache
        const cachedData = this.getCachedLevelData(levelId);
        if (cachedData) {
            return cachedData;
        }

        throw new Error(`Level ${levelId} not available offline`);
    }

    syncOfflineData() {
        // Sync any offline progress when back online
        const offlineProgress = JSON.parse(localStorage.getItem('tts-offline-progress') || '[]');
        
        if (offlineProgress.length > 0) {
            // Here you could send progress to a server
            console.log('Syncing offline progress:', offlineProgress);
            
            // Clear offline progress after sync
            localStorage.removeItem('tts-offline-progress');
        }
    }

    saveOfflineProgress(levelId, score, completedWords) {
        const progress = JSON.parse(localStorage.getItem('tts-offline-progress') || '[]');
        progress.push({
            levelId,
            score,
            completedWords,
            timestamp: Date.now()
        });
        localStorage.setItem('tts-offline-progress', JSON.stringify(progress));
    }

    isLevelCached(levelId) {
        return this.cachedLevels.has(levelId) || this.getCachedLevelData(levelId) !== null;
    }

    getAvailableOfflineLevels() {
        const levels = [];
        // Only check first 100 levels (15000 files exist but only 100 are active)
        for (let i = 1; i <= 100; i++) {
            if (this.isLevelCached(i)) {
                levels.push(i);
            }
        }
        return levels;
    }
}

// Progressive Web App features
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.init();
    }

    init() {
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.hideInstallButton();
            this.deferredPrompt = null;
        });
    }

    showInstallButton() {
        // Create install button if it doesn't exist
        if (!document.getElementById('install-button')) {
            const installButton = document.createElement('button');
            installButton.id = 'install-button';
            installButton.textContent = '📱 Install App';
            installButton.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: var(--theme-button);
                color: var(--theme-buttonText);
                border: none;
                padding: 12px 16px;
                border-radius: 25px;
                font-weight: bold;
                cursor: pointer;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                animation: bounce 2s infinite;
            `;
            
            installButton.addEventListener('click', () => this.installApp());
            document.body.appendChild(installButton);
        }
    }

    hideInstallButton() {
        const installButton = document.getElementById('install-button');
        if (installButton) {
            installButton.remove();
        }
    }

    async installApp() {
        if (!this.deferredPrompt) return;

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        
        this.deferredPrompt = null;
        this.hideInstallButton();
    }
}

// Category and progression system
class CategoryManager {
    constructor() {
        // Only organize first 100 levels (15000 files exist but only 100 are active)
        this.categories = {
            'pemula': {
                name: 'Pemula',
                description: 'Kata-kata dasar untuk pemula',
                levels: Array.from({length: 25}, (_, i) => i + 1), // Levels 1-25
                unlocked: true
            },
            'dasar': {
                name: 'Dasar',
                description: 'Kata-kata dasar sehari-hari',
                levels: Array.from({length: 25}, (_, i) => i + 26), // Levels 26-50
                unlocked: false,
                requirement: 10 // Need to complete 10 levels from pemula
            },
            'menengah': {
                name: 'Menengah',
                description: 'Kata-kata yang lebih menantang',
                levels: Array.from({length: 25}, (_, i) => i + 51), // Levels 51-75
                unlocked: false,
                requirement: 30 // Need to complete 30 levels total
            },
            'lanjut': {
                name: 'Lanjut',
                description: 'Kata-kata tingkat lanjut',
                levels: Array.from({length: 25}, (_, i) => i + 76), // Levels 76-100
                unlocked: false,
                requirement: 60 // Need to complete 60 levels total
            }
        };
    }

    getCategoryForLevel(levelId) {
        for (const [key, category] of Object.entries(this.categories)) {
            if (category.levels.includes(levelId)) {
                return { key, ...category };
            }
        }
        return null;
    }

    updateCategoryUnlocks() {
        const completedLevels = JSON.parse(localStorage.getItem('tts-completed-levels') || '[]');
        
        // Unlock dasar if 10+ pemula levels completed
        const pemulaCompleted = completedLevels.filter(level => level <= 25).length;
        if (pemulaCompleted >= 10) {
            this.categories.dasar.unlocked = true;
        }
        
        // Unlock menengah if 30+ total levels completed
        if (completedLevels.length >= 30) {
            this.categories.menengah.unlocked = true;
        }
        
        // Unlock lanjut if 60+ total levels completed
        if (completedLevels.length >= 60) {
            this.categories.lanjut.unlocked = true;
        }
    }

    getAvailableCategories() {
        this.updateCategoryUnlocks();
        return Object.entries(this.categories).map(([key, category]) => ({
            key,
            ...category
        }));
    }
}

// Export managers
window.OfflineManager = OfflineManager;
window.PWAManager = PWAManager;
window.CategoryManager = CategoryManager;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.offlineManager = new OfflineManager();
    window.pwaManager = new PWAManager();
    window.categoryManager = new CategoryManager();
}); 