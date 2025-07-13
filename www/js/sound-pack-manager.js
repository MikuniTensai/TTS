// Sound Pack Manager for TTS Game
class SoundPackManager {
    constructor() {
        this.currentPack = 'default';
        this.ownedPacks = { default: true }; // Default pack is always owned
        this.availablePacks = ['default', 'retro', 'nature', 'electronic'];
        this.init();
    }

    init() {
        this.loadOwnedPacks();
        this.loadActivePack();
    }

    // Load owned sound packs from localStorage and Firebase
    async loadOwnedPacks() {
        try {
            // Load from localStorage first
            const localPacks = localStorage.getItem('tts-sound-packs');
            if (localPacks) {
                const packs = JSON.parse(localPacks);
                this.ownedPacks = {
                    default: true,
                    retro: packs.retro || false,
                    nature: packs.nature || false,
                    electronic: packs.electronic || false
                };
            }

            // Load from Firebase if available
            if (window.getCurrentUserData) {
                const userData = await window.getCurrentUserData();
                if (userData && userData.soundPacks) {
                    this.ownedPacks = {
                        default: true,
                        retro: userData.soundPacks.retro || false,
                        nature: userData.soundPacks.nature || false,
                        electronic: userData.soundPacks.electronic || false
                    };
                    // Update localStorage
                    localStorage.setItem('tts-sound-packs', JSON.stringify({
                        retro: this.ownedPacks.retro,
                        nature: this.ownedPacks.nature,
                        electronic: this.ownedPacks.electronic,
                        activePack: userData.soundPacks.activePack || 'default'
                    }));
                }
            }
        } catch (error) {
            console.log('Could not load owned sound packs:', error);
        }
    }

    // Load active sound pack
    loadActivePack() {
        const saved = localStorage.getItem('tts-active-sound-pack');
        // Check if saved pack is owned
        if (saved && this.isPackOwned(saved)) {
            this.currentPack = saved;
        } else {
            this.currentPack = 'default';
        }
        this.applyPack(this.currentPack);
    }

    // Save active sound pack
    saveActivePack(packName) {
        localStorage.setItem('tts-active-sound-pack', packName);
    }

    // Check if sound pack is owned
    isPackOwned(packName) {
        return this.ownedPacks[packName] === true;
    }

    // Get available (owned) sound packs
    getAvailablePacks() {
        return this.availablePacks
            .filter(pack => this.isPackOwned(pack))
            .map(pack => ({
                key: pack,
                name: this.getPackDisplayName(pack)
            }));
    }

    // Get all sound packs with ownership status
    getAllPacks() {
        return this.availablePacks.map(pack => ({
            key: pack,
            name: this.getPackDisplayName(pack),
            owned: this.isPackOwned(pack)
        }));
    }

    // Get display name for sound pack
    getPackDisplayName(packName) {
        const names = {
            default: 'Default Sounds',
            retro: 'Retro Gaming',
            nature: 'Nature Sounds',
            electronic: 'Electronic Beats'
        };
        return names[packName] || packName;
    }

    // Apply sound pack to sound manager
    applyPack(packName) {
        if (!this.isPackOwned(packName)) {
            console.log(`Sound pack ${packName} is not owned, reverting to default`);
            packName = 'default';
        }

        this.currentPack = packName;
        this.saveActivePack(packName);

        // Update sound manager with new pack
        if (window.soundManager) {
            window.soundManager.setSoundPack(packName);
        }

        // Trigger pack change event
        document.dispatchEvent(new CustomEvent('soundPackChanged', {
            detail: { pack: packName }
        }));
    }

    // Get current active pack
    getCurrentPack() {
        return this.currentPack;
    }
    
    // Alias for applyPack to match the interface expected by settings
    setActivePack(packName) {
        return this.applyPack(packName);
    }
    
    // Get active pack (alias for getCurrentPack)
    getActivePack() {
        return this.getCurrentPack();
    }

    // Create sound pack selector UI
    createPackSelector(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container '${containerId}' not found`);
            return;
        }

        const availablePacks = this.getAvailablePacks();
        const packIcons = {
            default: '🔊',
            retro: '🎮',
            nature: '🌿',
            electronic: '🎵'
        };

        let selectorHTML = '<div class="sound-pack-selector">';
        selectorHTML += '<h3>Pilih Sound Pack:</h3>';
        
        availablePacks.forEach(pack => {
            const isActive = pack.key === this.currentPack;
            selectorHTML += `
                <button class="pack-option ${isActive ? 'active' : ''}" 
                        onclick="window.soundPackManager.applyPack('${pack.key}')">
                    ${packIcons[pack.key]} ${pack.name}
                </button>
            `;
        });
        
        selectorHTML += '</div>';
        container.innerHTML = selectorHTML;
    }
}

// Export for use in other files
window.SoundPackManager = SoundPackManager;

// Initialize global instance
if (typeof window.soundPackManager === 'undefined') {
    window.soundPackManager = new SoundPackManager();
}