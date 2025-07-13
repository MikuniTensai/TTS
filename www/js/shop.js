document.addEventListener('DOMContentLoaded', function() {
    let currentScore = 0;
    let inventory = {
        shuffle: 0,
        hint: 0
    };
    
    let themes = {
        dark: false,
        colorful: false,
        minimalist: false,
        activeTheme: 'default'
    };
    
    let soundPacks = {
        retro: false,
        nature: false,
        electronic: false,
        activePack: 'default'
    };
    
    let animationEffects = {
        classic: false,
        neon: false,
        minimal: false,
        explosive: false,
        activeEffect: 'default'
    };

    // Initialize shop
    loadPlayerData();

    async function loadPlayerData() {
        try {
            // First try to get score from Firebase, fallback to localStorage
            await syncScoreFromFirebase();
            
            // Load data from Firebase first, then fallback to localStorage
            await loadFromFirebase();
            
            // Get total score from localStorage (now synced with Firebase)
            const scores = JSON.parse(localStorage.getItem('tts-scores') || '{}');
            currentScore = Object.values(scores).reduce((total, score) => total + Number(score), 0);
            
            // Get inventory from localStorage (already synced with Firebase)
            const savedInventory = JSON.parse(localStorage.getItem('tts-inventory') || '{}');
            inventory = {
                shuffle: savedInventory.shuffle || 0,
                hint: savedInventory.hint || 0
            };
            
            // Get themes from localStorage (already synced with Firebase)
            const savedThemes = JSON.parse(localStorage.getItem('tts-themes') || '{}');
            themes = {
                dark: savedThemes.dark || false,
                colorful: savedThemes.colorful || false,
                minimalist: savedThemes.minimalist || false,
                activeTheme: savedThemes.activeTheme || 'default'
            };
            
            // Get sound packs from localStorage (already synced with Firebase)
            const savedSoundPacks = JSON.parse(localStorage.getItem('tts-sound-packs') || '{}');
            soundPacks = {
                retro: savedSoundPacks.retro || false,
                nature: savedSoundPacks.nature || false,
                electronic: savedSoundPacks.electronic || false,
                activePack: savedSoundPacks.activePack || 'default'
            };
            
            // Get animation effects from localStorage (already synced with Firebase)
            const savedAnimationEffects = JSON.parse(localStorage.getItem('tts-animation-effects') || '{}');
            animationEffects = {
                classic: savedAnimationEffects.classic || false,
                neon: savedAnimationEffects.neon || false,
                minimal: savedAnimationEffects.minimal || false,
                explosive: savedAnimationEffects.explosive || false,
                activeEffect: savedAnimationEffects.activeEffect || 'default'
            };

            updateUI();
        
        // Create theme selector after a short delay to ensure theme manager is loaded
        setTimeout(() => {
            if (window.themeManager) {
                window.themeManager.createThemeSelector('theme-selector-container');
            }
        }, 500);
        } catch (error) {
            console.error('Error loading player data:', error);
            showMessage('Error memuat data pemain', 'error');
        }
    }

    // Sync score from Firebase to localStorage to ensure consistency
    async function syncScoreFromFirebase() {
        try {
            if (!window.currentUserId || !window.db) {
                console.log('Firebase not ready, using localStorage score');
                return;
            }

            console.log('🔄 Syncing score from Firebase in shop...');
             const userRef = window.db.collection('users').doc(window.currentUserId);
             const userDoc = await userRef.get();
             
             if (userDoc.exists) {
                 const userData = userDoc.data();
                 const firebaseScore = userData.totalScore || 0;
                 
                 // Get current localStorage score
                 const scores = JSON.parse(localStorage.getItem('tts-scores') || '{}');
                 const localScore = Object.values(scores).reduce((total, score) => total + Number(score), 0);
                 
                 console.log(`Shop - Firebase score: ${firebaseScore}, Local score: ${localScore}`);
                 console.log('Shop - Current localStorage scores:', scores);
                 console.log('Shop - Firebase userData:', userData);
                
                // If Firebase score is different, update localStorage
                if (firebaseScore !== localScore && firebaseScore >= 0) {
                    console.log('🔄 Score mismatch in shop, updating localStorage from Firebase');
                    
                    const scoreDifference = firebaseScore - localScore;
                    
                    if (scoreDifference !== 0) {
                        // If we have a negative difference (recent purchase), subtract from the highest level score
                        if (scoreDifference < 0 && Object.keys(scores).length > 0) {
                            let highestScoreLevel = null;
                            let highestScore = 0;
                            
                            Object.entries(scores).forEach(([levelId, score]) => {
                                const numScore = Number(score);
                                if (numScore > highestScore) {
                                    highestScore = numScore;
                                    highestScoreLevel = levelId;
                                }
                            });
                            
                            if (highestScoreLevel && highestScore >= Math.abs(scoreDifference)) {
                                scores[highestScoreLevel] = highestScore + scoreDifference;
                                localStorage.setItem('tts-scores', JSON.stringify(scores));
                                console.log(`✅ Shop: Deducted ${Math.abs(scoreDifference)} points from level ${highestScoreLevel}`);
                            }
                        }
                        // If positive difference, add to a special "bonus" entry
                        else if (scoreDifference > 0) {
                            scores['bonus'] = (scores['bonus'] || 0) + scoreDifference;
                            localStorage.setItem('tts-scores', JSON.stringify(scores));
                            console.log(`✅ Shop: Added ${scoreDifference} bonus points`);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error syncing score from Firebase in shop:', error);
        }
    }

    function updateUI() {
        // Update score display
        document.getElementById('total-score').textContent = currentScore;
        
        // Update inventory display
        updateInventoryDisplay();
        
        // Update button states
        updateBuyButtons();
    }

    function updateInventoryDisplay() {
        const inventoryContainer = document.getElementById('inventory-items');
        
        const hasItems = inventory.shuffle > 0 || inventory.hint > 0;
        const hasThemes = themes.dark || themes.colorful || themes.minimalist;
        const hasSoundPacks = soundPacks.retro || soundPacks.nature || soundPacks.electronic;
        const hasAnimationEffects = animationEffects.classic || animationEffects.neon || animationEffects.minimal || animationEffects.explosive;
        
        if (!hasItems && !hasThemes && !hasSoundPacks && !hasAnimationEffects) {
            inventoryContainer.innerHTML = '<div class="loading">Inventory kosong</div>';
            return;
        }
        
        let inventoryHTML = '';
        
        // Display power-up items
        if (inventory.shuffle > 0) {
            inventoryHTML += `
                <div class="inventory-item">
                    <div>🔀 Shuffle</div>
                    <div style="font-weight: bold; color: #4a90e2;">${inventory.shuffle}</div>
                </div>
            `;
        }
        
        if (inventory.hint > 0) {
            inventoryHTML += `
                <div class="inventory-item">
                    <div>💡 Hint</div>
                    <div style="font-weight: bold; color: #4a90e2;">${inventory.hint}</div>
                </div>
            `;
        }
        
        // Display owned themes
        if (themes.dark) {
            inventoryHTML += `
                <div class="inventory-item">
                    <div>🎨 Dark Mode</div>
                    <div style="font-weight: bold; color: #4a90e2;">✓</div>
                </div>
            `;
        }
        
        if (themes.colorful) {
            inventoryHTML += `
                <div class="inventory-item">
                    <div>🌈 Colorful</div>
                    <div style="font-weight: bold; color: #4a90e2;">✓</div>
                </div>
            `;
        }
        
        if (themes.minimalist) {
            inventoryHTML += `
                <div class="inventory-item">
                    <div>✨ Minimalist</div>
                    <div style="font-weight: bold; color: #4a90e2;">✓</div>
                </div>
            `;
        }
        
        // Display owned sound packs
        if (soundPacks.retro) {
            inventoryHTML += `
                <div class="inventory-item">
                    <div>🎮 Retro Sounds</div>
                    <div style="font-weight: bold; color: #4a90e2;">✓</div>
                </div>
            `;
        }
        
        if (soundPacks.nature) {
            inventoryHTML += `
                <div class="inventory-item">
                    <div>🌿 Nature Sounds</div>
                    <div style="font-weight: bold; color: #4a90e2;">✓</div>
                </div>
            `;
        }
        
        if (soundPacks.electronic) {
            inventoryHTML += `
                <div class="inventory-item">
                    <div>🎵 Electronic Sounds</div>
                    <div style="font-weight: bold; color: #4a90e2;">✓</div>
                </div>
            `;
        }
        
        // Display owned animation effects
        if (animationEffects.classic) {
            inventoryHTML += `
                <div class="inventory-item">
                    <div>✨ Classic Effects</div>
                    <div style="font-weight: bold; color: #4a90e2;">✓</div>
                </div>
            `;
        }
        
        if (animationEffects.neon) {
            inventoryHTML += `
                <div class="inventory-item">
                    <div>💫 Neon Effects</div>
                    <div style="font-weight: bold; color: #4a90e2;">✓</div>
                </div>
            `;
        }
        
        if (animationEffects.minimal) {
            inventoryHTML += `
                <div class="inventory-item">
                    <div>🔹 Minimal Effects</div>
                    <div style="font-weight: bold; color: #4a90e2;">✓</div>
                </div>
            `;
        }
        
        if (animationEffects.explosive) {
            inventoryHTML += `
                <div class="inventory-item">
                    <div>💥 Explosive Effects</div>
                    <div style="font-weight: bold; color: #4a90e2;">✓</div>
                </div>
            `;
        }
        
        inventoryContainer.innerHTML = inventoryHTML;
    }

    function updateBuyButtons() {
        const buyButtons = document.querySelectorAll('.buy-button');
        buyButtons.forEach((button, index) => {
            let price;
            let isOwned = false;
            
            if (index === 0) {
                price = 500; // shuffle
            } else if (index === 1) {
                price = 4000; // hint
            } else if (index === 2) {
                price = 1; // dark theme
                isOwned = themes.dark;
            } else if (index === 3) {
                price = 1; // colorful theme
                isOwned = themes.colorful;
            } else if (index === 4) {
                price = 1; // minimalist theme
                isOwned = themes.minimalist;
            } else if (index === 5) {
                price = 1; // retro sound pack
                isOwned = soundPacks.retro;
            } else if (index === 6) {
                price = 1; // nature sound pack
                isOwned = soundPacks.nature;
            } else if (index === 7) {
                price = 1; // electronic sound pack
                isOwned = soundPacks.electronic;
            }
            
            if (isOwned) {
                button.textContent = 'Dimiliki';
                button.disabled = true;
                button.style.background = '#28a745';
            } else {
                button.textContent = 'Beli';
                button.disabled = currentScore < price;
                button.style.background = button.disabled ? '#ccc' : '#4CAF50';
            }
        });
        
        // Update animation effects buttons
        const animationEffectsButtons = {
            'buy-classic-effects': { owned: animationEffects.classic, price: 1 },
            'buy-neon-effects': { owned: animationEffects.neon, price: 1 },
            'buy-minimal-effects': { owned: animationEffects.minimal, price: 1 },
            'buy-explosive-effects': { owned: animationEffects.explosive, price: 1 }
        };
        
        Object.entries(animationEffectsButtons).forEach(([buttonId, config]) => {
            const button = document.getElementById(buttonId);
            if (button) {
                if (config.owned) {
                    button.textContent = 'Dimiliki';
                    button.disabled = true;
                    button.classList.add('owned');
                } else if (currentScore < config.price) {
                    button.textContent = `Beli (${config.price})`;
                    button.disabled = true;
                    button.classList.add('insufficient-funds');
                } else {
                    button.textContent = `Beli (${config.price})`;
                    button.disabled = false;
                    button.classList.remove('insufficient-funds', 'owned');
                }
            }
        });
    }

    window.buyItem = async function(itemType, price) {
        soundManager.playSound('click');
        if (currentScore < price) {
            showMessage('Score tidak cukup!', 'error');
            return;
        }

        try {
            // Show loading
            showMessage('Memproses pembelian...', 'loading');
            
            // Deduct score
            currentScore -= price;
            
            // Add item to inventory
            inventory[itemType]++;
            
            // Update localStorage scores to reflect the purchase
            updateLocalStorageScores(price);
            
            // Save inventory to localStorage
            localStorage.setItem('tts-inventory', JSON.stringify(inventory));
            
            // Update Firebase
            await updateFirebaseData();
            
            // Update UI
            updateUI();
            
            showMessage(`Berhasil membeli ${itemType === 'shuffle' ? 'Extra Shuffle' : 'Extra Hint'}!`, 'success');
            
        } catch (error) {
            console.error('Error buying item:', error);
            showMessage('Gagal membeli item. Coba lagi.', 'error');
            
            // Rollback changes
            currentScore += price;
            inventory[itemType]--;
            
            // Rollback localStorage scores
            rollbackLocalStorageScores(price);
            
            updateUI();
        }
    }

    window.buyTheme = async function(themeType, price) {
        soundManager.playSound('click');
        
        // Check if theme is already owned
        if (themes[themeType]) {
            showMessage('Theme sudah dimiliki!', 'error');
            return;
        }
        
        if (currentScore < price) {
            showMessage('Score tidak cukup!', 'error');
            return;
        }

        try {
            // Show loading
            showMessage('Memproses pembelian theme...', 'loading');
            
            // Deduct score
            currentScore -= price;
            
            // Add theme to collection
            themes[themeType] = true;
            
            // Update localStorage scores to reflect the purchase
            updateLocalStorageScores(price);
            
            // Save themes to localStorage
            localStorage.setItem('tts-themes', JSON.stringify(themes));
            
            // Update Firebase
            await updateFirebaseData();
            
            // Update UI
            updateUI();
            
            const themeNames = {
                dark: 'Dark Mode Theme',
                colorful: 'Colorful Theme',
                minimalist: 'Minimalist Theme'
            };
            
            showMessage(`Berhasil membeli ${themeNames[themeType]}!`, 'success');
            
            // Update theme selector
            setTimeout(() => {
                if (window.themeManager) {
                    window.themeManager.createThemeSelector('theme-selector-container');
                }
            }, 100);
            
        } catch (error) {
            console.error('Error buying theme:', error);
            showMessage('Gagal membeli theme. Coba lagi.', 'error');
            
            // Rollback changes
            currentScore += price;
            themes[themeType] = false;
            
            // Rollback localStorage scores
            rollbackLocalStorageScores(price);
            
            updateUI();
        }
    }

    window.buySoundPack = async function(packType, price = 1) {
        if (window.soundManager) {
            window.soundManager.playSound('click');
        }
        
        // Check if sound pack is already owned
        if (soundPacks[packType]) {
            showMessage('Sound pack sudah dimiliki!', 'error');
            return;
        }
        
        if (currentScore < price) {
            showMessage('Score tidak cukup!', 'error');
            return;
        }

        try {
            // Show loading
            showMessage('Memproses pembelian sound pack...', 'loading');
            
            // Deduct score
            currentScore -= price;
            
            // Add sound pack to collection
            soundPacks[packType] = true;
            
            // Update localStorage scores to reflect the purchase
            updateLocalStorageScores(price);
            
            // Save sound packs to localStorage
            localStorage.setItem('tts-sound-packs', JSON.stringify(soundPacks));
            
            // Update Firebase
            await updateFirebaseData();
            
            // Update UI
            updateUI();
            
            const packNames = {
                retro: 'Retro Sound Pack',
                nature: 'Nature Sound Pack',
                electronic: 'Electronic Sound Pack'
            };
            
            showMessage(`Berhasil membeli ${packNames[packType]}!`, 'success');
            
            // Update sound pack manager if available
            if (window.soundPackManager) {
                await window.soundPackManager.loadOwnedPacks();
            }
            
        } catch (error) {
            console.error('Error buying sound pack:', error);
            showMessage('Gagal membeli sound pack. Coba lagi.', 'error');
            
            // Rollback changes
            currentScore += price;
            soundPacks[packType] = false;
            
            // Rollback localStorage scores
            rollbackLocalStorageScores(price);
            
            updateUI();
        }
    }

    async function buyAnimationEffects(effectType, price = 1) {
        if (window.soundManager) {
            window.soundManager.playSound('click');
        }
        
        // Check if animation effect is already owned
        if (animationEffects[effectType]) {
            showMessage('Animation effect sudah dimiliki!', 'error');
            return;
        }
        
        if (currentScore < price) {
            showMessage('Score tidak cukup!', 'error');
            return;
        }

        try {
            // Show loading
            showMessage('Memproses pembelian animation effects...', 'loading');
            
            // Deduct score
            currentScore -= price;
            
            // Add animation effect to collection
            animationEffects[effectType] = true;
            
            // Update localStorage scores to reflect the purchase
            updateLocalStorageScores(price);
            
            // Save animation effects to localStorage
            localStorage.setItem('tts-animation-effects', JSON.stringify(animationEffects));
            
            // Update Firebase
            await updateFirebaseData();
            
            // Update UI
            updateUI();
            
            const effectNames = {
                classic: 'Classic Animation Effects',
                neon: 'Neon Animation Effects',
                minimal: 'Minimal Animation Effects',
                explosive: 'Explosive Animation Effects'
            };
            
            showMessage(`Berhasil membeli ${effectNames[effectType]}!`, 'success');
            
            // Update animation effects manager if available
            if (window.animationEffectsManager) {
                await window.animationEffectsManager.purchaseEffectPack(effectType);
                await window.animationEffectsManager.reloadOwnedPacks();
            }
            
        } catch (error) {
            console.error('Error buying animation effects:', error);
            showMessage('Gagal membeli animation effects. Coba lagi.', 'error');
            
            // Rollback changes
            currentScore += price;
            animationEffects[effectType] = false;
            
            // Rollback localStorage scores
            rollbackLocalStorageScores(price);
            
            updateUI();
        }
    }

    // Make functions globally accessible
    window.buyItem = buyItem;
    window.buyTheme = buyTheme;
    window.buySoundPack = buySoundPack;
    window.buyAnimationEffects = buyAnimationEffects;

    // Update localStorage scores after purchase
    function updateLocalStorageScores(deductedAmount) {
        try {
            const scores = JSON.parse(localStorage.getItem('tts-scores') || '{}');
            
            if (Object.keys(scores).length === 0) {
                console.log('No scores in localStorage to update');
                return;
            }
            
            // Find the level with the highest score to deduct from
            let highestScoreLevel = null;
            let highestScore = 0;
            
            Object.entries(scores).forEach(([levelId, score]) => {
                const numScore = Number(score);
                if (numScore > highestScore) {
                    highestScore = numScore;
                    highestScoreLevel = levelId;
                }
            });
            
            if (highestScoreLevel && highestScore >= deductedAmount) {
                scores[highestScoreLevel] = highestScore - deductedAmount;
                localStorage.setItem('tts-scores', JSON.stringify(scores));
                console.log(`✅ Deducted ${deductedAmount} points from level ${highestScoreLevel} in localStorage`);
            } else {
                console.warn('Cannot deduct from localStorage: insufficient score in highest level');
            }
        } catch (error) {
            console.error('Error updating localStorage scores:', error);
        }
    }

    // Rollback localStorage scores if purchase fails
    function rollbackLocalStorageScores(refundAmount) {
        try {
            const scores = JSON.parse(localStorage.getItem('tts-scores') || '{}');
            
            if (Object.keys(scores).length === 0) {
                console.log('No scores in localStorage to rollback');
                return;
            }
            
            // Find the level with the highest score to add back to
            let highestScoreLevel = null;
            let highestScore = 0;
            
            Object.entries(scores).forEach(([levelId, score]) => {
                const numScore = Number(score);
                if (numScore > highestScore) {
                    highestScore = numScore;
                    highestScoreLevel = levelId;
                }
            });
            
            if (highestScoreLevel) {
                scores[highestScoreLevel] = highestScore + refundAmount;
                localStorage.setItem('tts-scores', JSON.stringify(scores));
                console.log(`✅ Refunded ${refundAmount} points to level ${highestScoreLevel} in localStorage`);
            } else {
                // If no levels exist, create a bonus entry
                scores['bonus'] = (scores['bonus'] || 0) + refundAmount;
                localStorage.setItem('tts-scores', JSON.stringify(scores));
                console.log(`✅ Refunded ${refundAmount} points as bonus in localStorage`);
            }
        } catch (error) {
            console.error('Error rolling back localStorage scores:', error);
        }
    }

    async function updateFirebaseData() {
        try {
            // Ensure user data structure exists
            if (window.ensureUserDataStructure) {
                await window.ensureUserDataStructure();
            }
            
            // Update both inventory and totalScore in Firebase
            const db = firebase.firestore();
            const userRef = db.collection('users').doc(window.currentUserId);
            
            await userRef.update({
                inventory: inventory,
                themes: themes,
                soundPacks: soundPacks,
                animationEffects: animationEffects,
                totalScore: currentScore,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Inventory and score updated in Firebase');
            
        } catch (error) {
            console.error('Error updating Firebase:', error);
            throw error;
        }
    }

    function showMessage(message, type = 'info') {
        const messageArea = document.getElementById('message-area');
        const messageDiv = document.createElement('div');
        messageDiv.className = type;
        messageDiv.textContent = message;
        
        // Clear previous messages
        messageArea.innerHTML = '';
        messageArea.appendChild(messageDiv);
        
        // Auto remove success/error messages after 3 seconds
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                if (messageArea.contains(messageDiv)) {
                    messageArea.removeChild(messageDiv);
                }
            }, 3000);
        }
    }

    // Load data from Firebase
    async function loadFromFirebase() {
        try {
            if (!window.currentUserId || !window.db) {
                console.log('Firebase not ready, using localStorage data');
                return;
            }
            
            if (window.ensureUserDataStructure) {
                await window.ensureUserDataStructure();
            }
                
            const db = firebase.firestore();
            const userDoc = await db.collection('users').doc(window.currentUserId).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                if (userData.inventory) {
                    inventory = {
                        shuffle: userData.inventory.shuffle || 0,
                        hint: userData.inventory.hint || 0
                    };
                    
                    // Save to localStorage for offline access
                    localStorage.setItem('tts-inventory', JSON.stringify(inventory));
                }
                
                if (userData.themes) {
                    themes = {
                        dark: userData.themes.dark || false,
                        colorful: userData.themes.colorful || false,
                        minimalist: userData.themes.minimalist || false,
                        activeTheme: userData.themes.activeTheme || 'default'
                    };
                    
                    // Save to localStorage for offline access
                    localStorage.setItem('tts-themes', JSON.stringify(themes));
                }
                
                if (userData.soundPacks) {
                    soundPacks = {
                        retro: userData.soundPacks.retro || false,
                        nature: userData.soundPacks.nature || false,
                        electronic: userData.soundPacks.electronic || false,
                        activePack: userData.soundPacks.activePack || 'default'
                    };
                    
                    // Save to localStorage for offline access
                    localStorage.setItem('tts-sound-packs', JSON.stringify(soundPacks));
                }
                
                if (userData.animationEffects) {
                    animationEffects = {
                        classic: userData.animationEffects.classic || false,
                        neon: userData.animationEffects.neon || false,
                        minimal: userData.animationEffects.minimal || false,
                        explosive: userData.animationEffects.explosive || false,
                        activeEffect: userData.animationEffects.activeEffect || 'default'
                    };
                    
                    // Save to localStorage for offline access
                    localStorage.setItem('tts-animation-effects', JSON.stringify(animationEffects));
                }
                
                console.log('✅ Data loaded from Firebase:', { inventory, themes, soundPacks, animationEffects });
            }
        } catch (error) {
            console.error('Error loading data from Firebase:', error);
        }
    }
});