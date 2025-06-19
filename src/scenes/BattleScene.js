import { gameState } from '../game.js';
import { LETTER_CONFIG } from '../config/letterConfig.js';
import { Starfield } from '../effects/Starfield.js';
import { getRandomWord } from '../config/wordDict.js';

export class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    preload() {

    }

    create() {
        this.starfield = new Starfield(this);
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

        // Process special abilities
        if (letter.letter === 'e') {
            // Create shield for neighboring letters
            this.createShield(letter);
        } else if (LETTER_CONFIG[letter.letter].type === 'consonant') {
            // Heal neighboring letters
            this.healNeighbors(letter);
        }

        this.currentActionIndex++;
        this.time.delayedCall(500, this.processTurn, [], this);
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

        // Special targeting for X and Y
        if (attackingLetter.letter === 'x') {
            targetIndex = 0;
        } else if (attackingLetter.letter === 'y') {
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
        this.time.delayedCall(500, this.processTurn, [], this);
    }

    attack(attacker, defender) {
        // Play attack sound
        this.sound.play('attack');
        const particle = this.add.sprite(attacker.sprite.x, attacker.sprite.y, 'flares', 'yellow');
        particle.setScale(0.25);
        particle.setAlpha(1);
        particle.setTint(0xffffff);
        particle.setBlendMode(Phaser.BlendModes.ADD);

        // Create attack animation
        const tween = this.tweens.add({
            targets: particle,
            x: defender.sprite.x,
            y: defender.sprite.y,
            duration: 200,
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
                } else {
                    let damage = LETTER_CONFIG[attacker.letter].damage;
                    // Damage tempHealth first
                    if (defender.tempHealth && defender.tempHealth > 0) {
                        const tempDamage = Math.min(defender.tempHealth, damage);
                        defender.tempHealth -= tempDamage;
                        damage -= tempDamage;
                        this.sound.play('damage');
                        // Show damage indicator for temp health (blue)
                        this.showFloatingText(defender.sprite.x, defender.sprite.y - 40, `-${tempDamage}`, '#33ccff');
                    }
                    if (damage > 0) {
                        defender.health -= damage;
                        this.sound.play('damage');
                        // Show damage indicator for real health (red)
                        this.showFloatingText(defender.sprite.x, defender.sprite.y - 40, `-${damage}`, '#ff3333');
                    }
                    // Shake effect
                    this.tweens.add({
                        targets: defender.sprite,
                        x: defender.sprite.x + 5,
                        duration: 50,
                        yoyo: true,
                        repeat: 3
                    });
                    if (defender.health <= 0) {
                        this.destroyLetter(defender);
                    } else {
                        this.updateHealthBar(defender);
                    }
                }
            }
        });
    }

    destroyLetter(letterData) {
        this.sound.play('explode');
        
        // Create explosion particles
        const emitter = this.add.particles(letterData.sprite.x, letterData.sprite.y, 'flares', {
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

        // Check for game over
        this.checkGameOver();
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
            duration: 700,
            ease: 'Cubic.easeOut',
            onComplete: () => floatingText.destroy()
        });
    }

    checkGameOver() {
        const playerAlive = this.playerLetters.some(letter => letter.sprite.active);
        const opponentAlive = this.opponentLetters.some(letter => letter.sprite.active);

        if (!playerAlive) {
            this.scene.start('GameOverScene');
        } else if (!opponentAlive) {
            // Player wins
            gameState.level++;
            gameState.gold += 1; // Reward for winning
            
            // Refund surviving letters
            this.playerLetters.forEach(letter => {
                if (letter.sprite.active) {
                    gameState.gold += LETTER_CONFIG[letter.letter].cost;
                }
            });

            // Choose a new random opponent word for the next round
            gameState.opponentWord = getRandomWord();

            // Check for level 10 celebration
            if (gameState.level % 10 === 0) {
                this.createFireworks();
            }

            this.scene.start('WordEntryScene');
        }
    }

    createFireworks() {
        // Create fireworks effect
        const particles = this.add.particles('nokia16');
        
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(100, 700);
            const y = Phaser.Math.Between(100, 500);
            
            particles.createEmitter({
                x: x,
                y: y,
                speed: { min: 50, max: 100 },
                scale: { start: 0.5, end: 0 },
                lifespan: 1000,
                quantity: 20,
                frequency: 100
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