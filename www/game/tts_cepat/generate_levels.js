// Script untuk generate level 37-100 otomatis
// Hanya mengisi words dan random_letters, grid dibiarkan kosong

const fs = require('fs');
const path = require('path');

// Daftar kata-kata Indonesia yang umum untuk berbagai tema
const wordSets = [
    // Set 1: Keluarga
    {
        main: "KELUARGA",
        words: ["KELUARGA", "KELUAR", "ARGA", "LUAR", "GULA", "RAGA", "KELU"],
        letters: ["K","E","L","U","A","R","G","A"]
    },
    // Set 2: Makanan
    {
        main: "MAKANAN",
        words: ["MAKANAN", "MAKAN", "NAMA", "NANA", "KANA", "MANA", "AKAN"],
        letters: ["M","A","K","A","N","A","N"]
    },
    // Set 3: Rumah
    {
        main: "RUMAHAN",
        words: ["RUMAHAN", "RUMAH", "MAHA", "HARU", "NAMA", "HANA", "MANU"],
        letters: ["R","U","M","A","H","A","N"]
    },
    // Set 4: Sekolah
    {
        main: "SEKOLAH",
        words: ["SEKOLAH", "SEKOLA", "KELAS", "KOLA", "SELA", "HALO", "LASO"],
        letters: ["S","E","K","O","L","A","H"]
    },
    // Set 5: Pelajar
    {
        main: "PELAJAR",
        words: ["PELAJAR", "PELAR", "JALAR", "RAJA", "JARA", "LARA", "PARA"],
        letters: ["P","E","L","A","J","A","R"]
    },
    // Set 6: Bermain
    {
        main: "BERMAIN",
        words: ["BERMAIN", "BERMAN", "MAIN", "BINA", "RAIN", "MINA", "BARN"],
        letters: ["B","E","R","M","A","I","N"]
    },
    // Set 7: Teman
    {
        main: "TEMANAN",
        words: ["TEMANAN", "TEMAN", "NAMA", "MANA", "NETA", "ANTE", "AMEN"],
        letters: ["T","E","M","A","N","A","N"]
    },
    // Set 8: Belajar
    {
        main: "BELAJAR",
        words: ["BELAJAR", "BELAR", "JALAR", "RAJA", "JARA", "LARA", "BELA"],
        letters: ["B","E","L","A","J","A","R"]
    },
    // Set 9: Kerja
    {
        main: "BEKERJA",
        words: ["BEKERJA", "KERJA", "JERA", "RAJA", "JARE", "BEKA", "RAKE"],
        letters: ["B","E","K","E","R","J","A"]
    },
    // Set 10: Liburan
    {
        main: "LIBURAN",
        words: ["LIBURAN", "LIBUR", "BINAR", "LUNAR", "BARU", "LARI", "NABI"],
        letters: ["L","I","B","U","R","A","N"]
    }
];

// Fungsi untuk membuat grid kosong 25x24
function createEmptyGrid() {
    const grid = [];
    for (let i = 0; i < 24; i++) {
        const row = [];
        for (let j = 0; j < 25; j++) {
            row.push("1");
        }
        grid.push(row);
    }
    return grid;
}

// Fungsi untuk generate level
function generateLevel(levelId) {
    // Pilih word set berdasarkan level (cycle through available sets)
    const setIndex = (levelId - 37) % wordSets.length;
    const selectedSet = wordSets[setIndex];
    
    return {
        id: levelId,
        words: selectedSet.words,
        random_letters: selectedSet.letters,
        grid: createEmptyGrid()
    };
}

// Generate dan simpan level 37-100
for (let levelId = 37; levelId <= 100; levelId++) {
    const levelData = generateLevel(levelId);
    const filename = `level_${levelId.toString().padStart(6, '0')}.json`;
    const filepath = path.join(__dirname, 'levels', filename);
    
    const jsonContent = JSON.stringify(levelData, null, 2);
    
    try {
        fs.writeFileSync(filepath, jsonContent, 'utf8');
        console.log(`✅ Generated ${filename}`);
    } catch (error) {
        console.error(`❌ Error generating ${filename}:`, error.message);
    }
}

console.log('\n🎉 Level generation completed!');
console.log('📝 Note: Grid layouts need to be manually configured for each level.');