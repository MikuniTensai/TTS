// AdMob Implementation for TTS Cepat Game
// Interstitial ads shown only 2 times on main menu

// AdMob Configuration - Google Test Ad Unit IDs (with real ad display)
const ADMOB_CONFIG = {
    APP_ID: 'ca-app-pub-3940256099942544~3347511713', // Google Test App ID
    INTERSTITIAL_ID: 'ca-app-pub-3940256099942544/1033173712', // Google Test Interstitial ID
    REWARDED_ID: 'ca-app-pub-3940256099942544/5224354917' // Google Test Rewarded ID
};

let isAdMobInitialized = false;
let isInterstitialLoaded = false;
let isRewardedLoaded = false;
let rewardedAdCallback = null;

// Initialize AdMob when app starts
function initializeAdMob() {
    console.log('=== AdMob Initialization Started ===');
    
    // Check if running in web browser (for testing)
    if (typeof window.cordova === 'undefined' || !window.cordova) {
        // Web simulation mode
        console.log('Running in web browser - using simulation mode');
        setTimeout(() => {
            isAdMobInitialized = true;
            console.log('✅ AdMob initialized in web simulation mode');
            console.log('🎯 AdMob Status: Ready for ads');
            loadInterstitial(); // Pre-load first ad
            loadRewardedAd(); // Pre-load rewarded ad
        }, 500); // Reduced delay for faster initialization
        return;
    }
    
    // Check if plugin is available
    if (typeof cordova === 'undefined' || !cordova.plugins || !cordova.plugins.emiAdmobPlugin) {
        console.log('AdMob plugin not available - using simulation mode');
        setTimeout(() => {
            isAdMobInitialized = true;
            console.log('AdMob initialized in simulation mode');
            loadInterstitial(); // Pre-load first ad
            loadRewardedAd(); // Pre-load rewarded ad
        }, 1000);
        return;
    }
    
    try {
        // Set up event listeners first
        setupAdMobEventListeners();
        
        // Global settings
        cordova.plugins.emiAdmobPlugin.globalSettings({
            setAppMuted: false,
            setAppVolume: 1.0,
            pubIdEnabled: false
        });
        
        // Targeting settings
        cordova.plugins.emiAdmobPlugin.targeting({
            childDirectedTreatment: false,
            underAgeOfConsent: false,
            contentRating: 'MA'
        });

        // Listen for SDK initialization
        document.addEventListener('on.sdkInitialization', function(data) {
            console.log('=== SDK Initialization Event Received ===');
            isAdMobInitialized = true;
            console.log('AdMob initialized successfully');
            // Pre-load first interstitial ad and rewarded ad
            setTimeout(() => {
                loadInterstitial();
                loadRewardedAd();
            }, 1000);
        });

        // Initialize plugin
        const initConfig = {
            appId: ADMOB_CONFIG.APP_ID,
            isTesting: true,
            isUsingAdManagerRequest: false,
            isResponseInfo: true,
            isConsentDebug: false
        };
        
        console.log('Initializing AdMob with config:', initConfig);
        cordova.plugins.emiAdmobPlugin.initialize(initConfig);
        
        // Fallback timeout
        setTimeout(() => {
            if (!isAdMobInitialized) {
                console.log('AdMob initialization timeout - forcing initialization');
                isAdMobInitialized = true;
                loadInterstitial();
                loadRewardedAd();
            }
        }, 8000);
        
    } catch (error) {
        console.error('AdMob initialization error:', error);
    }
}

