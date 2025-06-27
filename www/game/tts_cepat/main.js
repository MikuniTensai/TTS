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
    
    // Initialize managers
    const themeManager = new ThemeManager();
    const settingsManager = new SettingsManager();
    const animationManager = new AnimationManager();
    const soundManager = new SoundManager();
    
    // Apply initial settings
    settingsManager.applySettings();
    animationManager.setSoundEnabled(settingsManager.getSetting('soundEnabled'));
    animationManager.setVibrationEnabled(settingsManager.getSetting('vibrationEnabled'));

    // Get level from URL parameter
    function getLevelFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return parseInt(urlParams.get('level')) || 1;
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

    // Save completed level to localStorage
    function saveCompletedLevel(levelId) {
        console.log(`=== Saving Completed Level ===`);
        console.log(`Level ID: ${levelId} (type: ${typeof levelId})`);
        
        const completedLevels = JSON.parse(localStorage.getItem('tts-completed-levels') || '[]');
        console.log("Current completed levels before save:", completedLevels);
        
        // Ensure levelId is a number for consistent storage
        const numLevelId = Number(levelId);
        console.log(`Converted Level ID: ${numLevelId}`);
        
        if (!completedLevels.includes(numLevelId)) {
            completedLevels.push(numLevelId);
            localStorage.setItem('tts-completed-levels', JSON.stringify(completedLevels));
            console.log(`✅ Level ${numLevelId} saved as completed`);
            console.log("Updated completed levels:", completedLevels);
        } else {
            console.log(`Level ${numLevelId} already marked as completed`);
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
                            window.location.href = '../level-select.html';
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
            isLevelAlreadyCompleted = isLevelCompleted(levelId); // Check if level was already completed
            levelNumberElement.textContent = levelData.id;
            
            // Add completion indicator to the level display
            updateLevelDisplay();
            
            renderGrid();
            renderLetterBank();
            updateFoundWordsUI();
            clearInput();
        } catch (error) {
            if (levelId > 1) {
                // Fallback for Android devices
                setTimeout(() => {
                    alert('Selamat! Anda telah mencapai level tertinggi. Nantikan pembaruan selanjutnya!');
                    setTimeout(() => {
                        window.location.href = '../level-select.html';
                    }, 1000);
                }, 500);
                return;
            }
            console.error("Error loading level:", error);
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

    function clearInput() {
        currentInput = [];
        updateCurrentWordUI();
        document.querySelectorAll('.letter-tile.used').forEach(t => t.classList.remove('used'));
    }

    function handleSubmit() {
        const word = currentInput.map(item => item.letter).join('');
        if (word.length === 0) return;

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
            animationManager.shakeElement(currentWordContainer);
            soundManager.playSound('error');
            // Add some feedback for wrong word
            currentWordContainer.classList.add('shake');
            setTimeout(() => currentWordContainer.classList.remove('shake'), 500);
            clearInput();
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
            
            // Show the next level prompt immediately.
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
            }, 500); // A small delay for the win animation to be appreciated.
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
    async function retryFailedSubmissions() {
        console.log("🔄 Checking for failed submissions to retry...");
        
        try {
            // Check if there are scores to submit
            const scores = JSON.parse(localStorage.getItem('tts-scores') || '{}');
            const completedLevels = JSON.parse(localStorage.getItem('tts-completed-levels') || '[]');
            
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
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    async function updateGlobalLeaderboard() {
        try {
            console.log("=== Starting leaderboard update ===");
            
            // Get current scores and levels from localStorage
            const scores = JSON.parse(localStorage.getItem('tts-scores') || '{}');
            const completedLevels = JSON.parse(localStorage.getItem('tts-completed-levels') || '[]');
            
            console.log("Local scores:", scores);
            console.log("Completed levels:", completedLevels);
            
            // Debug: Check individual score values
            console.log("=== Score Details ===");
            Object.entries(scores).forEach(([levelId, score]) => {
                console.log(`Level ${levelId}: ${score} (type: ${typeof score})`);
            });
            
            // Calculate totals with more detailed logging
            let totalScore = 0;
            Object.values(scores).forEach(score => {
                const numScore = Number(score);
                console.log(`Processing score: ${score} -> ${numScore} (valid: ${!isNaN(numScore)})`);
                if (!isNaN(numScore) && numScore >= 0) {
                    totalScore += numScore;
                }
            });
            
            const highestLevel = completedLevels.length > 0 ? Math.max(...completedLevels) : 0;
            
            console.log("=== Final Calculations ===");
            console.log("Total score calculated:", totalScore);
            console.log("Highest level completed:", highestLevel);
            
            // Validate data
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
            console.log("Submitting to Firebase...");
            await window.submitScoreToLeaderboard(totalScore, highestLevel);
            
            console.log("✅ Leaderboard update successful!");
            return true;
            
        } catch (error) {
            console.error("❌ Leaderboard update failed:", error);
            console.error("Error type:", error.constructor.name);
            console.error("Error message:", error.message);
            return false;
        }
    }

    // KBBI bonus check function
    function checkKBBIBonus(word) {
        console.log(`=== KBBI Bonus Check for "${word}" ===`);
        console.log("Word length:", word.length);
        
        if (word.length < 3) {
            console.log("❌ Word too short (< 3 letters)");
            return;
        }

        let isBonusWord = false;
        
        // Check if it's a Set (ideal) or an Array (fallback)
        if (window.KBBI_DATABASE_SET && typeof window.KBBI_DATABASE_SET.has === 'function') {
            console.log("✓ Using KBBI_DATABASE_SET (Set)");
            isBonusWord = window.KBBI_DATABASE_SET.has(word);
            console.log("Set contains word?", isBonusWord);
        } else if (Array.isArray(window.KBBI_DATABASE)) {
            console.log("✓ Using KBBI_DATABASE (Array)");
            isBonusWord = window.KBBI_DATABASE.includes(word);
            console.log("Array contains word?", isBonusWord);
        } else {
            console.log("❌ No KBBI database available!");
            return;
        }

        console.log("Already in bonus words?", bonusWords.includes(word));
        console.log("In level answers?", levelData.words.includes(word));
        
        if (isBonusWord && !bonusWords.includes(word) && !levelData.words.includes(word)) {
            console.log("🎉 BONUS WORD FOUND! Adding bonus...");
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
        
                setTimeout(() => {
            message.animate([
                { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
                { opacity: 0, transform: 'translate(-50%, -50%) scale(0.5)' }
            ], { duration: 300 }).onfinish = () => {
                message.remove();
            };
        }, 2000);
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
        console.log(`=== Saving Score ===`);
        console.log(`Level ID: ${levelId} (type: ${typeof levelId})`);
        console.log(`Score: ${score} (type: ${typeof score})`);
        
        const scores = JSON.parse(localStorage.getItem('tts-scores') || '{}');
        console.log("Current scores before save:", scores);
        
        // Ensure levelId is a string for consistent storage
        const levelKey = String(levelId);
        const numScore = Number(score);
        
        console.log(`Converted - Level key: ${levelKey}, Score: ${numScore}`);
        
        if (!scores[levelKey] || scores[levelKey] < numScore) {
            scores[levelKey] = numScore;
            localStorage.setItem('tts-scores', JSON.stringify(scores));
            console.log(`✅ Score saved successfully for level ${levelKey}: ${numScore}`);
            console.log("Updated scores:", scores);
        } else {
            console.log(`Score not saved - existing score ${scores[levelKey]} is higher than or equal to ${numScore}`);
        }
    }
    
    function loadScore(levelId) {
        const scores = JSON.parse(localStorage.getItem('tts-scores') || '{}');
        return scores[levelId] || 0;
    }

    // Calculate total cumulative score from all completed levels
    function calculateTotalScore() {
        const scores = JSON.parse(localStorage.getItem('tts-scores') || '{}');
        let total = 0;
        Object.values(scores).forEach(score => {
            const numScore = Number(score);
            if (!isNaN(numScore)) {
                total += numScore;
            }
        });
        return total;
    }
    
    // Event Listeners
    shuffleButton.addEventListener('click', () => {
        renderLetterBank();
        soundManager.playSound('click');
    });
    
    clearButton.addEventListener('click', () => {
        clearInput();
        soundManager.playSound('click');
    });
    
    hintButton.addEventListener('click', () => {
        useHint();
        soundManager.playSound('click');
        animationManager.pulseElement(hintButton);
    });
    
    backButton.addEventListener('click', () => {
        window.location.href = '../../level-select.html';
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
    const levelId = getLevelFromURL();
    isLevelAlreadyCompleted = isLevelCompleted(levelId);
    
    // Start with total cumulative score from all completed levels
    currentScore = calculateTotalScore();
    updateScoreDisplay();
    
    // Auto-retry failed submissions after game loads
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
    }, 3000); // Wait 3 seconds for Firebase to initialize
    
    // Debug functions for testing localStorage data
    window.debugLocalStorage = function() {
        console.log("=== LOCAL STORAGE DEBUG ===");
        const scores = JSON.parse(localStorage.getItem('tts-scores') || '{}');
        const completedLevels = JSON.parse(localStorage.getItem('tts-completed-levels') || '[]');
        
        console.log("Scores:", scores);
        console.log("Completed Levels:", completedLevels);
        
        // Calculate totals
        let totalScore = 0;
        Object.entries(scores).forEach(([levelId, score]) => {
            const numScore = Number(score);
            console.log(`Level ${levelId}: ${score} -> ${numScore}`);
            if (!isNaN(numScore)) totalScore += numScore;
        });
        
        const highestLevel = completedLevels.length > 0 ? Math.max(...completedLevels) : 0;
        
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

function loadSettingsUI() {
    const themeSelect = document.getElementById('theme-select');
    const fontSizeSelect = document.getElementById('font-size-select');
    const soundToggle = document.getElementById('sound-toggle');
    const vibrationToggle = document.getElementById('vibration-toggle');
    const highContrastToggle = document.getElementById('high-contrast-toggle');
    const autoSubmitToggle = document.getElementById('auto-submit-toggle');
    
    // Get current settings
    const themeManager = window.themeManager || new ThemeManager();
    const settingsManager = window.settingsManager || new SettingsManager();
    
    // Load current values
    themeSelect.value = themeManager.getCurrentTheme();
    fontSizeSelect.value = settingsManager.getSetting('fontSize');
    soundToggle.checked = settingsManager.getSetting('soundEnabled');
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