import { gameState } from '../game.js';
import { Starfield } from '../effects/Starfield.js';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create() {
        this.starfield = new Starfield(this);
        const { width, height } = this.cameras.main;

        // Display game over text
        const gameOverText = this.add.bitmapText(width / 2, height / 2, 'nokia16', 'GAME OVER', 48).setOrigin(0.5);
        gameOverText.setTint(0xff0000);

        // Display final score
        this.add.bitmapText(width / 2, height / 2 + 100, 'nokia16', `Level Reached: ${gameState.level}`, 24).setOrigin(0.5);

        // Add restart button
        const restartButton = this.add.bitmapText(width / 2, height / 2 + 250, 'nokia16', 'Play Again', 24).setOrigin(0.5).setInteractive();

        restartButton.on('pointerdown', () => {
            // Reset game state
            gameState.gold = 10;
            gameState.level = 1;
            gameState.currentWord = '';
            gameState.opponentWord = '';
            gameState.survivingLetters = [];
            
            this.scene.start('MenuScene');
        });
    }

    update() {
        if (this.starfield) this.starfield.update();
    }
} 