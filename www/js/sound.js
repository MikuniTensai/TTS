// Simple Sound Manager for main pages
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.soundEnabled = true;
        this.sounds = {};
        this.isUnlocked = false;

        this.soundFiles = {
            click: 'game/tts_cepat/assets/sounds/click.mp3',
            success: 'game/tts_cepat/assets/sounds/success.mp3',
            error: 'game/tts_cepat/assets/sounds/error.mp3'
        };
    }

    // Initialize the sound system
    init() {
        // Create AudioContext on the first user interaction
        const unlockAudio = () => {
            if (this.isUnlocked) return;
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                // Pre-load all sounds
                this.preloadSounds();

                this.isUnlocked = true;
                console.log("AudioContext unlocked and sounds preloaded.");
            } catch (e) {
                console.error("Failed to initialize AudioContext:", e);
                this.soundEnabled = false;
            }
            // Remove the event listeners after the first interaction
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchend', unlockAudio);
        };

        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchend', unlockAudio);
    }

    // Pre-load all sound files into buffers
    preloadSounds() {
        if (!this.audioContext) {
            console.log('No audioContext available for preloading sounds');
            return;
        }
        
        console.log('Starting to preload sounds...');
        
        for (const key in this.soundFiles) {
            const path = this.soundFiles[key];
            console.log(`Preloading sound: ${key} from ${path}`);
            const audio = new Audio(path);
            audio.preload = 'auto';
            
            // Handle loading errors gracefully
            audio.addEventListener('error', (e) => {
                console.warn(`Sound file not found: ${path}. Sound will be disabled for ${key}.`, e);
                delete this.sounds[key]; // Remove from available sounds
            });
            
            audio.addEventListener('canplaythrough', () => {
                console.log(`Successfully loaded sound: ${key}`);
                this.sounds[key] = audio; // Only add if successfully loaded
            });
            
            audio.addEventListener('loadstart', () => {
                console.log(`Started loading sound: ${key}`);
            });
            
            audio.load();
        }
    }

    // Play a sound from the preloaded pool
    playSound(type) {
        console.log(`playSound called with type: ${type}`);
        console.log(`soundEnabled: ${this.soundEnabled}, isUnlocked: ${this.isUnlocked}`);
        console.log(`Available sounds:`, Object.keys(this.sounds));
        
        if (!this.soundEnabled) {
            console.log('Sound is disabled');
            return;
        }
        
        if (!this.isUnlocked) {
            console.log('Audio context not unlocked yet');
            return;
        }
        
        if (!this.sounds[type]) {
            console.log(`Sound ${type} not found in preloaded sounds`);
            return;
        }

        const sound = this.sounds[type];
        console.log(`Playing sound: ${type}`);
        
        // Reset the sound to the beginning to allow for overlapping plays
        sound.currentTime = 0;
        
        // Play the sound
        const playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log(`Successfully played sound: ${type}`);
            }).catch(error => {
                console.error(`Failed to play sound: ${type}`, error);
            });
        }
    }

    // Toggle sound on or off
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
        if (!enabled) {
            // Optional: stop any currently playing sounds
            for (const key in this.sounds) {
                const sound = this.sounds[key];
                if (!sound.paused) {
                    sound.pause();
                    sound.currentTime = 0;
                }
            }
        }
    }
}

// Global instance
if (typeof window.soundManager === 'undefined') {
    window.soundManager = new SoundManager();
    window.soundManager.init();
}