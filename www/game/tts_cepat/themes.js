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
            revealedBox: "#a0d8a0",
            letterTile: "#4a90e2",
            letterTileUsed: "#666",
            letterTileText: "#fff",
            foundWord: "#a0d8a0",
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
            revealedBox: "#4a7c59",
            letterTile: "#2c5aa0",
            letterTileUsed: "#444",
            letterTileText: "#fff",
            foundWord: "#4a7c59",
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
            revealedBox: "#51cf66",
            letterTile: "#ff6b6b",
            letterTileUsed: "#868e96",
            letterTileText: "#fff",
            foundWord: "#51cf66",
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
    ocean: {
        name: "Ocean",
        colors: {
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            gridBackground: "rgba(255,255,255,0.95)",
            gridBorder: "#0077be",
            letterBox: "#f0f9ff",
            letterBoxBorder: "#0ea5e9",
            revealedBox: "#22d3ee",
            letterTile: "#0284c7",
            letterTileUsed: "#64748b",
            letterTileText: "#fff",
            foundWord: "#22d3ee",
            currentWord: "#0f172a",
            button: "#0284c7",
            buttonText: "#fff",
            text: "#0f172a"
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
        this.currentTheme = this.loadTheme();
        this.applyTheme(this.currentTheme);
    }

    loadTheme() {
        const saved = localStorage.getItem('tts-theme');
        return saved && THEMES[saved] ? saved : 'default';
    }

    saveTheme(themeName) {
        localStorage.setItem('tts-theme', themeName);
    }

    applyTheme(themeName) {
        if (!THEMES[themeName]) return;
        
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

    getAvailableThemes() {
        return Object.keys(THEMES).map(key => ({
            key,
            name: THEMES[key].name
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