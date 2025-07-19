// AdMob Test Implementation for Visual Novel
// Based on emi-indo-cordova-plugin-admob example

// AdMob Configuration - Real Production Ad Unit IDs
const ADMOB_CONFIG = {
    APP_ID: 'ca-app-pub-8770525488772470~3355625727', // Real Production App ID
    BANNER_ID: 'ca-app-pub-8770525488772470/6220783595', // Real Production Banner ID
    INTERSTITIAL_ID: 'ca-app-pub-8770525488772470/4187045990', // Real Production Interstitial ID
    REWARDED_ID: 'ca-app-pub-8770525488772470/7533865266' // Real Production Rewarded ID
};

let isAdMobInitialized = false;
let isBannerLoaded = false;
let isInterstitialLoaded = false;
let isRewardedLoaded = false;

// Update status display
function updateAdMobStatus(message) {
    const statusElement = document.getElementById('admobStatus');
    if (statusElement) {
        statusElement.textContent = `Status: ${message}`;
    }
    logToAdMob('Status: ' + message);
}

// Show AdMob Test menu
function showAdMobTest() {
    const admobTestElement = document.getElementById('admobTest');
    hideAllExcept(admobTestElement);
    // Initialize log area
    logToAdMob('AdMob Test menu opened');
}

// Hide AdMob Test menu
function hideAdMobTest() {
    const menuElement = document.getElementById('menu');
    hideAllExcept(menuElement);
}

