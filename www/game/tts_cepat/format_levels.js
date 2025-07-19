// Script untuk memperbaiki format semua file level
const fs = require('fs');
const path = require('path');

// Fungsi untuk memformat ulang file JSON level
function formatLevelFile(levelId) {
    const filename = `level_${levelId.toString().padStart(6, '0')}.json`;
    const filepath = path.join(__dirname, 'levels', filename);
    
    try {
        // Baca file JSON
        const rawData = fs.readFileSync(filepath, 'utf8');
        const levelData = JSON.parse(rawData);
        
        // Format ulang dengan struktur yang rapi
        const formattedContent = `{
    "id": ${levelData.id},
    "words": [${levelData.words.map(word => `"${word}"`).join(", ")}],
    "random_letters": [${levelData.random_letters.map(letter => `"${letter}"`).join(",")}],
    "grid": [
${levelData.grid.map(row => `      [${row.map(cell => `"${cell}"`).join(",")}]`).join(",\n")}
    ]
  }`;
        
        // Tulis kembali file dengan format yang rapi
        fs.writeFileSync(filepath, formattedContent, 'utf8');
        console.log(`✅ Formatted ${filename}`);
        
    } catch (error) {
        console.error(`❌ Error formatting ${filename}:`, error.message);
    }
}

// Format semua level dari 37-100
for (let levelId = 37; levelId <= 100; levelId++) {
    formatLevelFile(levelId);
}

console.log('\n🎉 All levels formatted successfully!');