document.addEventListener('DOMContentLoaded', function() {
    let currentScore = 0;
    let inventory = {
        shuffle: 0,
        hint: 0
    };

    // Initialize shop
    loadPlayerData();

    async function loadPlayerData() {
        try {
            // Get total score from localStorage
            const scores = JSON.parse(localStorage.getItem('tts-scores') || '{}');
            currentScore = Object.values(scores).reduce((total, score) => total + Number(score), 0);
            
            // Get inventory from localStorage
            const savedInventory = JSON.parse(localStorage.getItem('tts-inventory') || '{}');
            inventory = {
                shuffle: savedInventory.shuffle || 0,
                hint: savedInventory.hint || 0
            };

            updateUI();
        } catch (error) {
            console.error('Error loading player data:', error);
            showMessage('Error memuat data pemain', 'error');
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
        
        if (inventory.shuffle === 0 && inventory.hint === 0) {
            inventoryContainer.innerHTML = '<div class="loading">Inventory kosong</div>';
            return;
        }
        
        let inventoryHTML = '';
        
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
        
        inventoryContainer.innerHTML = inventoryHTML;
    }

    function updateBuyButtons() {
        const buyButtons = document.querySelectorAll('.buy-button');
        buyButtons.forEach((button, index) => {
            const price = index === 0 ? 10 : 15; // shuffle = 10, hint = 15
            button.disabled = currentScore < price;
        });
    }

    window.buyItem = async function(itemType, price) {
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
            
            // Save to localStorage
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
            updateUI();
        }
    };

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

    // Load inventory from Firebase when available
    setTimeout(async () => {
        try {
            if (window.ensureUserDataStructure) {
                await window.ensureUserDataStructure();
                
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
                        updateUI();
                    }
                }
            }
        } catch (error) {
            console.error('Error loading inventory from Firebase:', error);
        }
    }, 2000);
}); 