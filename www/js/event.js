document.addEventListener('DOMContentLoaded', () => {
    const eventList = document.getElementById('event-list');
    const noEventsDiv = document.getElementById('no-events');
    const refreshBtn = document.getElementById('refresh-btn');

    let lastEventCheck = localStorage.getItem('lastEventCheck') || '0';
    let hasNewEvents = false;

    // Function to format date
    function formatDate(timestamp) {
        if (!timestamp) return 'Tidak ada tanggal';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Function to get event status
    function getEventStatus(startDate, endDate) {
        const now = new Date();
        const start = startDate ? (startDate.toDate ? startDate.toDate() : new Date(startDate)) : null;
        const end = endDate ? (endDate.toDate ? endDate.toDate() : new Date(endDate)) : null;

        if (!start && !end) return { status: 'active', text: 'Aktif' };
        
        if (start && now < start) {
            return { status: 'upcoming', text: 'Akan Datang' };
        } else if (end && now > end) {
            return { status: 'ended', text: 'Berakhir' };
        } else {
            return { status: 'active', text: 'Berlangsung' };
        }
    }

    // Function to create sharing buttons
    function createShareButtons(event) {
        const gameUrl = window.location.origin + window.location.pathname.replace('event.html', 'index.html');
        const eventTitle = event.title || event.judul || 'Event TTS Game';
        const eventDesc = event.description || event.deskripsi || 'Ayo ikuti event menarik di TTS Game!';
        
        return `
            <div class="share-section">
                <span class="share-label">Bagikan:</span>
                <div class="share-buttons">
                    <button class="share-btn whatsapp" onclick="shareToWhatsApp('${eventTitle}', '${eventDesc}', '${gameUrl}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                    </button>
                    <button class="share-btn facebook" onclick="shareToFacebook('${eventTitle}', '${gameUrl}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                    </button>
                    <button class="share-btn twitter" onclick="shareToTwitter('${eventTitle}', '${eventDesc}', '${gameUrl}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                    </button>
                    <button class="share-btn telegram" onclick="shareToTelegram('${eventTitle}', '${eventDesc}', '${gameUrl}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                    </button>
                    <button class="share-btn copy" onclick="copyEventLink('${eventTitle}', '${eventDesc}', '${gameUrl}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    // Function to render events
    function renderEvents(events) {
        if (events.length === 0) {
            eventList.style.display = 'none';
            noEventsDiv.style.display = 'block';
            return;
        }

        eventList.style.display = 'block';
        noEventsDiv.style.display = 'none';

        const eventsHtml = events.map(event => {
            const eventStatus = getEventStatus(event.startDate, event.endDate);
            const isNew = event.createdAt && event.createdAt.toMillis() > parseInt(lastEventCheck);
            
            return `
                <div class="event-item ${isNew ? 'new' : ''}" data-event-id="${event.id}">
                    <div class="event-header">
                        <h2 class="event-title">${event.title || event.judul || 'Event Tanpa Judul'}</h2>
                        <span class="event-status ${eventStatus.status}">${eventStatus.text}</span>
                    </div>
                    
                    <p class="event-description">${event.description || event.deskripsi || 'Tidak ada deskripsi tersedia.'}</p>
                    
                    <div class="event-meta">
                        <div class="event-date">
                            📅 ${formatDate(event.createdAt)}
                        </div>
                        ${event.priority ? `<div class="event-priority ${event.priority}">${event.priority.toUpperCase()}</div>` : ''}
                    </div>
                    
                    ${createShareButtons(event)}
                </div>
            `;
        }).join('');

        eventList.innerHTML = eventsHtml;
    }

    // Social media sharing functions
    window.shareToWhatsApp = function(title, description, url) {
        const text = `🎮 ${title}\n\n${description}\n\nMainkan sekarang: ${url}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    };

    window.shareToFacebook = function(title, url) {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
        window.open(facebookUrl, '_blank', 'width=600,height=400');
    };

    window.shareToTwitter = function(title, description, url) {
        const text = `🎮 ${title} - ${description}`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(twitterUrl, '_blank', 'width=600,height=400');
    };

    window.shareToTelegram = function(title, description, url) {
        const text = `🎮 ${title}\n\n${description}\n\nMainkan sekarang: ${url}`;
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        window.open(telegramUrl, '_blank');
    };

    window.copyEventLink = function(title, description, url) {
        const text = `🎮 ${title}\n\n${description}\n\nMainkan sekarang: ${url}`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                showShareMessage('Link berhasil disalin!');
            }).catch(() => {
                fallbackCopyText(text);
            });
        } else {
            fallbackCopyText(text);
        }
    };

    // Fallback copy function for older browsers
    function fallbackCopyText(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            showShareMessage('Link berhasil disalin!');
        } catch (err) {
            showShareMessage('Gagal menyalin link');
        }
        
        document.body.removeChild(textArea);
    }

    // Show share message
    function showShareMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'share-message';
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            messageDiv.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(messageDiv);
            }, 300);
        }, 2000);
    }

    // Function to fetch events from Firebase
    async function fetchEvents() {
        if (!db) {
            console.error("Firestore is not initialized.");
            eventList.innerHTML = '<div class="error-message">Error: Koneksi ke database gagal.</div>';
            return;
        }

        eventList.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Memuat event...</p>
            </div>
        `;

        try {
            console.log("Fetching events from /event collection...");
            
            // Get all events without ordering (since createdAt might not exist)
            const snapshot = await db.collection('event').get();
            
            console.log("Events query successful, documents found:", snapshot.size);
            
            if (snapshot.empty) {
                eventList.style.display = 'none';
                noEventsDiv.style.display = 'block';
                return;
            }

            const events = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                events.push({
                    id: doc.id,
                    title: data.title || data.judul,
                    description: data.description || data.deskripsi,
                    createdAt: data.createdAt || firebase.firestore.Timestamp.now(),
                    startDate: data.startDate,
                    endDate: data.endDate,
                    priority: data.priority,
                    active: data.active !== false // Default to true if not specified
                });
            });
            
            // Sort events by createdAt (newest first)
            events.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
            
            // Filter only active events
            const activeEvents = events.filter(event => event.active);
            
            console.log("Active events processed:", activeEvents.length, "events");
            renderEvents(activeEvents);

            // Update last check timestamp
            const now = Date.now().toString();
            localStorage.setItem('lastEventCheck', now);
            
            // Update main menu notification
            updateMainMenuNotification(false);

        } catch (error) {
            console.error("❌ Error fetching events:", error);
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);
            
            eventList.innerHTML = `
                <div class="error-message">
                    <h3>Gagal Memuat Event</h3>
                    <p>Terjadi kesalahan saat memuat event. Silakan coba lagi.</p>
                    <p><small>Error: ${error.message}</small></p>
                </div>
            `;
        }
    }

    // Function to update main menu notification
    function updateMainMenuNotification(show) {
        // This will be called from main menu to check for new events
        if (window.opener && window.opener.updateEventNotification) {
            window.opener.updateEventNotification(show);
        }
    }

    // Function to check for new events (called from main menu)
    window.checkForNewEvents = async function() {
        if (!db) return false;

        try {
            const lastCheck = localStorage.getItem('lastEventCheck') || '0';
            const snapshot = await db.collection('event')
                .where('createdAt', '>', new Date(parseInt(lastCheck)))
                .where('active', '==', true)
                .limit(1)
                .get();
            
            return !snapshot.empty;
        } catch (error) {
            console.error("Error checking for new events:", error);
            return false;
        }
    };

    // Refresh button functionality
    refreshBtn.addEventListener('click', () => {
        fetchEvents();
        refreshBtn.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            refreshBtn.style.transform = 'rotate(0deg)';
        }, 500);
    });

    // Initial load
    fetchEvents();

    // Auto refresh every 5 minutes
    setInterval(fetchEvents, 5 * 60 * 1000);
}); 