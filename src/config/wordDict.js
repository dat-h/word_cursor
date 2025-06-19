// Load the word dictionary from the public folder
export const WORD_DICT = [];

// Function to load the word dictionary
export async function loadWordDict() {
    try {
        const response = await fetch('assets/words.txt');
        const text = await response.text();
        const words = text.split('\n').map(word => word.trim().toLowerCase());
        WORD_DICT.push(...words.filter(word => word.length === 5));
    } catch (error) {
        console.error('Error loading word dictionary:', error);
    }
}

// Function to get a random word from the dictionary
export function getRandomWord() {
    const randomIndex = Math.floor(Math.random() * WORD_DICT.length);
    return WORD_DICT[randomIndex].toLowerCase();
}

// Function to check if a word is valid
export function isValidWord(word) {
    return WORD_DICT.includes(word.toLowerCase());
}

export function getRandomWordFromLettersWithPriority(allowedLetters, priorityLetters) {
    const allowedSet = new Set(allowedLetters);
    const prioritySet = new Set(priorityLetters);

    // 1. Filter valid words
    const validWords = WORD_DICT.filter(word =>
        word.split('').every(letter => allowedSet.has(letter))
    );

    if (validWords.length === 0) return null;

    // 2. Score words by number of unique priority letters present
    const scoredWords = validWords.map(word => {
        const uniqueLetters = new Set(word.split(''));
        let score = 0;
        for (const letter of prioritySet) {
            if (uniqueLetters.has(letter)) score++;
        }
        return { word, score };
    });

    // 3. Sort by score descending
    scoredWords.sort((a, b) => b.score - a.score);

    // 4. Take the top 100 scoring words (or all if less)
    const topWords = scoredWords.slice(0, 100);

    // 5. Randomly select one from the top set
    const randomEntry = Phaser.Utils.Array.GetRandom(topWords);

    return randomEntry ? randomEntry.word : null;
}
