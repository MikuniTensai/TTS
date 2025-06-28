// Account Manager for TTS Game
// Handles import/export of user data for device migration

class AccountManager {
    constructor() {
        this.version = '1.0.0';
        this.supportedDataTypes = [
            'userProfile',
            'gameProgress', 
            'inventory',
            'scores',
            'settings'
        ];
    }

    // Generate export code from current user data and reset account
    async generateExportCode() {
        let step = 'initialization';
        try {
            console.log('🔄 Generating export code...');
            
            // Step 1: Wait for authentication with timeout
            step = 'authentication';
            console.log('Step 1: Waiting for authentication...');
            const user = await this.waitForAuth();
            if (!user) {
                throw new Error('User not authenticated');
            }
            console.log('✅ Authentication successful');

            // Step 2: Collect all user data
            step = 'data collection';
            console.log('Step 2: Collecting user data...');
            const exportData = await this.collectUserData(user);
            console.log('✅ User data collected');
            
            // Step 3: Create export package
            step = 'package creation';
            console.log('Step 3: Creating export package...');
            const exportPackage = {
                version: this.version,
                timestamp: new Date().toISOString(),
                userId: user.uid,
                data: exportData
            };

            // Step 4: Generate compressed code
            step = 'code generation';
            console.log('Step 4: Generating export code...');
            const exportCode = this.generateCode(exportPackage);
            console.log('✅ Export code generated successfully');
            
            // Step 5: Deactivate current user after successful export
            step = 'user deactivation';
            console.log('Step 5: Deactivating current user...');
            await this.deactivateCurrentUser();
            console.log('✅ Current user deactivated');
            
            // Step 6: Create new fresh user
            step = 'fresh user creation';
            console.log('Step 6: Creating fresh user...');
            await this.createFreshUser();
            console.log('✅ Fresh user created');
            
            console.log('🎉 Export process completed successfully!');
            return exportCode;

        } catch (error) {
            console.error(`❌ Error during export at step '${step}':`, error);
            
            // Provide more specific error messages
            let userMessage = 'Export failed. ';
            switch (step) {
                case 'authentication':
                    userMessage += 'Please check your internet connection and try again.';
                    break;
                case 'data collection':
                    userMessage += 'Failed to collect user data. Please try again.';
                    break;
                case 'package creation':
                case 'code generation':
                    userMessage += 'Failed to generate export code. Please try again.';
                    break;
                case 'user deactivation':
                    userMessage += 'Failed to deactivate account. Please check your internet connection.';
                    break;
                case 'fresh user creation':
                    userMessage += 'Failed to create new account. Please refresh the page and try again.';
                    break;
                default:
                    userMessage += 'Please try again or check your internet connection.';
            }
            
            const enhancedError = new Error(userMessage);
            enhancedError.originalError = error;
            enhancedError.step = step;
            throw enhancedError;
        }
    }

    // Import data from export code with old user cleanup
    async importFromCode(exportCode, cleanupOldUsers = true) {
        try {
            console.log('🔄 Importing from code...');
            
            // Validate and parse code
            const exportPackage = this.parseCode(exportCode);
            if (!exportPackage) {
                throw new Error('Invalid export code format');
            }

            // Wait for authentication
            const user = await this.waitForAuth();
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Check if this is the same user (to prevent unnecessary operations)
            if (exportPackage.userId === user.uid) {
                console.log('⚠️ Import data is from the same user, skipping import');
                return true;
            }

            // Import data to current user
            await this.importUserData(user, exportPackage.data);
            
            // Cleanup old user data if requested
            if (cleanupOldUsers && exportPackage.userId !== user.uid) {
                await this.cleanupOldUserData(exportPackage.userId);
            }
            
            console.log('✅ Data imported successfully');
            return true;

        } catch (error) {
            console.error('❌ Error importing data:', error);
            throw error;
        }
    }

