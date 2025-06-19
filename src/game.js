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
export const gameState = {
    gold: 10,
    level: 1,
    currentWord: '',
    opponentWord: '',
    survivingLetters: [],
    isMuted: true
}; 