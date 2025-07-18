// Index.js file

document.addEventListener('DOMContentLoaded', () => {
    const eventNotification = document.getElementById('event-notification');
    
    // Initialize theme manager for main menu
    if (window.ThemeManager) {
        const themeManager = new window.ThemeManager();
        window.themeManager = themeManager;
    }
    
    // Function to update event notification badge
    window.updateEventNotification = function(show) {
        if (eventNotification) {
            eventNotification.style.display = show ? 'flex' : 'none';
        }
    };

    // Function to check for new events
    async function checkForNewEvents() {
        if (!db) return;

        try {
            const lastCheck = localStorage.getItem('lastEventCheck') || '0';
            console.log('Checking for new events since:', new Date(parseInt(lastCheck)));
            
            const snapshot = await db.collection('event')
                .where('createdAt', '>', new Date(parseInt(lastCheck)))
                .where('active', '==', true)
                .limit(1)
                .get();
            
            const hasNewEvents = !snapshot.empty;
            console.log('Has new events:', hasNewEvents);
            
            updateEventNotification(hasNewEvents);
            
            return hasNewEvents;
        } catch (error) {
            console.error("Error checking for new events:", error);
            return false;
        }
    }

    // Initialize Firebase connection and check for events
    function initializeApp() {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            console.log('Firebase initialized, checking for new events...');
            checkForNewEvents();
        } else {
            // Wait for Firebase to initialize
            setTimeout(initializeApp, 1000);
        }
    }

    // Start initialization
    initializeApp();

    // Check for new events every 10 minutes
    setInterval(checkForNewEvents, 10 * 60 * 1000);

    // Clear notification when event menu is clicked
    const eventMenu = document.getElementById('event-menu');
    if (eventMenu) {
        eventMenu.addEventListener('click', () => {
            updateEventNotification(false);
            // Update last check timestamp
            localStorage.setItem('lastEventCheck', Date.now().toString());
        });
    }
});