    // Cleanup old user data from Firebase
    async cleanupOldUserData(oldUserId) {
        try {
            if (!window.db || !oldUserId) {
                console.log('⚠️ Cannot cleanup old user data - missing database or user ID');
                return;
            }

            console.log(`🔄 Cleaning up old user data for: ${oldUserId}`);
            
            // Check if old user document exists
            const oldUserRef = window.db.collection('users').doc(oldUserId);
            const oldUserDoc = await oldUserRef.get();
            
            if (oldUserDoc.exists) {
                // Mark as migrated instead of deleting (for safety)
                await oldUserRef.update({
                    migrated: true,
                    migratedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    migratedTo: window.auth.currentUser.uid,
                    // Keep data but mark as inactive
                    active: false
                });
                
                console.log('✅ Old user data marked as migrated');
            } else {
                console.log('⚠️ Old user document not found');
            }

        } catch (error) {
            console.error('❌ Error cleaning up old user data:', error);
            // Don't throw error here as cleanup is optional
        }
    }

    // Find and merge duplicate users (simplified approach)
    async findAndMergeDuplicateUsers() {
        try {
            const currentUser = await this.waitForAuth();
            if (!currentUser || !window.db) {
                throw new Error('User not authenticated or database not available');
            }

            console.log('🔍 Searching for duplicate users...');
            
            // Get current user data
            const currentUserDoc = await window.db.collection('users').doc(currentUser.uid).get();
            if (!currentUserDoc.exists) {
                throw new Error('Current user document not found');
            }
            
            const currentUserData = currentUserDoc.data();
            const currentNickname = currentUserData.nickname;
            
            if (!currentNickname || currentNickname === 'Unknown') {
                console.log('Current user has no valid nickname, skipping duplicate search');
                return { merged: 0, duplicates: 0 };
            }
            
            // Simple approach: get all users and filter in memory
            console.log('Fetching all users for duplicate detection...');
            const allUsersQuery = await window.db.collection('users')
                .limit(1000) // Reasonable limit
                .get();
            
            const duplicates = [];
            allUsersQuery.forEach(doc => {
                const data = doc.data();
                // Find users with same nickname, exclude current user and inactive users
                if (doc.id !== currentUser.uid && 
                    data.nickname === currentNickname &&
                    data.active !== false && 
                    data.migrated !== true) {
                    duplicates.push({
                        id: doc.id,
                        data: data
                    });
                }
            });
            
            console.log(`Found ${duplicates.length} potential duplicate users with nickname: ${currentNickname}`);
            
            if (duplicates.length === 0) {
                return { merged: 0, duplicates: 0 };
            }
            
            // Merge data from duplicates
            let mergedCount = 0;
            for (const duplicate of duplicates) {
                try {
                    await this.mergeDuplicateUser(currentUser.uid, duplicate);
                    mergedCount++;
                } catch (error) {
                    console.error(`Failed to merge duplicate user ${duplicate.id}:`, error);
                }
            }
            
            return { merged: mergedCount, duplicates: duplicates.length };

        } catch (error) {
            console.error('Error finding and merging duplicate users:', error);
            throw error;
        }
    }

