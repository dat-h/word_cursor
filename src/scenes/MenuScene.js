import { gameState } from '../game.js';
import { Starfield } from '../effects/Starfield.js';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
    }

    create() {
        this.starfield = new Starfield(this);
        // Add title
        const { width, height } = this.cameras.main;

        this.add.bitmapText(width / 2, height / 2 - 100, 'nokia16', 'wardle', 32).setOrigin(0.5);

        // Add start button
        const startButton = this.add.bitmapText(width / 2, height / 2, 'nokia16', "play", 24)
            .setOrigin(0.5)
            .setInteractive();

        startButton.on('pointerdown', () => {
            this.scene.start('WordEntryScene');
        });

        // Add sound toggle
        const soundButton = this.add.bitmapText(width / 2, height / 2 + 200, 'nokia16', 'Sound: ON', 24)
            .setOrigin(0.5)
            .setInteractive();

        soundButton.on('pointerdown', () => {
            gameState.isMuted = !gameState.isMuted;
            soundButton.setText(`Sound: ${gameState.isMuted ? 'OFF' : 'ON'}`);
            this.sound.mute = gameState.isMuted;
        });

        // Start background music
        // if (!this.sound.get('bgm')) {
        //     this.sound.add('bgm', { loop: true, volume: 0.5 }).play();
        // }
    }

    update() {
        if (this.starfield) this.starfield.update();
    }
} 