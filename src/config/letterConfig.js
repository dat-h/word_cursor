export const LETTER_CONFIG = {
    // Vowels (cost: 2 gold)
    'a': { health: 2, damage: 3, cost: 2, type: 'vowel', tags: [] },
    'e': { health: 2, damage: 2, cost: 1, type: 'vowel', tags: [] },
    'i': { health: 3, damage: 2, cost: 2, type: 'vowel', tags: [] },
    'o': { health: 1, damage: 2, cost: 0, type: 'vowel', tags: [] },
    'u': { health: 2, damage: 2, cost: 3, type: 'vowel', tags: ['shielding'] },
    
    // Consonants (cost: 1 gold)
    'b': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] },
    'c': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] },
    'd': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['double'] },
    'f': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] },
    'g': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] },
    'h': { health: 5, damage: 1, cost: 3, type: 'consonant', tags: ['healing'] },
    'j': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] },
    'k': { health: 2, damage: 2, cost: 3, type: 'consonant', tags: ['healing', 'double'] },
    'l': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] },
    'm': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['double', 'revenant-n'] },
    'n': { health: 2, damage: 1, cost: 1, type: 'consonant', tags: [] },
    'p': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] },
    'q': { health: 5, damage: 1, cost: 2, type: 'consonant', tags: ['healing', 'double'] },
    'r': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: [] },
    's': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: [] },
    't': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: [] },
    'v': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] },
    'w': { health: 3, damage: 1, cost: 3, type: 'consonant', tags: ['double', 'revenant-v'] },
    'x': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing', 'target-left'] },
    'y': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing', 'target-right'] },
    'z': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing', 'revenant-v'] }
}; 