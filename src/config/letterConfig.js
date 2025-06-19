export const LETTER_CONFIG = {
    // Vowels (cost: 2 gold)
    'a': { health: 2, damage: 2, cost: 2, type: 'vowel', tags: [] },
    'e': { health: 2, damage: 2, cost: 3, type: 'vowel', tags: [] },
    'i': { health: 2, damage: 2, cost: 2, type: 'vowel', tags: [] },
    'o': { health: 1, damage: 2, cost: 0, type: 'vowel', tags: [] },
    'u': { health: 2, damage: 2, cost: 2, type: 'vowel', tags: ['shielding'] },
    
    // Consonants (cost: 1 gold)
    'b': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] },
    'c': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] },
    'd': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] },
    'f': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] },
    'g': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] },
    'h': { health: 5, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] },
    'j': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] },
    'k': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] },
    'l': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: [] },
    'm': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] },
    'n': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: [] },
    'p': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] },
    'q': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] },
    'r': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: [] },
    's': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: [] },
    't': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: [] },
    'v': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] },
    'w': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] },
    'x': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing', 'special-targeting-x'] },
    'y': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing', 'special-targeting-y'] },
    'z': { health: 3, damage: 1, cost: 1, type: 'consonant', tags: ['healing'] }
}; 