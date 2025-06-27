// Animation and visual effects system
class AnimationManager {
    constructor() {
        this.isAnimating = false;
        this.soundEnabled = true;
        this.vibrationEnabled = true;
    }

    // Particle effect for word completion
    createParticleEffect(element, color = '#ffd700') {
        if (!element || typeof element.getBoundingClientRect !== 'function') {
            console.warn('Particle effect called on an invalid element.');
            return;
        }
        const particles = [];
        const particleCount = 15;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
            `;
            
            const rect = element.getBoundingClientRect();
            const startX = rect.left + rect.width / 2;
            const startY = rect.top + rect.height / 2;
            
            particle.style.left = startX + 'px';
            particle.style.top = startY + 'px';
            
            document.body.appendChild(particle);
            particles.push(particle);
            
            // Animate particle
            const angle = (i / particleCount) * Math.PI * 2;
            const velocity = 50 + Math.random() * 50;
            const duration = 800 + Math.random() * 400;
            
            particle.animate([
                { 
                    transform: 'translate(0, 0) scale(1)',
                    opacity: 1
                },
                { 
                    transform: `translate(${Math.cos(angle) * velocity}px, ${Math.sin(angle) * velocity}px) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: duration,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => {
                particle.remove();
            };
        }
    }

    // Shake animation for wrong answers
    shakeElement(element) {
        if (!element) {
            console.warn('Shake effect called on an invalid element.');
            return;
        }
        if (this.isAnimating) return;
        this.isAnimating = true;
        
        element.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(0)' }
        ], {
            duration: 500,
            easing: 'ease-in-out'
        }).onfinish = () => {
            this.isAnimating = false;
        };
        
        this.vibrate(200);
    }

    // Pulse animation for hints
    pulseElement(element) {
        if (!element) {
            console.warn('Pulse effect called on an invalid element.');
            return;
        }
        element.animate([
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(1.1)', opacity: 0.8 },
            { transform: 'scale(1)', opacity: 1 }
        ], {
            duration: 600,
            easing: 'ease-in-out'
        });
    }

    // Bounce animation for letter tiles
    bounceElement(element) {
        element.animate([
            { transform: 'scale(1)' },
            { transform: 'scale(1.2)' },
            { transform: 'scale(1)' }
        ], {
            duration: 300,
            easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        });
    }

    // Fade in animation
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.animate([
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' }
        ], {
            duration: duration,
            easing: 'ease-out',
            fill: 'forwards'
        });
    }

    // Slide in animation
    slideIn(element, direction = 'left', duration = 400) {
        const transforms = {
            left: 'translateX(-100%)',
            right: 'translateX(100%)',
            up: 'translateY(-100%)',
            down: 'translateY(100%)'
        };
        
        element.animate([
            { transform: transforms[direction], opacity: 0 },
            { transform: 'translate(0)', opacity: 1 }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fill: 'forwards'
        });
    }

    // Reveal word animation
    revealWord(cells, word) {
        if (!cells || cells.length === 0) {
            console.warn('revealWord called with invalid cells.');
            return;
        }
        cells.forEach((cell, index) => {
            setTimeout(() => {
                cell.classList.add('revealed');
                cell.style.animation = 'revealCell 0.3s ease-out forwards';
                this.bounceElement(cell);
                
                // Play sound effect using the new manager
                soundManager.playSound('reveal');
            }, index * 100);
        });
        
        // Create particle effect after all letters are revealed
        setTimeout(() => {
            if (cells.length > 0) {
                this.createParticleEffect(cells[Math.floor(cells.length / 2)]);
            }
        }, cells.length * 100 + 200);
        
        // Play sound effect for level completion
        soundManager.playSound('complete');
    }

    // Level completion animation
    levelComplete() {
        const container = document.querySelector('.game-container');
        if (!container) return;
        
        // Create success overlay
        const overlay = document.createElement('div');
        overlay.className = 'success-overlay';
        overlay.innerHTML = `
            <div class="success-content">
                <h2>🎉 Level Selesai! 🎉</h2>
                <p>Selamat! Anda berhasil menyelesaikan level ini.</p>
            </div>
        `;
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            opacity: 0;
        `;
        
        const content = overlay.querySelector('.success-content');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            transform: scale(0.5);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(overlay);
        
        // Animate overlay
        overlay.animate([
            { opacity: 0 },
            { opacity: 1 }
        ], { duration: 300, fill: 'forwards' });
        
        content.animate([
            { transform: 'scale(0.5)' },
            { transform: 'scale(1)' }
        ], { 
            duration: 400, 
            easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            fill: 'forwards'
        });
        
        // Create multiple particle effects
        setTimeout(() => {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    this.createParticleEffect(content, ['#51cf66', '#ff6b6b', '#4a90e2'][i]);
                }, i * 200);
            }
        }, 500);
        
        this.playSound('levelComplete');
        this.vibrate(300);
        
        // Remove overlay after delay
        setTimeout(() => {
            overlay.animate([
                { opacity: 1 },
                { opacity: 0 }
            ], { duration: 300 }).onfinish = () => {
                overlay.remove();
            };
        }, 2500);
    }

    // Method to play sound effects
    playSound(type) {
        // This now delegates to the global soundManager
        soundManager.playSound(type);
    }

    // Vibration feedback
    vibrate(duration = 100) {
        if (!this.vibrationEnabled || !navigator.vibrate) return;
        navigator.vibrate(duration);
    }

    // Settings
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
        soundManager.setSoundEnabled(enabled);
    }

    setVibrationEnabled(enabled) {
        this.vibrationEnabled = enabled;
    }
}

// CSS animations (to be added to stylesheet)
const animationCSS = `
@keyframes revealCell {
    0% {
        transform: scale(0.8);
        background-color: var(--theme-letterBox, #fff);
    }
    50% {
        transform: scale(1.1);
        background-color: var(--theme-revealedBox, #a0d8a0);
    }
    100% {
        transform: scale(1);
        background-color: var(--theme-revealedBox, #a0d8a0);
    }
}

@keyframes bounce {
    0%, 20%, 53%, 80%, 100% {
        transform: translate3d(0,0,0);
    }
    40%, 43% {
        transform: translate3d(0,-10px,0);
    }
    70% {
        transform: translate3d(0,-5px,0);
    }
    90% {
        transform: translate3d(0,-2px,0);
    }
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
    100% {
        transform: scale(1);
    }
}

@keyframes fadeInUp {
    0% {
        opacity: 0;
        transform: translateY(20px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

.bounce {
    animation: bounce 1s ease-in-out;
}

.pulse {
    animation: pulse 1s ease-in-out infinite;
}

.fade-in-up {
    animation: fadeInUp 0.3s ease-out;
}

.particle {
    animation: particleFloat 1s ease-out forwards;
}

@keyframes particleFloat {
    0% {
        opacity: 1;
        transform: scale(1);
    }
    100% {
        opacity: 0;
        transform: scale(0);
    }
}
`;

// Add CSS to document
function addAnimationCSS() {
    const style = document.createElement('style');
    style.textContent = animationCSS;
    document.head.appendChild(style);
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addAnimationCSS);
} else {
    addAnimationCSS();
}

// Export for use in main.js
window.AnimationManager = AnimationManager; 