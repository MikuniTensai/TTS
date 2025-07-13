// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAAawL5XBJgI8lhCNdFu55-RwDs_Dd_jRo",
  authDomain: "tts-game-624af.firebaseapp.com",
  projectId: "tts-game-624af",
  storageBucket: "tts-game-624af.firebasestorage.app",
  messagingSenderId: "1073876999818",
  appId: "1:1073876999818:web:156612de608936a4321773",
  measurementId: "G-Q715CYJFN1"
};

console.log("Initializing Firebase...");

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("✓ Firebase app initialized successfully");
} catch (error) {
    console.error("Failed to initialize Firebase app:", error);
}

const auth = firebase.auth();
const db = firebase.firestore();

console.log("Firebase auth and firestore services initialized");

// Enable offline persistence
db.enablePersistence().catch((err) => {
    if (err.code == 'failed-precondition') {
        console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
        console.log('The current browser does not support all features required for persistence.');
    }
});

// Authentication state observer
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // User is signed in
        await createUserProfileIfNeeded(user);
    } else {
        // User is signed out, sign in anonymously
        try {
            await auth.signInAnonymously();
        } catch (error) {
            console.error('Error signing in anonymously:', error);
        }
    }
});

// Create user profile if it doesn't exist
async function createUserProfileIfNeeded(user) {
    const userRef = db.collection('users').doc(user.uid);
    const userSnapshot = await userRef.get();
    
    if (!userSnapshot.exists) {
        let defaultNickname;
        
        // Generate unique nickname
        if (window.accountManager) {
            // Use account manager to generate unique nickname
            defaultNickname = await window.accountManager.generateUniqueNickname('Pemain');
        } else {
            // Fallback to random number
            const randomNumber = Math.floor(1000 + Math.random() * 9000);
            defaultNickname = `Pemain${randomNumber}`;
        }
        
        // Create user profile with default score 0, empty inventory, and default themes
        await userRef.set({
            nickname: defaultNickname,
            totalScore: 0,
            highestLevelCompleted: 0,
            inventory: { shuffle: 0, hint: 0 },
            themes: { dark: false, colorful: false, minimalist: false, activeTheme: 'default' },
            whatsappNumber: '',
            active: true,
            migrated: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`✅ User profile created: ${defaultNickname} with score 0`);
    } else {
        const userData = userSnapshot.data();
        console.log("✅ User profile exists:", userData.nickname, "Score:", userData.totalScore || 0);
    }
}

// Helper functions
function getCurrentUser() {
    return auth.currentUser;
}

function getCurrentUserId() {
    const user = getCurrentUser();
    if (user) {
        console.log("Current user ID:", user.uid);
        return user.uid;
    } else {
        console.log("No current user");
        return null;
    }
}

// Leaderboard functions - now updates /users collection
async function submitScoreToLeaderboard(totalScore, highestLevel) {
    try {
        console.log("Submitting score to leaderboard...");
        console.log(`Data to submit: totalScore=${totalScore}, highestLevel=${highestLevel}`);

        const user = await waitForAuthentication();
        if (!user) {
            throw new Error('Authentication failed or timed out.');
        }

        const userDocRef = db.collection('users').doc(user.uid);
        const userDoc = await getUserDocument(user.uid);

        if (!userDoc.exists) {
            console.error("User profile does not exist. This shouldn't happen.");
            await createUserProfileIfNeeded(user); // Coba buat profil lagi untuk jaga-jaga
        }
        
        const userData = userDoc.exists ? userDoc.data() : {};
        const existingTotalScore = userData.totalScore || 0;
        const existingHighestLevel = userData.highestLevelCompleted || 0;

        console.log("Data from Firebase:", { 
            totalScore: existingTotalScore, 
            highestLevel: existingHighestLevel 
        });

        // Tentukan data final yang akan di-update
        const finalTotalScore = Math.max(totalScore, existingTotalScore);
        const finalHighestLevel = Math.max(highestLevel, existingHighestLevel);

        // Hanya update jika ada perubahan
        if (finalTotalScore === existingTotalScore && finalHighestLevel === existingHighestLevel) {
            console.log("No score update needed. Data is current.");
            return true;
        }

        const updateData = {
            totalScore: finalTotalScore,
            highestLevelCompleted: finalHighestLevel,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };

        console.log("Final data for update:", updateData);

        // Update user document with a 10-second timeout
        await Promise.race([
            userDocRef.update(updateData),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Update operation timed out')), 10000)
            )
        ]);

        console.log("✅ User score updated successfully in Firebase.");
        
        return true;

    } catch (error) {
        console.error("❌ Score submission process failed:", error);
        throw error;
    }
}

// Helper function to wait for authentication
async function waitForAuthentication() {
    return new Promise((resolve, reject) => {
        // Check if already authenticated
        const currentUser = auth.currentUser;
        if (currentUser) {
            resolve(currentUser);
            return;
        }
        
        // Wait for authentication state change
        let timeout;
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                clearTimeout(timeout);
                unsubscribe();
                resolve(user);
            }
        });
        
        // Set timeout for 15 seconds
        timeout = setTimeout(() => {
            unsubscribe();
            reject(new Error('Authentication timeout'));
        }, 15000);
    });
}

// Helper function to get user document with retry
async function getUserDocument(userId) {
    let retries = 3;
    let lastError;
    
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Fetching user document (attempt ${i + 1}/${retries})...`);
            const userRef = db.collection('users').doc(userId);
            const userDoc = await userRef.get();
            return userDoc;
        } catch (error) {
            lastError = error;
            console.warn(`User document fetch failed (attempt ${i + 1}):`, error.message);
            
            // Wait before retry (exponential backoff)
            if (i < retries - 1) {
                const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError;
}

// Make functions available globally
window.getCurrentUser = getCurrentUser;
window.getCurrentUserId = getCurrentUserId;
window.submitScoreToLeaderboard = submitScoreToLeaderboard;

// Set current user ID globally when authenticated
auth.onAuthStateChanged((user) => {
    if (user) {
        window.currentUserId = user.uid;
    } else {
        window.currentUserId = null;
    }
});

// Utility function to get current user's data
async function getCurrentUserData() {
    const user = getCurrentUser();
    if (!user) return null;
    
    const userDoc = await db.collection('users').doc(user.uid).get();
    return userDoc.exists ? userDoc.data() : null;
}

// Function to ensure user has required fields (migration helper)
async function ensureUserDataStructure() {
    const user = getCurrentUser();
    if (!user) return;
    
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
        const userData = userDoc.data();
        
        // Check if user needs migration (missing score fields, inventory, themes, or new fields)
        if (userData.totalScore === undefined || userData.highestLevelCompleted === undefined || 
            !userData.inventory || !userData.themes || userData.active === undefined || userData.migrated === undefined) {
            console.log("🔄 Migrating user data structure...");
            
            await userRef.update({
                totalScore: userData.totalScore || 0,
                highestLevelCompleted: userData.highestLevelCompleted || 0,
                inventory: userData.inventory || { shuffle: 0, hint: 0 },
                themes: userData.themes || { dark: false, colorful: false, minimalist: false, activeTheme: 'default' },
                active: userData.active !== undefined ? userData.active : true,
                migrated: userData.migrated !== undefined ? userData.migrated : false,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log("✅ User data structure updated");
        }
    }
}

// Make utility functions available globally
window.getCurrentUserData = getCurrentUserData;
window.ensureUserDataStructure = ensureUserDataStructure;

// Make Firebase instances available globally for account page
window.auth = auth;
window.db = db;
window.firebase = firebase;