    // Merge duplicate user data
    async mergeDuplicateUser(currentUserId, duplicateUser) {
        try {
            const currentUserRef = window.db.collection('users').doc(currentUserId);
            const currentUserDoc = await currentUserRef.get();
            const currentData = currentUserDoc.data();
            
            // Merge data (keep highest values)
            const mergedData = {
                nickname: currentData.nickname, // Keep current nickname
                totalScore: Math.max(
                    currentData.totalScore || 0,
                    duplicateUser.data.totalScore || 0
                ),
                highestLevelCompleted: Math.max(
                    currentData.highestLevelCompleted || 0,
                    duplicateUser.data.highestLevelCompleted || 0
                ),
                inventory: {
                    shuffle: Math.max(
                        (currentData.inventory?.shuffle || 0),
                        (duplicateUser.data.inventory?.shuffle || 0)
                    ),
                    hint: Math.max(
                        (currentData.inventory?.hint || 0),
                        (duplicateUser.data.inventory?.hint || 0)
                    )
                },
                active: true, // Mark as active
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Update current user with merged data
            await currentUserRef.update(mergedData);
            
            // Mark duplicate as merged
            await window.db.collection('users').doc(duplicateUser.id).update({
                migrated: true,
                migratedAt: firebase.firestore.FieldValue.serverTimestamp(),
                migratedTo: currentUserId,
                active: false
            });
            
            console.log(`✅ Merged duplicate user ${duplicateUser.id} into ${currentUserId}`);

        } catch (error) {
            console.error('Error merging duplicate user:', error);
            throw error;
        }
    }

    // Deactivate current user (mark as exported/migrated)
    async deactivateCurrentUser() {
        const maxRetries = 3;
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Deactivating current user (attempt ${attempt}/${maxRetries})...`);
                
                const currentUser = await this.waitForAuth();
                if (!currentUser || !window.db) {
                    throw new Error('User not authenticated or database not available');
                }

                console.log('Updating user status in database...');
                
                // Update user status with timeout
                await Promise.race([
                    window.db.collection('users').doc(currentUser.uid).update({
                        active: false,
                        migrated: true,
                        migratedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Database update timeout')), 10000)
                    )
                ]);
                
                console.log('✅ Current user deactivated successfully');
                return;

            } catch (error) {
                lastError = error;
                console.error(`❌ Deactivation attempt ${attempt} failed:`, error);
                
                if (attempt < maxRetries) {
                    const delay = attempt * 1000; // 1s, 2s, 3s
                    console.log(`⏳ Retrying deactivation in ${delay/1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error('❌ All deactivation attempts failed');
                }
            }
        }
        
