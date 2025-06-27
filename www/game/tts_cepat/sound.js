// Sound Manager to handle all audio playback
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.soundEnabled = true;
        this.sounds = {};
        this.isUnlocked = false;

        this.soundFiles = {
            click: 'assets/sounds/click.mp3',
            success: 'assets/sounds/success.mp3',
            error: 'assets/sounds/error.mp3',
            reveal: 'assets/sounds/reveal.mp3',
            bonus: 'assets/sounds/bonus.mp3',
            complete: 'assets/sounds/complete.mp3'
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
        if (!this.audioContext) return;
        
        for (const key in this.soundFiles) {
            const path = this.soundFiles[key];
            const audio = new Audio(path);
            audio.preload = 'auto';
            
            // Handle loading errors gracefully
            audio.addEventListener('error', () => {
                console.warn(`Sound file not found: ${path}. Sound will be disabled for ${key}.`);
                delete this.sounds[key]; // Remove from available sounds
            });
            
            audio.addEventListener('canplaythrough', () => {
                this.sounds[key] = audio; // Only add if successfully loaded
            });
            
            audio.load();
        }
    }

    // Play a sound from the preloaded pool
    playSound(type) {
        if (!this.soundEnabled || !this.isUnlocked || !this.sounds[type]) {
            return;
        }

        const sound = this.sounds[type];
        
        // Reset the sound to the beginning to allow for overlapping plays
        sound.currentTime = 0;
        
        // Play the sound
        const playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
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
const soundManager = new SoundManager();
soundManager.init(); 