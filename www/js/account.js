// Account Management UI Handler
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const userNicknameSpan = document.getElementById('user-nickname');
    const totalScoreSpan = document.getElementById('total-score');
    const highestLevelSpan = document.getElementById('highest-level');
    const completedLevelsSpan = document.getElementById('completed-levels');
    const whatsappNumberSpan = document.getElementById('whatsapp-number');
    const dataStatusDiv = document.getElementById('data-status');
    
    // Buttons
    const editNicknameBtn = document.getElementById('edit-nickname-btn');
    const editWhatsappBtn = document.getElementById('edit-whatsapp-btn');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const downloadBackupBtn = document.getElementById('download-backup-btn');
    const validateDataBtn = document.getElementById('validate-data-btn');
    const resetProgressBtn = document.getElementById('reset-progress-btn');
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const findDuplicatesBtn = document.getElementById('find-duplicates-btn');
    const cleanupInactiveBtn = document.getElementById('cleanup-inactive-btn');
    
    // Modal elements
    const copyExportCodeBtn = document.getElementById('copy-export-code');
    const importExecuteBtn = document.getElementById('import-execute-btn');
    
    let currentUserId = null;

    // Initialize - wait for Firebase to be ready
    let initRetries = 0;
    const maxRetries = 10;
    
    async function initializeAccount() {
        try {
            // Check if Firebase is available
            if (typeof firebase === 'undefined' || !window.auth || !window.db) {
                if (initRetries < maxRetries) {
                    initRetries++;
                    console.log(`Waiting for Firebase... (attempt ${initRetries}/${maxRetries})`);
                    
                    // Update loading message
                    const loadingMsg = document.querySelector('#initial-loading p');
                    if (loadingMsg) {
                        loadingMsg.textContent = `Connecting to Firebase... (${initRetries}/${maxRetries})`;
                    }
                    
                    setTimeout(initializeAccount, 1000);
                    return;
                } else {
                    throw new Error('Firebase not available after maximum retries');
                }
            }
            
            // Hide initial loading overlay
            const initialLoading = document.getElementById('initial-loading');
            if (initialLoading) {
                initialLoading.style.display = 'none';
            }
            
            await loadUserData();
            await validateData();
        } catch (error) {
            console.error('Failed to initialize account page:', error);
            
            // Hide initial loading and show error
            const initialLoading = document.getElementById('initial-loading');
            if (initialLoading) {
                initialLoading.style.display = 'none';
            }
            
            showMessage('Failed to initialize account page. Please refresh.', 'error');
            hideLoading();
        }
    }
    
    // Start initialization
    initializeAccount();

    // Event Listeners
    editNicknameBtn.addEventListener('click', () => { soundManager.playSound('click'); editNickname(); });
    editWhatsappBtn.addEventListener('click', () => { soundManager.playSound('click'); editWhatsapp(); });
    exportBtn.addEventListener('click', () => { soundManager.playSound('click'); exportData(); });
    importBtn.addEventListener('click', () => { soundManager.playSound('click'); openModal('import-modal'); });
    downloadBackupBtn.addEventListener('click', () => { soundManager.playSound('click'); downloadBackup(); });
    validateDataBtn.addEventListener('click', () => { soundManager.playSound('click'); validateData(); });
    resetProgressBtn.addEventListener('click', () => { soundManager.playSound('click'); resetProgress(); });
    deleteAccountBtn.addEventListener('click', () => { soundManager.playSound('click'); deleteAccount(); });
    findDuplicatesBtn.addEventListener('click', () => { soundManager.playSound('click'); findDuplicateUsers(); });
    cleanupInactiveBtn.addEventListener('click', () => { soundManager.playSound('click'); cleanupInactiveUsers(); });
    copyExportCodeBtn.addEventListener('click', () => { soundManager.playSound('click'); copyExportCode(); });
    importExecuteBtn.addEventListener('click', () => { soundManager.playSound('click'); executeImport(); });

    // Edit WhatsApp number
    async function editWhatsapp() {
        try {
            const user = await waitForAuth();
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Get current WhatsApp number
            const userDoc = await window.db.collection('users').doc(user.uid).get();
            const currentNumber = userDoc.exists ? (userDoc.data().whatsappNumber || '') : '';

            // Prompt for new number
            const newNumber = prompt('Masukkan nomor WhatsApp:', currentNumber);
            
            // Validate input
            if (newNumber === null) return; // User cancelled
            
            // Basic validation
            const cleanNumber = newNumber.trim().replace(/[^0-9+]/g, '');
            if (cleanNumber === '') {
                showMessage('Nomor WhatsApp tidak valid', 'error');
                return;
            }

            showLoading('Menyimpan nomor WhatsApp...');

            // Update in Firebase
            await window.db.collection('users').doc(user.uid).update({
                whatsappNumber: cleanNumber,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update UI
            whatsappNumberSpan.textContent = cleanNumber || '-';
            showMessage('Nomor WhatsApp berhasil diperbarui', 'success');

        } catch (error) {
            console.error('Error updating WhatsApp number:', error);
            showMessage('Gagal memperbarui nomor WhatsApp', 'error');
        } finally {
            hideLoading();
        }
    }

    // Load user data and display
    async function loadUserData() {
        try {
            showLoading('Loading user data...');
            
            // Wait for authentication with detailed logging
            console.log('🔄 Waiting for authentication...');
            const user = await waitForAuth();
            if (!user) {
                throw new Error('Authentication failed - no user returned');
            }
            
            console.log('✅ User authenticated:', user.uid);
            currentUserId = user.uid;
            
            // Load from Firebase with fallback
            let userData = null;
            if (window.db) {
                try {
                    console.log('🔄 Loading user data from Firebase...');
                    const userDoc = await window.db.collection('users').doc(user.uid).get();
                    if (userDoc.exists) {
                        userData = userDoc.data();
                        console.log('✅ Firebase data loaded:', userData);
                    } else {
                        console.log('⚠️ User document does not exist in Firebase');
                    }
                } catch (firebaseError) {
                    console.error('❌ Firebase error:', firebaseError);
                    showMessage('Firebase connection issue, using local data only', 'warning');
                }
            }
            
            // Update UI with Firebase data or defaults
            if (userData) {
                userNicknameSpan.textContent = userData.nickname || 'Unknown';
                totalScoreSpan.textContent = userData.totalScore || 0;
                highestLevelSpan.textContent = userData.highestLevelCompleted || 0;
                whatsappNumberSpan.textContent = userData.whatsappNumber || '-';
            } else {
                // Fallback to defaults if no Firebase data
                userNicknameSpan.textContent = 'Unknown';
                totalScoreSpan.textContent = '0';
                highestLevelSpan.textContent = '0';
                whatsappNumberSpan.textContent = '-';
            }
            
            // Load from localStorage
            const completedLevels = JSON.parse(localStorage.getItem('tts-completed-levels') || '[]');
            completedLevelsSpan.textContent = completedLevels.length;
            
            console.log('✅ User data loaded successfully');
            hideLoading();
            
        } catch (error) {
            console.error('Failed to load user data:', error);
            showMessage('Failed to load user data', 'error');
            hideLoading();
        }
    }

    // Edit nickname
    async function editNickname() {
        try {
            const currentNickname = userNicknameSpan.textContent;
            let newNickname = prompt('Enter new nickname:', currentNickname);
            
            if (!newNickname || newNickname === currentNickname) {
                return;
            }
            
            // Trim and validate length
            newNickname = newNickname.trim();
            if (newNickname.length < 3 || newNickname.length > 20) {
                showMessage('Nickname must be 3-20 characters', 'error');
                return;
            }
            
            // Validate characters (alphanumeric + underscore only)
            if (!/^[a-zA-Z0-9_]+$/.test(newNickname)) {
                showMessage('Nickname can only contain letters, numbers, and underscores', 'error');
                return;
            }
            
            showLoading('Checking nickname availability...');
            
            // Check if nickname is unique
            const isUnique = await window.accountManager.checkNicknameUnique(newNickname, currentUserId);
            
            if (!isUnique) {
                hideLoading();
                
                // Generate suggestions
                showLoading('Generating suggestions...');
                const suggestion = await window.accountManager.generateUniqueNickname(newNickname);
                hideLoading();
                
                const usesSuggestion = confirm(
                    `❌ Nickname "${newNickname}" sudah digunakan!\n\n` +
                    `💡 Saran: "${suggestion}"\n\n` +
                    `Gunakan saran ini?`
                );
                
                if (usesSuggestion) {
                    newNickname = suggestion;
                } else {
                    showMessage('Nickname change cancelled', 'info');
                    return;
                }
            }
            
            showLoading('Updating nickname...');
            
            // Update in Firebase
            if (window.db && currentUserId) {
                await window.db.collection('users').doc(currentUserId).update({
                    nickname: newNickname,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            userNicknameSpan.textContent = newNickname;
            showMessage('✅ Nickname updated successfully!', 'success');
            hideLoading();
            
        } catch (error) {
            console.error('Error updating nickname:', error);
            showMessage('Failed to update nickname: ' + error.message, 'error');
            hideLoading();
        }
    }

    // Export data
    async function exportData() {
        try {
            // Confirm action
            if (!confirm('⚠️ PERINGATAN: Setelah export, akun ini akan direset dan Anda akan mulai dengan akun baru yang kosong. Pastikan Anda menyimpan kode export dengan aman!\n\nLanjutkan export?')) {
                return;
            }
            
            // Show initial loading message
            showLoading('Memulai proses export...');
            
            // Add timeout for the entire export process (60 seconds)
            const exportPromise = window.accountManager.generateExportCode();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Export timeout after 60 seconds')), 60000)
            );
            
            // Update loading message every few seconds
            let loadingStep = 0;
            const loadingMessages = [
                'Mengumpulkan data user...',
                'Membuat kode export...',
                'Menonaktifkan akun lama...',
                'Membuat akun baru...',
                'Menyelesaikan proses...'
            ];
            
            const loadingInterval = setInterval(() => {
                if (loadingStep < loadingMessages.length - 1) {
                    loadingStep++;
                    showLoading(loadingMessages[loadingStep]);
                }
            }, 8000); // Update every 8 seconds
            
            try {
                const exportCode = await Promise.race([exportPromise, timeoutPromise]);
                clearInterval(loadingInterval);
                
                document.getElementById('export-code').value = exportCode;
                openModal('export-modal');
                hideLoading();
                
                // Show success message
                showMessage('✅ Export berhasil! Akun lama telah dinonaktifkan dan akun baru telah dibuat.', 'success');
                
                // Reload page to show fresh state after modal is closed
                setTimeout(() => {
                    if (!document.getElementById('export-modal').classList.contains('hidden')) {
                        // Wait for user to close modal
                        const checkModal = setInterval(() => {
                            if (document.getElementById('export-modal').classList.contains('hidden')) {
                                clearInterval(checkModal);
                                window.location.reload();
                            }
                        }, 1000);
                    } else {
                        window.location.reload();
                    }
                }, 3000);
                
            } catch (exportError) {
                clearInterval(loadingInterval);
                throw exportError;
            }
            
        } catch (error) {
            console.error('Error exporting data:', error);
            
            // Provide user-friendly error messages
            let errorMessage = 'Gagal melakukan export. ';
            
            if (error.message.includes('timeout')) {
                errorMessage += 'Koneksi internet terlalu lambat. Silakan coba lagi dengan koneksi yang lebih stabil.';
            } else if (error.message.includes('authentication')) {
                errorMessage += 'Masalah autentikasi. Silakan refresh halaman dan coba lagi.';
            } else if (error.message.includes('network') || error.message.includes('offline')) {
                errorMessage += 'Tidak ada koneksi internet. Silakan periksa koneksi dan coba lagi.';
            } else if (error.step) {
                // Use the enhanced error message from account-manager
                errorMessage = error.message;
            } else {
                errorMessage += 'Silakan coba lagi atau periksa koneksi internet Anda.';
            }
            
            showMessage(errorMessage, 'error');
            hideLoading();
        }
    }

    // Copy export code
    function copyExportCode() {
        const exportCodeTextarea = document.getElementById('export-code');
        exportCodeTextarea.select();
        exportCodeTextarea.setSelectionRange(0, 99999); // For mobile
        
        try {
            document.execCommand('copy');
            showMessage('Export code copied to clipboard', 'success');
        } catch (error) {
            // Fallback for modern browsers
            navigator.clipboard.writeText(exportCodeTextarea.value).then(() => {
                showMessage('Export code copied to clipboard', 'success');
            }).catch(() => {
                showMessage('Failed to copy code', 'error');
            });
        }
    }

    // Execute import
    async function executeImport() {
        try {
            const importCode = document.getElementById('import-code').value.trim();
            const cleanupOldUser = document.getElementById('cleanup-old-user').checked;
            
            if (!importCode) {
                showMessage('Please enter an export code', 'error');
                return;
            }
            
            if (!confirm('Are you sure you want to import this data? This will merge with your current progress.')) {
                return;
            }
            
            showLoading('Importing data...');
            closeModal('import-modal');
            
            await window.accountManager.importFromCode(importCode, cleanupOldUser);
            
            showMessage('Data imported successfully! Reloading...', 'success');
            
            // Reload page after successful import
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Error importing data:', error);
            showMessage('Failed to import data: ' + error.message, 'error');
            hideLoading();
        }
    }

    // Download backup file
    async function downloadBackup() {
        try {
            showLoading('Creating backup file...');
            
            const filename = await window.accountManager.createBackupFile();
            showMessage(`Backup file downloaded: ${filename}`, 'success');
            hideLoading();
            
        } catch (error) {
            console.error('Error creating backup:', error);
            showMessage('Failed to create backup file', 'error');
            hideLoading();
        }
    }

    // Validate data
    async function validateData() {
        try {
            dataStatusDiv.innerHTML = '<span class="status-loading">Validating data...</span>';
            
            const isValid = await window.accountManager.validateData();
            
            if (isValid) {
                dataStatusDiv.innerHTML = '<span class="status-valid">✅ Data is valid and complete</span>';
            } else {
                dataStatusDiv.innerHTML = '<span class="status-invalid">⚠️ Data validation failed or incomplete</span>';
            }
            
        } catch (error) {
            console.error('Error validating data:', error);
            dataStatusDiv.innerHTML = '<span class="status-invalid">❌ Error validating data</span>';
        }
    }

    // Reset progress
    async function resetProgress() {
        const confirmation = prompt('Type "RESET" to confirm resetting all game progress:');
        
        if (confirmation !== 'RESET') {
            return;
        }
        
        try {
            showLoading('Resetting game progress...');
            
            // Clear localStorage
            localStorage.removeItem('tts-completed-levels');
            localStorage.removeItem('tts-scores');
            localStorage.removeItem('tts-inventory');
            
            // Reset Firebase data
            if (window.db && currentUserId) {
                await window.db.collection('users').doc(currentUserId).update({
                    totalScore: 0,
                    highestLevelCompleted: 0,
                    inventory: { shuffle: 0, hint: 0 },
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            
            showMessage('Game progress reset successfully! Reloading...', 'success');
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Error resetting progress:', error);
            showMessage('Failed to reset progress', 'error');
            hideLoading();
        }
    }

    // Delete account
    async function deleteAccount() {
        const confirmation1 = prompt('Type "DELETE" to confirm deleting all account data:');
        
        if (confirmation1 !== 'DELETE') {
            return;
        }
        
        const confirmation2 = confirm('This action cannot be undone. Are you absolutely sure?');
        
        if (!confirmation2) {
            return;
        }
        
        try {
            showLoading('Deleting account data...');
            
            // Clear all localStorage
            localStorage.clear();
            
            // Delete Firebase user data
            if (window.db && currentUserId) {
                await window.db.collection('users').doc(currentUserId).delete();
            }
            
            showMessage('Account data deleted successfully! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            
        } catch (error) {
            console.error('Error deleting account:', error);
            showMessage('Failed to delete account data', 'error');
            hideLoading();
        }
    }

    // Find duplicate users
    async function findDuplicateUsers() {
        try {
            showLoading('Searching for duplicate users...');
            
            const result = await window.accountManager.findAndMergeDuplicateUsers();
            
            const duplicateStatusDiv = document.getElementById('duplicate-status');
            duplicateStatusDiv.style.display = 'block';
            
            if (result.merged > 0) {
                duplicateStatusDiv.innerHTML = `<span class="status-valid">✅ Found and merged ${result.merged} duplicate users</span>`;
                showMessage(`Successfully merged ${result.merged} duplicate users`, 'success');
                
                // Reload data after merge
                setTimeout(() => {
                    loadUserData();
                }, 1000);
            } else {
                duplicateStatusDiv.innerHTML = `<span class="status-info">ℹ️ No duplicate users found</span>`;
                showMessage('No duplicate users found', 'info');
            }
            
            hideLoading();
            
        } catch (error) {
            console.error('Error finding duplicate users:', error);
            showMessage('Failed to find duplicate users: ' + error.message, 'error');
            
            const duplicateStatusDiv = document.getElementById('duplicate-status');
            duplicateStatusDiv.style.display = 'block';
            duplicateStatusDiv.innerHTML = `<span class="status-invalid">❌ Error searching for duplicates</span>`;
            
            hideLoading();
        }
    }

    // Cleanup inactive users
    async function cleanupInactiveUsers() {
        const confirmation = confirm('This will permanently delete all inactive/migrated user data. Continue?');
        
        if (!confirmation) {
            return;
        }
        
        try {
            showLoading('Cleaning up inactive users...');
            
            const deletedCount = await window.accountManager.cleanupInactiveUsers();
            
            if (deletedCount > 0) {
                showMessage(`Successfully deleted ${deletedCount} inactive users`, 'success');
            } else {
                showMessage('No inactive users found to delete', 'info');
            }
            
            hideLoading();
            
        } catch (error) {
            console.error('Error cleaning up inactive users:', error);
            showMessage('Failed to cleanup inactive users: ' + error.message, 'error');
            hideLoading();
        }
    }

    // Utility functions
    function waitForAuth() {
        return new Promise((resolve, reject) => {
            // Check if Firebase auth is available
            if (!window.auth) {
                reject(new Error('Firebase auth not available'));
                return;
            }
            
            // Check if already authenticated
            if (window.auth.currentUser) {
                resolve(window.auth.currentUser);
                return;
            }
            
            // Wait for authentication state change
            let timeout;
            const unsubscribe = window.auth.onAuthStateChanged((user) => {
                if (user) {
                    clearTimeout(timeout);
                    unsubscribe();
                    resolve(user);
                }
            });
            
            // Increase timeout to 20 seconds
            timeout = setTimeout(() => {
                unsubscribe();
                reject(new Error('Authentication timeout after 20 seconds'));
            }, 20000);
        });
    }

    function openModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    function closeModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
        
        // Clear input fields
        if (modalId === 'import-modal') {
            document.getElementById('import-code').value = '';
        }
    }

    function showLoading(message) {
        const loadingOverlay = document.getElementById('loading-overlay');
        const loadingMessage = document.getElementById('loading-message');
        
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }
    }

    function hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }

    function showMessage(message, type = 'info') {
        const messageArea = document.getElementById('message-area');
        const messageDiv = document.createElement('div');
        messageDiv.className = type;
        messageDiv.textContent = message;
        
        messageArea.appendChild(messageDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageArea.contains(messageDiv)) {
                messageArea.removeChild(messageDiv);
            }
        }, 5000);
    }

    // Make functions available globally for modal close buttons
    window.openModal = openModal;
    window.closeModal = closeModal;
});