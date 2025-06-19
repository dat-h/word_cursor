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
        const { width, height } = this.cameras.main;
        // // Add semi-opaque background if overlay
        // if (this.scene.isOverlay) {
        //     const bg = this.add.graphics();
        //     bg.fillStyle(0x000000, 1.0);
        //     bg.fillRect(0, 0, width, height);
        //     bg.setDepth(-1); // ensure it's behind menu UI
        // }
        // Wavy 'wardle' title as individual letters
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
        // Add menu buttons
        if (this.scene.isOverlay) {
            // Continue button
            const continueButton = this.add.bitmapText(width / 2, height / 2, 'nokia16', 'Continue', 24)
                .setOrigin(0.5)
                .setInteractive();
            continueButton.on('pointerdown', () => {
                if (this.scene.resumeTarget) {
                    this.scene.setVisible(true, this.scene.resumeTarget);
                    this.scene.resume(this.scene.resumeTarget);
                }
                this.scene.stop('MenuScene');
            });
            // Restart button
            const restartButton = this.add.bitmapText(width / 2, height / 2 + 60, 'nokia16', 'Restart', 24)
                .setOrigin(0.5)
                .setInteractive();
            restartButton.on('pointerdown', () => {
                // Reset game state and go to main menu
                gameState.gold = 10;
                gameState.level = 1;
                gameState.currentWord = '';
                gameState.opponentWord = '';
                gameState.survivingLetters = [];
                if (this.scene.resumeTarget) {
                    this.scene.setVisible(true, this.scene.resumeTarget);
                }
                this.scene.stop('BattleScene');
                this.scene.stop('WordEntryScene');                
                // Create twisting pixel effect
                this.createTwistingPixels();
                // Fade to black before restarting
                this.cameras.main.fadeOut(700, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.stop('MenuScene');
                    // this.scene.stop('BattleScene');
                    // this.scene.stop('WordEntryScene');
                    this.scene.start('WordEntryScene');
                });
            });
        } else {
            // Main menu play button
            const startButton = this.add.bitmapText(width / 2, height / 2, 'nokia16', "play", 24)
                .setOrigin(0.5)
                .setInteractive();
            startButton.on('pointerdown', () => {
                this.scene.start('WordEntryScene');
            });
        }
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

        // Add volume slider (20 blocks)
        this.volumeBlocks = [];
        const blockCount = 20;
        const blockSpacing = 9;
        const blockY = height / 2 + 250;
        const blockStartX = width / 2 - ((blockCount - 1) * blockSpacing) / 2;
        // Initialize gameState.volume if not set
        if (typeof gameState.volume !== 'number') gameState.volume = 1;
        for (let i = 0; i < blockCount; i++) {
            const filled = i < Math.round(gameState.volume * (blockCount - 1));
            const block = this.add.bitmapText(blockStartX + i * blockSpacing, blockY, 'nokia16', '|', 32)
                .setOrigin(0.5)
                .setTint(filled ? 0xffffff : 0x444444)
                .setInteractive();
            block.blockIndex = i;
            block.on('pointerdown', () => {
                this.setVolume(i / (blockCount - 1));
            });
            this.volumeBlocks.push(block);
        }
        this.updateVolumeBlocks();

        // Start background music

        if (!this.sound.get('bgm')) {
            this.sound.add('bgm', { loop: true, volume: 0.50 }).play();
        }
    }

    setVolume(value) {
        // Clamp between 0 and 1
        value = Math.max(0, Math.min(1, value));
        gameState.volumeLevel = value; // store slider position (0-1)
        // Power curve for perceived loudness with a minimum floor
        const minVolume = 0.005;
        const maxVolume = 1;
        const power = 2.5;
        const logVolume = minVolume + (maxVolume - minVolume) * Math.pow(value, power);
        gameState.volume = logVolume;
        this.sound.volume = logVolume;
        this.updateVolumeBlocks();
    }

    updateVolumeBlocks() {
        const blockCount = this.volumeBlocks.length;
        // Use the slider value for UI, not the log-mapped value
        const sliderValue = typeof gameState.volumeLevel === 'number' ? gameState.volumeLevel : 1;
        const filledBlocks = Math.round(sliderValue * (blockCount - 1));
        for (let i = 0; i < blockCount; i++) {
            this.volumeBlocks[i].setTint(i <= filledBlocks ? 0xffffff : 0x444444);
        }
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

    createTwistingPixels() {
        const { width, height } = this.cameras.main;
        const pixelSize = 8;
        const cols = Math.ceil(width / pixelSize);
        const rows = Math.ceil(height / pixelSize);
        this.twistingPixels = [];
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * pixelSize + pixelSize / 2;
                const y = row * pixelSize + pixelSize / 2;
                const pixel = this.add.rectangle(x, y, pixelSize - 1, pixelSize - 1, 0xffffff);
                pixel.setOrigin(0.5);
                pixel.setDepth(1000); // Above everything
                
                // Random rotation and scale animation
                const delay = Math.random() * 500;
                const duration = 700 + Math.random() * 300;
                const rotationSpeed = (Math.random() - 0.5) * 4; // -2 to 2 radians
                const scaleSpeed = 0.5 + Math.random() * 1.5; // 0.5 to 2
                
                this.tweens.add({
                    targets: pixel,
                    rotation: rotationSpeed * Math.PI,
                    scaleX: scaleSpeed,
                    scaleY: scaleSpeed,
                    alpha: 0,
                    x: x + (Math.random() - 0.5) * 50,
                    y: y + (Math.random() - 0.5) * 50,
                    delay: delay,
                    duration: duration,
                    ease: 'Cubic.easeOut',
                    onComplete: () => {
                        pixel.destroy();
                    }
                });
                
                this.twistingPixels.push(pixel);
            }
        }
    }
} 