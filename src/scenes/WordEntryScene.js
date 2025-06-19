import { gameState } from '../game.js';
import { LETTER_CONFIG } from '../config/letterConfig.js';
import { WORD_DICT, getRandomWord, isValidWord } from '../config/wordDict.js';
import { Starfield } from '../effects/Starfield.js';

export class WordEntryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WordEntryScene' });
    }

    preload() {
    }

    create() {
        this.starfield = new Starfield(this);
        this.font = 'nokia16';
        this.fontSize = 32;
        const { width, height } = this.cameras.main;

        // Set opponent word if not already set
        if (!gameState.opponentWord) {
            gameState.opponentWord = getRandomWord();
        }

        // Display current gold
        this.goldText = this.add.bitmapText(20, 20, this.font, `Gold: ${gameState.gold}`, this.fontSize).setOrigin(0, 0);

        // Display level indicator (top right)
        this.levelText = this.add.bitmapText(width - 20, 20, this.font, `Level: ${gameState.level}`, this.fontSize).setOrigin(1, 0);

        // Display opponent word
        const topY = 80;
        this.opponentTextLabel = this.add.bitmapText(
            width / 2,
            topY,
            this.font,
            'Opponent word:',
            this.fontSize
        ).setOrigin(0.5, 0);

        // this.opponentText = this.add.bitmapText(
        //     width / 2,
        //     topY + 36,
        //     this.font,
        //     gameState.opponentWord,
        //     this.fontSize
        // ).setOrigin(0.5, 0); 


        // Create opponent word with wavy animation
        this.opponentLetters = [];
        const word = gameState.opponentWord;
        const fontSize = 24;
        const scale = 1.5;
        const letterWidth = fontSize * scale;
        const gap = 4;
        const totalWidth = (letterWidth * word.length) + (gap * (word.length - 1));
        const startOpponentX = width / 2 - totalWidth / 2 + letterWidth / 2;
        const baseY = topY + 50;

        for (let i = 0; i < word.length; i++) {
            const letter = word[i];
            const x = startOpponentX + i * (letterWidth + gap);
            const sprite = this.add.bitmapText(x, baseY, this.font, letter, fontSize).setOrigin(0.5, 0.5);
            sprite.setScale(scale);
            sprite.baseY = baseY;
            sprite.waveIndex = i;
            this.opponentLetters.push(sprite);
        }

        // Display validation message
        this.validationText = this.add.bitmapText(width / 2, height / 2 + 100, this.font, '', this.fontSize).setOrigin(0.5);

        // Focus invisible input for keyboard capture
        if (window.focusInvisibleInput) {
            window.focusInvisibleInput();
        }

        const slotsY = height / 2;
        this.enterWordTitle = this.add.bitmapText(
        width / 2,
        slotsY - 60,
        this.font,
        'Enter word',
        this.fontSize
        ).setOrigin(0.5, 0);

        // Display 5 underscores for the word slots
        this.enteredWord = '';
        this.letterSlots = [];
        const slotSpacing = 40;
        const startX = this.cameras.main.width / 2 - (slotSpacing * 2);
        for (let i = 0; i < 5; i++) {
        const slot = this.add.bitmapText(
            startX + i * slotSpacing,
            slotsY,
            this.font,
            '_',
            this.fontSize
        ).setOrigin(0.5);
        this.letterSlots.push(slot);
        }
        // Add invisible clickable box overlay over the letter slots
        const overlayWidth = slotSpacing * 5;
        const overlayHeight = this.fontSize + 16;
        this.letterSlotOverlay = this.add.rectangle(
            this.cameras.main.width / 2,
            slotsY,
            overlayWidth,
            overlayHeight,
            0x000000,
            0 // fully transparent
        ).setInteractive({ useHandCursor: true });
        this.letterSlotOverlay.on('pointerdown', () => {
            if (window.focusInvisibleInput) {
            window.focusInvisibleInput();
            }
        });
        this.letterSlotOverlay.setDepth(10); // ensure it's above the stars but below text
        // Listen for keyboard input
        this.input.keyboard.on('keydown', this.handleWordInput, this);

        // Add Quit button (top right, below level)
        this.quitButton = this.add.bitmapText(width / 2, height - 60, this.font, 'Quit', this.fontSize)
            .setOrigin(0.5, 0)
            .setInteractive();
        this.quitButton.on('pointerdown', () => {
            // Reset game state
            gameState.gold = 10;
            gameState.level = 1;
            gameState.currentWord = '';
            gameState.opponentWord = '';
            gameState.survivingLetters = [];
            this.scene.start('MenuScene');
        });
    }

    handleWordInput(event) {
        if (!this.letterSlots) return;
        const key = event.key;
        let totalCost = 0;
        this.validationText.setText('');

        if (/^[a-zA-Z]$/.test(key) && this.enteredWord.length < 5) {
            let word = this.enteredWord + key.toLowerCase();

            // Calculate cost of current word
            for (let letter of word) {
                if (LETTER_CONFIG[letter]) {
                    totalCost += LETTER_CONFIG[letter].cost;
                }
            }

            if (totalCost > gameState.gold) {
                this.validationText.setText('Not enough gold!');
                return;
            }
            // Update gold display
            this.goldText.setText(`Gold: ${gameState.gold - totalCost}`);

            this.enteredWord += key.toLowerCase();
            this.letterSlots[this.enteredWord.length - 1].setText(key.toLowerCase());
        } else if (key === 'Backspace' && this.enteredWord.length > 0) {
            this.letterSlots[this.enteredWord.length - 1].setText('_');
            this.enteredWord = this.enteredWord.slice(0, -1);
        } else if (key === 'Enter' && this.enteredWord.length === 5) {
            this.checkWordAndProceed();
        }
        // Auto-check when 5 letters are entered
        if (this.enteredWord.length === 5) {
            this.checkWordAndProceed();
        }
      }

    checkWordAndProceed() {
        const word = this.enteredWord.toLowerCase();
        if (!isValidWord(word)) {
            // this.flashRedOverlay();
            this.validationText.setText('Not a valid word!');
            this.goldText.setText(`Gold: ${gameState.gold}`);
            this.enteredWord = '';
            for (let i = 0; i < this.letterSlots.length; i++) {
                this.letterSlots[i].setText('_');
            }
        } else { 
            let totalCost = 0;
            for (let letter of word) {
                if (LETTER_CONFIG[letter]) {
                    totalCost += LETTER_CONFIG[letter].cost;
                }
            }
            
            if (totalCost <= gameState.gold) {
                gameState.currentWord = word.toLowerCase();
                gameState.gold -= totalCost;
                // Fade to black for 700ms before starting battle
                this.cameras.main.fadeOut(700, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start('BattleScene');
                });
            } else {
                this.validationText.setText('Not enough gold!');
            }
        }
    }    

    handleInput(event) {
        const word = event.target.value.toUpperCase();
        let totalCost = 0;
        
        // Calculate cost of current word
        for (let letter of word) {
            if (LETTER_CONFIG[letter]) {
                totalCost += LETTER_CONFIG[letter].cost;
            }
        }

        // Update gold display
        this.goldText.setText(`Gold: ${gameState.gold - totalCost}`);

        // Disable input if cost exceeds gold
        if (totalCost > gameState.gold) {
            this.inputField.value = this.inputField.value.slice(0, -1);
        }

        // Clear validation message when input changes
        this.validationText.setText('');
    }

    handleKeyDown(event) {
        if (event.key === 'Enter') {
            const word = this.inputField.value.toLowerCase();
            if (word.length === 5) {
                // Validate word exists in dictionary
                if (!isValidWord(word)) {
                    this.validationText.setText('Not a valid word!');
                    return;
                }
                let totalCost = 0;
                for (let letter of word) {
                    if (LETTER_CONFIG[letter]) {
                        totalCost += LETTER_CONFIG[letter].cost;
                    }
                }
                if (totalCost <= gameState.gold) {
                    gameState.currentWord = word;
                    gameState.gold -= totalCost;
                    // Fade to black for 300ms before starting battle
                    this.cameras.main.fadeOut(300, 0, 0, 0);
                    this.cameras.main.once('camerafadeoutcomplete', () => {
                        this.scene.start('BattleScene');
                    });
                }
            }
        }
    }

    removeInputField() {
        if (this.inputField && document.body.contains(this.inputField)) {
            document.body.removeChild(this.inputField);
            this.inputField = null;
        }
    }

    update() {
        if (this.starfield) this.starfield.update();

        // Wavy animation for player and opponent words
        const amplitude = 10; // subtle
        const frequency = 5; // radians per second
        const time = this.time.now / 1000;
        if( this.opponentLetters ) {
            this.opponentLetters.forEach(l => {
                l.y = l.baseY + amplitude * Math.sin(frequency * time + l.waveIndex * 0.5);
            });
        }
    }
} 