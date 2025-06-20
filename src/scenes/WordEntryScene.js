import { gameState, saveGameState } from '../game.js';
import { LETTER_CONFIG } from '../config/letterConfig.js';
import { WORD_DICT, getRandomWord, isValidWord, getRandomWordFromLettersWithPriority } from '../config/wordDict.js';
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
            // gameState.opponentWord = getRandomWord();
            // Choose a new random opponent word for the next round, prioritizing new letters
            gameState.opponentWord = getRandomWordFromLettersWithPriority(
                gameState.opponentAvailableLetters,
                gameState.opponentPriorityLetters || []
            );

        }

        // Display level indicator (top right)
        this.levelText = this.add.bitmapText(width / 2, 10, this.font, `Level: ${gameState.level}`, 24).setOrigin(0.5, 0);

        // Display opponent word
        const topY = 35;
        this.opponentTextLabel = this.add.bitmapText(
            width / 2,
            topY,
            this.font,
            'opponent word:',
            24
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
        const baseY = topY + 70;

        for (let i = 0; i < word.length; i++) {
            const letter = word[i];
            const x = startOpponentX + i * (letterWidth + gap);
            const sprite = this.add.bitmapText(x, baseY, this.font, letter, fontSize).setOrigin(0.5, 0.5);
            sprite.setScale(scale);
            sprite.baseY = baseY;
            sprite.waveIndex = i;
            // Add health bar above each letter
            const config = LETTER_CONFIG[letter];
            const maxHealth = config ? config.health : 1;
            const barWidth = 32;
            const barHeight = 6;
            const segmentGap = 2;
            const segmentWidth = (barWidth - (maxHealth - 1) * segmentGap) / maxHealth;
            const xStart = x - barWidth / 2;
            const barBaseY = baseY - (sprite.displayHeight / 2) - 10;
            const healthBar = this.add.graphics();
            for (let j = 0; j < maxHealth; j++) {
                healthBar.fillStyle(0x00ff00);
                healthBar.fillRect(xStart + j * (segmentWidth + segmentGap), barBaseY, segmentWidth, barHeight);
            }
            // Store healthBar and its baseY for animation
            sprite.healthBar = healthBar;
            // sprite.healthBarBaseY = barBaseY;
            this.opponentLetters.push(sprite);
        }

        // Display validation message
        this.validationText = this.add.bitmapText(width / 2, height / 2 + 100, this.font, '', this.fontSize).setOrigin(0.5);

        // Focus invisible input for keyboard capture
        if (window.focusInvisibleInput) {
            window.focusInvisibleInput();
        }

        const slotsY = height / 2 - 60;
        // this.enterWordTitle = this.add.bitmapText(
        // width / 2,
        // slotsY - 60,
        // this.font,
        // 'Enter word',
        // this.fontSize
        // ).setOrigin(0.5, 0);

        // Display 5 underscores for the word slots
        this.enteredWord = '';
        this.letterSlots = [];
        this.letterSlotHealthBars = [];
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
            // Create empty health bar placeholder
            this.letterSlotHealthBars.push(null);
        }
        // Add info card background and elements for last letter entered
        const cardWidth = 200;
        const cardHeight = 54;
        const cardX = this.cameras.main.width / 2 - cardWidth / 2;
        const cardY = slotsY - 90;
        this.infoCard = this.add.graphics();
        this.infoCard.fillStyle(0x222222, 0.85);
        this.infoCard.fillRoundedRect(cardX, cardY, cardWidth, cardHeight, 8);
        this.infoCard.lineStyle(2, 0xffffff, 1);
        this.infoCard.strokeRoundedRect(cardX, cardY, cardWidth, cardHeight, 8);
        this.infoCard.setVisible(false);
        // Large letter
        this.infoCardLetter = this.add.bitmapText(cardX + 20, cardY + cardHeight / 2, this.font, '', 24).setOrigin(0.5);
        this.infoCardLetter.setVisible(false);
        // Info texts
        this.lastLetterInfoText = this.add.bitmapText(cardX + 50, cardY + 14, this.font, '', 16).setOrigin(0, 0.5);
        this.lastLetterInfoText2 = this.add.bitmapText(cardX + 50, cardY + 36, this.font, '', 16).setOrigin(0, 0.5);
        this.lastLetterInfoText.setVisible(false);
        this.lastLetterInfoText2.setVisible(false);

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

        // Display current gold
        this.goldText = this.add.bitmapText(width / 2, slotsY + 80, this.font, `Funds: $${gameState.gold}`, 24).setOrigin(0.5, 0);

        // Add global menu button (top right)
        const menuButton = this.add.bitmapText(0, 0, this.font, '=', 48)
            .setOrigin(0, 0)
            .setInteractive();
        menuButton.on('pointerdown', () => {
            this.scene.setVisible(false, this.scene.key);
            this.scene.launch('MenuScene');
            this.scene.pause();
            this.scene.get('MenuScene').scene.isOverlay = true;
            this.scene.get('MenuScene').scene.resumeTarget = this.scene.key;
            saveGameState();
        });
        this.availableLettersLabel = this.add.bitmapText(width/2, slotsY + 40, this.font, 'Available Letters', 16).setOrigin(0.5);

        // --- Available Letters Setup ---
        if (!gameState.availableLetters) {
            const baseLetters = ['r', 's', 't', 'l', 'n', 'e'];
            const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
            const availablePool = alphabet.filter(l => !baseLetters.includes(l));
            Phaser.Utils.Array.Shuffle(availablePool);
            const randomLetters = availablePool.slice(0, 3);
            gameState.availableLetters = baseLetters.concat(randomLetters).sort();
            saveGameState();
        }
        this.availableLetters = gameState.availableLetters;

        // Display available letters as buttons below the letter slots
        this.letterButtons = [];
        const buttonSpacing = 25;
        const buttonY = slotsY + 60;
        const startXButtons = this.cameras.main.width / 2 - (buttonSpacing * 4);
        this.availableLetters.forEach((letter, i) => {
            const btn = this.add.bitmapText(startXButtons + i * buttonSpacing, buttonY, this.font, letter, 20)
                .setOrigin(0.5);
            // Convert to display-only (remove interactive properties)
            this.letterButtons.push(btn);
        });

        // Add QWERTY keyboard for available letters
        this.createQWERTYKeyboard();
    }

    createQWERTYKeyboard() {
        const { height } = this.cameras.main;
        const slotsY = height / 2 - 100;

        const qwertyLayout = [
            ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
            ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
            ['z', 'x', 'c', 'v', 'b', 'n', 'm']
        ];
        
        const keySize = 25;
        const keySpacing = 8;
        const keyboardY = slotsY + 170; // Position below existing letter display
        this.keyboardKeys = [];

        qwertyLayout.forEach((row, rowIndex) => {
            const rowWidth = row.length * (keySize + keySpacing) - keySpacing;
            const startX = this.cameras.main.width / 2 - rowWidth / 2;
            
            row.forEach((letter, colIndex) => {
                const x = startX + colIndex * (keySize + keySpacing) + keySize / 2;
                const y = keyboardY + rowIndex * (keySize + keySpacing) + keySize / 2;
                
                // Check if letter is available
                const isAvailable = this.availableLetters.includes(letter);
                
                const key = this.add.bitmapText(x, y, this.font, letter, 24)
                    .setOrigin(0.5);

                // Create square background
                const square = this.add.graphics();
                if (isAvailable) {
                    // Neon green square for available letters
                    square.lineStyle(2, 0x39ff14); // Neon green
                    square.strokeRect(x - keySize/2, y - keySize/2, keySize, keySize);
                    key.setAlpha(1);
                } else {
                    // Grey square with 80% transparency for unavailable letters
                    square.fillStyle(0x888888, 0.55); // Grey with 80% transparency
                    square.fillRect(x - keySize/2, y - keySize/2, keySize, keySize);
                    key.setAlpha(0.25);
                }

                
                // Only make available keys interactive
                if (isAvailable) {
                    key.setInteractive();
                    key.on('pointerdown', () => {
                        this.sound.play('attack');
                        this.handleLetterButton(letter);
                    });
                }
                
                // Store both the key and its square
                this.keyboardKeys.push({ key, square });
            });
        });

        // Add backspace key on the bottom right
        const backspaceX = this.cameras.main.width / 2 + (qwertyLayout[0].length * (keySize + keySpacing)) / 2 - keySize;
        const backspaceY = keyboardY + 2 * (keySize + keySpacing) + keySize / 2;    
        
        // Create neon green square for backspace
        const backspaceSquare = this.add.graphics();
        backspaceSquare.lineStyle(2, 0x39ff14); // Neon green
        backspaceSquare.strokeRect(backspaceX - keySize/2, backspaceY - keySize/2, keySize, keySize);
        
        const backspaceKey = this.add.bitmapText(backspaceX, backspaceY, this.font, '<', 20)
            .setOrigin(0.5)
            .setInteractive();
        
        backspaceKey.on('pointerdown', () => {
            this.sound.play('attack');
            // Simulate backspace key press
            const event = { key: 'Backspace' };
            this.handleWordInput(event);
        });
        
        this.keyboardKeys.push({ key: backspaceKey, square: backspaceSquare });
    }

    handleWordInput(event) {
        if (!this.letterSlots) return;
        const key = event.key.toLowerCase();
        let totalCost = 0;
        this.validationText.setText('');

        if (/^[a-z]$/.test(key) && this.enteredWord.length < 5 && this.availableLetters.includes(key)) {
            let word = this.enteredWord + key;

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
            this.goldText.setText(`Funds: $${gameState.gold - totalCost}`);
            this.enteredWord += key;
            this.letterSlots[this.enteredWord.length - 1].setText(key);

            // Update letter slots and health bars
            for (let i = 0; i < 5; i++) {
                const slot = this.letterSlots[i];
                const letter = word[i] || '_';
                slot.setText(letter);
                // Remove old health bar if present
                if (this.letterSlotHealthBars[i]) {
                    this.letterSlotHealthBars[i].destroy();
                    this.letterSlotHealthBars[i] = null;
                }
                // Add health bar if letter is present and valid
                if (LETTER_CONFIG[letter]) {
                    const config = LETTER_CONFIG[letter];
                    const maxHealth = config ? config.health : 1;
                    const barWidth = 32;
                    const barHeight = 6;
                    const segmentGap = 2;
                    const segmentWidth = (barWidth - (maxHealth - 1) * segmentGap) / maxHealth;
                    const xStart = slot.x - barWidth / 2;
                    const y = slot.y - (slot.displayHeight / 2) - 10;
                    const healthBar = this.add.graphics();
                    for (let j = 0; j < maxHealth; j++) {
                        healthBar.fillStyle(0x00ff00);
                        healthBar.fillRect(xStart + j * (segmentWidth + segmentGap), y, segmentWidth, barHeight);
                    }
                    this.letterSlotHealthBars[i] = healthBar;
                    const tags = config.tags && config.tags.length ? `${config.tags.join(', ')}` : '';
                    this.infoCard.setVisible(true);
                    this.infoCardLetter.setText(letter.toLowerCase());
                    this.infoCardLetter.setVisible(true);
                    this.lastLetterInfoText.setText(`ATK: ${config.damage}  Cost: $${config.cost}`);
                    this.lastLetterInfoText2.setText(tags);
                    this.lastLetterInfoText.setVisible(true);
                    this.lastLetterInfoText2.setVisible(true);
                }
            }
            // // Show comet if two letters left
            // if (this.enteredWord.length === 3) {
            //     this.starfield.showComet(true);
            // } else {
            //     this.starfield.showComet(false);
            // }
        } else if (key === 'backspace' && this.enteredWord.length > 0) {
            this.letterSlots[this.enteredWord.length - 1].setText('_');
            this.enteredWord = this.enteredWord.slice(0, -1);

            // Update gold display
            let word = this.enteredWord;
            // Calculate cost of current word
            for (let letter of word) {
                if (LETTER_CONFIG[letter]) {
                    totalCost += LETTER_CONFIG[letter].cost;
                }
            }            
            this.goldText.setText(`Funds: $${gameState.gold - totalCost}`);
            const i = this.enteredWord.length;
            if (this.letterSlotHealthBars[i]) {
                this.letterSlotHealthBars[i].destroy();
                this.letterSlotHealthBars[i] = null;
            }
            this.infoCard.setVisible(false);
            this.infoCardLetter.setVisible(false);
            this.lastLetterInfoText.setVisible(false);
            this.lastLetterInfoText2.setVisible(false);
            // Show comet if two letters left
            // if (this.enteredWord.length === 3) {
            //     this.starfield.showComet(true);
            // } else {
            //     this.starfield.showComet(false);
            // }
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
            this.goldText.setText(`Funds: $${gameState.gold}`);
            this.enteredWord = '';
            for (let i = 0; i < this.letterSlots.length; i++) {
                this.letterSlots[i].setText('_');
                if (this.letterSlotHealthBars[i]) {
                    this.letterSlotHealthBars[i].destroy();
                    this.letterSlotHealthBars[i] = null;
                }

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
                saveGameState();
                // Blur invisible input
                if (window.blurInvisibleInput) {
                    window.blurInvisibleInput();
                }                        
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
        const word = event.target.value.toLowerCase();
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
        // Update letter slots and health bars
        for (let i = 0; i < 5; i++) {
            const slot = this.letterSlots[i];
            const letter = word[i] || '_';
            slot.setText(letter);
            // Remove old health bar if present
            if (this.letterSlotHealthBars[i]) {
                this.letterSlotHealthBars[i].destroy();
                this.letterSlotHealthBars[i] = null;
            }
            // Add health bar if letter is present and valid
            if (LETTER_CONFIG[letter]) {
                const config = LETTER_CONFIG[letter];
                const maxHealth = config ? config.health : 1;
                const barWidth = 32;
                const barHeight = 6;
                const segmentGap = 2;
                const segmentWidth = (barWidth - (maxHealth - 1) * segmentGap) / maxHealth;
                const xStart = slot.x - barWidth / 2;
                const y = slot.y - (slot.displayHeight / 2) - 10;
                const healthBar = this.add.graphics();
                for (let j = 0; j < maxHealth; j++) {
                    healthBar.fillStyle(0x00ff00);
                    healthBar.fillRect(xStart + j * (segmentWidth + segmentGap), y, segmentWidth, barHeight);
                }
                this.letterSlotHealthBars[i] = healthBar;
            }
        }
        // Show comet if two letters left
        if (word.length === 2) {
            this.starfield.showComet(true);
        } else {
            this.starfield.showComet(false);
        }

        // Update info card for last letter
        if (word.length > 0) {
            const lastLetter = word[word.length - 1];
            const config = LETTER_CONFIG[lastLetter];
            if (config) {
                const tags = config.tags && config.tags.length ? `${config.tags.join(', ')}` : '';
                this.infoCard.setVisible(true);
                this.infoCardLetter.setText(lastLetter.toUpperCase());
                this.infoCardLetter.setVisible(true);
                this.lastLetterInfoText.setText(`atk: ${config.damage}  Cost: $${config.cost}`);
                this.lastLetterInfoText2.setText(tags);
                this.lastLetterInfoText.setVisible(true);
                this.lastLetterInfoText2.setVisible(true);
            } else {
                this.infoCard.setVisible(false);
                this.infoCardLetter.setVisible(false);
                this.lastLetterInfoText.setVisible(false);
                this.lastLetterInfoText2.setVisible(false);
            }
        } else {
            this.infoCard.setVisible(false);
            this.infoCardLetter.setVisible(false);
            this.lastLetterInfoText.setVisible(false);
            this.lastLetterInfoText2.setVisible(false);
        }
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
                    gameState.currentWord = word.toLowerCase();
                    gameState.gold -= totalCost;
                    saveGameState();
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
    }

    removeInputField() {
        if (this.inputField && document.body.contains(this.inputField)) {
            document.body.removeChild(this.inputField);
            this.inputField = null;
        }
    }

    update() {
        if (this.starfield) this.starfield.update();
        // Wavy animation for opponent word and health bars
        const amplitude = 10; // subtle
        const frequency = 5; // radians per second
        const time = this.time.now / 1000;
        if (this.opponentLetters) {
            this.opponentLetters.forEach(l => {
                l.y = l.baseY + amplitude * Math.sin(frequency * time + l.waveIndex * 0.5);
                if (l.healthBar) {
                    l.healthBar.y = l.y - l.baseY;
                }
            });
        }
    }

    // Add handler for letter button clicks
    handleLetterButton(letter) {
        if (this.enteredWord.length < 5) {
            // Simulate the same logic as valid keyboard input
            let event = { key: letter };
            this.handleWordInput(event);
        }
    }
} 