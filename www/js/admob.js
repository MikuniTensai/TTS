// AdMob Implementation for TTS Game
// Based on emi-indo-cordova-plugin-admob

// AdMob Configuration - Google Test Ad Unit IDs (with real ad display)
const ADMOB_CONFIG = {
    APP_ID: 'ca-app-pub-3940256099942544~3347511713', // Google Test App ID
    BANNER_ID: 'ca-app-pub-3940256099942544/6300978111', // Google Test Banner ID
    INTERSTITIAL_ID: 'ca-app-pub-3940256099942544/1033173712', // Google Test Interstitial ID
    REWARDED_ID: 'ca-app-pub-3940256099942544/5224354917' // Google Test Rewarded ID
};

let isAdMobInitialized = false;
let isBannerLoaded = false;
let isInterstitialLoaded = false;
let isRewardedLoaded = false;

// Update status display
function updateAdMobStatus(message) {
    console.log('AdMob Status:', message);
}

// Log functions for debugging
function logToAdMob(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] AdMob:`, message);
}

// Initialize AdMob
function initializeAdMob() {
    logToAdMob('=== AdMob Initialization Started ===');
    updateAdMobStatus('Initializing...');
    
    // Check if running in web browser (for testing)
    if (typeof window.cordova === 'undefined' || !window.cordova) {
        // Web simulation mode
        logToAdMob('Running in web browser - using simulation mode');
        setTimeout(() => {
            isAdMobInitialized = true;
            updateAdMobStatus('Initialized (Web Simulation Mode)');
            console.log('AdMob initialized in web simulation mode');
        }, 1000);
        return;
    }
    
    // Check if plugin is available via cordova.plugins
    if (typeof cordova === 'undefined' || !cordova.plugins || !cordova.plugins.emiAdmobPlugin) {
        // Fallback to simulation mode if plugin not available
        logToAdMob('ERROR: AdMob plugin not available');
        logToAdMob('cordova: ' + (typeof cordova !== 'undefined' ? 'available' : 'not available'));
        logToAdMob('cordova.plugins: ' + (typeof cordova !== 'undefined' && cordova.plugins ? 'available' : 'not available'));
        logToAdMob('emiAdmobPlugin: ' + (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.emiAdmobPlugin ? 'available' : 'not available'));
        
        // List all available plugins for debugging
        if (typeof cordova !== 'undefined' && cordova.plugins) {
            logToAdMob('Available plugins: ' + Object.keys(cordova.plugins).join(', '));
        }
        
        setTimeout(() => {
            isAdMobInitialized = true;
            updateAdMobStatus('Initialized (Simulation Mode - Plugin not available)');
            console.log('AdMob initialized in simulation mode - plugin not available');
        }, 1000);
        return;
    }
    
    // Initialize status bar if available
    if (typeof StatusBar !== 'undefined') {
        logToAdMob('StatusBar plugin available - configuring...');
        StatusBar.overlaysWebView(false);
        StatusBar.backgroundColorByHexString('#000000');
        StatusBar.styleLightContent();
    } else {
        logToAdMob('StatusBar plugin not available');
    }

    try {
        // Set up event listeners first
        setupAdMobEventListeners();
        
        // Global settings with error handling
        try {
            cordova.plugins.emiAdmobPlugin.globalSettings({
                setAppMuted: false,
                setAppVolume: 1.0,
                pubIdEnabled: false
            });
            logToAdMob('Global settings configured successfully');
        } catch (globalError) {
            logToAdMob('Global settings error: ' + globalError.message);
        }
        
        // Targeting settings with error handling
        try {
            cordova.plugins.emiAdmobPlugin.targeting({
                childDirectedTreatment: false,
                underAgeOfConsent: false,
                contentRating: 'MA'
            });
            logToAdMob('Targeting settings configured successfully');
        } catch (targetingError) {
            logToAdMob('Targeting settings error: ' + targetingError.message);
        }

        // Listen for SDK initialization BEFORE initializing
        document.addEventListener('on.sdkInitialization', function(data) {
            logToAdMob('=== SDK Initialization Event Received ===');
            logToAdMob('SDK data: ' + JSON.stringify(data));
            isAdMobInitialized = true;
            updateAdMobStatus('Initialized successfully');
            
            // Auto load interstitial for main menu
            setTimeout(() => {
                logToAdMob('Auto-loading interstitial after SDK initialization...');
                loadInterstitial();
            }, 1500);
        });

        // Initialize plugin
        const initConfig = {
            appId: ADMOB_CONFIG.APP_ID,
            isTesting: true,
            isUsingAdManagerRequest: false,
            isResponseInfo: true,
            isConsentDebug: false
        };
        
        logToAdMob('Sending initialization request...');
        cordova.plugins.emiAdmobPlugin.initialize(initConfig);
        
        // Extended timeout with fallback
        setTimeout(() => {
            if (!isAdMobInitialized) {
                logToAdMob('Forcing initialization after timeout');
                isAdMobInitialized = true;
                updateAdMobStatus('Initialized (forced after timeout)');
                
                setTimeout(() => {
                    logToAdMob('Auto-loading interstitial after forced initialization...');
                    loadInterstitial();
                }, 1500);
            }
        }, 8000);
        
    } catch (error) {
        console.error('AdMob initialization error:', error);
        updateAdMobStatus('Initialization failed: ' + error.message);
    }
}

// Setup event listeners
function setupAdMobEventListeners() {
    logToAdMob('Setting up AdMob event listeners...');
    
    // Interstitial events
    document.addEventListener('on.interstitial.loaded', function(data) {
        logToAdMob('=== Interstitial Loaded Successfully ===');
        logToAdMob('Interstitial data: ' + JSON.stringify(data));
        isInterstitialLoaded = true;
        updateAdMobStatus('Interstitial loaded successfully');
    });

    document.addEventListener('on.interstitial.failed.load', function(data) {
        logToAdMob('=== Interstitial Failed to Load ===');
        logToAdMob('Error data: ' + JSON.stringify(data));
        isInterstitialLoaded = false;
        updateAdMobStatus('Interstitial failed to load: ' + (data.message || data.error || 'Unknown error'));
    });

    document.addEventListener('on.interstitial.dismissed', function(data) {
        logToAdMob('=== Interstitial Dismissed ===');
        logToAdMob('Interstitial dismissed data: ' + JSON.stringify(data));
        isInterstitialLoaded = false;
        updateAdMobStatus('Interstitial dismissed');
        // Auto reload interstitial after dismissal
        setTimeout(() => {
            logToAdMob('Auto-loading next interstitial...');
            loadInterstitial();
        }, 1000);
    });

    document.addEventListener('on.interstitial.failed.show', function(data) {
        logToAdMob('=== Interstitial Failed to Show ===');
        logToAdMob('Error data: ' + JSON.stringify(data));
        updateAdMobStatus('Interstitial failed to show: ' + (data.message || data.error || 'Unknown error'));
    });

    document.addEventListener('on.interstitial.opened', function(data) {
        logToAdMob('=== Interstitial Opened ===');
        logToAdMob('Interstitial opened data: ' + JSON.stringify(data));
    });

    document.addEventListener('on.interstitial.closed', function(data) {
        logToAdMob('=== Interstitial Closed ===');
        logToAdMob('Interstitial closed data: ' + JSON.stringify(data));
    });

    document.addEventListener('on.interstitial.impression', function(data) {
        logToAdMob('=== Interstitial Impression ===');
        logToAdMob('Interstitial impression data: ' + JSON.stringify(data));
    });

    document.addEventListener('on.interstitial.clicked', function(data) {
        logToAdMob('=== Interstitial Clicked ===');
        logToAdMob('Interstitial clicked data: ' + JSON.stringify(data));
    });

    document.addEventListener('on.interstitial.revenue', function(data) {
        logToAdMob('=== Interstitial Revenue ===');
        logToAdMob('Interstitial revenue data: ' + JSON.stringify(data));
    });
}

// Interstitial Ad Functions
function loadInterstitial() {
    logToAdMob('=== Load Interstitial Function Called ===');
    
    if (!isAdMobInitialized) {
        logToAdMob('ERROR: AdMob not initialized yet');
        updateAdMobStatus('Please initialize AdMob first');
        return;
    }

    updateAdMobStatus('Loading interstitial...');
    
    // Check if running in web browser (for testing)
    if (typeof window.cordova === 'undefined' || !window.cordova) {
        logToAdMob('Web browser detected - using simulation');
        setTimeout(() => {
            isInterstitialLoaded = true;
            updateAdMobStatus('Interstitial loaded (web simulation)');
        }, 1500);
        return;
    }
    
    // Check if plugin is available
    if (!cordova.plugins || !cordova.plugins.emiAdmobPlugin) {
        logToAdMob('ERROR: AdMob plugin not available for interstitial loading');
        updateAdMobStatus('AdMob plugin not available');
        return;
    }
    
    try {
        const interstitialConfig = {
            adUnitId: ADMOB_CONFIG.INTERSTITIAL_ID,
            autoShow: false
        };
        
        logToAdMob('Sending interstitial load request with config:');
        logToAdMob('- Ad Unit ID: ' + interstitialConfig.adUnitId);
        logToAdMob('- Auto Show: ' + interstitialConfig.autoShow);
        
        cordova.plugins.emiAdmobPlugin.loadInterstitialAd(interstitialConfig);
        logToAdMob('Interstitial load request sent successfully');
    } catch (error) {
        logToAdMob('=== Interstitial Load Error ===');
        logToAdMob('Error: ' + error.message);
        logToAdMob('Stack: ' + (error.stack || 'No stack trace'));
        updateAdMobStatus('Interstitial load failed: ' + error.message);
    }
}

function showInterstitial() {
    logToAdMob('=== Show Interstitial Function Called ===');
    
    // Check if running in web browser (for testing)
    if (typeof window.cordova === 'undefined' || !window.cordova) {
        logToAdMob('Web browser detected - using simulation');
        updateAdMobStatus('Interstitial shown (web simulation)');
        // Simulate dismissal after 3 seconds
        setTimeout(() => {
            updateAdMobStatus('Interstitial dismissed (simulated)');
            // Auto reload
            setTimeout(() => {
                loadInterstitial();
            }, 1000);
        }, 3000);
        return;
    }
    
    // Check if plugin is available
    if (!cordova.plugins || !cordova.plugins.emiAdmobPlugin) {
        logToAdMob('ERROR: AdMob plugin not available for showing interstitial');
        updateAdMobStatus('AdMob plugin not available');
        return;
    }
    
    if (!isInterstitialLoaded) {
        logToAdMob('Interstitial not loaded yet - triggering load first');
        updateAdMobStatus('Interstitial not loaded yet - loading now...');
        loadInterstitial();
        return;
    }
    
    try {
        logToAdMob('Sending interstitial show request...');
        cordova.plugins.emiAdmobPlugin.showInterstitialAd();
        updateAdMobStatus('Interstitial shown');
        logToAdMob('Interstitial show request sent successfully');
    } catch (error) {
        logToAdMob('=== Interstitial Show Error ===');
        logToAdMob('Error: ' + error.message);
        logToAdMob('Stack: ' + (error.stack || 'No stack trace'));
        updateAdMobStatus('Interstitial show failed: ' + error.message);
    }
}

// Function to show ad when starting game from main menu
function showAdOnGameStart() {
    logToAdMob('=== Game Start - Attempting to Show Ad ===');
    
    if (isInterstitialLoaded) {
        showInterstitial();
    } else {
        logToAdMob('No interstitial loaded, loading one for next time');
        loadInterstitial();
    }
}

// This event listener is now handled at the bottom of the file

// Export AdMobManager for use in other pages
window.AdMobManager = {
    isInitialized: function() {
        return isAdMobInitialized;
    },
    
    showInterstitialAd: function() {
        console.log('=== AdMobManager.showInterstitialAd called ===');
        
        // Always show ad for web simulation
        if (typeof window.cordova === 'undefined' || !window.cordova) {
            console.log('Web mode - showing test ad popup');
            showTestAdPopup();
            return true;
        }
        
        // Show real ad for mobile
        console.log('Mobile mode - showing real interstitial');
        showInterstitial();
        return true;
    },
    
    shouldShowAd: function() {
        // Always return true for consistent ad display
        return true;
    },
    
    resetAdCounter: function() {
        console.log('Ad counter reset (no longer using counter)');
    }
};

// Test ad popup function for web simulation
function showTestAdPopup() {
    console.log('Test ad popup disabled - showing real ad behavior');
    // No popup shown - behaves like real ad
}

// For web testing
if (typeof window.cordova === 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        logToAdMob('DOM ready - initializing AdMob (web mode)');
        setTimeout(() => {
            initializeAdMob();
        }, 500);
    });
} else {
    // Auto-initialize AdMob when device is ready
    document.addEventListener('deviceready', function() {
        logToAdMob('Device ready - initializing AdMob');
        initializeAdMob();
    }, false);
}