// Log functions for debugging
function logToAdMob(message) {
    const logArea = document.getElementById('admobLog');
    if (logArea) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}\n`;
        logArea.value += logEntry;
        logArea.scrollTop = logArea.scrollHeight;
        console.log('AdMob:', message);
    }
}

function clearAdMobLog() {
    const logArea = document.getElementById('admobLog');
    if (logArea) {
        logArea.value = '';
        logToAdMob('Log cleared');
    }
}

function copyAdMobLog() {
    const logArea = document.getElementById('admobLog');
    if (logArea && logArea.value.trim()) {
        // Try to copy to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(logArea.value)
                .then(() => {
                    logToAdMob('Log copied to clipboard successfully');
                    alert('Log berhasil disalin ke clipboard!');
                })
                .catch(err => {
                    logToAdMob('Failed to copy log: ' + err.message);
                    // Fallback: select text for manual copy
                    logArea.select();
                    logArea.setSelectionRange(0, 99999);
                    alert('Gagal menyalin otomatis. Silakan copy manual dengan Ctrl+C');
                });
        } else {
            // Fallback for older browsers
            logArea.select();
            logArea.setSelectionRange(0, 99999);
            try {
                document.execCommand('copy');
                logToAdMob('Log copied using fallback method');
                alert('Log berhasil disalin ke clipboard!');
            } catch (err) {
                logToAdMob('Failed to copy log with fallback: ' + err.message);
                alert('Gagal menyalin. Silakan copy manual dengan Ctrl+C');
            }
        }
    } else {
        alert('Tidak ada log untuk disalin!');
    }
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
            // Auto load all ad types after initialization
            setTimeout(() => {
                logToAdMob('Auto-loading banner after SDK initialization...');
                loadBanner();
            }, 1000);
            
            setTimeout(() => {
                logToAdMob('Auto-loading interstitial after SDK initialization...');
                loadInterstitial();
            }, 1500);
            
            setTimeout(() => {
                logToAdMob('Auto-loading rewarded ad after SDK initialization...');
                loadRewarded();
            }, 2000);
        });

        // Initialize plugin with improved configuration
        logToAdMob('Initializing AdMob plugin with config:');
        logToAdMob('- App ID: ' + ADMOB_CONFIG.APP_ID);
        logToAdMob('- Banner ID: ' + ADMOB_CONFIG.BANNER_ID);
        logToAdMob('- Interstitial ID: ' + ADMOB_CONFIG.INTERSTITIAL_ID);
        logToAdMob('- Rewarded ID: ' + ADMOB_CONFIG.REWARDED_ID);
        
        // Try different initialization approaches
        const initConfig = {
            appId: ADMOB_CONFIG.APP_ID,
            isTesting: true,
            isUsingAdManagerRequest: false,
            isResponseInfo: true,
            isConsentDebug: false
        };
        
        logToAdMob('Sending initialization request...');
        cordova.plugins.emiAdmobPlugin.initialize(initConfig);
        
        // Extended timeout with multiple fallback attempts
        let timeoutAttempts = 0;
        const maxAttempts = 3;
        
        const checkInitialization = () => {
            timeoutAttempts++;
            if (!isAdMobInitialized && timeoutAttempts <= maxAttempts) {
                logToAdMob(`=== SDK Initialization Timeout (Attempt ${timeoutAttempts}/${maxAttempts}) ===`);
                
                if (timeoutAttempts < maxAttempts) {
                    logToAdMob('Retrying initialization...');
                    try {
                        cordova.plugins.emiAdmobPlugin.initialize(initConfig);
                    } catch (retryError) {
                        logToAdMob('Retry initialization error: ' + retryError.message);
                    }
                    setTimeout(checkInitialization, 5000);
                } else {
                    logToAdMob('Forcing initialization after all attempts failed');
                    isAdMobInitialized = true;
                    updateAdMobStatus('Initialized (forced after timeout)');
                    setTimeout(() => {
                        loadBanner();
                    }, 1000);
                    
                    setTimeout(() => {
                        logToAdMob('Auto-loading interstitial after forced initialization...');
                        loadInterstitial();
                    }, 1500);
                    
                    setTimeout(() => {
                        logToAdMob('Auto-loading rewarded ad after forced initialization...');
                        loadRewarded();
                    }, 2000);
                }
            }
        };
        
        setTimeout(checkInitialization, 8000); // Initial 8 second timeout
        
    } catch (error) {
        console.error('AdMob initialization error:', error);
        updateAdMobStatus('Initialization failed: ' + error.message);
    }
}

// Setup event listeners
function setupAdMobEventListeners() {
    logToAdMob('Setting up AdMob event listeners...');
    
    // Banner events
    document.addEventListener('on.banner.load', function(data) {
        logToAdMob('=== Banner Loaded Successfully ===');
        logToAdMob('Banner data: ' + JSON.stringify(data));
        isBannerLoaded = true;
        updateAdMobStatus('Banner loaded successfully');
    });
    
    document.addEventListener('on.banner.failed.load', function(data) {
        logToAdMob('=== Banner Failed to Load ===');
        logToAdMob('Error data: ' + JSON.stringify(data));
        logToAdMob('Error code: ' + (data.code || 'No code'));
        logToAdMob('Error message: ' + (data.message || data.error || 'Unknown error'));
        updateAdMobStatus('Banner load failed: ' + (data.message || data.error || 'Unknown error'));
    });
    
    document.addEventListener('on.banner.opened', function(data) {
        logToAdMob('=== Banner Opened ===');
        logToAdMob('Banner opened data: ' + JSON.stringify(data));
    });
    
    document.addEventListener('on.banner.closed', function(data) {
        logToAdMob('=== Banner Closed ===');
        logToAdMob('Banner closed data: ' + JSON.stringify(data));
    });
    
    document.addEventListener('on.banner.impression', function(data) {
        logToAdMob('=== Banner Impression ===');
        logToAdMob('Banner impression data: ' + JSON.stringify(data));
    });
    
    document.addEventListener('on.banner.clicked', function(data) {
        logToAdMob('=== Banner Clicked ===');
        logToAdMob('Banner clicked data: ' + JSON.stringify(data));
    });

    document.addEventListener('on.banner.revenue', function(data) {
        console.log('Banner revenue:', data);
    });

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
        logToAdMob('Error code: ' + (data.code || 'No code'));
        logToAdMob('Error message: ' + (data.message || data.error || 'Unknown error'));
        isInterstitialLoaded = false;
        updateAdMobStatus('Interstitial failed to load: ' + (data.message || data.error || 'Unknown error'));
    });

    document.addEventListener('on.interstitial.dismissed', function(data) {
        logToAdMob('=== Interstitial Dismissed ===');
        logToAdMob('Interstitial dismissed data: ' + JSON.stringify(data));
        isInterstitialLoaded = false;
        updateAdMobStatus('Interstitial dismissed - ready for next load');
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

    // Rewarded events
    document.addEventListener('on.rewarded.loaded', function(data) {
        logToAdMob('=== Rewarded Loaded Successfully ===');
        logToAdMob('Rewarded data: ' + JSON.stringify(data));
        isRewardedLoaded = true;
        updateAdMobStatus('Rewarded loaded successfully');
    });

    document.addEventListener('on.rewarded.failed.load', function(data) {
        logToAdMob('=== Rewarded Failed to Load ===');
        logToAdMob('Error data: ' + JSON.stringify(data));
        logToAdMob('Error code: ' + (data.code || 'No code'));
        logToAdMob('Error message: ' + (data.message || data.error || 'Unknown error'));
        isRewardedLoaded = false;
        updateAdMobStatus('Rewarded failed to load: ' + (data.message || data.error || 'Unknown error'));
    });

    document.addEventListener('on.reward.userEarnedReward', function(data) {
        logToAdMob('=== User Earned Reward ===');
        logToAdMob('Reward data: ' + JSON.stringify(data));
        const rewardType = data.type || data.rewardType || 'coins';
        const rewardAmount = data.amount || data.rewardAmount || 1;
        updateAdMobStatus(`Reward earned: ${rewardAmount} ${rewardType}`);
        logToAdMob('User earned reward: ' + rewardType + ' amount: ' + rewardAmount);
        // Here you can give reward to user
        alert(`Congratulations! You earned ${rewardAmount} ${rewardType}`);
    });

    document.addEventListener('on.rewarded.dismissed', function(data) {
        logToAdMob('=== Rewarded Dismissed ===');
        logToAdMob('Rewarded dismissed data: ' + JSON.stringify(data));
        isRewardedLoaded = false;
        updateAdMobStatus('Rewarded dismissed - ready for next load');
        // Auto reload rewarded after dismissal
        setTimeout(() => {
            logToAdMob('Auto-loading next rewarded ad...');
            loadRewarded();
        }, 1000);
    });

    document.addEventListener('on.rewarded.failed.show', function(data) {
        logToAdMob('=== Rewarded Failed to Show ===');
        logToAdMob('Error data: ' + JSON.stringify(data));
        updateAdMobStatus('Rewarded failed to show: ' + (data.message || data.error || 'Unknown error'));
    });

    document.addEventListener('on.rewarded.opened', function(data) {
        logToAdMob('=== Rewarded Opened ===');
        logToAdMob('Rewarded opened data: ' + JSON.stringify(data));
    });

    document.addEventListener('on.rewarded.closed', function(data) {
        logToAdMob('=== Rewarded Closed ===');
        logToAdMob('Rewarded closed data: ' + JSON.stringify(data));
    });

    document.addEventListener('on.rewarded.impression', function(data) {
        logToAdMob('=== Rewarded Impression ===');
        logToAdMob('Rewarded impression data: ' + JSON.stringify(data));
    });

    document.addEventListener('on.rewarded.clicked', function(data) {
        logToAdMob('=== Rewarded Clicked ===');
        logToAdMob('Rewarded clicked data: ' + JSON.stringify(data));
    });

    document.addEventListener('on.rewarded.revenue', function(data) {
        logToAdMob('=== Rewarded Revenue ===');
        logToAdMob('Rewarded revenue data: ' + JSON.stringify(data));
    });
}

// Banner Ad Functions
function loadBanner() {
    logToAdMob('=== Load Banner Function Called ===');
    
    if (!isAdMobInitialized) {
        logToAdMob('ERROR: AdMob not initialized yet');
        updateAdMobStatus('Please initialize AdMob first');
        return;
    }

    updateAdMobStatus('Loading banner...');
    
    // Check if running in web browser (for testing only)
    if (typeof window.cordova === 'undefined' || !window.cordova) {
        logToAdMob('Web browser detected - using simulation');
        setTimeout(() => {
            isBannerLoaded = true;
            updateAdMobStatus('Banner loaded (web simulation)');
        }, 1000);
        return;
    }
    
    // Check if plugin is available
    if (!cordova.plugins || !cordova.plugins.emiAdmobPlugin) {
        logToAdMob('ERROR: AdMob plugin not available for banner loading');
        updateAdMobStatus('AdMob plugin not available');
        return;
    }
    
    try {
            const bannerConfig = {
                adUnitId: ADMOB_CONFIG.BANNER_ID,
                position: 'bottom-center',
                size: 'BANNER',
                collapsible: '',
                autoShow: true,
                isOverlapping: false,
                offset: 0,
                marginTop: 0,
                marginBottom: 0
            };
            
            logToAdMob('Sending banner load request with config:');
            logToAdMob('- Ad Unit ID: ' + bannerConfig.adUnitId);
            logToAdMob('- Position: ' + bannerConfig.position);
            logToAdMob('- Size: ' + bannerConfig.size);
            logToAdMob('- Auto Show: ' + bannerConfig.autoShow);
            
            // Add CSS to ensure banner visibility without disrupting UI
            const style = document.createElement('style');
            style.textContent = `
                .admob-banner-view {
                    position: fixed !important;
                    bottom: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    z-index: 100 !important;
                    width: 100% !important;
                    height: 50px !important;
                    max-height: 50px !important;
                    display: block !important;
                    visibility: visible !important;
                    pointer-events: auto !important;
                }
                
                /* Adjust main content to avoid banner overlap */
                .dialog-box {
                    bottom: calc(2vh + 50px) !important;
                }
            `;
            document.head.appendChild(style);
            logToAdMob('Added CSS for banner visibility with UI protection');
            
            cordova.plugins.emiAdmobPlugin.loadBannerAd(bannerConfig);
            logToAdMob('Banner load request sent successfully');
            
            // Check for banner element after a delay (for debugging only)
            setTimeout(() => {
                const bannerElements = document.querySelectorAll('[class*="admob"], [id*="admob"], [class*="banner"], [id*="banner"]');
                logToAdMob('Found ' + bannerElements.length + ' potential banner elements');
                bannerElements.forEach((el, index) => {
                    logToAdMob('Banner element ' + index + ': ' + el.tagName + ' class="' + el.className + '" id="' + el.id + '"');
                    // CSS is now handled by stylesheet, no need to override
                });
            }, 2000);
    } catch (error) {
        logToAdMob('=== Banner Load Error ===');
        logToAdMob('Error: ' + error.message);
        logToAdMob('Stack: ' + error.stack);
        updateAdMobStatus('Banner load failed: ' + error.message);
    }
}

function showBanner() {
    logToAdMob('=== Show Banner Function Called ===');
    
    // Check if running in web browser (for testing only)
    if (typeof window.cordova === 'undefined' || !window.cordova) {
        logToAdMob('Web browser detected - using simulation');
        updateAdMobStatus('Banner shown (web simulation)');
        return;
    }
    
    // Check if plugin is available
    if (!cordova.plugins || !cordova.plugins.emiAdmobPlugin) {
        logToAdMob('ERROR: AdMob plugin not available for showing banner');
        updateAdMobStatus('AdMob plugin not available');
        return;
    }
    
    if (!isBannerLoaded) {
        logToAdMob('Banner not loaded yet - triggering load first');
        updateAdMobStatus('Banner not loaded yet - loading now...');
        loadBanner();
        return;
    }
    
    try {
        logToAdMob('Sending banner show request...');
        cordova.plugins.emiAdmobPlugin.showBannerAd();
        updateAdMobStatus('Banner shown');
        logToAdMob('Banner show request sent successfully');
    } catch (error) {
        logToAdMob('=== Banner Show Error ===');
        logToAdMob('Error: ' + error.message);
        logToAdMob('Stack: ' + error.stack);
        updateAdMobStatus('Banner show failed: ' + error.message);
    }
}

function hideBanner() {
    // Web simulation mode or plugin not available
    if (typeof window.cordova === 'undefined' || !window.cordova || !cordova.plugins || !cordova.plugins.emiAdmobPlugin) {
        updateAdMobStatus('Banner hidden (simulated)');
        return;
    }
    
    try {
        cordova.plugins.emiAdmobPlugin.hideBannerAd();
    } catch (error) {
        console.error('Banner hide error:', error);
        updateAdMobStatus('Banner hide failed: ' + error.message);
    }
}

function removeBanner() {
    // Web simulation mode or plugin not available
    if (typeof window.cordova === 'undefined' || !window.cordova || !cordova.plugins || !cordova.plugins.emiAdmobPlugin) {
        isBannerLoaded = false;
        updateAdMobStatus('Banner removed (simulated)');
        return;
    }
    
    try {
        cordova.plugins.emiAdmobPlugin.removeBannerAd();
        isBannerLoaded = false;
        updateAdMobStatus('Banner removed');
    } catch (error) {
        console.error('Banner remove error:', error);
        updateAdMobStatus('Banner remove failed: ' + error.message);
    }
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

// Rewarded Ad Functions
function loadRewarded() {
    logToAdMob('=== Load Rewarded Function Called ===');
    
    if (!isAdMobInitialized) {
        logToAdMob('ERROR: AdMob not initialized yet');
        updateAdMobStatus('Please initialize AdMob first');
        return;
    }

    updateAdMobStatus('Loading rewarded...');
    
    // Check if running in web browser (for testing)
    if (typeof window.cordova === 'undefined' || !window.cordova) {
        logToAdMob('Web browser detected - using simulation');
        setTimeout(() => {
            isRewardedLoaded = true;
            updateAdMobStatus('Rewarded loaded (web simulation)');
        }, 2000);
        return;
    }
    
    // Check if plugin is available
    if (!cordova.plugins || !cordova.plugins.emiAdmobPlugin) {
        logToAdMob('ERROR: AdMob plugin not available for rewarded loading');
        updateAdMobStatus('AdMob plugin not available');
        return;
    }
    
    try {
        const rewardedConfig = {
            adUnitId: ADMOB_CONFIG.REWARDED_ID,
            autoShow: false
        };
        
        logToAdMob('Sending rewarded load request with config:');
        logToAdMob('- Ad Unit ID: ' + rewardedConfig.adUnitId);
        logToAdMob('- Auto Show: ' + rewardedConfig.autoShow);
        
        cordova.plugins.emiAdmobPlugin.loadRewardedAd(rewardedConfig);
        logToAdMob('Rewarded load request sent successfully');
    } catch (error) {
        logToAdMob('=== Rewarded Load Error ===');
        logToAdMob('Error: ' + error.message);
        logToAdMob('Stack: ' + (error.stack || 'No stack trace'));
        updateAdMobStatus('Rewarded load failed: ' + error.message);
    }
}

function showRewarded() {
    logToAdMob('=== Show Rewarded Function Called ===');
    
    // Check if running in web browser (for testing)
    if (typeof window.cordova === 'undefined' || !window.cordova) {
        logToAdMob('Web browser detected - using simulation');
        updateAdMobStatus('Rewarded shown (web simulation)');
        // Simulate reward after 5 seconds
        setTimeout(() => {
            updateAdMobStatus('Reward earned: 10 coins (simulated)');
            alert('Congratulations! You earned 10 coins (simulated)');
            // Simulate dismissal
            setTimeout(() => {
                updateAdMobStatus('Rewarded dismissed (simulated)');
                // Auto reload
                setTimeout(() => {
                    loadRewarded();
                }, 1000);
            }, 1000);
        }, 5000);
        return;
    }
    
    // Check if plugin is available
    if (!cordova.plugins || !cordova.plugins.emiAdmobPlugin) {
        logToAdMob('ERROR: AdMob plugin not available for showing rewarded');
        updateAdMobStatus('AdMob plugin not available');
        return;
    }
    
    if (!isRewardedLoaded) {
        logToAdMob('Rewarded not loaded yet - triggering load first');
        updateAdMobStatus('Rewarded not loaded yet - loading now...');
        loadRewarded();
        return;
    }
    
    try {
        logToAdMob('Sending rewarded show request...');
        cordova.plugins.emiAdmobPlugin.showRewardedAd();
        updateAdMobStatus('Rewarded shown');
        logToAdMob('Rewarded show request sent successfully');
    } catch (error) {
        logToAdMob('=== Rewarded Show Error ===');
        logToAdMob('Error: ' + error.message);
        logToAdMob('Stack: ' + (error.stack || 'No stack trace'));
        updateAdMobStatus('Rewarded show failed: ' + error.message);
    }
}

// Auto-initialize when device is ready (for Cordova)
document.addEventListener('deviceready', function() {
    console.log('Device ready - AdMob plugin available');
    updateAdMobStatus('Device ready - Plugin available');
}, false);

// For web testing
if (typeof window.cordova === 'undefined') {
    console.log('Running in web mode - AdMob functions will be simulated');
    updateAdMobStatus('Web mode - AdMob simulated');
}