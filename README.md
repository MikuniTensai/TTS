# TTS Game - Firebase Setup

## Firebase Security Rules

Update your Firebase Security Rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - contains nickname, scores, and levels
    match /users/{userId} {
      // Anyone can read user data (for leaderboard)
      allow read: if true;
      
      // Only authenticated users can write their own data
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Optional: Keep leaderboard collection for backward compatibility (read-only)
    match /leaderboard/{userId} {
      allow read: if true;
      allow write: if false; // Deprecated - use /users instead
    }
  }
}
```

## User Data Structure

Each user document in `/users/{userId}` contains:

```javascript
{
  "nickname": "Pemain1234",
  "totalScore": 0,
  "highestLevelCompleted": 0,
  "createdAt": timestamp,
  "lastUpdated": timestamp
}
```

## Features

- ✅ Default score 0 untuk user baru
- ✅ Semua data score disimpan di collection `/users`
- ✅ Leaderboard membaca dari `/users`
- ✅ Auto-migration untuk user existing
- ✅ Automatic retry mechanism
- ✅ Real-time score updates 