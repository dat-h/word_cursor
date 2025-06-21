import { gameState, saveGameState } from '../game.js';
import { LETTER_CONFIG } from '../config/letterConfig.js';
import { Starfield } from '../effects/Starfield.js';
import { getRandomWordFromLettersWithPriority } from '../config/wordDict.js';

export class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    preload() {

    }

    create() {
        this.starfield = new Starfield(this);

        // Blur invisible input
        if (window.blurInvisibleInput) {
            window.blurInvisibleInput();
        }
        
        this.playerLetters = [];
        this.opponentLetters = [];
        this.currentTurn = 'player'; // or 'opponent'
        this.isActionPhase = true;
        this.currentActionIndex = 0;
        this.isFirstTurn = true; // Track if it's the first turn

        // Create player letters
        this.createLetters(gameState.currentWord, true);
        // Create opponent letters
        this.createLetters(gameState.opponentWord, false);

        // Add global menu button (top right)
        const width = this.cameras.main.width;
        const menuButton = this.add.bitmapText(0, 0, 'nokia16', '=', 48)
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

        // Start battle
        this.time.delayedCall(1000, this.startBattle, [], this);
    }

    createLetters(word, isPlayer) {
        const letters = isPlayer ? this.playerLetters : this.opponentLetters;
        const y = isPlayer ? 400 : 200;
        // Layout for 320px width
        const areaWidth = 320;
        const fontSize = 16; // bitmapText font size
        const scale = 2.5; // scale to fit 5 letters in 320px
        const letterWidth = fontSize * scale; // 56px
        const gap = 8;
        const totalWidth = (letterWidth * word.length) + (gap * (word.length - 1));
        const startX = areaWidth / 2 - totalWidth / 2 + letterWidth / 2;

        for (let i = 0; i < word.length; i++) {
            const letter = word[i];
            const x = startX + i * (letterWidth + gap);
            // Create letter sprite
            const sprite = this.add.bitmapText(x, y, 'nokia16', letter, fontSize).setOrigin(0.5, 0.5);
            sprite.setScale(scale);
            // Store baseY for wavy animation
            sprite.baseY = y;
            sprite.waveIndex = i;
            // Create health bar
            const healthBar = this.add.graphics();
            const maxHealth = LETTER_CONFIG[letter].health;
            // Store letter data
            letters.push({
                letter,
                sprite,
                healthBar,
                health: maxHealth,
                maxHealth,
                tempHealth: 0,
                hasShield: false
            });
            this.updateHealthBar(letters[i]);
        }
    }

    updateHealthBar(letterData) {
        const { sprite, healthBar, health, maxHealth, tempHealth = 0 } = letterData;
        healthBar.clear();
        const barWidth = 40;
        const barHeight = 7;
        const segmentGap = 2;
        const totalSegments = maxHealth + tempHealth;
        const segmentWidth = (barWidth - (totalSegments - 1) * segmentGap) / totalSegments;
        const xStart = sprite.x - barWidth / 2;
        const y = sprite.y - (sprite.displayHeight / 2) - 12;
        for (let i = 0; i < totalSegments; i++) {
            let color;
            if (i < health) {
                color = 0x00ff00; // green for real health
            } else if (i < health + tempHealth) {
                color = 0x33ccff; // blue for temp health
            } else {
                color = 0x555555; // gray for missing
            }
            healthBar.fillStyle(color);
            healthBar.fillRect(xStart + i * (segmentWidth + segmentGap), y, segmentWidth, barHeight);
        }
    }

    startBattle() {
        this.processTurn();
    }

    processTurn() {
        if (this.isActionPhase) {
            this.processActionPhase();
        } else {
            this.processAttackPhase();
        }
    }

    processActionPhase() {
        // On the very first turn, add 1 temp health to all opponent letters
        if (this.isFirstTurn && this.currentTurn === 'player' && this.currentActionIndex === 0) {
            this.sound.play('heal');

            this.opponentLetters.forEach(letter => {
                this.addTemporaryHealth(letter, 1);
            });
        }

        const letters = this.currentTurn === 'player' ? this.opponentLetters : this.playerLetters;
        if (this.currentActionIndex >= letters.length) {
            this.isActionPhase = false;
            this.currentActionIndex = 0;
            // After the first action phase for opponent, set isFirstTurn to false
            if (this.isFirstTurn && this.currentTurn === 'player') {
                this.isFirstTurn = false;
            }
            this.processTurn();
            return;
        }

        const letter = letters[this.currentActionIndex];
        if (!letter.sprite.active) {
            this.currentActionIndex++;
            this.processTurn();
            return;
        }

        // New logic using tags:
        const config = LETTER_CONFIG[letter.letter];
        if (config.tags && config.tags.includes('shielding')) {
            this.createShield(letter);
        } else if (config.tags && config.tags.includes('healing')) {
            this.healNeighbors(letter);
        }

        this.currentActionIndex++;
        const delay = gameState.battleSpeed === 'fast' ? 250 : 500;
        this.time.delayedCall(delay, this.processTurn, [], this);
    }

    processAttackPhase() {
        const attacker = this.currentTurn === 'player' ? this.playerLetters : this.opponentLetters;
        const defender = this.currentTurn === 'player' ? this.opponentLetters : this.playerLetters;
        
        if (this.currentActionIndex >= attacker.length) {
            // Switch turns
            this.currentTurn = this.currentTurn === 'player' ? 'opponent' : 'player';
            this.isActionPhase = true;
            this.currentActionIndex = 0;
            // After the attack phase is completely finished for every letter, reset tempHealth
            [this.playerLetters, this.opponentLetters].forEach(group => {
                group.forEach(letter => {
                    if (letter.tempHealth && letter.tempHealth > 0) {
                        letter.tempHealth = 0;
                        this.updateHealthBar(letter);
                    }
                });
            });
            this.processTurn();
            return;
        }

        const attackingLetter = attacker[this.currentActionIndex];
        if (!attackingLetter.sprite.active) {
            this.currentActionIndex++;
            this.processTurn();
            return;
        }
        let targetIndex;

        // New logic using tags:
        const config = LETTER_CONFIG[attackingLetter.letter];
        if (config.tags && config.tags.includes('target-left')) {
            targetIndex = 0;
        } else if (config.tags && config.tags.includes('target-right')) {
            targetIndex = defender.length - 1;
        } else {
            targetIndex = this.currentActionIndex;
        }

        // Find next active target from left to right
        let foundTarget = false;
        if (defender[targetIndex].sprite.active) {
            foundTarget = true;
        } else {
            for (let i = 0; i < defender.length; i++) {
                if (defender[i].sprite.active) {
                    targetIndex = i;
                    foundTarget = true;
                    break;
                }
            }
        }
        if (foundTarget) {
            this.attack(attackingLetter, defender[targetIndex]);
        }
        
        this.currentActionIndex++;
        const delay = gameState.battleSpeed === 'fast' ? 250 : 500;
        this.time.delayedCall(delay, this.processTurn, [], this);
    }

    attack(attacker, defender) {
        // Play attack sound
        this.sound.play('attack');
        let damage = LETTER_CONFIG[attacker.letter].damage;
        const config = LETTER_CONFIG[attacker.letter];
        const isDouble = config.tags && config.tags.includes('double');
        
        if (isDouble) {
            // Double attack - create first particle with callback for second attack
            this.createAttackParticle(attacker, defender, damage, 0, () => {
                // Callback when first attack completes - find new target and create second attack
                const newTarget = this.findAliveTarget(defender);
                this.createAttackParticle(attacker, newTarget, damage, 1);
            });
        } else {
            // Single attack
            this.createAttackParticle(attacker, defender, damage, 0);
        }
    }

    findAliveTarget(originalTarget) {
        // If original target is still alive, use it
        if (originalTarget.sprite.active) {
            return originalTarget;
        }
        
        // Find the first alive target from the same team as original target
        const defenderTeam = this.playerLetters.includes(originalTarget) ? this.playerLetters : this.opponentLetters;
        const aliveTarget = defenderTeam.find(letter => letter.sprite.active);
        
        return aliveTarget || originalTarget; // Return original if no alive targets found
    }

    createAttackParticle(attacker, defender, damage, particleIndex, onCompleteCallback = null) {
        const particle = this.add.sprite(attacker.sprite.x, attacker.sprite.y, 'flares', 'yellow');
        particle.setScale(0.25 * damage); // Scale particle based on damage
        particle.setAlpha(1);
        particle.setTint(0xffffff);
        particle.setBlendMode(Phaser.BlendModes.ADD);

        // Create attack animation with speed adjustment
        const duration = gameState.battleSpeed === 'fast' ? 100 : 200;
        const tween = this.tweens.add({
            targets: particle,
            x: defender.sprite.x,
            y: defender.sprite.y,
            duration: duration,
            yoyo: false,
            onComplete: () => {
                particle.destroy();
                if (defender.hasShield) {
                    defender.hasShield = false;
                    if (defender.shieldVisual) {
                        defender.shieldVisual.shieldFlare.destroy();
                        defender.shieldVisual.shieldCircle.destroy();
                        defender.shieldVisual = null;
                    }
                }
                // Apply damage
                let remainingDamage = damage;
                // Damage tempHealth first
                if (defender.tempHealth && defender.tempHealth > 0) {
                    const tempDamage = Math.min(defender.tempHealth, remainingDamage);
                    defender.tempHealth -= tempDamage;
                    remainingDamage -= tempDamage;
                    this.sound.play('damage');
                    // Show damage indicator for temp health (blue)
                    this.showFloatingText(defender.sprite.x, defender.sprite.y - 40, `-${tempDamage}`, '#33ccff');
                }
                if (remainingDamage > 0) {
                    defender.health -= remainingDamage;
                    this.sound.play('damage');
                    // Show damage indicator for real health (red)
                    this.showFloatingText(defender.sprite.x, defender.sprite.y - 40, `-${remainingDamage}`, '#ff3333');
                }
                // Shake effect with speed adjustment
                const shakeDuration = gameState.battleSpeed === 'fast' ? 25 : 50;
                this.tweens.add({
                    targets: defender.sprite,
                    x: defender.sprite.x + 5,
                    duration: shakeDuration,
                    yoyo: true,
                    repeat: 3
                });
                if (defender.health <= 0) {
                    this.destroyLetter(defender);
                } else {
                    this.updateHealthBar(defender);
                }
                
                // Call the completion callback if provided
                if (onCompleteCallback) {
                    onCompleteCallback();
                }
            }
        });
    }

    destroyLetter(letterData) {
        this.sound.play('explode');
        
        // Check for revenant ability before destroying
        const config = LETTER_CONFIG[letterData.letter];
        const revenantTag = config.tags ? config.tags.find(tag => tag.startsWith('revenant-')) : null;
        
        // Store position before destroying sprite
        const spriteX = letterData.sprite.x;
        const spriteY = letterData.sprite.y;
        const baseY = letterData.sprite.baseY;
        const waveIndex = letterData.sprite.waveIndex;
        
        // Create explosion particles
        const emitter = this.add.particles(spriteX, spriteY, 'flares', {
            frame: [ 'red', 'yellow', 'white' ],
            lifespan: 600,
            speed: { min: 150, max: 250 },
            scale: { start: 0.3, end: 0 },
            gravityY: 150,
            blendMode: 'ADD',
            emitting: false
        });
        emitter.explode(20); // Fixed number of particles for explosion

        // Destroy letter
        letterData.healthBar.destroy();        
        letterData.sprite.destroy();

        letterData.sprite.active = false;

        // Handle revenant resurrection
        if (revenantTag) {
            const resurrectLetter = revenantTag.split('-')[1]; // Extract the letter from 'revenant-v'
            const resurrectConfig = LETTER_CONFIG[resurrectLetter];
            
            if (resurrectConfig) {
                // Delay resurrection
                const delay = gameState.battleSpeed === 'fast' ? 300 : 600;
                this.time.delayedCall(delay, () => {
                    // Create resurrection effect
                    const resurrectionEmitter = this.add.particles(spriteX, spriteY, 'flares', {
                        frame: [ 'green', 'blue', 'white' ],
                        lifespan: 800,
                        speed: { min: 100, max: 200 },
                        scale: { start: 0.4, end: 0 },
                        gravityY: -50,
                        blendMode: 'ADD',
                        emitting: false
                    });
                    resurrectionEmitter.explode(15);
                    
                    // Resurrect as new letter
                    letterData.letter = resurrectLetter;
                    letterData.health = resurrectConfig.health;
                    letterData.maxHealth = resurrectConfig.health;
                    letterData.tempHealth = 0;
                    letterData.hasShield = false;
                    
                    // Recreate sprite and health bar
                    letterData.sprite = this.add.bitmapText(spriteX, spriteY, 'nokia16', resurrectLetter, 16).setOrigin(0.5, 0.5);
                    letterData.sprite.setScale(2.5);
                    letterData.sprite.baseY = baseY;
                    letterData.sprite.waveIndex = waveIndex;
                    
                    letterData.healthBar = this.add.graphics();
                    this.updateHealthBar(letterData);
                    
                    // Make sprite active again
                    letterData.sprite.active = true;
                    
                    // Play resurrection sound
                    this.sound.play('heal');
                    
                    // Show resurrection indicator
                    this.showFloatingText(spriteX, spriteY - 40, 'AVENGE!', '#ffffff');
                    
                    // Check for game over after resurrection
                    this.checkGameOver();
                }, [], this);
            } else {
                // No resurrection - check game over immediately
                this.checkGameOver();
            }
        } else {
            // No revenant tag - check game over immediately
            this.checkGameOver();
        }
    }

    createShield(letter) {
        this.sound.play('heal');
        // Find closest living neighbors
        const letters = this.currentTurn === 'player' ? this.opponentLetters : this.playerLetters;
        const index = letters.indexOf(letter);
        const neighbors = [];
        // Find left neighbor
        for (let i = index - 1; i >= 0; i--) {
            if (letters[i].sprite.active) {
                neighbors.push(i);
                break;
            }
        }
        // Find right neighbor
        for (let i = index + 1; i < letters.length; i++) {
            if (letters[i].sprite.active) {
                neighbors.push(i);
                break;
            }
        }
        neighbors.forEach(i => {
            const neighbor = letters[i];
            neighbor.hasShield = true;
            // Remove any existing shield visual
            if (neighbor.shieldVisual) {
                neighbor.shieldVisual.shieldFlare.destroy();
                neighbor.shieldVisual.shieldCircle.destroy();
            }
            // Create persistent shield visual centered on the letter
            const shieldCircle = this.add.graphics();
            shieldCircle.lineStyle(2, 0x00ffff);
            shieldCircle.strokeCircle(neighbor.sprite.x, neighbor.sprite.y, 20);
            neighbor.shieldVisual = shieldCircle;
            const shieldFlare = this.add.sprite(neighbor.sprite.x, neighbor.sprite.y, 'flares', 'blue')
                .setDepth(50)
                .setAlpha(0.7)
                .setScale(0.7);
            neighbor.shieldVisual = {shieldFlare, shieldCircle};

        });
    }

    healNeighbors(letter) {
        // Find closest living neighbors
        const letters = this.currentTurn === 'player' ? this.opponentLetters : this.playerLetters;
        const index = letters.indexOf(letter);
        const neighbors = [];
        // Find left neighbor
        for (let i = index - 1; i >= 0; i--) {
            if (letters[i].sprite.active) {
                neighbors.push(i);
                break;
            }
        }
        // Find right neighbor
        for (let i = index + 1; i < letters.length; i++) {
            if (letters[i].sprite.active) {
                neighbors.push(i);
                break;
            }
        }
        if (neighbors.length === 0) return;

        neighbors.forEach(i => {
            const neighbor = letters[i];
            if (neighbor.health < neighbor.maxHealth) {
                this.sound.play('heal');

                const healAmount = 1;
                neighbor.health = Math.min(neighbor.health + healAmount, neighbor.maxHealth);
                this.updateHealthBar(neighbor);
                // Show heal indicator
                this.showFloatingText(neighbor.sprite.x, neighbor.sprite.y - 40, `+${healAmount}`, '#33ff33');

                // Create a glowing blue healEffect sprite (circle) that travels from caster to target
                const healEffect = this.add.sprite(letter.sprite.x, letter.sprite.y, 'flares', 'green');

                // Tween the particle to the target
                this.tweens.add({
                    targets: healEffect,
                    x: neighbor.sprite.x,
                    y: neighbor.sprite.y,
                    scale: { from: 0.5, to: 0.7 },
                    alpha: { from: 0.8, to: 1 },
                    duration: 350,
                    ease: 'Cubic.easeOut',
                    onComplete: () => {
                        healEffect.destroy();
                        // Glowing blue light effect on the target
                        const glow = this.add.sprite(neighbor.sprite.x, neighbor.sprite.y, 'flares', 'green')
                            .setDepth(50)
                            .setAlpha(0.7)
                            .setScale(0.7);
                        glow.setBlendMode(Phaser.BlendModes.ADD);

                        this.tweens.add({
                            targets: glow,
                            scale: { from: 0.7, to: 1.7 },
                            alpha: { from: 0.7, to: 0 },
                            duration: 400,
                            ease: 'Sine.easeOut',
                            onComplete: () => {
                                glow.destroy();
                            }
                        });
                    }
                });

            }
        });
    }

    showFloatingText(x, y, text, color) {
        const floatingText = this.add.text(x, y, text, {
            font: 'bold 28px Arial',
            fill: color,
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);
        this.tweens.add({
            targets: floatingText,
            y: y - 30,
            alpha: 0,
            duration: 1200,
            ease: 'Cubic.easeOut',
            onComplete: () => floatingText.destroy()
        });
    }

    checkGameOver() {
        const playerAlive = this.playerLetters.some(letter => letter.sprite.active);
        const opponentAlive = this.opponentLetters.some(letter => letter.sprite.active);
        
        if (!playerAlive) {
            saveGameState();
            this.scene.start('GameOverScene');
        } else if (!opponentAlive) {
            // Player wins
            // --- WIN POPUP LOGIC START ---
            // Gather surviving player letters
            const survivingLetters = this.playerLetters.filter(l => l.sprite.active).map(l => l.letter);
            // Pick two new letters not in availableLetters
            const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
            const playerLetters = (gameState.availableLetters || []).slice();
            const newLetterPool = alphabet.filter(l => !playerLetters.includes(l));
            Phaser.Utils.Array.Shuffle(newLetterPool);
            const letterChoices = newLetterPool.slice(0, 2);
            // Reward for winning
            this.createFireworks();
            this.sound.play('win');
            // Show win popup
            this.showWinPopup(survivingLetters, letterChoices);
            // --- WIN POPUP LOGIC END ---
        }
    }

    showWinPopup(survivingLetters, letterChoices) {
        // Overlay
        const { width, height } = this.cameras.main;
        const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7).setDepth(1000);
        // Panel
        const panelWidth = 280;
        const panelHeight = 450;
        const panel = this.add.rectangle(width/2, height/2, panelWidth, panelHeight, 0x222222, 0.95).setDepth(1001);
        panel.setStrokeStyle(3, 0x39ff14);
        // Title
        this.add.bitmapText(width/2, height/2 - 170, 'nokia16', 'Victory!', 32).setOrigin(0.5).setDepth(1002);
        // Surviving letters label
        this.add.bitmapText(width/2, height/2 - 135, 'nokia16', 'Surviving Letters:', 18).setOrigin(0.5).setDepth(1002);
        // Surviving letters (centered)
        const slotSpacing = 40;
        const startX = width/2 - (slotSpacing * (survivingLetters.length-1))/2;
        survivingLetters.forEach((letter, i) => {
            const sprite = this.add.bitmapText(startX + i*slotSpacing, height/2 - 110, 'nokia16', letter, 32).setOrigin(0.5).setDepth(1002);
            sprite.setTint(0x39ff14);
        });

        // --- Gold reward calculation ---
        const baseReward = 2;
        let refund = 0;
        this.playerLetters.forEach(letterObj => {
            if (letterObj.sprite.active) {
                refund += LETTER_CONFIG[letterObj.letter].cost;
            }
        });
        const totalReward = baseReward + refund;
        this.add.bitmapText(width / 2 + 60, height/2 - 70, 'nokia16', `Gold Reward: $${baseReward}`, 18).setOrigin(1).setDepth(1002);
        this.add.bitmapText(width / 2 + 60, height/2 - 50, 'nokia16', `Refund: $${refund}`, 18).setOrigin(1).setDepth(1002);
        this.add.bitmapText(width / 2 + 60, height/2 - 30, 'nokia16', `Funds: $${totalReward + gameState.gold}`, 18).setOrigin(1).setDepth(1002);

        const availableLettersY = height/2 - 10;
        // Current available letters
        this.add.bitmapText(width/2, availableLettersY, 'nokia16', 'Available Letters:', 18).setOrigin(0.5).setDepth(1002);
        const availableLetters = gameState.availableLetters || [];
        const availableSpacing = 15;
        const maxLettersPerRow = 13; // Maximum letters that fit in one row
        const availableStartX = width/2 - (availableSpacing * (Math.min(availableLetters.length, maxLettersPerRow) - 1)) / 2;
        
        availableLetters.forEach((letter, i) => {
            const row = Math.floor(i / maxLettersPerRow);
            const col = i % maxLettersPerRow;
            const x = availableStartX + col * availableSpacing;
            const y = availableLettersY + 20 + row * 15; // 25px spacing between rows
            const sprite = this.add.bitmapText(x, y, 'nokia16', letter, 20).setOrigin(0.5).setDepth(1002);
            // sprite.setTint(0x39ff14);
        });

        // --- Infocard buttons for letter choices ---
        const cardWidth = 250;
        const cardHeight = 54;
        const cardSpacing = 15;

        const startCardY = height/2 + 75  + cardHeight/2;

        if (letterChoices.length > 0) {
            // Choice prompt
            this.add.bitmapText(width/2, startCardY - 45, 'nokia16', 'Choose a new letter:', 18).setOrigin(0.5).setDepth(1002);

            // Show letter choice infocards
            letterChoices.forEach((letter, i) => {
                const x = width/2;
                const y = startCardY + i * (cardHeight + cardSpacing);
                // Card background (rounded rectangle, button)
                const card = this.add.graphics().setDepth(1002);
                card.fillStyle(0x222222, 0.85);
                card.fillRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 8);
                card.lineStyle(2, 0xffff00, 1);
                card.strokeRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 8);
                // Make the card interactive
                const hitArea = this.add.rectangle(x, y, cardWidth, cardHeight, 0x000000, 0).setDepth(1002).setInteractive({ useHandCursor: true });
                // Hover/press feedback
                hitArea.on('pointerover', () => card.lineStyle(3, 0x39ff14, 1).strokeRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 8));
                hitArea.on('pointerout', () => card.lineStyle(2, 0xffff00, 1).strokeRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 8));
                hitArea.on('pointerdown', () => card.fillStyle(0x333333, 1).fillRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 8));
                hitArea.on('pointerup', () => card.fillStyle(0x222222, 0.85).fillRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 8));
                // Letter (large)
                const letterText = this.add.bitmapText(x - cardWidth/2 + 20, y, 'nokia16', letter, 24).setOrigin(0, 0.5).setDepth(1002);
                // Segmented health bar above the letter
                const config = LETTER_CONFIG[letter];
                const maxHealth = config.health;
                const barWidth = 24;
                const barHeight = 3;
                const segmentGap = 1;
                const segmentWidth = (barWidth - (maxHealth - 1) * segmentGap) / maxHealth;
                const barX = x - cardWidth/2 + 15;
                const barY = y - 18;
                const healthBar = this.add.graphics().setDepth(1002);
                for (let j = 0; j < maxHealth; j++) {
                    healthBar.fillStyle(0x00ff00);
                    healthBar.fillRect(barX + j * (segmentWidth + segmentGap), barY, segmentWidth, barHeight);
                }
                // Info: health, damage, cost, tags
                const info1 = `ATK: ${config.damage} Cost: $${config.cost}`;
                const tags = config.tags && config.tags.length ? config.tags.join(', ') : '';
                const info2 = tags;
                this.add.bitmapText(x - cardWidth/2 + 70, y - 10, 'nokia16', info1, 16).setOrigin(0, 0.5).setDepth(1002);
                this.add.bitmapText(x - cardWidth/2 + 70, y + 12, 'nokia16', info2, 14).setOrigin(0, 0.5).setDepth(1002);
                // Click handler for the whole card
                hitArea.on('pointerup', () => {
                    // Add chosen letter to availableLetters
                    if (!gameState.availableLetters) gameState.availableLetters = [];
                    gameState.availableLetters.push(letter);
                    gameState.availableLetters.sort();
                    // Clean up popup
                    overlay.destroy();
                    panel.destroy();
                    this.children.list.filter(o => o.depth === 1002).forEach(o => o.destroy());
                    // Continue progression
                    gameState.level++;
                    gameState.gold += totalReward;
                    // Add a new random letter to opponentAvailableLetters and update priority
                    const current = gameState.opponentAvailableLetters || [];
                    const availablePool = alphabet.filter(l => !current.includes(l));
                    let newLetter = null;
                    if (availablePool.length > 0) {
                        Phaser.Utils.Array.Shuffle(availablePool);
                        newLetter = availablePool[0];
                        gameState.opponentAvailableLetters.push(newLetter);
                        if (!gameState.opponentPriorityLetters) gameState.opponentPriorityLetters = [];
                        gameState.opponentPriorityLetters.push(newLetter);
                        if (gameState.opponentPriorityLetters.length > 2) {
                            gameState.opponentPriorityLetters = gameState.opponentPriorityLetters.slice(-2);
                        }
                    }
                    // Choose a new random opponent word for the next round, prioritizing new letters
                    gameState.opponentWord = getRandomWordFromLettersWithPriority(
                        gameState.opponentAvailableLetters,
                        gameState.opponentPriorityLetters || []
                    );
                    saveGameState();
                    this.time.delayedCall(500, () => {
                        this.scene.start('WordEntryScene');
                    });
                });
            });
        } else {
            // No more letters available - show continue button
            const continueButton = this.add.bitmapText(width/2, startCardY, 'nokia16', 'Continue', 32)
                .setOrigin(0.5)
                .setDepth(1002)
                .setInteractive({ useHandCursor: true });
            continueButton.setTint(0x39ff14);
            
            // Hover effect
            continueButton.on('pointerover', () => continueButton.setTint(0xffff00));
            continueButton.on('pointerout', () => continueButton.setTint(0x39ff14));
            
            continueButton.on('pointerup', () => {
                // Clean up popup
                overlay.destroy();
                panel.destroy();
                this.children.list.filter(o => o.depth === 1002).forEach(o => o.destroy());
                // Continue progression without adding new letter
                gameState.level++;
                gameState.gold += totalReward;
                // Add a new random letter to opponentAvailableLetters and update priority
                const current = gameState.opponentAvailableLetters || [];
                const availablePool = alphabet.filter(l => !current.includes(l));
                let newLetter = null;
                if (availablePool.length > 0) {
                    Phaser.Utils.Array.Shuffle(availablePool);
                    newLetter = availablePool[0];
                    gameState.opponentAvailableLetters.push(newLetter);
                    if (!gameState.opponentPriorityLetters) gameState.opponentPriorityLetters = [];
                    gameState.opponentPriorityLetters.push(newLetter);
                    if (gameState.opponentPriorityLetters.length > 2) {
                        gameState.opponentPriorityLetters = gameState.opponentPriorityLetters.slice(-2);
                    }
                }
                // Choose a new random opponent word for the next round, prioritizing new letters
                gameState.opponentWord = getRandomWordFromLettersWithPriority(
                    gameState.opponentAvailableLetters,
                    gameState.opponentPriorityLetters || []
                );
                saveGameState();
                this.time.delayedCall(500, () => {
                    this.scene.start('WordEntryScene');
                });
            });
        }
    }

    createFireworks() {
        const { width, height } = this.cameras.main;

        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(10, width - 10);
            const y = Phaser.Math.Between(10, height - 10);
            const frameList = [
                ['green', 'blue'],
                ['yellow', 'red'],
                ['green'],
                ['blue', 'white'], 
                ['green', 'blue', 'yellow', 'red']
            ]
            this.time.delayedCall(i * 350, () => {
                const emitter = this.add.particles(x, y, 'flares', {
                    frame: frameList[i],
                    lifespan: 600,
                    speed: { min: 150, max: 250 },
                    scale: { start: 0.3, end: 0 },
                    gravityY: 150,
                    blendMode: 'ADD',
                    emitting: false
                });
                emitter.explode(35);
            });
        }
    }

    update() {
        if (this.starfield) this.starfield.update();
        // Wavy animation for player and opponent words
        const amplitude = 10; // subtle
        const frequency = 5; // radians per second
        const time = this.time.now / 1000;
        // Player word: phase 0
        this.playerLetters.forEach(l => {
            l.sprite.y = l.sprite.baseY + amplitude * Math.sin(frequency * time + l.sprite.waveIndex * 0.5);
            if (l.sprite.active) {
                this.updateHealthBar(l);
                // Redraw shield visual if present
                if (l.shieldVisual) {
                    l.shieldVisual.shieldFlare.y = l.sprite.y;
                    l.shieldVisual.shieldCircle.clear();
                    l.shieldVisual.shieldCircle.lineStyle(2, 0x00aaff);
                    l.shieldVisual.shieldCircle.strokeCircle(l.sprite.x, l.sprite.y, 20);
                }
            }
        });
        // Opponent word: phase offset by PI/2
        this.opponentLetters.forEach(l => {
            l.sprite.y = l.sprite.baseY + amplitude * Math.sin(frequency * time + l.sprite.waveIndex * 0.5 + Math.PI / 2);
            if (l.sprite.active) {
                this.updateHealthBar(l);
                // Redraw shield visual if present
                if (l.shieldVisual) {
                    l.shieldVisual.shieldFlare.y = l.sprite.y;
                    l.shieldVisual.shieldCircle.clear();
                    l.shieldVisual.shieldCircle.lineStyle(2, 0x00aaff);
                    l.shieldVisual.shieldCircle.strokeCircle(l.sprite.x, l.sprite.y, 20);
                }
            }
        });
    }

    // --- Temporary Health Implementation ---
    addTemporaryHealth(letterData, amount) {
        letterData.tempHealth = (letterData.tempHealth || 0) + amount;
        this.updateHealthBar(letterData);
        // Show floating blue indicator
        this.showFloatingText(letterData.sprite.x, letterData.sprite.y - 60, `+${amount}`, '#33ccff');
    }
} 