document.addEventListener('DOMContentLoaded', () => {
    const leaderboardList = document.getElementById('leaderboard-list');
    const userNicknameSpan = document.getElementById('user-nickname');
    const editNicknameBtn = document.getElementById('edit-nickname-btn');

    let currentUserId = null;

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

            // Convert to array and sort manually for more control
            const users = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                users.push({
                    id: doc.id,
                    nickname: data.nickname || 'Anonim',
                    totalScore: data.totalScore || 0,
                    highestLevelCompleted: data.highestLevelCompleted || 0,
                    isCurrentUser: doc.id === currentUserId
                });
            });
            
            // Sort by totalScore desc, then by highestLevelCompleted desc
            users.sort((a, b) => {
                if (b.totalScore !== a.totalScore) {
                    return b.totalScore - a.totalScore;
                }
                return b.highestLevelCompleted - a.highestLevelCompleted;
            });
            
            console.log("Users data processed:", users.length, "users");

            let rank = 1;
            let html = '';
            users.forEach(user => {
                const levelDisplay = user.highestLevelCompleted > 0 ? `(Lv. ${user.highestLevelCompleted})` : '';
                
                html += `
                    <div class="leaderboard-item ${user.isCurrentUser ? 'is-user' : ''}">
                        <span class="rank">${rank++}.</span>
                        <span class="nickname">${user.nickname} <span class="level-indicator">${levelDisplay}</span></span>
                        <span class="score">${user.totalScore}</span>
                    </div>
                `;
            });
            
            leaderboardList.innerHTML = html;
            console.log("✅ Leaderboard rendered successfully");

        } catch (error) {
            console.error("❌ Error fetching leaderboard:", error);
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);
            
            // Try fallback query without orderBy
            try {
                console.log("Trying fallback query without orderBy...");
                const fallbackSnapshot = await db.collection('users').limit(100).get();
                
                if (!fallbackSnapshot.empty) {
                    const users = [];
                    fallbackSnapshot.forEach(doc => {
                        const data = doc.data();
                        users.push({
                            id: doc.id,
                            nickname: data.nickname || 'Anonim',
                            totalScore: data.totalScore || 0,
                            highestLevelCompleted: data.highestLevelCompleted || 0,
                            isCurrentUser: doc.id === currentUserId
                        });
                    });
                    
                    // Sort manually
                    users.sort((a, b) => {
                        if (b.totalScore !== a.totalScore) {
                            return b.totalScore - a.totalScore;
                        }
                        return b.highestLevelCompleted - a.highestLevelCompleted;
                    });
                    
                    let rank = 1;
                    let html = '';
                    users.forEach(user => {
                        const levelDisplay = user.highestLevelCompleted > 0 ? `(Lv. ${user.highestLevelCompleted})` : '';
                        
                        html += `
                            <div class="leaderboard-item ${user.isCurrentUser ? 'is-user' : ''}">
                                <span class="rank">${rank++}.</span>
                                <span class="nickname">${user.nickname} <span class="level-indicator">${levelDisplay}</span></span>
                                <span class="score">${user.totalScore}</span>
                            </div>
                        `;
                    });
                    
                    leaderboardList.innerHTML = html;
                    console.log("✅ Fallback leaderboard rendered successfully");
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
        const currentNickname = userNicknameSpan.textContent;
        const newNickname = prompt("Masukkan nama panggilan baru:", currentNickname);

        if (newNickname && newNickname.trim() !== '' && newNickname.trim() !== currentNickname) {
            const finalNickname = newNickname.trim().slice(0, 20); // Limit to 20 chars
            try {
                // Update nickname in /users collection
                await db.collection('users').doc(userId).update({ 
                    nickname: finalNickname,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                userNicknameSpan.textContent = finalNickname;
                // Refresh leaderboard to show new name
                fetchLeaderboard();
                alert("Nama panggilan berhasil diperbarui!");
            } catch (error) {
                console.error("Error updating nickname:", error);
                alert("Gagal memperbarui nama panggilan.");
            }
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