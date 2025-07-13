// Animation Effects Manager - Manages different animation effect packs
class AnimationEffectsManager {
    constructor() {
        this.animationEffects = {
            classic: false,
            neon: false,
            minimal: false,
            explosive: false,
            activeEffect: 'default'
        };
        
        this.effectPacks = {
            default: {
                key: 'default',
                name: 'Default Effects',
                description: 'Efek animasi standar',
                owned: true
            },
            classic: {
                key: 'classic',
                name: 'Classic Effects',
                description: 'Efek animasi klasik dengan gaya retro',
                owned: false
            },
            neon: {
                key: 'neon',
                name: 'Neon Effects',
                description: 'Efek animasi neon yang berkilau',
                owned: false
            },
            minimal: {
                key: 'minimal',
                name: 'Minimal Effects',
                description: 'Efek animasi minimalis dan halus',
                owned: false
            },
            explosive: {
                key: 'explosive',
                name: 'Explosive Effects',
                description: 'Efek animasi eksplosif dan dramatis',
                owned: false
            }
        };
        
        this.loadFromLocalStorage();
    }
    
    // Load animation effects data from localStorage
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('tts-animation-effects');
            if (saved) {
                const data = JSON.parse(saved);
                this.animationEffects = {
                    classic: data.classic || false,
                    neon: data.neon || false,
                    minimal: data.minimal || false,
                    explosive: data.explosive || false,
                    activeEffect: data.activeEffect || 'default'
                };
                
                // Update owned status
                Object.keys(this.animationEffects).forEach(key => {
                    if (key !== 'activeEffect' && this.effectPacks[key]) {
                        this.effectPacks[key].owned = this.animationEffects[key];
                    }
                });
            }
        } catch (error) {
            console.error('Error loading animation effects from localStorage:', error);
        }
    }
    
    // Save animation effects data to localStorage
    saveToLocalStorage() {
        try {
            localStorage.setItem('tts-animation-effects', JSON.stringify(this.animationEffects));
        } catch (error) {
            console.error('Error saving animation effects to localStorage:', error);
        }
    }
    
    // Save to Firebase
    async saveToFirebase() {
        if (!window.currentUserId || !window.db) {
            console.log('Firebase not available for animation effects sync');
            return;
        }
        
        try {
            const userRef = window.db.collection('users').doc(window.currentUserId);
            await userRef.update({
                animationEffects: this.animationEffects,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Animation effects synced to Firebase');
        } catch (error) {
            console.error('❌ Error syncing animation effects to Firebase:', error);
        }
    }
    
    // Load from Firebase
    async loadFromFirebase() {
        if (!window.currentUserId || !window.db) {
            console.log('Firebase not available for animation effects sync');
            return;
        }
        
        try {
            const userRef = window.db.collection('users').doc(window.currentUserId);
            const userDoc = await userRef.get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData.animationEffects) {
                    this.animationEffects = {
                        classic: userData.animationEffects.classic || false,
                        neon: userData.animationEffects.neon || false,
                        minimal: userData.animationEffects.minimal || false,
                        explosive: userData.animationEffects.explosive || false,
                        activeEffect: userData.animationEffects.activeEffect || 'default'
                    };
                    
                    // Update owned status
                    Object.keys(this.animationEffects).forEach(key => {
                        if (key !== 'activeEffect' && this.effectPacks[key]) {
                            this.effectPacks[key].owned = this.animationEffects[key];
                        }
                    });
                    
                    this.saveToLocalStorage();
                    console.log('✅ Animation effects loaded from Firebase');
                }
            }
        } catch (error) {
            console.error('❌ Error loading animation effects from Firebase:', error);
        }
    }
    
    // Check if user owns a specific effect pack
    ownsEffectPack(packKey) {
        if (packKey === 'default') return true;
        return this.animationEffects[packKey] || false;
    }
    
    // Get available effect packs (owned by user)
    getAvailableEffectPacks() {
        return Object.values(this.effectPacks).filter(pack => pack.owned);
    }
    
    // Get all effect packs
    getAllEffectPacks() {
        return Object.values(this.effectPacks);
    }
    
    // Get active effect pack
    getActiveEffectPack() {
        return this.animationEffects.activeEffect;
    }
    
    // Set active effect pack
    async setActiveEffectPack(packKey) {
        if (!this.ownsEffectPack(packKey)) {
            console.warn(`Effect pack '${packKey}' is not owned`);
            return false;
        }
        
        this.animationEffects.activeEffect = packKey;
        this.saveToLocalStorage();
        await this.saveToFirebase();
        
        // Apply the effect pack
        this.applyEffectPack(packKey);
        
        console.log(`Active effect pack changed to: ${packKey}`);
        return true;
    }
    
    // Purchase effect pack
    async purchaseEffectPack(packKey) {
        if (this.ownsEffectPack(packKey)) {
            console.warn(`Effect pack '${packKey}' is already owned`);
            return false;
        }
        
        this.animationEffects[packKey] = true;
        this.effectPacks[packKey].owned = true;
        
        this.saveToLocalStorage();
        await this.saveToFirebase();
        
        // Trigger pack change event
        document.dispatchEvent(new CustomEvent('animationEffectsChanged', {
            detail: { pack: packKey, action: 'purchased' }
        }));
        
        console.log(`Effect pack '${packKey}' purchased successfully`);
        return true;
    }
    
    // Reload owned packs (useful after purchase)
    async reloadOwnedPacks() {
        this.loadFromLocalStorage();
        await this.loadFromFirebase();
        console.log('Animation effects ownership reloaded');
    }
    
    // Apply effect pack styles
    applyEffectPack(packKey) {
        // Remove existing effect classes
        document.body.classList.remove('effect-classic', 'effect-neon', 'effect-minimal', 'effect-explosive');
        
        // Apply new effect class
        if (packKey !== 'default') {
            document.body.classList.add(`effect-${packKey}`);
        }
        
        // Update CSS custom properties for different effects
        const root = document.documentElement;
        
        switch (packKey) {
            case 'classic':
                root.style.setProperty('--particle-color', '#ffd700');
                root.style.setProperty('--animation-duration', '0.8s');
                root.style.setProperty('--bounce-intensity', '1.3');
                break;
            case 'neon':
                root.style.setProperty('--particle-color', '#00ffff');
                root.style.setProperty('--animation-duration', '0.6s');
                root.style.setProperty('--bounce-intensity', '1.5');
                break;
            case 'minimal':
                root.style.setProperty('--particle-color', '#666666');
                root.style.setProperty('--animation-duration', '0.4s');
                root.style.setProperty('--bounce-intensity', '1.1');
                break;
            case 'explosive':
                root.style.setProperty('--particle-color', '#ff4444');
                root.style.setProperty('--animation-duration', '1.2s');
                root.style.setProperty('--bounce-intensity', '2.0');
                break;
            default:
                root.style.setProperty('--particle-color', '#ffd700');
                root.style.setProperty('--animation-duration', '0.6s');
                root.style.setProperty('--bounce-intensity', '1.2');
                break;
        }
    }
    
    // Get effect pack display name
    getEffectPackDisplayName(packKey) {
        return this.effectPacks[packKey]?.name || packKey;
    }
    
    // Create UI selector for effect packs
    createEffectPackSelector(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID '${containerId}' not found`);
            return;
        }
        
        const availablePacks = this.getAvailableEffectPacks();
        
        container.innerHTML = '';
        availablePacks.forEach(pack => {
            const option = document.createElement('option');
            option.value = pack.key;
            option.textContent = pack.name;
            container.appendChild(option);
        });
        
        container.value = this.getActiveEffectPack();
        
        container.addEventListener('change', (e) => {
            this.setActiveEffectPack(e.target.value);
        });
    }
}

// Initialize when DOM is loaded
if (typeof window !== 'undefined') {
    window.AnimationEffectsManager = AnimationEffectsManager;
    
    // Auto-initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.animationEffectsManager) {
            window.animationEffectsManager = new AnimationEffectsManager();
            
            // Load from Firebase if available
            if (window.currentUserId) {
                window.animationEffectsManager.loadFromFirebase();
            }
            
            // Apply current effect pack
            window.animationEffectsManager.applyEffectPack(
                window.animationEffectsManager.getActiveEffectPack()
            );
        }
    });
}