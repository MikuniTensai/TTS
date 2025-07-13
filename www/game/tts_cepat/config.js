// TTS Game Configuration
const TTS_CONFIG = {
    // Level Management
    TOTAL_LEVELS_AVAILABLE: 15000,  // Total level files that exist
    ACTIVE_LEVELS: 100,             // Currently active/playable levels
    
    // Performance Settings
    CACHE_LEVELS: 100,              // Number of levels to cache in service worker
    
    // Game Settings
    DEFAULT_THEME: 'classic',
    ENABLE_SOUND: true,
    ENABLE_ANIMATIONS: true,
    
    // Performance and Caching
    DOM_CACHE_DURATION: 1000,      // DOM element cache duration in ms
    RETRY_DELAY: 3000,              // Auto-retry delay in ms
    NOTIFICATION_DURATION: 3000,    // Notification display duration in ms
    LOADING_OVERLAY_DELAY: 500,     // Delay before showing loading overlay
    
    // Input Validation
    MIN_WORD_LENGTH: 3,             // Minimum word length for KBBI check
    MAX_SCORE_VALUE: 999999,        // Maximum allowed score value
    MIN_LEVEL_ID: 1,                // Minimum valid level ID
    
    // Error Handling
    MAX_RETRY_ATTEMPTS: 3,          // Maximum retry attempts for failed operations
    FIREBASE_TIMEOUT: 10000,        // Firebase operation timeout in ms
    STORAGE_ERROR_FALLBACK: true,   // Enable fallback for localStorage errors
    
    // Category Settings
    CATEGORIES: {
        pemula: {
            name: 'Pemula',
            description: 'Kata-kata dasar untuk pemula',
            levelRange: [1, 25],
            unlocked: true
        },
        dasar: {
            name: 'Dasar', 
            description: 'Kata-kata dasar sehari-hari',
            levelRange: [26, 50],
            requirement: 10
        },
        menengah: {
            name: 'Menengah',
            description: 'Kata-kata yang lebih menantang',
            levelRange: [51, 75],
            requirement: 30
        },
        lanjut: {
            name: 'Lanjut',
            description: 'Kata-kata tingkat lanjut',
            levelRange: [76, 100],
            requirement: 60
        }
    },
    
    // Future expansion settings
    EXPANSION_READY: true,          // Ready to activate more levels
    NEXT_EXPANSION_TARGET: 200,     // Next target for level expansion
    
    // Admin functions
    expandLevels: function(newCount) {
        if (newCount <= this.TOTAL_LEVELS_AVAILABLE) {
            this.ACTIVE_LEVELS = newCount;
            console.log(`Levels expanded to ${newCount}`);
            return true;
        }
        return false;
    },
    
    getActiveLevelCount: function() {
        return this.ACTIVE_LEVELS;
    },
    
    getTotalLevelCount: function() {
        return this.TOTAL_LEVELS_AVAILABLE;
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TTS_CONFIG;
} else if (typeof window !== 'undefined') {
    window.TTS_CONFIG = TTS_CONFIG;
}