// Setup event listeners for interstitial ads
function setupAdMobEventListeners() {
    console.log('Setting up AdMob event listeners...');
    
    // Interstitial events
    document.addEventListener('on.interstitial.loaded', function(data) {
        console.log('=== Interstitial Loaded Successfully ===');
        isInterstitialLoaded = true;
    });

    document.addEventListener('on.interstitial.failed.load', function(data) {
        console.log('=== Interstitial Failed to Load ===');
        console.log('Error:', data.message || data.error || 'Unknown error');
        isInterstitialLoaded = false;
    });

    document.addEventListener('on.interstitial.dismissed', function(data) {
        console.log('=== Interstitial Dismissed ===');
        isInterstitialLoaded = false;
        // Don't auto-reload since we only want to show 2 ads total
    });

    document.addEventListener('on.interstitial.failed.show', function(data) {
        console.log('=== Interstitial Failed to Show ===');
        console.log('Error:', data.message || data.error || 'Unknown error');
    });

    document.addEventListener('on.interstitial.opened', function(data) {
        console.log('=== Interstitial Opened ===');
    });

    document.addEventListener('on.interstitial.closed', function(data) {
        console.log('=== Interstitial Closed ===');
    });

    document.addEventListener('on.interstitial.impression', function(data) {
        console.log('=== Interstitial Impression ===');
        console.log('Ad impression recorded');
    });
    
    // Rewarded ad events
    document.addEventListener('on.rewarded.loaded', function(data) {
        console.log('=== Rewarded Ad Loaded Successfully ===');
        isRewardedLoaded = true;
    });

    document.addEventListener('on.rewarded.failed.load', function(data) {
        console.log('=== Rewarded Ad Failed to Load ===');
        console.log('Error:', data.message || data.error || 'Unknown error');
        isRewardedLoaded = false;
    });

    document.addEventListener('on.rewarded.dismissed', function(data) {
        console.log('=== Rewarded Ad Dismissed ===');
        isRewardedLoaded = false;
        // Load next rewarded ad
        setTimeout(() => {
            loadRewardedAd();
        }, 1000);
    });

    document.addEventListener('on.rewarded.failed.show', function(data) {
        console.log('=== Rewarded Ad Failed to Show ===');
        console.log('Error:', data.message || data.error || 'Unknown error');
    });

    document.addEventListener('on.rewarded.opened', function(data) {
        console.log('=== Rewarded Ad Opened ===');
    });

    document.addEventListener('on.rewarded.closed', function(data) {
        console.log('=== Rewarded Ad Closed ===');
    });

    document.addEventListener('on.rewarded.impression', function(data) {
        console.log('=== Rewarded Ad Impression ===');
        console.log('Rewarded ad impression recorded');
    });

    document.addEventListener('on.rewarded.earned', function(data) {
        console.log('=== Rewarded Ad Earned ===');
        console.log('Reward earned:', data);
        if (rewardedAdCallback) {
            rewardedAdCallback();
            rewardedAdCallback = null;
        }
    });
}

// Load interstitial ad
function loadInterstitial() {
    console.log('=== Load Interstitial Function Called ===');
    
    if (!isAdMobInitialized) {
        console.log('AdMob not initialized yet');
        return;
    }

    // Always load ads when requested
    
    // Check if running in web browser (for testing)
    if (typeof window.cordova === 'undefined' || !window.cordova) {
        console.log('Web browser detected - using simulation');
        setTimeout(() => {
            isInterstitialLoaded = true;
            console.log('Interstitial loaded (web simulation)');
            // Update UI if function exists
            if (typeof window.updateActionButtonsUI === 'function') {
                window.updateActionButtonsUI();
            }
        }, 1500);
        return;
    }
    
    // Check if plugin is available
    if (!cordova.plugins || !cordova.plugins.emiAdmobPlugin) {
        console.log('AdMob plugin not available for interstitial loading');
        return;
    }
    
    try {
        const interstitialConfig = {
            adUnitId: ADMOB_CONFIG.INTERSTITIAL_ID,
            autoShow: false
        };
        
        console.log('Loading interstitial with config:', interstitialConfig);
        cordova.plugins.emiAdmobPlugin.loadInterstitialAd(interstitialConfig);
        console.log('Interstitial load request sent');
    } catch (error) {
        console.log('Interstitial load error:', error.message);
    }
}

// Show interstitial ad (called from main menu)
function showInterstitialAd() {
    console.log('=== Show Interstitial Function Called ===');
    
    // Check if running in web browser (for testing)
    if (typeof window.cordova === 'undefined' || !window.cordova) {
        console.log('Web browser detected - showing visual simulation');
        showTestAdPopup();
        console.log('Simulated ad shown');
        
        // Load next ad
        setTimeout(() => {
            loadInterstitial();
        }, 2000);
        return true;
    }
    
    // Check if plugin is available
    if (!cordova.plugins || !cordova.plugins.emiAdmobPlugin) {
        console.log('AdMob plugin not available for showing interstitial');
        return false;
    }
    
    if (!isInterstitialLoaded) {
        console.log('Interstitial not loaded yet');
        // Try to load it now
        loadInterstitial();
        return false;
    }
    
    try {
        console.log('Showing interstitial ad...');
        cordova.plugins.emiAdmobPlugin.showInterstitialAd();
        console.log('Interstitial show request sent');
        
        // Load next ad
        setTimeout(() => {
            loadInterstitial();
        }, 3000);
        
        return true;
    } catch (error) {
        console.log('Interstitial show error:', error.message);
        return false;
    }
}

