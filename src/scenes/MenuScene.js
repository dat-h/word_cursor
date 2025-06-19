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

        // this.add.bitmapText(width / 2, height / 2 - 100, 'nokia16', 'wardle', 32).setOrigin(0.5);

        // Create opponent word with wavy animation
        this.gameTitleLetters = [];
        const word = 'wardle';
        const fontSize = 24;
        const scale = 1.5;
        const letterWidth = fontSize * scale;
        const gap = 4;
        const totalWidth = (letterWidth * word.length) + (gap * (word.length - 1));
        const startX = width / 2 - totalWidth / 2 + letterWidth / 2;
        const baseY = height / 2 - 100;

        for (let i = 0; i < word.length; i++) {
            const letter = word[i];
            const x = startX + i * (letterWidth + gap);
            const sprite = this.add.bitmapText(x, baseY, 'nokia16', letter, fontSize).setOrigin(0.5, 0.5);
            sprite.setScale(scale);
            sprite.baseY = baseY;
            sprite.waveIndex = i;
            this.gameTitleLetters.push(sprite);
        }



        // Add start button
        const startButton = this.add.bitmapText(width / 2, height / 2, 'nokia16', "play", 24)
            .setOrigin(0.5)
            .setInteractive();

        startButton.on('pointerdown', () => {
            this.scene.start('WordEntryScene');
        });

        // Set muted to default
        this.sound.mute = gameState.isMuted;

        // Add sound toggle
        const soundButton = this.add.bitmapText(width / 2, height / 2 + 200, 'nokia16', 'Sound: OFF', 24)
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
        const amplitude = 10; // subtle
        const frequency = 5; // radians per second
        const time = this.time.now / 1000;
        if( this.gameTitleLetters ) {
            this.gameTitleLetters.forEach(l => {
                l.y = l.baseY + amplitude * Math.sin(frequency * time + l.waveIndex * 0.5);
            });
        }        
    }
} 