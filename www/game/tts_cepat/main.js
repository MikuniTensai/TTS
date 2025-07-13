/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const letterBankContainer = document.getElementById('letter-bank');
    const currentWordContainer = document.getElementById('current-word');
    const foundWordsContainer = document.getElementById('found-words');
    const levelNumberElement = document.getElementById('level-number');
    const shuffleButton = document.getElementById('shuffle-button');
    const clearButton = document.getElementById('clear-button');
    const hintButton = document.getElementById('hint-button');
    const backButton = document.querySelector('.back-button');
    const scoreDisplay = document.getElementById('score-display');
    
    // --- KBBI Database Conversion ---
    // The kbbi.js file loads the database as an Array.
    // We convert it to a Set here for much faster lookups (O(1) vs O(n)).
    // Note: This variable is now globally available via `window.KBBI_DATABASE`
    console.log("=== KBBI Database Debug ===");
    console.log("window.KBBI_DATABASE exists?", typeof window.KBBI_DATABASE !== 'undefined');
    console.log("window.KBBI_DATABASE type:", typeof window.KBBI_DATABASE);
    console.log("window.KBBI_DATABASE is Array?", Array.isArray(window.KBBI_DATABASE));
    
    if (window.KBBI_DATABASE) {
        console.log("KBBI_DATABASE length:", window.KBBI_DATABASE.length);
        console.log("First 5 words:", window.KBBI_DATABASE.slice(0, 5));
        console.log("Contains 'ABA'?", window.KBBI_DATABASE.includes('ABA'));
    }
    
    if (Array.isArray(window.KBBI_DATABASE)) {
        console.log("Converting KBBI Array to Set for performance...");
        window.KBBI_DATABASE_SET = new Set(window.KBBI_DATABASE); // Use a new variable
        console.log(`KBBI Set created with ${window.KBBI_DATABASE_SET.size} words.`);
        console.log("Set contains 'ABA'?", window.KBBI_DATABASE_SET.has('ABA'));
    } else {
        console.error("❌ KBBI_DATABASE not found or not an array!");
    }
    console.log("=== End KBBI Debug ===");
    // --- End of Conversion ---

    let levelData = null;
    let currentInput = []; // { letter: 'A', tileIndex: 0 }
    let foundWords = [];
    let currentLevelId = 1;
    let currentScore = 0;
    let bonusWords = [];
    let isLevelAlreadyCompleted = false; // Track if level was already completed
    let shuffleCount = 2;
    let hintCount = 1;
    let inventory = { shuffle: 0, hint: 0 }; // Player inventory
    
    // Initialize managers
    const themeManager = new ThemeManager();
    const settingsManager = new SettingsManager();
    const animationManager = new AnimationManager();
    // soundManager is already initialized globally in sound.js
    
    // Apply initial settings
    settingsManager.applySettings();
    animationManager.setSoundEnabled(settingsManager.getSetting('soundEnabled'));
    animationManager.setVibrationEnabled(settingsManager.getSetting('vibrationEnabled'));
    
    // Ensure soundManager gets the correct setting
    const soundEnabled = settingsManager.getSetting('soundEnabled');
    console.log('Sound setting from settingsManager:', soundEnabled);
    soundManager.setSoundEnabled(soundEnabled);
    console.log('SoundManager soundEnabled after setting:', soundManager.soundEnabled);

    // Utility function to ensure consistent level ID handling
    function normalizeLevel(levelId) {
        const parsed = parseInt(levelId, 10);
        const minLevel = window.TTS_CONFIG?.MIN_LEVEL_ID || 1;
        if (isNaN(parsed) || parsed < minLevel) {
            console.warn(`Invalid level ID: ${levelId}, defaulting to ${minLevel}`);
            return minLevel;
        }
        return parsed;
    }
    
    // Get level from URL parameter
    function getLevelFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const levelParam = urlParams.get('level');
        return normalizeLevel(levelParam || 1);
    }

    // Check if level is already completed
    function isLevelCompleted(levelId) {
        const completedLevels = JSON.parse(localStorage.getItem('tts-completed-levels') || '[]');
        return completedLevels.includes(Number(levelId));
    }

    // Update level display with completion indicator
    function updateLevelDisplay() {
        const levelHeader = document.querySelector('.top-bar h2');
        if (levelHeader && isLevelAlreadyCompleted) {
            levelHeader.innerHTML = `Level <span id="level-number">${levelData.id}</span> <span style="color: #4CAF50; font-size: 0.8em;">✓ Selesai</span>`;
        }
    }

    function updateActionButtonsUI() {
        const shuffleButton = document.getElementById('shuffle-button');
        const hintButton = document.getElementById('hint-button');

        // Update Shuffle Button
        shuffleButton.textContent = `Acak (${shuffleCount})`;
        if (shuffleCount <= 0) {
            shuffleButton.disabled = true;
            shuffleButton.classList.add('disabled');
        } else {
            shuffleButton.disabled = false;
            shuffleButton.classList.remove('disabled');
        }

        // Update Hint Button
        hintButton.textContent = `Hint (${hintCount})`;
        if (hintCount <= 0) {
            hintButton.disabled = true;
            hintButton.classList.add('disabled');
        } else {
            hintButton.disabled = false;
            hintButton.classList.remove('disabled');
        }
    }

    function toggleInventoryPopup() {
        const popup = document.getElementById('inventory-popup');
        if (popup) {
            popup.classList.toggle('hidden');
            if (!popup.classList.contains('hidden')) {
                updateInventoryPopup(); // Update content when opening
            }
        }
    }

    function updateInventoryBadge() {
        const badge = document.getElementById('inventory-badge');
        if (!badge) return;

        const totalItems = (inventory.shuffle || 0) + (inventory.hint || 0);
        if (totalItems > 0) {
            badge.textContent = totalItems;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    function loadInventory() {
        try {
            const savedInventory = JSON.parse(localStorage.getItem('tts-inventory') || '{}');
            inventory = {
                shuffle: savedInventory.shuffle || 0,
                hint: savedInventory.hint || 0
            };
            updateInventoryBadge();
        } catch (error) {
            console.error('Error loading inventory:', error);
        }
    }

    function updateInventoryDisplay() {
        // This function is deprecated and replaced by updateInventoryPopup
        updateInventoryPopup();
    }
    
    function updateInventoryPopup() {
        const inventoryContainer = document.getElementById('popup-inventory-items');
        if (!inventoryContainer) return;

        if (inventory.shuffle === 0 && inventory.hint === 0) {
            inventoryContainer.innerHTML = '<div class="popup-empty">Inventory Anda kosong.</div>';
            return;
        }

        let inventoryHTML = '';

        if (inventory.shuffle > 0) {
            inventoryHTML += `
                <div class="popup-inventory-item">
                    <span>🔀 Extra Shuffle</span>
                    <span>x ${inventory.shuffle}</span>
                    <button class="use-item-button" onclick="useInventoryItem('shuffle')">Gunakan</button>
                </div>
            `;
        }

        if (inventory.hint > 0) {
            inventoryHTML += `
                <div class="popup-inventory-item">
                    <span>💡 Extra Hint</span>
                    <span>x ${inventory.hint}</span>
                    <button class="use-item-button" onclick="useInventoryItem('hint')">Gunakan</button>
                </div>
            `;
        }
        
        inventoryContainer.innerHTML = inventoryHTML || '<div class="popup-empty">Inventory Anda kosong.</div>';
    }

    function useInventoryItem(itemType) {
        if (inventory[itemType] <= 0) {
            return;
        }

        if (itemType === 'shuffle') {
            shuffleCount++;
            inventory.shuffle--;
            renderLetterBank();
            soundManager.playSound('click');
            showInventoryMessage('🔀 Extra Shuffle digunakan!');
        } else if (itemType === 'hint') {
            hintCount++;
            inventory.hint--;
            showInventoryMessage('💡 Extra Hint digunakan!');
        }

        // Update localStorage
        localStorage.setItem('tts-inventory', JSON.stringify(inventory));
        
        // Update displays
        updateInventoryPopup();
        updateInventoryBadge();
        updateActionButtonsUI();

        // Update Firebase in background
        updateInventoryInFirebase().catch(err => {
            console.error('Failed to update inventory in Firebase:', err);
        });
    }

    function showInventoryMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            z-index: 1500;
            font-weight: bold;
            font-size: 0.9em;
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (document.body.contains(messageDiv)) {
                document.body.removeChild(messageDiv);
            }
        }, window.TTS_CONFIG?.NOTIFICATION_DURATION || 3000);
    }

    async function updateInventoryInFirebase() {
        try {
            if (window.ensureUserDataStructure) {
                await window.ensureUserDataStructure();
                
                const db = firebase.firestore();
                const userRef = db.collection('users').doc(window.currentUserId);
                
                await userRef.update({
                    inventory: inventory,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                console.log('✅ Inventory updated in Firebase');
            }
        } catch (error) {
            console.error('Error updating inventory in Firebase:', error);
        }
    }

    // Sync score from Firebase to localStorage to ensure consistency after shop purchases
    async function syncScoreFromFirebase() {
        try {
            if (!window.currentUserId || !window.db) {
                console.log('Firebase not ready, skipping score sync');
                return;
            }

            console.log('🔄 Syncing score from Firebase...');
            const userRef = window.db.collection('users').doc(window.currentUserId);
            const userDoc = await userRef.get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                const firebaseScore = userData.totalScore || 0;
                
                // Get current localStorage score
                const localScore = calculateTotalScore();
                
                console.log(`Firebase score: ${firebaseScore}, Local score: ${localScore}`);
                
                // If Firebase score is different (likely after shop purchase), update localStorage
                if (firebaseScore !== localScore && firebaseScore >= 0) {
                    console.log('🔄 Score mismatch detected, updating localStorage from Firebase');
                    
                    // Calculate the difference and adjust localStorage scores proportionally
                    const scoreDifference = firebaseScore - localScore;
                    
                    if (scoreDifference !== 0) {
                        // Get current scores from localStorage
                        let scores = {};
                        try {
                            const scoresData = localStorage.getItem('tts-scores');
                            if (scoresData) {
                                scores = JSON.parse(scoresData);
                            }
                        } catch (parseError) {
                            console.error('Error parsing scores:', parseError);
                            scores = {};
                        }
                        
                        // If we have a negative difference (shop purchase), subtract from the highest level score
                        if (scoreDifference < 0 && Object.keys(scores).length > 0) {
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
                            
                            if (highestScoreLevel && highestScore >= Math.abs(scoreDifference)) {
                                scores[highestScoreLevel] = highestScore + scoreDifference; // scoreDifference is negative
                                localStorage.setItem('tts-scores', JSON.stringify(scores));
                                console.log(`✅ Deducted ${Math.abs(scoreDifference)} points from level ${highestScoreLevel}`);
                            }
                        }
                        // If positive difference, add to a special "bonus" entry
                        else if (scoreDifference > 0) {
                            scores['bonus'] = (scores['bonus'] || 0) + scoreDifference;
                            localStorage.setItem('tts-scores', JSON.stringify(scores));
                            console.log(`✅ Added ${scoreDifference} bonus points`);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error syncing score from Firebase:', error);
        }
    }

    // Save completed level to localStorage with proper validation
    function saveCompletedLevel(levelId) {
        try {
            console.log(`=== Saving Completed Level ===`);
            console.log(`Level ID: ${levelId} (type: ${typeof levelId})`);
            
            // Normalize level ID to ensure consistency
            const numLevelId = normalizeLevel(levelId);
            console.log(`Normalized Level ID: ${numLevelId}`);
            
            // Validate and parse localStorage data
            let completedLevels;
            try {
                completedLevels = JSON.parse(localStorage.getItem('tts-completed-levels') || '[]');
                if (!Array.isArray(completedLevels)) {
                    console.warn('Completed levels data is not an array, resetting to empty array');
                    completedLevels = [];
                }
            } catch (parseError) {
                console.error('Error parsing completed levels from localStorage:', parseError);
                completedLevels = [];
            }
            
            console.log("Current completed levels before save:", completedLevels);
            
            if (!completedLevels.includes(numLevelId)) {
                completedLevels.push(numLevelId);
                try {
                    localStorage.setItem('tts-completed-levels', JSON.stringify(completedLevels));
                    console.log(`✅ Level ${numLevelId} saved as completed`);
                    console.log("Updated completed levels:", completedLevels);
                } catch (storageError) {
                    console.error('Error saving to localStorage:', storageError);
                }
            } else {
                console.log(`Level ${numLevelId} already marked as completed`);
            }
        } catch (error) {
            console.error('Error in saveCompletedLevel:', error);
        }
    }

    async function loadLevel(levelId) {
        try {
            const response = await fetch(`levels/level_${String(levelId).padStart(6, '0')}.json`);
            if (!response.ok) {
                if (levelId > 1) {
                    // Show completion message and return to level selection
                    setTimeout(() => {
                        alert('Selamat! Anda telah mencapai level tertinggi. Nantikan pembaruan selanjutnya!');
                        setTimeout(() => {
                            window.location.href = '../../level-select.html';
                        }, 1000);
                    }, 500);
                } else {
                    throw new Error('Level 1 not found!');
                }
                return;
            }
            levelData = await response.json();
            currentLevelId = levelData.id;
            foundWords = [];
            bonusWords = [];
            isLevelAlreadyCompleted = isLevelCompleted(levelId); // Check if level was already completed
            levelNumberElement.textContent = levelData.id;
            
            // Add completion indicator to the level display
            updateLevelDisplay();
            
            // Reset counts for new level
            shuffleCount = 2;
            hintCount = 1;
            updateActionButtonsUI();

            // Load inventory
            loadInventory();

            renderGrid();
            renderLetterBank();
            updateFoundWordsUI();
            clearInput();
            
        } catch (error) {
            console.error("Error loading level:", error);
            if (levelId > 1) {
                // Fallback for Android devices
                setTimeout(() => {
                    alert('Selamat! Anda telah mencapai level tertinggi. Nantikan pembaruan selanjutnya!');
                    setTimeout(() => {
                        window.location.href = '../../level-select.html';
                    }, 1000);
                }, 500);
                return;
            }
            gridContainer.innerHTML = `<p style="color: red;">Gagal memuat level.</p>`;
        }
    }

    function renderGrid() {
        gridContainer.innerHTML = '';
        
        let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity;

        levelData.grid.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (cell !== '1') {
                    if (r < minRow) minRow = r;
                    if (r > maxRow) maxRow = r;
                    if (c < minCol) minCol = c;
                    if (c > maxCol) maxCol = c;
                }
            });
        });

        const padding = 2;
        const visibleMinRow = Math.max(0, minRow - padding);
        const visibleMaxRow = Math.min(levelData.grid.length - 1, maxRow + padding);
        const visibleMinCol = Math.max(0, minCol - padding);
        const visibleMaxCol = Math.min(levelData.grid[0].length - 1, maxCol + padding);

        const visibleCols = visibleMaxCol - visibleMinCol + 1;
        const visibleRows = visibleMaxRow - visibleMinRow + 1;

        // Calculate optimal cell size based on available space
        const containerWidth = window.innerWidth - 48; // Account for margins and padding
        const containerHeight = window.innerHeight * 0.5; // Max 50% of viewport height
        
        const maxCellWidth = Math.floor((containerWidth - (visibleCols * 2)) / visibleCols); // Account for gaps
        const maxCellHeight = Math.floor((containerHeight - (visibleRows * 2)) / visibleRows);
        
        const cellSize = Math.min(maxCellWidth, maxCellHeight, 35); // Max 35px
        
        // Update CSS custom property
        document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);

        gridContainer.style.gridTemplateColumns = `repeat(${visibleCols}, var(--cell-size))`;
        gridContainer.style.gridTemplateRows = `repeat(${visibleRows}, var(--cell-size))`;
        gridContainer.classList.add('grid-dynamic');

        for (let r = visibleMinRow; r <= visibleMaxRow; r++) {
            for (let c = visibleMinCol; c <= visibleMaxCol; c++) {
                const cell = levelData.grid[r][c];
                const cellDiv = document.createElement('div');
                cellDiv.classList.add('grid-cell');
                cellDiv.dataset.row = r;
                cellDiv.dataset.col = c;

                if (cell === '1') {
                    cellDiv.classList.add('background');
                } else {
                    cellDiv.classList.add('letter-box');
                    cellDiv.dataset.letter = cell;
                }
                gridContainer.appendChild(cellDiv);
            }
        }
    }

    function renderLetterBank() {
        letterBankContainer.innerHTML = '';
        const letters = [...levelData.random_letters];
        
        // Calculate optimal tile size based on screen width and number of letters
        calculateTileSize(letters.length);
        
        // Fisher-Yates shuffle
        for (let i = letters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [letters[i], letters[j]] = [letters[j], letters[i]];
        }

        letters.forEach((letter, index) => {
            const tile = document.createElement('div');
            tile.classList.add('letter-tile');
            tile.textContent = letter;
            tile.dataset.tileIndex = index;
            tile.addEventListener('click', () => handleLetterClick(letter, tile));
            letterBankContainer.appendChild(tile);
        });
    }
    
    function calculateTileSize(letterCount) {
        const bankContainer = letterBankContainer;
        const availableWidth = window.innerWidth - 70; // Account for margins and padding (35px * 2)
        const minGap = 1;
        const maxGap = 2;
        const minTileSize = 16;
        const maxTileSize = 30;
        
        // Calculate optimal tile size with more conservative approach
        let tileSize = Math.floor((availableWidth - (letterCount - 1) * minGap) / letterCount);
        
        // Apply scaling based on letter count to prevent oversizing
        if (letterCount <= 4) {
            tileSize = Math.min(tileSize, 30); // Max 30px for few letters
        } else if (letterCount <= 6) {
            tileSize = Math.min(tileSize, 25); // Max 25px for medium count
        } else if (letterCount <= 8) {
            tileSize = Math.min(tileSize, 22); // Max 22px for more letters
        } else {
            tileSize = Math.min(tileSize, 20); // Max 20px for many letters
        }
        
        // Ensure tile size is within bounds
        tileSize = Math.max(minTileSize, Math.min(maxTileSize, tileSize));
        
        // Calculate gap based on remaining space, more conservative
        const totalTileWidth = tileSize * letterCount;
        const remainingSpace = availableWidth - totalTileWidth;
        let gap = letterCount > 1 ? remainingSpace / (letterCount - 1) : 0;
        gap = Math.max(minGap, Math.min(maxGap, gap));
        
        // Double check total width doesn't exceed available space
        const totalWidth = (tileSize * letterCount) + (gap * (letterCount - 1));
        if (totalWidth > availableWidth) {
            // Reduce tile size if still too wide
            tileSize = Math.floor((availableWidth - (letterCount - 1) * minGap) / letterCount);
            gap = minGap;
        }
        
        // Calculate input box size based on tile size and letter count
        calculateInputSize(tileSize, letterCount);
        
        // Update CSS custom properties
        document.documentElement.style.setProperty('--tile-size', `${tileSize}px`);
        document.documentElement.style.setProperty('--tile-gap', `${gap}px`);
        
        // Update letter bank gap
        if (bankContainer) {
            bankContainer.style.gap = `${gap}px`;
        }
    }
    
    function calculateInputSize(tileSize, letterCount) {
        // Base input height should be proportional to tile size but smaller
        const inputHeight = Math.max(25, Math.min(40, tileSize * 0.8));
        
        // Font size should be proportional to both tile size and available space
        const baseFontSize = Math.max(12, Math.min(18, tileSize * 0.35));
        
        // Adjust font size based on letter count for better fit
        let fontSize = baseFontSize;
        if (letterCount > 8) {
            fontSize = baseFontSize * 0.9;
        }
        if (letterCount > 12) {
            fontSize = baseFontSize * 0.8;
        }
        
        // Update CSS custom properties
        document.documentElement.style.setProperty('--input-height', `${inputHeight}px`);
        document.documentElement.style.setProperty('--input-font-size', `${fontSize}px`);
    }

    function handleLetterClick(letter, tile) {
        if (tile.classList.contains('used')) return;

        animationManager.bounceElement(tile);
        soundManager.playSound('click');

        tile.classList.add('used');
        currentInput.push({ letter, tile });
        updateCurrentWordUI();

        // Automatic submission check if enabled
        if (settingsManager.getSetting('autoSubmit')) {
        const word = currentInput.map(item => item.letter).join('');
        const isCorrect = levelData.words.includes(word) && !foundWords.includes(word);
        
        if (isCorrect) {
            // Check if it's a prefix for any other valid (and not yet found) words
            const isPrefix = levelData.words.some(w => w.length > word.length && w.startsWith(word) && !foundWords.includes(w));
            
            if (!isPrefix) {
                setTimeout(() => handleSubmit(), 200);
                }
            } else {
                // Check for KBBI bonus words
                checkKBBIBonus(word);
            }
        }
    }
    
    function updateCurrentWordUI() {
        currentWordContainer.textContent = currentInput.map(item => item.letter).join('');
    }

    // Cache DOM elements to improve performance
    let cachedUsedTiles = null;
    let lastUsedTilesUpdate = 0;
    const CACHE_DURATION = window.TTS_CONFIG?.DOM_CACHE_DURATION || 1000; // Cache duration from config
    
    function clearInput() {
        try {
            currentInput = [];
            updateCurrentWordUI();
            
            // Use cached tiles if available and recent
            const now = Date.now();
            if (cachedUsedTiles && (now - lastUsedTilesUpdate) < CACHE_DURATION) {
                cachedUsedTiles.forEach(tile => {
                    if (tile && tile.classList) {
                        tile.classList.remove('used');
                    }
                });
            } else {
                // Refresh cache
                const usedTiles = document.querySelectorAll('.letter-tile.used');
                cachedUsedTiles = Array.from(usedTiles);
                lastUsedTilesUpdate = now;
                
                cachedUsedTiles.forEach(tile => {
                    if (tile && tile.classList) {
                        tile.classList.remove('used');
                    }
                });
            }
        } catch (error) {
            console.error('Error in clearInput:', error);
            // Fallback to simple clear
            currentInput = [];
            if (typeof updateCurrentWordUI === 'function') {
                updateCurrentWordUI();
            }
        }
    }

    // Input validation and sanitization
    function validateAndSanitizeInput(input) {
        if (!input || !Array.isArray(input)) {
            console.warn('Invalid input provided to validateAndSanitizeInput');
            return '';
        }
        
        const word = input.map(item => {
            if (!item || typeof item.letter !== 'string') {
                console.warn('Invalid letter item:', item);
                return '';
            }
            return item.letter.toUpperCase().trim();
        }).join('');
        
        // Sanitize: only allow alphabetic characters
        return word.replace(/[^A-Z]/g, '');
    }

    function handleSubmit() {
        try {
            const word = validateAndSanitizeInput(currentInput);
            if (word.length === 0) return;

            // Validate levelData exists
            if (!levelData || !Array.isArray(levelData.words)) {
                console.error('Level data is invalid or missing');
                return;
            }

            if (levelData.words.includes(word) && !foundWords.includes(word)) {
            foundWords.push(word);
            
            // Only add score if level wasn't already completed
            if (!isLevelAlreadyCompleted) {
                currentScore += word.length; // Score based on word length
            }
            
            // Animate word reveal
            const wordCells = getWordCoordinates(word);
            if (wordCells.length > 0) {
                animationManager.revealWord(wordCells, word);
            }
            
            revealWordInGrid(word);
            updateFoundWordsUI();
            updateScoreDisplay();
            checkWinCondition();
            clearInput();
            
                soundManager.playSound('success');
            } else {
                // Check for KBBI bonus
                checkKBBIBonus(word);
                
                // Wrong word animation
                if (animationManager && typeof animationManager.shakeElement === 'function') {
                    animationManager.shakeElement(currentWordContainer);
                }
                if (soundManager && typeof soundManager.playSound === 'function') {
                    soundManager.playSound('error');
                }
                // Add some feedback for wrong word
                if (currentWordContainer) {
                    currentWordContainer.classList.add('shake');
                    setTimeout(() => {
                        if (currentWordContainer) {
                            currentWordContainer.classList.remove('shake');
                        }
                    }, 500);
                }
                clearInput();
            }
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            clearInput(); // Ensure UI is reset even on error
        }
    }
    
    function getWordCoordinates(word) {
        const wordChars = word.split('');
        const coords = [];

        // Find horizontal match
        for(let r = 0; r < levelData.grid.length; r++) {
            for (let c = 0; c <= levelData.grid[r].length - word.length; c++) {
                let match = true;
                for(let i = 0; i < word.length; i++) { if (levelData.grid[r][c+i] !== wordChars[i]) { match = false; break; } }
                const isExactWord = (c === 0 || levelData.grid[r][c-1] === '1') && (c + word.length === levelData.grid[r].length || levelData.grid[r][c+word.length] === '1');
                if (match && isExactWord) {
                    for(let i = 0; i < word.length; i++) { coords.push({ r, c: c + i }); }
                    return coords;
                }
            }
        }

        // Find vertical match
        for(let c = 0; c < levelData.grid[0].length; c++) {
            for (let r = 0; r <= levelData.grid.length - word.length; r++) {
                let match = true;
                for(let i = 0; i < word.length; i++) { if (levelData.grid[r+i][c] !== wordChars[i]) { match = false; break; } }
                const isExactWord = (r === 0 || levelData.grid[r-1][c] === '1') && (r + word.length === levelData.grid.length || levelData.grid[r+word.length][c] === '1');
                if (match && isExactWord) {
                    for(let i = 0; i < word.length; i++) { coords.push({ r: r + i, c }); }
                    return coords;
                }
            }
        }
        return [];
    }

    function useHint() {
        if (hintCount <= 0) return; // Exit if no hints left

        const remainingWords = levelData.words.filter(w => !foundWords.includes(w));
        if (remainingWords.length === 0) {
            alert("Semua kata telah ditemukan!");
            return;
        }

        let hintableCoords = [];
        remainingWords.forEach(word => {
            hintableCoords.push(...getWordCoordinates(word));
        });

        const revealedCells = [...gridContainer.querySelectorAll('.revealed')].map(cell => ({ r: parseInt(cell.dataset.row), c: parseInt(cell.dataset.col) }));

        const finalHintableCoords = hintableCoords.filter(coord => 
            !revealedCells.some(rc => rc.r === coord.r && rc.c === coord.c)
        );

        if (finalHintableCoords.length > 0) {
            const hintCoord = finalHintableCoords[Math.floor(Math.random() * finalHintableCoords.length)];
            const cellElement = gridContainer.querySelector(`[data-row='${hintCoord.r}'][data-col='${hintCoord.c}']`);
            if (cellElement) {
                cellElement.textContent = levelData.grid[hintCoord.r][hintCoord.c];
                cellElement.classList.add('revealed');
                
                hintCount--; // Decrement only on successful hint
                updateActionButtonsUI();
            }
        } else {
            alert("Tidak ada petunjuk lagi.");
        }
    }

    function revealWordInGrid(word) {
        const coords = getWordCoordinates(word);
        coords.forEach(coord => {
            const cell = gridContainer.querySelector(`[data-row='${coord.r}'][data-col='${coord.c}']`);
            if(cell) {
                cell.textContent = levelData.grid[coord.r][coord.c];
                cell.classList.add('revealed');
            }
        });
    }

    function updateFoundWordsUI() {
        foundWordsContainer.innerHTML = '';
        foundWords.forEach(word => {
            const wordSpan = document.createElement('span');
            wordSpan.textContent = word;
            foundWordsContainer.appendChild(wordSpan);
        });
    }

    function checkWinCondition() {
        if (foundWords.length === levelData.words.length) {
            // Only save score if this is the first time completing the level
            if (!isLevelAlreadyCompleted) {
            saveCompletedLevel(currentLevelId);
                saveScore(currentLevelId, currentScore);
                
                // --- UI UPDATE ---
                // Don't wait for the submission. Run it in the background.
                // This makes the UI feel instant for the user.
                updateGlobalLeaderboard().catch(err => {
                    console.error("Background submission failed:", err);
                    // The retry mechanism will handle this later.
                });
            }
            
            animationManager.levelComplete();
            
            // Show the next level prompt after animation
            const overlayDelay = window.TTS_CONFIG?.LOADING_OVERLAY_DELAY || 500;
            setTimeout(() => {
                const nextLevel = parseInt(currentLevelId, 10) + 1;
                let message;
                
                if (isLevelAlreadyCompleted) {
                    message = `Level ${currentLevelId} selesai ulang!\n\nLevel ini sudah pernah diselesaikan sebelumnya, jadi tidak ada poin tambahan.\nSkor Total: ${currentScore}\n\nLanjut ke Level ${nextLevel}?`;
                } else {
                    message = `Level ${currentLevelId} selesai!\nSkor Total: ${currentScore}\n\nSkor sedang dikirim ke leaderboard.\nLanjut ke Level ${nextLevel}?`;
                }
                
                if (confirm(message)) {
                    // Stop any ongoing sounds before loading next level
                    if (window.soundManager && typeof window.soundManager.stopAllSounds === 'function') {
                        window.soundManager.stopAllSounds();
                    }
                    window.location.href = `game.html?level=${nextLevel}`;
                } else {
                    window.location.href = '../../level-select.html';
                }
            }, overlayDelay); // Delay for the win animation to be appreciated
        }
    }
    
    // Helper function to create loading overlay
    function createLoadingOverlay(title, message) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
        `;
        
        overlay.innerHTML = `
            <div style="padding: 30px; background: rgba(255, 255, 255, 0.1); border-radius: 15px; backdrop-filter: blur(10px);">
                <div style="font-size: 1.4em; font-weight: bold; margin-bottom: 20px;">${title}</div>
                <div style="font-size: 1.1em; margin-bottom: 20px;">📡 ${message}</div>
                <div style="font-size: 0.9em; opacity: 0.8;">Harap tunggu...</div>
                <div style="margin-top: 15px;">
                    <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #ffffff30; border-top: 3px solid #ffffff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        return overlay;
    }

    // Add retry mechanism for failed submissions
    // Add flag to prevent race conditions in retry mechanism
    let isRetryInProgress = false;
    
    async function retryFailedSubmissions() {
        if (isRetryInProgress) {
            console.log("Retry already in progress, skipping...");
            return;
        }
        
        isRetryInProgress = true;
        console.log("🔄 Checking for failed submissions to retry...");
        
        try {
            // Validate localStorage data
            let scores, completedLevels;
            try {
                scores = JSON.parse(localStorage.getItem('tts-scores') || '{}');
                completedLevels = JSON.parse(localStorage.getItem('tts-completed-levels') || '[]');
            } catch (parseError) {
                console.error('Error parsing localStorage data:', parseError);
                return;
            }
            
            if (Object.keys(scores).length === 0 || completedLevels.length === 0) {
                console.log("No data to retry");
                return;
            }
            
            console.log("Attempting retry submission...");
            const success = await updateGlobalLeaderboard();
            
            if (success) {
                console.log("✅ Retry submission successful!");
                
                // Show success notification
                showRetrySuccessNotification();
            } else {
                console.log("❌ Retry submission still failing");
            }
        } catch (error) {
            console.error("Retry submission error:", error);
        } finally {
            isRetryInProgress = false;
        }
    }
    
    // Show success notification for retry
    function showRetrySuccessNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 1000;
            font-family: Arial, sans-serif;
            font-size: 0.9em;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center;">
                <span style="margin-right: 8px;">✅</span>
                <span>Skor berhasil dikirim ke leaderboard!</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Slide in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Slide out and remove
        const notificationDuration = window.TTS_CONFIG?.NOTIFICATION_DURATION || 3000;
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, notificationDuration);
    }

    async function updateGlobalLeaderboard() {
        try {
            console.log("=== Starting leaderboard update ===");
            
            // Get current scores and levels from localStorage with validation
            let scores = {};
            let completedLevels = [];
            
            try {
                const scoresData = localStorage.getItem('tts-scores');
                const levelsData = localStorage.getItem('tts-completed-levels');
                
                if (scoresData) {
                    const parsedScores = JSON.parse(scoresData);
                    if (typeof parsedScores === 'object' && parsedScores !== null) {
                        scores = parsedScores;
                    } else {
                        console.warn('Scores data is not a valid object, using empty object');
                    }
                }
                
                if (levelsData) {
                    const parsedLevels = JSON.parse(levelsData);
                    if (Array.isArray(parsedLevels)) {
                        completedLevels = parsedLevels;
                    } else {
                        console.warn('Completed levels data is not an array, using empty array');
                    }
                }
            } catch (parseError) {
                console.error('Error parsing localStorage data:', parseError);
                // Continue with empty data rather than failing completely
            }
            
            console.log("Local scores:", scores);
            console.log("Completed levels:", completedLevels);
            
            // Debug: Check individual score values with normalization
            console.log("=== Score Details ===");
            Object.entries(scores).forEach(([levelId, score]) => {
                const normalizedLevel = normalizeLevel(levelId);
                console.log(`Level ${levelId} -> ${normalizedLevel}: ${score} (type: ${typeof score})`);
            });
            
            // Calculate totals with validation and normalization
            let totalScore = 0;
            Object.entries(scores).forEach(([levelId, score]) => {
                const normalizedLevel = normalizeLevel(levelId);
                const numScore = Number(score);
                console.log(`Processing level ${normalizedLevel}, score: ${score} -> ${numScore} (valid: ${!isNaN(numScore) && numScore >= 0})`);
                if (!isNaN(numScore) && numScore >= 0) {
                    totalScore += numScore;
                }
            });
            
            // Find highest completed level with validation
            let highestLevel = 0;
            if (completedLevels.length > 0) {
                const validLevels = completedLevels
                    .map(level => normalizeLevel(level))
                    .filter(level => level > 0);
                
                if (validLevels.length > 0) {
                    highestLevel = Math.max(...validLevels);
                }
            }
            
            console.log("=== Final Calculations ===");
            console.log("Total score calculated:", totalScore);
            console.log("Highest level completed:", highestLevel);
            
            // Validate final data
            if (totalScore < 0 || highestLevel < 0) {
                throw new Error(`Invalid data: score=${totalScore}, level=${highestLevel}`);
            }
            
            // Additional check: ensure we have meaningful data
            if (totalScore === 0 && highestLevel === 0 && Object.keys(scores).length > 0) {
                console.warn("⚠️ Warning: Data exists but calculated values are 0");
                console.warn("Scores object:", scores);
                console.warn("Completed levels:", completedLevels);
            }
            
            // Submit to Firebase using the helper function from firebase-init.js
            if (typeof window.submitScoreToLeaderboard !== 'function') {
                throw new Error('Firebase submission function not available');
            }
            
            console.log("Submitting to Firebase...");
            await window.submitScoreToLeaderboard(totalScore, highestLevel);
            
            console.log("✅ Leaderboard update successful!");
            return true;
            
        } catch (error) {
            console.error("❌ Leaderboard update failed:", error);
            console.error("Error type:", error.constructor.name);
            console.error("Error message:", error.message);
            
            // Store failed submission for retry with error handling
            try {
                const failedSubmissions = JSON.parse(localStorage.getItem('tts-failed-submissions') || '[]');
                failedSubmissions.push({
                    timestamp: Date.now(),
                    scores: localStorage.getItem('tts-scores'),
                    completedLevels: localStorage.getItem('tts-completed-levels'),
                    error: error.message
                });
                localStorage.setItem('tts-failed-submissions', JSON.stringify(failedSubmissions));
                console.log('Stored failed submission for retry');
            } catch (storageError) {
                console.error('Error storing failed submission:', storageError);
            }
            
            return false;
        }
    }

    // KBBI bonus check function
    function checkKBBIBonus(word) {
        const minWordLength = window.TTS_CONFIG?.MIN_WORD_LENGTH || 3;
        if (word.length < minWordLength) {
            console.log(`Word too short for KBBI check (minimum: ${minWordLength})`);
            return;
        }

        console.log("=== KBBI Check ===");
        console.log("Checking word:", word);
        console.log("KBBI Database exists?", typeof window.KBBI_DATABASE_SET !== 'undefined');
        
        // Check if word exists in KBBI database
        if (window.KBBI_DATABASE_SET && window.KBBI_DATABASE_SET.has(word)) {
            console.log("✅ Word found in KBBI!");
            
            // Don't add duplicate bonus words
            if (bonusWords.includes(word)) {
                console.log("❌ Already found this bonus word");
                return;
            }
            
            bonusWords.push(word);
            
            // Only add score if level wasn't already completed
            if (!isLevelAlreadyCompleted) {
                currentScore += 1; // Bonus point
            }
            
            const bonusSpan = document.createElement('span');
            bonusSpan.textContent = word;
            bonusSpan.classList.add('bonus-word');
            foundWordsContainer.appendChild(bonusSpan);
            
            updateScoreDisplay();
            animationManager.createParticleEffect(bonusSpan, '#ff6b6b');
            soundManager.playSound('bonus');
            
            if (isLevelAlreadyCompleted) {
                showBonusMessage(word, true); // Pass true to indicate no points awarded
            } else {
                showBonusMessage(word, false);
            }
        } else {
            console.log("❌ Not a bonus word");
        }
        console.log("=== End KBBI Check ===");
    }
    
    function showBonusMessage(word, noPoints = false) {
        const message = document.createElement('div');
        if (noPoints) {
            message.textContent = `Bonus! "${word}" ditemukan di KBBI (no poin - level sudah selesai)`;
        } else {
            message.textContent = `Bonus! "${word}" ditemukan di KBBI (+1 poin)`;
        }
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            font-weight: bold;
            z-index: 1500;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(message);
        
        message.animate([
            { opacity: 0, transform: 'translate(-50%, -50%) scale(0.5)' },
            { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' }
        ], { duration: 300, easing: 'ease-out' });
        
        const bonusMessageDuration = (window.TTS_CONFIG?.NOTIFICATION_DURATION || 3000) - 1000; // Slightly shorter than notifications
        setTimeout(() => {
            message.animate([
                { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
                { opacity: 0, transform: 'translate(-50%, -50%) scale(0.5)' }
            ], { duration: 300 }).onfinish = () => {
                message.remove();
            };
        }, bonusMessageDuration);
    }
    
    function updateScoreDisplay() {
        if (scoreDisplay) {
            if (isLevelAlreadyCompleted) {
                scoreDisplay.textContent = `Skor Total: ${currentScore} (Level sudah selesai)`;
                scoreDisplay.style.color = '#888'; // Gray out the score
            } else {
                scoreDisplay.textContent = `Skor Total: ${currentScore}`;
                scoreDisplay.style.color = ''; // Reset to default color
            }
        }
    }
    
    function saveScore(levelId, score) {
        try {
            console.log(`=== Saving Score ===`);
            console.log(`Level ID: ${levelId} (type: ${typeof levelId})`);
            console.log(`Score: ${score} (type: ${typeof score})`);
            
            // Normalize and validate inputs
            const normalizedLevel = normalizeLevel(levelId);
            const numScore = Number(score);
            
            const maxScore = window.TTS_CONFIG?.MAX_SCORE_VALUE || 999999;
            if (isNaN(numScore) || numScore < 0 || numScore > maxScore) {
                console.error(`Invalid score: ${score} (must be between 0 and ${maxScore})`);
                return;
            }
            
            console.log(`Normalized Level: ${normalizedLevel}, Score: ${numScore}`);
            
            // Get and validate existing scores
            let scores = {};
            try {
                const scoresData = localStorage.getItem('tts-scores');
                if (scoresData) {
                    const parsedScores = JSON.parse(scoresData);
                    if (typeof parsedScores === 'object' && parsedScores !== null) {
                        scores = parsedScores;
                    } else {
                        console.warn('Existing scores data is not valid, using empty object');
                    }
                }
            } catch (parseError) {
                console.error('Error parsing existing scores:', parseError);
                scores = {};
            }
            
            console.log("Current scores before save:", scores);
            
            // Use normalized level as string key for consistent storage
            const levelKey = String(normalizedLevel);
            
            if (!scores[levelKey] || scores[levelKey] < numScore) {
                scores[levelKey] = numScore;
                try {
                    localStorage.setItem('tts-scores', JSON.stringify(scores));
                    console.log(`✅ Score saved successfully for level ${levelKey}: ${numScore}`);
                    console.log("Updated scores:", scores);
                } catch (storageError) {
                    console.error('Error saving scores to localStorage:', storageError);
                }
            } else {
                console.log(`Score not saved - existing score ${scores[levelKey]} is higher than or equal to ${numScore}`);
            }
        } catch (error) {
            console.error('Error in saveScore:', error);
        }
    }
    
    function loadScore(levelId) {
        try {
            // Normalize level ID for consistent lookup
            const normalizedLevel = normalizeLevel(levelId);
            const levelKey = String(normalizedLevel);
            
            // Get and validate scores data
            let scores = {};
            try {
                const scoresData = localStorage.getItem('tts-scores');
                if (scoresData) {
                    const parsedScores = JSON.parse(scoresData);
                    if (typeof parsedScores === 'object' && parsedScores !== null) {
                        scores = parsedScores;
                    }
                }
            } catch (parseError) {
                console.error('Error parsing scores in loadScore:', parseError);
            }
            
            const score = scores[levelKey] || 0;
            console.log(`Loading score for level ${normalizedLevel}: ${score}`);
            return score;
        } catch (error) {
            console.error('Error in loadScore:', error);
            return 0;
        }
    }

    // Calculate total cumulative score from all completed levels with validation
    function calculateTotalScore() {
        try {
            // Get and validate scores data
            let scores = {};
            try {
                const scoresData = localStorage.getItem('tts-scores');
                if (scoresData) {
                    const parsedScores = JSON.parse(scoresData);
                    if (typeof parsedScores === 'object' && parsedScores !== null) {
                        scores = parsedScores;
                    } else {
                        console.warn('Scores data is not a valid object in calculateTotalScore');
                    }
                }
            } catch (parseError) {
                console.error('Error parsing scores in calculateTotalScore:', parseError);
            }
            
            let total = 0;
            Object.entries(scores).forEach(([levelId, score]) => {
                const normalizedLevel = normalizeLevel(levelId);
                const numScore = Number(score);
                if (!isNaN(numScore) && numScore >= 0) {
                    total += numScore;
                    console.log(`Adding to total - Level ${normalizedLevel}: ${numScore}`);
                } else {
                    console.warn(`Invalid score for level ${levelId}: ${score}`);
                }
            });
            
            console.log(`Total calculated score: ${total}`);
            return total;
        } catch (error) {
            console.error('Error in calculateTotalScore:', error);
            return 0;
        }
    }
    
    // Event Listeners
    clearButton.addEventListener('click', () => {
        clearInput();
        soundManager.playSound('click');
    });
    
    shuffleButton.addEventListener('click', () => {
        shuffleLetters();
        soundManager.playSound('click');
    });
    
    hintButton.addEventListener('click', () => {
        useHint();
        soundManager.playSound('click');
        animationManager.pulseElement(hintButton);
    });
    
    backButton.addEventListener('click', () => {
        window.location.href = '../../level-select.html';
        soundManager.playSound('click');
    });
    
    // Settings event listeners
    document.addEventListener('themeChanged', (e) => {
        console.log('Theme changed to:', e.detail.theme);
    });
    
    document.addEventListener('settingsChanged', (e) => {
        const settings = e.detail.settings;
        animationManager.setSoundEnabled(settings.soundEnabled);
        animationManager.setVibrationEnabled(settings.vibrationEnabled);
    });
    
    // Touch gesture support
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
        if (!touchStartX || !touchStartY) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        
        // Swipe threshold
        const threshold = 50;
        
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
            if (diffX > 0) {
                // Swipe left - shuffle
                renderLetterBank();
                soundManager.playSound('click');
            } else {
                // Swipe right - clear
                clearInput();
                soundManager.playSound('click');
            }
        }
        
        touchStartX = 0;
        touchStartY = 0;
    });
    
    // Window resize handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (levelData) {
                renderGrid();
                renderLetterBank();
            }
        }, 250);
    });
    
    // Initialize score display
    async function initializeGame() {
        const levelId = getLevelFromURL();
        isLevelAlreadyCompleted = isLevelCompleted(levelId);
        
        // Sync score from Firebase first, then calculate from localStorage
        await syncScoreFromFirebase();
        currentScore = calculateTotalScore();
        updateScoreDisplay();
    }
    
    // Call async initialization
    initializeGame();
    
    // Re-sync score and themes when user returns to the game (e.g., after shopping)
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden) {
            console.log('🔄 Page became visible, re-syncing score and themes...');
            await syncScoreFromFirebase();
            currentScore = calculateTotalScore();
            updateScoreDisplay();
            
            // Reload owned themes
            if (themeManager && themeManager.loadOwnedThemes) {
                await themeManager.loadOwnedThemes();
            }
        }
    });
    
    // Additional sync on window focus as backup
    window.addEventListener('focus', async () => {
        console.log('🔄 Window focused, re-syncing score and themes...');
        await syncScoreFromFirebase();
        currentScore = calculateTotalScore();
        updateScoreDisplay();
        
        // Reload owned themes
        if (themeManager && themeManager.loadOwnedThemes) {
            await themeManager.loadOwnedThemes();
        }
    });
    
    // Auto-retry failed submissions after game loads
    const retryDelay = window.TTS_CONFIG?.RETRY_DELAY || 3000;
    setTimeout(async () => {
        try {
            console.log("🔄 Auto-retry checking for pending submissions...");
            
            // Ensure user data structure is up to date
            if (window.ensureUserDataStructure) {
                await window.ensureUserDataStructure();
            }
            
            // Then retry failed submissions
            await retryFailedSubmissions();
        } catch (error) {
            console.error("Auto-retry error:", error);
        }
    }, retryDelay); // Wait for Firebase to initialize
    
    // Debug functions for testing localStorage data with validation
    window.debugLocalStorage = function() {
        console.log("=== LOCAL STORAGE DEBUG ===");
        
        // Get and validate data
        let scores = {};
        let completedLevels = [];
        
        try {
            const scoresData = localStorage.getItem('tts-scores');
            const levelsData = localStorage.getItem('tts-completed-levels');
            
            if (scoresData) {
                const parsedScores = JSON.parse(scoresData);
                if (typeof parsedScores === 'object' && parsedScores !== null) {
                    scores = parsedScores;
                } else {
                    console.warn('Scores data is not a valid object');
                }
            }
            
            if (levelsData) {
                const parsedLevels = JSON.parse(levelsData);
                if (Array.isArray(parsedLevels)) {
                    completedLevels = parsedLevels;
                } else {
                    console.warn('Completed levels data is not an array');
                }
            }
        } catch (parseError) {
            console.error('Error parsing localStorage data:', parseError);
        }
        
        console.log("Scores:", scores);
        console.log("Completed Levels:", completedLevels);
        
        // Calculate totals with normalization
        let totalScore = 0;
        Object.entries(scores).forEach(([levelId, score]) => {
            const normalizedLevel = normalizeLevel(levelId);
            const numScore = Number(score);
            console.log(`Level ${levelId} -> ${normalizedLevel}: ${score} -> ${numScore} (valid: ${!isNaN(numScore) && numScore >= 0})`);
            if (!isNaN(numScore) && numScore >= 0) {
                totalScore += numScore;
            }
        });
        
        // Find highest level with validation
        let highestLevel = 0;
        if (completedLevels.length > 0) {
            const validLevels = completedLevels
                .map(level => normalizeLevel(level))
                .filter(level => level > 0);
            
            if (validLevels.length > 0) {
                highestLevel = Math.max(...validLevels);
            }
        }
        
        console.log("=== CALCULATED TOTALS ===");
        console.log("Total Score:", totalScore);
        console.log("Highest Level:", highestLevel);
        
        return { scores, completedLevels, totalScore, highestLevel };
    };
    
    window.clearGameData = function() {
        if (confirm("Hapus semua data game dari localStorage?")) {
            localStorage.removeItem('tts-scores');
            localStorage.removeItem('tts-completed-levels');
            console.log("✅ Game data cleared");
            location.reload();
        }
    };
    
    // Debug function to check score synchronization
    window.debugScoreSync = async function() {
        console.log("=== SCORE SYNC DEBUG ===");
        
        // Check localStorage
        const localScores = JSON.parse(localStorage.getItem('tts-scores') || '{}');
        const localTotal = Object.values(localScores).reduce((total, score) => total + Number(score), 0);
        console.log("📱 localStorage scores:", localScores);
        console.log("📱 localStorage total:", localTotal);
        
        // Check Firebase
        if (window.currentUserId && window.db) {
            try {
                const userRef = window.db.collection('users').doc(window.currentUserId);
                const userDoc = await userRef.get();
                
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    console.log("🔥 Firebase userData:", userData);
                    console.log("🔥 Firebase totalScore:", userData.totalScore || 0);
                } else {
                    console.log("🔥 No Firebase document found");
                }
            } catch (error) {
                console.error("🔥 Firebase error:", error);
            }
        } else {
            console.log("🔥 Firebase not ready");
        }
        
        // Check current game state
        console.log("🎮 Current game score:", currentScore);
        
        return { localScores, localTotal, currentScore };
    };
    
    // Force sync function for debugging
    window.forceScoreSync = async function() {
        console.log("🔄 Forcing score sync...");
        await syncScoreFromFirebase();
        currentScore = calculateTotalScore();
        updateScoreDisplay();
        console.log("✅ Force sync completed. New score:", currentScore);
    };
    
    // Make useInventoryItem and toggleInventoryPopup globally accessible
    window.useInventoryItem = useInventoryItem;
    window.toggleInventoryPopup = toggleInventoryPopup;
    
    // Initial Load
    loadLevel(getLevelFromURL());
});