// Check if ads should be shown (called from main menu)
function shouldShowAd() {
    console.log('shouldShowAd called - always returning true');
    return true;
}

// Show test ad popup for web browser testing
function showTestAdPopup() {
    console.log('Test ad popup disabled - showing real ad behavior');
    // No popup shown - behaves like real ad
}

// Reset ad counter (for testing purposes)
function resetAdCounter() {
    console.log('Ad counter reset (no longer using counter)');
}

// Initialize when device is ready (for Cordova)
document.addEventListener('deviceready', function() {
    console.log('Device ready - initializing AdMob');
    initializeAdMob();
}, false);

// Load rewarded ad
function loadRewardedAd() {
    console.log('=== Load Rewarded Ad Function Called ===');
    
    if (!isAdMobInitialized) {
        console.log('AdMob not initialized yet for rewarded ad');
        return;
    }

    // Check if running in web browser (for testing)
    if (typeof window.cordova === 'undefined' || !window.cordova) {
        console.log('Web browser detected - using rewarded simulation');
        setTimeout(() => {
            isRewardedLoaded = true;
            console.log('Rewarded ad loaded (web simulation)');
            // Update UI if function exists
            if (typeof window.updateActionButtonsUI === 'function') {
                window.updateActionButtonsUI();
            }
        }, 1500);
        return;
    }
    
    // Check if plugin is available
    if (!cordova.plugins || !cordova.plugins.emiAdmobPlugin) {
        console.log('AdMob plugin not available for rewarded ad loading');
        return;
    }
    
    try {
        const rewardedConfig = {
            adUnitId: ADMOB_CONFIG.REWARDED_ID,
            autoShow: false
        };
        
        console.log('Loading rewarded ad with config:', rewardedConfig);
        cordova.plugins.emiAdmobPlugin.loadRewardedAd(rewardedConfig);
        console.log('Rewarded ad load request sent');
    } catch (error) {
        console.log('Rewarded ad load error:', error.message);
    }
}

// Show rewarded ad
function showRewardedAd(callback) {
    console.log('=== Show Rewarded Ad Function Called ===');
    
    // Store callback for when reward is earned
    rewardedAdCallback = callback;
    
    // Check if running in web browser (for testing)
    if (typeof window.cordova === 'undefined' || !window.cordova) {
        console.log('Web browser detected - showing rewarded simulation');
        showTestAdPopup();
        console.log('Simulated rewarded ad shown');
        
        // Simulate reward earned
        setTimeout(() => {
            if (rewardedAdCallback) {
                rewardedAdCallback();
                rewardedAdCallback = null;
            }
        }, 2000);
        
        // Load next ad
        setTimeout(() => {
            loadRewardedAd();
        }, 3000);
        return true;
    }
    
    // Check if plugin is available
    if (!cordova.plugins || !cordova.plugins.emiAdmobPlugin) {
        console.log('AdMob plugin not available for showing rewarded ad');
        return false;
    }
    
    if (!isRewardedLoaded) {
        console.log('Rewarded ad not loaded yet');
        // Try to load it now
        loadRewardedAd();
        return false;
    }
    
    try {
        console.log('Showing rewarded ad...');
        cordova.plugins.emiAdmobPlugin.showRewardedAd();
        console.log('Rewarded ad show request sent');
        
        return true;
    } catch (error) {
        console.log('Rewarded ad show error:', error.message);
        return false;
    }
}

// Export functions immediately for use in other files
window.AdMobManager = {
    showInterstitialAd,
    showRewardedAd,
    shouldShowAd,
    resetAdCounter,
    initializeAdMob,
    isInitialized: () => isAdMobInitialized,
    isInterstitialReady: () => isInterstitialLoaded,
    isRewardedReady: () => isRewardedLoaded
};

// For web testing - initialize immediately
if (typeof window.cordova === 'undefined') {
    console.log('Running in web mode - initializing AdMob');
    // Initialize immediately
    setTimeout(() => {
        initializeAdMob();
    }, 100);
}