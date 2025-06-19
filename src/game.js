import Phaser from 'phaser';
import { LETTER_CONFIG } from './config/letterConfig.js';
import { MenuScene } from './scenes/MenuScene.js';
import { WordEntryScene } from './scenes/WordEntryScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { LoadingScene } from './scenes/LoadingScene.js';
import { loadWordDict } from './config/wordDict.js';

function createOrGetInvisibleInput() {
    let input = document.getElementById('invisible-word-input');
    if (!input) {
      input = document.createElement('input');
      input.type = 'text';
      input.id = 'invisible-word-input';
      input.style.position = 'absolute';
      input.style.opacity = '0';
      input.style.pointerEvents = 'none';
      input.style.zIndex = '100';
      input.autocomplete = 'off';
      document.body.appendChild(input);
    }
    return input;
}
  
window.focusInvisibleInput = function() {
    const input = createOrGetInvisibleInput();
    input.value = '';
    input.focus();
};
  
window.blurInvisibleInput = function() {
    const input = document.getElementById('invisible-word-input');
    if (input) input.blur();
};

// Load word dictionary before starting the game
loadWordDict().then(() => {
    const config = {
        type: Phaser.AUTO,
        parent: 'game-container',
        width: 320,
        height: 600,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        scene: [LoadingScene, MenuScene, WordEntryScene, BattleScene, GameOverScene]
    };

    const game = new Phaser.Game(config);
});

// Game state
export const GAME_SAVE_KEY = 'wardleSave';
export const GAME_SAVE_VERSION = 1;

export const gameState = {
    gold: 10,
    level: 1,
    currentWord: '',
    opponentWord: '',
    survivingLetters: [],
    isMuted: true, // Muted by default
    volumeLevel: 1,
    volume: 0,
    version: GAME_SAVE_VERSION,
    opponentAvailableLetters: ['r', 's', 't', 'l', 'n', 'e', 'o'],
    opponentPriorityLetters: [ 'o'],
    lastScene: 'MenuScene',
};

export function saveGameState() {
    try {
        const saveData = {
            // gold: gameState.gold,
            // level: gameState.level,
            // currentWord: gameState.currentWord,
            // opponentWord: gameState.opponentWord,
            // survivingLetters: gameState.survivingLetters,
            isMuted: gameState.isMuted,
            volumeLevel: gameState.volumeLevel,
            volume: gameState.volume,
            version: GAME_SAVE_VERSION,
            // lastScene: gameState.lastScene,
        };
        localStorage.setItem(GAME_SAVE_KEY, JSON.stringify(saveData));
    } catch (e) {
        // ignore
    }
}

export function loadGameState() {
    try {
        const data = localStorage.getItem(GAME_SAVE_KEY);
        if (!data) return;
        const saveData = JSON.parse(data);
        if (saveData.version !== GAME_SAVE_VERSION) return; // skip incompatible saves
        Object.assign(gameState, saveData);
    } catch (e) {
        // ignore
    }
}

// Load state on game start
loadGameState();

// Save on page unload
window.addEventListener('beforeunload', saveGameState); 