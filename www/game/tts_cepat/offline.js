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
        for (let i = 1; i <= 15; i++) {
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
        this.categories = {
            'basic': {
                name: 'Dasar',
                description: 'Kata-kata dasar sehari-hari',
                levels: [1, 2, 3, 4, 5],
                unlocked: true
            },
            'intermediate': {
                name: 'Menengah',
                description: 'Kata-kata yang lebih menantang',
                levels: [6, 7, 8, 9, 10],
                unlocked: false,
                requirement: 3 // Need to complete 3 levels from basic
            },
            'advanced': {
                name: 'Lanjut',
                description: 'Kata-kata tingkat lanjut',
                levels: [11, 12, 13, 14, 15],
                unlocked: false,
                requirement: 7 // Need to complete 7 levels total
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
        
        // Unlock intermediate if 3+ basic levels completed
        const basicCompleted = completedLevels.filter(level => level <= 5).length;
        if (basicCompleted >= 3) {
            this.categories.intermediate.unlocked = true;
        }
        
        // Unlock advanced if 7+ total levels completed
        if (completedLevels.length >= 7) {
            this.categories.advanced.unlocked = true;
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