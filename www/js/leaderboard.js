document.addEventListener('DOMContentLoaded', () => {
    const leaderboardList = document.getElementById('leaderboard-list');
    const userNicknameSpan = document.getElementById('user-nickname');
    const editNicknameBtn = document.getElementById('edit-nickname-btn');
    const categoryTabs = document.querySelectorAll('.tab-btn');
    const podiumContainer = document.getElementById('podium-container');

    let currentUserId = null;
    let currentCategory = 'score'; // 'score' or 'level'
    let allUsers = []; // Cache all users data

    // Tab switching functionality
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            soundManager.playSound('click');
            const category = tab.dataset.category;
            if (category !== currentCategory) {
                // Update active tab
                categoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                currentCategory = category;
                renderLeaderboard();
            }
        });
    });

    // Function to update podium display
    function updatePodium(topUsers) {
        const podiumItems = {
            1: podiumContainer.querySelector('.first-place'),
            2: podiumContainer.querySelector('.second-place'),
            3: podiumContainer.querySelector('.third-place')
        };

        // Reset podium
        Object.values(podiumItems).forEach(item => {
            const nickname = item.querySelector('.podium-nickname');
            const score = item.querySelector('.podium-score');
            nickname.textContent = '-';
            score.textContent = '0';
            item.classList.remove('is-user');
        });

        // Fill podium with top 3 users
        topUsers.slice(0, 3).forEach((user, index) => {
            const rank = index + 1;
            const podiumItem = podiumItems[rank];
            if (podiumItem) {
                const nickname = podiumItem.querySelector('.podium-nickname');
                const score = podiumItem.querySelector('.podium-score');
                
                nickname.textContent = user.nickname;
                if (currentCategory === 'score') {
                    score.textContent = user.totalScore.toLocaleString();
                } else {
                    score.textContent = `Level ${user.highestLevelCompleted}`;
                }
                
                if (user.isCurrentUser) {
                    podiumItem.classList.add('is-user');
                }
            }
        });
    }

    // Function to render leaderboard based on current category
    function renderLeaderboard() {
        if (allUsers.length === 0) {
            leaderboardList.innerHTML = '<div class="loading">Belum ada data di leaderboard.</div>';
            return;
        }

        // Sort users based on current category
        let sortedUsers = [...allUsers];
        if (currentCategory === 'score') {
            sortedUsers.sort((a, b) => {
                if (b.totalScore !== a.totalScore) {
                    return b.totalScore - a.totalScore;
                }
                return b.highestLevelCompleted - a.highestLevelCompleted;
            });
        } else { // level
            sortedUsers.sort((a, b) => {
                if (b.highestLevelCompleted !== a.highestLevelCompleted) {
                    return b.highestLevelCompleted - a.highestLevelCompleted;
                }
                return b.totalScore - a.totalScore;
            });
        }

        // Limit to top 10 players
        const topUsers = sortedUsers.slice(0, 10);
        
        // Update podium (top 3)
        updatePodium(topUsers);

        // Render remaining users (4-10) in the list
        const remainingUsers = topUsers.slice(3);
        let html = '';
        
        if (remainingUsers.length > 0) {
            remainingUsers.forEach((user, index) => {
                const rank = index + 4; // Start from rank 4
                const displayValue = currentCategory === 'score' 
                    ? user.totalScore.toLocaleString()
                    : `Level ${user.highestLevelCompleted}`;
                const levelDisplay = user.highestLevelCompleted > 0 ? `(Lv. ${user.highestLevelCompleted})` : '';
                
                html += `
                    <div class="leaderboard-item ${user.isCurrentUser ? 'is-user' : ''}">
                        <span class="rank">${rank}.</span>
                        <span class="nickname">${user.nickname} <span class="level-indicator">${levelDisplay}</span></span>
                        <span class="score">${displayValue}</span>
                    </div>
                `;
            });
        } else {
            html = '<div class="loading">Hanya menampilkan top 3 pemain.</div>';
        }
        
        leaderboardList.innerHTML = html;
        console.log(`✅ Leaderboard rendered successfully (${currentCategory} category)`);
    }

    // Function to fetch and display the leaderboard
    async function fetchLeaderboard() {
        if (!db) {
            console.error("Firestore is not initialized.");
            leaderboardList.innerHTML = '<div class="loading">Error: Koneksi ke database gagal.</div>';
            return;
        }

        leaderboardList.innerHTML = '<div class="loading">Memuat data...</div>';

        try {
            console.log("Fetching leaderboard from /users collection...");
            
            // Use only one orderBy to avoid composite index requirement
            const snapshot = await db.collection('users')
                .orderBy('totalScore', 'desc')
                .limit(100)
                .get();
            
            console.log("Leaderboard query successful, documents found:", snapshot.size);
            
            if (snapshot.empty) {
                leaderboardList.innerHTML = '<div class="loading">Belum ada data di leaderboard.</div>';
                return;
            }

            // Convert to array and filter out inactive users manually
            allUsers = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                // Only show active users (filter out exported/migrated users)
                if (data.active === true && data.migrated !== true) {
                    allUsers.push({
                        id: doc.id,
                        nickname: data.nickname || 'Anonim',
                        totalScore: data.totalScore || 0,
                        highestLevelCompleted: data.highestLevelCompleted || 0,
                        isCurrentUser: doc.id === currentUserId
                    });
                }
            });
            
            console.log("Users data processed:", allUsers.length, "users");
            renderLeaderboard();

        } catch (error) {
            console.error("❌ Error fetching leaderboard:", error);
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);
            
            // Try fallback query without orderBy
            try {
                console.log("Trying fallback query without orderBy...");
                const fallbackSnapshot = await db.collection('users').limit(100).get();
                
                if (!fallbackSnapshot.empty) {
                    allUsers = [];
                    fallbackSnapshot.forEach(doc => {
                        const data = doc.data();
                        if (data.active === true && data.migrated !== true) {
                            allUsers.push({
                                id: doc.id,
                                nickname: data.nickname || 'Anonim',
                                totalScore: data.totalScore || 0,
                                highestLevelCompleted: data.highestLevelCompleted || 0,
                                isCurrentUser: doc.id === currentUserId
                            });
                        }
                    });
                    
                    console.log("✅ Fallback leaderboard data loaded successfully");
                    renderLeaderboard();
                } else {
                    leaderboardList.innerHTML = '<div class="loading">Belum ada data di leaderboard.</div>';
                }
                
            } catch (fallbackError) {
                console.error("❌ Fallback query also failed:", fallbackError);
                leaderboardList.innerHTML = '<div class="loading">Gagal memuat leaderboard. Coba refresh halaman.</div>';
            }
        }
    }

    // Function to get and display user's own nickname
    async function displayUserNickname(userId) {
        if (!userId) return;
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            userNicknameSpan.textContent = userData.nickname;
            
            // Also display user's score and level
            const userScore = userData.totalScore || 0;
            const userLevel = userData.highestLevelCompleted || 0;
            console.log(`Current user: ${userData.nickname}, Score: ${userScore}, Level: ${userLevel}`);
        }
    }
    
    // Function to handle nickname editing
    async function editNickname(userId) {
        try {
            const currentNickname = userNicknameSpan.textContent;
            let newNickname = prompt("Masukkan nama panggilan baru:", currentNickname);

            if (!newNickname || newNickname.trim() === '' || newNickname.trim() === currentNickname) {
                return;
            }

            // Trim and validate length
            newNickname = newNickname.trim();
            if (newNickname.length < 3 || newNickname.length > 20) {
                alert("Nama panggilan harus 3-20 karakter!");
                return;
            }
            
            // Validate characters (alphanumeric + underscore only)
            if (!/^[a-zA-Z0-9_]+$/.test(newNickname)) {
                alert("Nama panggilan hanya boleh berisi huruf, angka, dan underscore!");
                return;
            }

            // Check if nickname is unique (using account manager if available)
            if (window.accountManager) {
                const isUnique = await window.accountManager.checkNicknameUnique(newNickname, userId);
                
                if (!isUnique) {
                    // Generate suggestions
                    const suggestion = await window.accountManager.generateUniqueNickname(newNickname);
                    
                    const usesSuggestion = confirm(
                        `❌ Nama "${newNickname}" sudah digunakan!\n\n` +
                        `💡 Saran: "${suggestion}"\n\n` +
                        `Gunakan saran ini?`
                    );
                    
                    if (usesSuggestion) {
                        newNickname = suggestion;
                    } else {
                        alert("Perubahan nama dibatalkan.");
                        return;
                    }
                }
            }

            // Update nickname in /users collection
            await db.collection('users').doc(userId).update({ 
                nickname: newNickname,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            userNicknameSpan.textContent = newNickname;
            // Refresh leaderboard to show new name
            fetchLeaderboard();
            alert("✅ Nama panggilan berhasil diperbarui!");
            
        } catch (error) {
            console.error("Error updating nickname:", error);
            alert("Gagal memperbarui nama panggilan: " + error.message);
        }
    }

    // Main logic execution
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUserId = user.uid;
            displayUserNickname(currentUserId);
            fetchLeaderboard();
            
            editNicknameBtn.addEventListener('click', () => editNickname(currentUserId));
        } else {
            leaderboardList.innerHTML = '<div class="loading">Anda harus masuk untuk melihat leaderboard.</div>';
            userNicknameSpan.textContent = 'Tidak Masuk';
        }
    });
});