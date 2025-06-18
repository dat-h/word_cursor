export class Starfield {
    constructor(scene, starCount = 100) {
        this.scene = scene;
        this.stars = [];
        this.width = scene.sys.game.config.width;
        this.height = scene.sys.game.config.height;
        this.starCount = starCount;
        this.createStars();
    }

    createStars() {
        for (let i = 0; i < this.starCount; i++) {
            const x = Phaser.Math.Between(0, this.width);
            const y = Phaser.Math.Between(0, this.height);
            const speed = Phaser.Math.FloatBetween(0.5, 2.5);
            const size = Phaser.Math.FloatBetween(1, 2.5);
            const alpha = Phaser.Math.FloatBetween(0.3, 1);
            const star = this.scene.add.circle(x, y, size, 0xffffff, alpha);
            star.speed = speed;
            this.stars.push(star);
        }
    }

    update() {
        for (const star of this.stars) {
            star.y += star.speed;
            if (star.y > this.height) {
                star.y = 0;
                star.x = Phaser.Math.Between(0, this.width);
            }
        }
    }

    destroy() {
        for (const star of this.stars) {
            star.destroy();
        }
        this.stars = [];
    }
} 