        // If we get here, all attempts failed
        const enhancedError = new Error(`Failed to deactivate user after ${maxRetries} attempts. ${lastError.message}`);
        enhancedError.originalError = lastError;
        throw enhancedError;
    }

    // Create fresh new user
    async createFreshUser() {
        const maxRetries = 3;
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Creating fresh user (attempt ${attempt}/${maxRetries})...`);
                
                // Step 1: Sign out current user with timeout
                console.log('Signing out current user...');
                await Promise.race([
                    firebase.auth().signOut(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Sign out timeout')), 10000)
                    )
                ]);
                console.log('✅ Current user signed out');
                
                // Step 2: Wait a moment for the sign-out to complete
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Step 3: Sign in anonymously to create new user with timeout
                console.log('Creating new anonymous user...');
                const userCredential = await Promise.race([
                    firebase.auth().signInAnonymously(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Sign in timeout')), 15000)
                    )
                ]);
                const newUser = userCredential.user;
                console.log('✅ New user created:', newUser.uid);
                
                // Step 4: Verify database is available
                if (!window.db) {
                    throw new Error('Database not available');
                }
                
                // Step 5: Create fresh user document with timeout
                console.log('Creating user document in database...');
                
                // Generate unique nickname for fresh user
                const uniqueNickname = await this.generateUniqueNickname('Player');
                
                await Promise.race([
                    window.db.collection('users').doc(newUser.uid).set({
                        nickname: uniqueNickname,
                        totalScore: 0,
                        highestLevelCompleted: 0,
                        inventory: { shuffle: 0, hint: 0 },
                        active: true,
                        migrated: false,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Database write timeout')), 10000)
                    )
                ]);
                console.log('✅ User document created in database');
                
                // Step 6: Clear all localStorage game data
                console.log('Clearing game data...');
                this.clearAllGameData();
                console.log('✅ Game data cleared');
                
                console.log('🎉 Fresh user created successfully with ID:', newUser.uid);
                return newUser;

            } catch (error) {
                lastError = error;
                console.error(`❌ Attempt ${attempt} failed:`, error);
                
                if (attempt < maxRetries) {
                    const delay = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
                    console.log(`⏳ Retrying in ${delay/1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error('❌ All attempts failed to create fresh user');
                }
            }
        }
        
        // If we get here, all attempts failed
        const enhancedError = new Error(`Failed to create fresh user after ${maxRetries} attempts. ${lastError.message}`);
        enhancedError.originalError = lastError;
        throw enhancedError;
    }

    // Clear all game data from localStorage
    clearAllGameData() {
        const gameDataKeys = [
            'currentLevel',
            'gameProgress',
            'completedLevels',
            'userStats',
            'gameState',
            // Main game data keys used by the app
            'tts-completed-levels',  // Used by level-select.html
            'tts-scores',           // Used by scoring system
            'tts-inventory',        // Used by inventory system
            // Settings keys (optional - user might want to keep theme preferences)
            // 'tts-theme',
            // 'tts-sound-enabled',
            // 'tts-vibration-enabled',
            // 'tts-animations-enabled'
        ];
        
        gameDataKeys.forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Reset level progress (legacy format)
        for (let i = 1; i <= 15; i++) {
            localStorage.removeItem(`level_${i.toString().padStart(6, '0')}_completed`);
            localStorage.removeItem(`level_${i.toString().padStart(6, '0')}_score`);
        }
        
        console.log('✅ All game data cleared');
    }

    // Clean up all inactive/migrated users (admin function)
    async cleanupInactiveUsers() {
        try {
            if (!window.db) {
                throw new Error('Database not available');
            }

            console.log('🔄 Cleaning up inactive users...');
            
            // Find all migrated users (avoid using active field in query)
            const migratedQuery = await window.db.collection('users')
                .where('migrated', '==', true)
                .get();
            
            let deletedCount = 0;
            const batch = window.db.batch();
            
            migratedQuery.forEach(doc => {
                const data = doc.data();
                // Double check that user is actually inactive
                if (data.active === false || data.migrated === true) {
                    batch.delete(doc.ref);
                    deletedCount++;
                }
            });
            
            if (deletedCount > 0) {
                await batch.commit();
                console.log(`✅ Deleted ${deletedCount} inactive users`);
            } else {
                console.log('No inactive users found');
            }
            
            return deletedCount;

        } catch (error) {
            console.error('Error cleaning up inactive users:', error);
            throw error;
        }
    }

    // Collect all user data for export
    async collectUserData(user) {
        const data = {};

        try {
            // Get Firebase user data
            if (window.db) {
                const userDoc = await window.db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    data.userProfile = userDoc.data();
                }
            }

            // Get localStorage data
            data.gameProgress = {
                completedLevels: JSON.parse(localStorage.getItem('tts-completed-levels') || '[]'),
                scores: JSON.parse(localStorage.getItem('tts-scores') || '{}'),
                inventory: JSON.parse(localStorage.getItem('tts-inventory') || '{}')
            };

            // Get settings
            data.settings = {
                theme: localStorage.getItem('tts-theme') || 'default',
                soundEnabled: localStorage.getItem('tts-sound-enabled') !== 'false',
                vibrationEnabled: localStorage.getItem('tts-vibration-enabled') !== 'false',
                animationsEnabled: localStorage.getItem('tts-animations-enabled') !== 'false'
            };

            console.log('📦 Collected user data:', data);
            return data;

        } catch (error) {
            console.error('Error collecting user data:', error);
            throw error;
        }
    }

    // Import user data to current account
    async importUserData(user, data) {
        try {
            // Import to Firebase
            if (data.userProfile && window.db) {
                const userRef = window.db.collection('users').doc(user.uid);
                
                // Merge with existing data, keeping the higher values
                const existingDoc = await userRef.get();
                const existingData = existingDoc.exists ? existingDoc.data() : {};
                
                const mergedData = {
                    nickname: data.userProfile.nickname || existingData.nickname,
                    totalScore: Math.max(
                        data.userProfile.totalScore || 0,
                        existingData.totalScore || 0
                    ),
                    highestLevelCompleted: Math.max(
                        data.userProfile.highestLevelCompleted || 0,
                        existingData.highestLevelCompleted || 0
                    ),
                    inventory: {
                        shuffle: Math.max(
                            (data.userProfile.inventory?.shuffle || 0),
                            (existingData.inventory?.shuffle || 0)
                        ),
                        hint: Math.max(
                            (data.userProfile.inventory?.hint || 0),
                            (existingData.inventory?.hint || 0)
                        )
                    },
                    active: true, // Mark as active
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                };

                await userRef.set(mergedData, { merge: true });
                console.log('✅ Firebase data imported');
            }

            // Import to localStorage
            if (data.gameProgress) {
                // Merge completed levels
                const existingLevels = JSON.parse(localStorage.getItem('tts-completed-levels') || '[]');
                const importedLevels = data.gameProgress.completedLevels || [];
                const mergedLevels = [...new Set([...existingLevels, ...importedLevels])];
                localStorage.setItem('tts-completed-levels', JSON.stringify(mergedLevels));

                // Merge scores (keep higher scores)
                const existingScores = JSON.parse(localStorage.getItem('tts-scores') || '{}');
                const importedScores = data.gameProgress.scores || {};
                const mergedScores = { ...existingScores };
                
                Object.entries(importedScores).forEach(([level, score]) => {
                    if (!mergedScores[level] || score > mergedScores[level]) {
                        mergedScores[level] = score;
                    }
                });
                localStorage.setItem('tts-scores', JSON.stringify(mergedScores));

                // Merge inventory
                const existingInventory = JSON.parse(localStorage.getItem('tts-inventory') || '{}');
                const importedInventory = data.gameProgress.inventory || {};
                const mergedInventory = {
                    shuffle: Math.max(existingInventory.shuffle || 0, importedInventory.shuffle || 0),
                    hint: Math.max(existingInventory.hint || 0, importedInventory.hint || 0)
                };
                localStorage.setItem('tts-inventory', JSON.stringify(mergedInventory));

                console.log('✅ Game progress imported');
            }

            // Import settings (user choice to override)
            if (data.settings) {
                localStorage.setItem('tts-theme', data.settings.theme || 'default');
                localStorage.setItem('tts-sound-enabled', data.settings.soundEnabled.toString());
                localStorage.setItem('tts-vibration-enabled', data.settings.vibrationEnabled.toString());
                localStorage.setItem('tts-animations-enabled', data.settings.animationsEnabled.toString());
                console.log('✅ Settings imported');
            }

        } catch (error) {
            console.error('Error importing user data:', error);
            throw error;
        }
    }

    // Generate compressed export code
    generateCode(exportPackage) {
        try {
            // Convert to JSON and compress
            const jsonString = JSON.stringify(exportPackage);
            
            // Use base64 encoding with fallback
            let compressed;
            if (typeof btoa !== 'undefined') {
                compressed = btoa(unescape(encodeURIComponent(jsonString)));
            } else {
                // Fallback for environments without btoa
                compressed = this.base64Encode(jsonString);
            }
            
            // Add prefix for identification
            return `TTS${this.version.replace(/\./g, '')}${compressed}`;
            
        } catch (error) {
            console.error('Error generating code:', error);
            throw new Error('Failed to generate export code');
        }
    }

    // Parse and validate export code
    parseCode(exportCode) {
        try {
            // Check prefix
            if (!exportCode.startsWith('TTS')) {
                throw new Error('Invalid code format');
            }

            // Extract version and data
            const versionPart = exportCode.substring(3, 6); // TTS100 -> 100
            const dataPart = exportCode.substring(6);

            // Decode with fallback
            let decodedJson;
            if (typeof atob !== 'undefined') {
                decodedJson = decodeURIComponent(escape(atob(dataPart)));
            } else {
                // Fallback for environments without atob
                decodedJson = this.base64Decode(dataPart);
            }
            
            const exportPackage = JSON.parse(decodedJson);

            // Validate structure
            if (!exportPackage.version || !exportPackage.data) {
                throw new Error('Invalid export package structure');
            }

            return exportPackage;

        } catch (error) {
            console.error('Error parsing code:', error);
            return null;
        }
    }

    // Base64 encode fallback
    base64Encode(str) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        let i = 0;
        
        str = unescape(encodeURIComponent(str));
        
        while (i < str.length) {
            const a = str.charCodeAt(i++);
            const b = i < str.length ? str.charCodeAt(i++) : 0;
            const c = i < str.length ? str.charCodeAt(i++) : 0;
            
            const bitmap = (a << 16) | (b << 8) | c;
            
            result += chars.charAt((bitmap >> 18) & 63);
            result += chars.charAt((bitmap >> 12) & 63);
            result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
            result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '=';
        }
        
        return result;
    }

    // Base64 decode fallback
    base64Decode(str) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        let i = 0;
        
        str = str.replace(/[^A-Za-z0-9+/]/g, '');
        
        while (i < str.length) {
            const encoded1 = chars.indexOf(str.charAt(i++));
            const encoded2 = chars.indexOf(str.charAt(i++));
            const encoded3 = chars.indexOf(str.charAt(i++));
            const encoded4 = chars.indexOf(str.charAt(i++));
            
            const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
            
            result += String.fromCharCode((bitmap >> 16) & 255);
            if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
            if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
        }
        
        return decodeURIComponent(escape(result));
    }

    // Wait for Firebase authentication
    waitForAuth() {
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

    // Create backup file for download
    async createBackupFile() {
        try {
            const exportCode = await this.generateExportCode();
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `tts_backup_${timestamp}.txt`;
            
            const blob = new Blob([exportCode], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            
            URL.revokeObjectURL(url);
            return filename;
            
        } catch (error) {
            console.error('Error creating backup file:', error);
            throw error;
        }
    }

    // Validate current user data integrity
    async validateData() {
        try {
            const user = await this.waitForAuth();
            if (!user) return false;

            const data = await this.collectUserData(user);
            
            // Basic validation checks
            const checks = {
                hasUserProfile: !!data.userProfile,
                hasGameProgress: !!data.gameProgress,
                hasValidScores: typeof data.gameProgress?.scores === 'object',
                hasValidLevels: Array.isArray(data.gameProgress?.completedLevels)
            };

            const isValid = Object.values(checks).every(check => check);
            console.log('Data validation:', checks, 'Overall valid:', isValid);
            
            return isValid;

        } catch (error) {
            console.error('Error validating data:', error);
            return false;
        }
    }

    // Check if nickname is unique
    async checkNicknameUnique(nickname, excludeUserId = null) {
        try {
            if (!window.db) {
                throw new Error('Database not available');
            }

            console.log(`🔍 Checking nickname uniqueness: "${nickname}"`);
            
            // Query for users with the same nickname
            const nicknameQuery = await window.db.collection('users')
                .where('nickname', '==', nickname)
                .where('active', '==', true)
                .where('migrated', '==', false)
                .get();
            
            // Check if any existing users have this nickname (excluding current user)
            let isUnique = true;
            nicknameQuery.forEach(doc => {
                if (excludeUserId && doc.id === excludeUserId) {
                    // Skip current user
                    return;
                }
                isUnique = false;
            });
            
            console.log(`✅ Nickname "${nickname}" uniqueness check: ${isUnique ? 'UNIQUE' : 'NOT UNIQUE'}`);
            return isUnique;

        } catch (error) {
            console.error('Error checking nickname uniqueness:', error);
            // If there's an error, assume it's not unique to be safe
            return false;
        }
    }

    // Generate unique nickname suggestion
    async generateUniqueNickname(baseName) {
        try {
            // First try the base name
            if (await this.checkNicknameUnique(baseName)) {
                return baseName;
            }
            
            // Try with numbers
            for (let i = 1; i <= 999; i++) {
                const suggestion = `${baseName}${i}`;
                if (await this.checkNicknameUnique(suggestion)) {
                    return suggestion;
                }
            }
            
            // If all numbers are taken, add random suffix
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            return `${baseName}${randomSuffix}`;
            
        } catch (error) {
            console.error('Error generating unique nickname:', error);
            // Fallback to random nickname
            const randomNumber = Math.floor(1000 + Math.random() * 9000);
            return `Pemain${randomNumber}`;
        }
    }
}

// Make AccountManager available globally
window.AccountManager = AccountManager;
window.accountManager = new AccountManager(); 