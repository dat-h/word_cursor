export class Starfield {
    constructor(scene, starCount = 100) {
        this.scene = scene;
        this.stars = [];
        this.width = scene.sys.game.config.width;
        this.height = scene.sys.game.config.height;
        this.starCount = starCount;
        // Move neonColors definition before createStars
        this.neonColors = [
            0x39ff14, // Neon Green
            0x00ffff, // Aqua/Cyan
            0xff073a, // Neon Red
            0xfffb00, // Neon Yellow
            0xff00ff, // Neon Magenta
            0x00ffea, // Neon Blue
            0xff9900, // Neon Orange
            0x7cfc00, // Lawn Green
            0x18dcff, // Electric Blue
            0xf000ff  // Electric Purple
        ];
        this.createStars();
        // Comet properties
        this.cometActive = false;
        this.comet = null;
        this.cometTail = [];
        this.cometTailLength = 18;
    }

    createStars() {
        // Neon color palette (hex values)
        const neonColors = this.neonColors;
        for (let i = 0; i < this.starCount; i++) {
            const x = Phaser.Math.Between(0, this.width);
            const y = Phaser.Math.Between(0, this.height);
            const speed = Phaser.Math.FloatBetween(0.5, 2.5);
            const size = Phaser.Math.FloatBetween(1, 2.5);
            const alpha = Phaser.Math.FloatBetween(0.3, 1);
            // 95% chance white, 5% chance neon
            let color = 0xffffff;
            if (Math.random() < 0.05) {
                color = Phaser.Utils.Array.GetRandom(neonColors);
            }
            const star = this.scene.add.circle(x, y, size, color, alpha);
            star.speed = speed;
            this.stars.push(star);
        }
    }

    showComet(show) {
        if (show && !this.cometActive) {
            this.spawnComet();
            this.cometActive = true;
        } else if (!show && this.cometActive) {
            this.destroyComet();
            this.cometActive = false;
        }
    }

    spawnComet() {
        // Remove old comet if any
        this.destroyComet();
        // Start at left/top, random y, neon color
        const startY = Phaser.Math.Between(this.height * 0.2, this.height * 0.8);
        const startX = -20;
        const color = Phaser.Utils.Array.GetRandom(this.neonColors);
        this.comet = this.scene.add.circle(startX, startY, 7, color, 1);
        this.comet.cometColor = color;
        this.comet.cometAlpha = 1;
        this.comet.cometVX = Phaser.Math.FloatBetween(2.0, 2.7); // slow, visible
        this.comet.cometVY = Phaser.Math.FloatBetween(-0.3, 0.3); // slight angle
        this.cometTail = [];
    }

    destroyComet() {
        for (const t of this.cometTail) {
            t.circle.destroy();
        }

        if (this.comet) {
            this.comet.destroy();
            this.comet = null;
        }
        this.cometTail = [];
    }

    update() {
        for (const star of this.stars) {
            star.y += star.speed;
            if (star.y > this.height) {
                star.y = 0;
                star.x = Phaser.Math.Between(0, this.width);
            }
        }
        // Comet logic
        if (this.cometActive && this.comet) {
            // Add current position to tail
            this.cometTail.unshift({
                x: this.comet.x,
                y: this.comet.y,
                color: this.comet.cometColor,
                alpha: this.comet.cometAlpha
            });
            if (this.cometTail.length > this.cometTailLength) {
                const removed = this.cometTail.pop();
                if (removed.circle) removed.circle.destroy();
            }
            // Move comet
            this.comet.x += this.comet.cometVX;
            this.comet.y += this.comet.cometVY;
            // Draw tail (as fading circles)
            // Remove old tail graphics
            for (const t of this.cometTail) {
                if (t.circle) t.circle.destroy();
            }
            for (let i = 0; i < this.cometTail.length; i++) {
                const t = this.cometTail[i];
                const tailAlpha = 0.5 * (1 - i / this.cometTailLength);
                t.circle = this.scene.add.circle(t.x, t.y, 7 - i * 0.3, t.color, tailAlpha);
            }
            // If comet leaves screen, respawn
            if (this.comet.x > this.width + 20 || this.comet.y < -20 || this.comet.y > this.height + 20) {
                this.spawnComet();
            }
        }
    }

    destroy() {
        for (const star of this.stars) {
            star.destroy();
        }
        this.stars = [];
        this.destroyComet();
    }
} 