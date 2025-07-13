// Theme Manager for TTS Game
class ThemeManager {
    constructor() {
        this.currentTheme = 'default';
        this.availableThemes = ['default', 'dark', 'colorful', 'minimalist'];
        this.init();
    }

    init() {
        // Load theme from localStorage or Firebase
        this.loadTheme();
        
        // Apply theme on page load
        this.applyTheme(this.currentTheme);
        
        // Listen for theme changes from other tabs/windows
        window.addEventListener('storage', (e) => {
            if (e.key === 'tts-active-theme') {
                this.currentTheme = e.newValue || 'default';
                this.applyTheme(this.currentTheme);
            }
        });
    }

    async loadTheme() {
        try {
            // First try to get from localStorage
            const savedThemes = JSON.parse(localStorage.getItem('tts-themes') || '{}');
            this.currentTheme = savedThemes.activeTheme || 'default';
            
            // Then sync with Firebase if available
            if (window.currentUserId && window.db) {
                const userRef = window.db.collection('users').doc(window.currentUserId);
                const userDoc = await userRef.get();
                
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    if (userData.themes && userData.themes.activeTheme) {
                        this.currentTheme = userData.themes.activeTheme;
                        
                        // Update localStorage
                        const themes = JSON.parse(localStorage.getItem('tts-themes') || '{}');
                        themes.activeTheme = this.currentTheme;
                        localStorage.setItem('tts-themes', JSON.stringify(themes));
                    }
                }
            }
        } catch (error) {
            console.error('Error loading theme:', error);
            this.currentTheme = 'default';
        }
    }

    applyTheme(themeName) {
        if (!this.availableThemes.includes(themeName)) {
            console.warn(`Theme '${themeName}' not available, using default`);
            themeName = 'default';
        }

        // Remove all theme classes
        document.body.classList.remove('theme-dark', 'theme-colorful', 'theme-minimalist');
        
        // Add transition class for smooth theme switching
        document.body.classList.add('theme-transition');
        
        // Apply new theme
        if (themeName !== 'default') {
            document.body.classList.add(`theme-${themeName}`);
        }
        
        this.currentTheme = themeName;
        
        // Remove transition class after animation
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 300);
        
        console.log(`✅ Theme applied: ${themeName}`);
    }

    async setTheme(themeName) {
        if (!this.availableThemes.includes(themeName)) {
            console.error(`Theme '${themeName}' is not available`);
            return false;
        }

        // Check if user owns the theme (except default)
        if (themeName !== 'default') {
            const themes = JSON.parse(localStorage.getItem('tts-themes') || '{}');
            if (!themes[themeName]) {
                console.error(`Theme '${themeName}' is not owned by user`);
                return false;
            }
        }

        try {
            // Apply theme immediately
            this.applyTheme(themeName);
            
            // Save to localStorage
            const themes = JSON.parse(localStorage.getItem('tts-themes') || '{}');
            themes.activeTheme = themeName;
            localStorage.setItem('tts-themes', JSON.stringify(themes));
            
            // Save to Firebase
            if (window.currentUserId && window.db) {
                const userRef = window.db.collection('users').doc(window.currentUserId);
                await userRef.update({
                    'themes.activeTheme': themeName,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            return true;
        } catch (error) {
            console.error('Error setting theme:', error);
            return false;
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getAvailableThemes() {
        const themes = JSON.parse(localStorage.getItem('tts-themes') || '{}');
        const available = ['default']; // Default is always available
        
        if (themes.dark) available.push('dark');
        if (themes.colorful) available.push('colorful');
        if (themes.minimalist) available.push('minimalist');
        
        return available;
    }

    isThemeOwned(themeName) {
        if (themeName === 'default') return true;
        
        const themes = JSON.parse(localStorage.getItem('tts-themes') || '{}');
        return themes[themeName] || false;
    }

    // Create theme selector UI
    createThemeSelector(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container '${containerId}' not found`);
            return;
        }

        const availableThemes = this.getAvailableThemes();
        const themeNames = {
            default: '🎨 Default',
            dark: '🌙 Dark Mode',
            colorful: '🌈 Colorful',
            minimalist: '✨ Minimalist'
        };

        let selectorHTML = '<div class="theme-selector">';
        selectorHTML += '<h3>Pilih Theme:</h3>';
        
        availableThemes.forEach(theme => {
            const isActive = theme === this.currentTheme;
            selectorHTML += `
                <button class="theme-option ${isActive ? 'active' : ''}" 
                        onclick="window.themeManager.setTheme('${theme}')">
                    ${themeNames[theme]}
                </button>
            `;
        });
        
        selectorHTML += '</div>';
        container.innerHTML = selectorHTML;
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// Make ThemeManager available globally
window.ThemeManager = ThemeManager;