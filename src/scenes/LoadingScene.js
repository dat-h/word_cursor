import Phaser from 'phaser';

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super('LoadingScene');
  }

  preload() {
    // Display loading text or bar
    const { width, height } = this.cameras.main;
    this.loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
      font: '20px Arial',
      fill: '#fff'
    }).setOrigin(0.5);

    // Optional: loading bar
    const barWidth = 200;
    const barHeight = 20;
    const barBg = this.add.rectangle(width / 2, height / 2 + 40, barWidth, barHeight, 0x444444).setOrigin(0.5);
    const bar = this.add.rectangle(width / 2 - barWidth / 2, height / 2 + 40, 0, barHeight, 0xffffff).setOrigin(0, 0.5);

    this.load.on('progress', (value) => {
      bar.width = barWidth * value;
    });

    // Load all assets here (same as in MainScene)
    this.load.bitmapFont('nokia16', 'assets/fonts/nokia16.png', 'assets/fonts/nokia16.xml');
    this.load.atlas('flares', 'assets/particles/flares.png', 'assets/particles/flares.json');

    this.load.audio('attack', 'assets/sounds/attack.mp3');
    this.load.audio('damage', 'assets/sounds/damage.mp3');
    this.load.audio('explode', 'assets/sounds/explode.mp3');
    this.load.audio('heal', 'assets/sounds/heal.mp3');

    this.load.audio('bgm', 'assets/music/bg.mp3');
  }

  create() {
    // Start the main scene after loading
    this.scene.start('MenuScene');
  }
}