// Global functions for settings panel
function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    const isHidden = panel.classList.contains('hidden');
    
    if (isHidden) {
        panel.classList.remove('hidden');
        loadSettingsUI();
    } else {
        panel.classList.add('hidden');
    }
}

// Listen for sound pack and animation effects changes to reload settings
document.addEventListener('DOMContentLoaded', () => {
    // Listen for sound pack changes
    document.addEventListener('soundPackChanged', () => {
        const panel = document.getElementById('settings-panel');
        if (panel && !panel.classList.contains('hidden')) {
            loadSettingsUI();
        }
    });
    
    // Listen for animation effects changes
    document.addEventListener('animationEffectsChanged', () => {
        const panel = document.getElementById('settings-panel');
        if (panel && !panel.classList.contains('hidden')) {
            loadSettingsUI();
        }
    });
    
    // Listen for storage changes (when items are purchased)
    window.addEventListener('storage', (e) => {
        if (e.key === 'tts-sound-packs' || e.key === 'tts-animation-effects') {
            const panel = document.getElementById('settings-panel');
            if (panel && !panel.classList.contains('hidden')) {
                setTimeout(() => loadSettingsUI(), 100); // Small delay to ensure data is loaded
            }
        }
    });
});

function loadSettingsUI() {
    const themeSelect = document.getElementById('theme-select');
    const fontSizeSelect = document.getElementById('font-size-select');
    const soundToggle = document.getElementById('sound-toggle');
    const soundPackSelect = document.getElementById('sound-pack-select');
    const animationEffectsSelect = document.getElementById('animation-effects-select');
    const vibrationToggle = document.getElementById('vibration-toggle');
    const highContrastToggle = document.getElementById('high-contrast-toggle');
    const autoSubmitToggle = document.getElementById('auto-submit-toggle');
    
    // Get current settings
    const themeManager = window.themeManager || new ThemeManager();
    const settingsManager = window.settingsManager || new SettingsManager();
    
    // Update theme options to show only owned themes
    const availableThemes = themeManager.getAvailableThemes();
    themeSelect.innerHTML = '';
    availableThemes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme.key;
        option.textContent = theme.name;
        themeSelect.appendChild(option);
    });
    
    // Update sound pack options to show only owned sound packs
    if (window.soundPackManager) {
        const availableSoundPacks = window.soundPackManager.getAvailablePacks();
        soundPackSelect.innerHTML = '';
        availableSoundPacks.forEach(pack => {
            const option = document.createElement('option');
            option.value = pack.key;
            option.textContent = pack.name;
            soundPackSelect.appendChild(option);
        });
    }
    
    // Update animation effects options to show only owned effects
    if (window.animationEffectsManager) {
        const availableEffects = window.animationEffectsManager.getAvailableEffectPacks();
        animationEffectsSelect.innerHTML = '';
        
        // Always add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = 'default';
        defaultOption.textContent = 'Default Effects';
        animationEffectsSelect.appendChild(defaultOption);
        
        // Add owned effects
        availableEffects.forEach(effect => {
            if (effect.key !== 'default') {
                const option = document.createElement('option');
                option.value = effect.key;
                option.textContent = effect.name;
                animationEffectsSelect.appendChild(option);
            }
        });
    }
    
    // Load current values
    themeSelect.value = themeManager.getCurrentTheme();
    fontSizeSelect.value = settingsManager.getSetting('fontSize');
    soundToggle.checked = settingsManager.getSetting('soundEnabled');
    if (window.soundPackManager) {
        soundPackSelect.value = window.soundPackManager.getActivePack();
    }
    if (window.animationEffectsManager) {
        animationEffectsSelect.value = window.animationEffectsManager.getActiveEffectPack();
    }
    vibrationToggle.checked = settingsManager.getSetting('vibrationEnabled');
    highContrastToggle.checked = settingsManager.getSetting('highContrast');
    autoSubmitToggle.checked = settingsManager.getSetting('autoSubmit');
    
    // Add event listeners
    themeSelect.addEventListener('change', (e) => {
        themeManager.applyTheme(e.target.value);
    });
    
    fontSizeSelect.addEventListener('change', (e) => {
        settingsManager.updateSetting('fontSize', e.target.value);
    });
    
    soundToggle.addEventListener('change', (e) => {
        settingsManager.updateSetting('soundEnabled', e.target.checked);
    });
    
    if (soundPackSelect && window.soundPackManager) {
        soundPackSelect.addEventListener('change', (e) => {
            window.soundPackManager.setActivePack(e.target.value);
        });
    }
    
    if (animationEffectsSelect && window.animationEffectsManager) {
        animationEffectsSelect.addEventListener('change', (e) => {
            window.animationEffectsManager.setActiveEffectPack(e.target.value);
        });
    }
    
    vibrationToggle.addEventListener('change', (e) => {
        settingsManager.updateSetting('vibrationEnabled', e.target.checked);
    });
    
    highContrastToggle.addEventListener('change', (e) => {
        settingsManager.updateSetting('highContrast', e.target.checked);
    });
    
    autoSubmitToggle.addEventListener('change', (e) => {
        settingsManager.updateSetting('autoSubmit', e.target.checked);
    });
}

function shuffleLetters() {
    if (shuffleCount <= 0) return;
    shuffleCount--;
    renderLetterBank();
    soundManager.playSound('click');
    updateActionButtonsUI();
}