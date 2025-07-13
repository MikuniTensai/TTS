// Theme system for visual customization
const THEMES = {
    default: {
        name: "Default",
        colors: {
            background: "#f0f8ff",
            gridBackground: "#e0e0e0",
            gridBorder: "#ccc",
            letterBox: "#fff",
            letterBoxBorder: "#999",
            revealedBox: "#4CAF50",
            letterTile: "#4a90e2",
            letterTileUsed: "#666",
            letterTileText: "#fff",
            foundWord: "#4CAF50",
            currentWord: "#333",
            button: "#4a90e2",
            buttonText: "#fff",
            text: "#333"
        },
        fonts: {
            primary: "Arial, sans-serif",
            size: "1em"
        }
    },
    dark: {
        name: "Dark Mode",
        colors: {
            background: "#1a1a1a",
            gridBackground: "#2d2d2d",
            gridBorder: "#555",
            letterBox: "#3a3a3a",
            letterBoxBorder: "#666",
            revealedBox: "#2E7D32",
            letterTile: "#2c5aa0",
            letterTileUsed: "#444",
            letterTileText: "#fff",
            foundWord: "#2E7D32",
            currentWord: "#fff",
            button: "#2c5aa0",
            buttonText: "#fff",
            text: "#fff"
        },
        fonts: {
            primary: "Arial, sans-serif",
            size: "1em"
        }
    },
    colorful: {
        name: "Colorful",
        colors: {
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            gridBackground: "rgba(255,255,255,0.9)",
            gridBorder: "#8a2be2",
            letterBox: "#fff",
            letterBoxBorder: "#ff6b6b",
            revealedBox: "#FF9800",
            letterTile: "#ff6b6b",
            letterTileUsed: "#868e96",
            letterTileText: "#fff",
            foundWord: "#FF9800",
            currentWord: "#495057",
            button: "#ff6b6b",
            buttonText: "#fff",
            text: "#495057"
        },
        fonts: {
            primary: "Arial, sans-serif",
            size: "1em"
        }
    },
    minimalist: {
        name: "Minimalist",
        colors: {
            background: "#fafafa",
            gridBackground: "#ffffff",
            gridBorder: "#e0e0e0",
            letterBox: "#ffffff",
            letterBoxBorder: "#d0d0d0",
            revealedBox: "#E0E0E0",
            letterTile: "#757575",
            letterTileUsed: "#bdbdbd",
            letterTileText: "#ffffff",
            foundWord: "#E0E0E0",
            currentWord: "#424242",
            button: "#757575",
            buttonText: "#ffffff",
            text: "#424242"
        },
        fonts: {
            primary: "Arial, sans-serif",
            size: "1em"
        }
    }
};

// Theme management
class ThemeManager {
    constructor() {
        this.ownedThemes = { default: true }; // Only default theme is free
        this.loadOwnedThemes();
        this.currentTheme = this.loadTheme();
        this.applyTheme(this.currentTheme);
    }

    async loadOwnedThemes() {
        try {
            // Load from localStorage first
            const localThemes = localStorage.getItem('tts-themes');
            if (localThemes) {
                const themes = JSON.parse(localThemes);
                this.ownedThemes = {
                    default: true,
                    dark: themes.dark || false,
                    colorful: themes.colorful || false,
                    minimalist: themes.minimalist || false
                };
            }

            // Load from Firebase if available
            if (window.getCurrentUserData) {
                const userData = await window.getCurrentUserData();
                if (userData && userData.themes) {
                    this.ownedThemes = {
                        default: true,
                        dark: userData.themes.dark || false,
                        colorful: userData.themes.colorful || false,
                        minimalist: userData.themes.minimalist || false
                    };
                    // Update localStorage
                    localStorage.setItem('tts-themes', JSON.stringify({
                        dark: this.ownedThemes.dark,
                        colorful: this.ownedThemes.colorful,
                        minimalist: this.ownedThemes.minimalist,
                        activeTheme: userData.themes.activeTheme || 'default'
                    }));
                }
            }
        } catch (error) {
            console.log('Could not load owned themes:', error);
        }
    }

    loadTheme() {
        const saved = localStorage.getItem('tts-theme');
        // Migrate old 'ocean' theme to 'default'
        if (saved === 'ocean') {
            localStorage.setItem('tts-theme', 'default');
            return 'default';
        }
        return saved && THEMES[saved] ? saved : 'default';
    }

    saveTheme(themeName) {
        localStorage.setItem('tts-theme', themeName);
    }

    applyTheme(themeName) {
        if (!THEMES[themeName]) return;
        
        // Check if theme is owned
        if (!this.isThemeOwned(themeName)) {
            console.log(`Theme ${themeName} is not owned, reverting to default`);
            themeName = 'default';
        }
        
        const theme = THEMES[themeName];
        const root = document.documentElement;
        
        // Apply CSS custom properties
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(`--theme-${key}`, value);
        });
        
        Object.entries(theme.fonts).forEach(([key, value]) => {
            root.style.setProperty(`--theme-font-${key}`, value);
        });
        
        this.currentTheme = themeName;
        this.saveTheme(themeName);
        
        // Trigger theme change event
        document.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: themeName } 
        }));
    }

    isThemeOwned(themeName) {
        return this.ownedThemes[themeName] === true;
    }

    getAvailableThemes() {
        return Object.keys(THEMES)
            .filter(key => this.isThemeOwned(key))
            .map(key => ({
                key,
                name: THEMES[key].name
            }));
    }

    getAllThemes() {
        return Object.keys(THEMES).map(key => ({
            key,
            name: THEMES[key].name,
            owned: this.isThemeOwned(key)
        }));
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Settings management
class SettingsManager {
    constructor() {
        this.settings = this.loadSettings();
    }

    loadSettings() {
        const defaultSettings = {
            fontSize: 'medium',
            soundEnabled: true,
            vibrationEnabled: true,
            highContrast: false,
            autoSubmit: true,
            showHints: true
        };
        
        const saved = localStorage.getItem('tts-settings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }

    saveSettings() {
        localStorage.setItem('tts-settings', JSON.stringify(this.settings));
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.applySettings();
        
        // Trigger settings change event
        document.dispatchEvent(new CustomEvent('settingsChanged', { 
            detail: { settings: this.settings } 
        }));
    }

    applySettings() {
        const root = document.documentElement;
        
        // Font size
        const fontSizes = {
            small: '0.8em',
            medium: '1em',
            large: '1.2em',
            xlarge: '1.4em'
        };
        root.style.setProperty('--font-size', fontSizes[this.settings.fontSize]);
        
        // High contrast
        if (this.settings.highContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }
    }

    getSetting(key) {
        return this.settings[key];
    }

    getAllSettings() {
        return { ...this.settings };
    }
}

// Export for use in main.js
window.ThemeManager = ThemeManager;
window.SettingsManager = SettingsManager;
window.THEMES = THEMES;