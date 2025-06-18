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
