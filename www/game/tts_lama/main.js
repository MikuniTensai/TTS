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

    let levelData;
    let currentInput = []; // { letter: 'A', tileIndex: 0 }
    let foundWords = [];
    let currentLevelId = 1;

    // Get level from URL parameter
    function getLevelFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return parseInt(urlParams.get('level')) || 1;
    }

    // Save completed level to localStorage
    function saveCompletedLevel(levelId) {
        const completedLevels = JSON.parse(localStorage.getItem('tts-completed-levels') || '[]');
        if (!completedLevels.includes(levelId)) {
            completedLevels.push(levelId);
            localStorage.setItem('tts-completed-levels', JSON.stringify(completedLevels));
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
            levelNumberElement.textContent = levelData.id;
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

        const padding = 3;
        const visibleMinRow = Math.max(0, minRow - padding);
        const visibleMaxRow = Math.min(levelData.grid.length - 1, maxRow + padding);
        const visibleMinCol = Math.max(0, minCol - padding);
        const visibleMaxCol = Math.min(levelData.grid[0].length - 1, maxCol + padding);

        const visibleCols = visibleMaxCol - visibleMinCol + 1;
        const visibleRows = visibleMaxRow - visibleMinRow + 1;

        gridContainer.style.gridTemplateColumns = `repeat(${visibleCols}, var(--cell-size))`;
        gridContainer.style.gridTemplateRows = `repeat(${visibleRows}, var(--cell-size))`;

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

    function handleLetterClick(letter, tile) {
        if (tile.classList.contains('used')) return;

        tile.classList.add('used');
        currentInput.push({ letter, tile });
        updateCurrentWordUI();

        // Automatic submission check
        const word = currentInput.map(item => item.letter).join('');
        const isCorrect = levelData.words.includes(word) && !foundWords.includes(word);
        
        if (isCorrect) {
            // Check if it's a prefix for any other valid (and not yet found) words
            const isPrefix = levelData.words.some(w => w.length > word.length && w.startsWith(word) && !foundWords.includes(w));
            
            if (!isPrefix) {
                setTimeout(() => handleSubmit(), 200);
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
            revealWordInGrid(word);
            updateFoundWordsUI();
            checkWinCondition();
            clearInput();
        } else {
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
            // Save completed level
            saveCompletedLevel(currentLevelId);
            
            setTimeout(() => {
                alert('Level Selesai!');
                // Add delay before attempting to load next level
                setTimeout(() => {
                    loadLevel(levelData.id + 1);
                }, 1000);
            }, 500);
        }
    }
    
    // Event Listeners
    shuffleButton.addEventListener('click', renderLetterBank);
    clearButton.addEventListener('click', clearInput);
    hintButton.addEventListener('click', useHint);
    backButton.addEventListener('click', () => {
        // This will navigate back to the level selection
        window.location.href = 'index.html';
    });
    
    // Initial Load
    loadLevel(getLevelFromURL());
});
