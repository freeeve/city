import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Loading bar
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const barW = 300;
    const barH = 24;
    const barX = (w - barW) / 2;
    const barY = h / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x222244, 1);
    bg.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

    const bar = this.add.graphics();
    this.load.on('progress', (value) => {
      bar.clear();
      bar.fillStyle(0x3778c8, 1);
      bar.fillRect(barX, barY, barW * value, barH);
    });

    const loadText = this.add.text(w / 2, barY - 30, 'Loading...', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('complete', () => {
      bar.destroy();
      bg.destroy();
      loadText.destroy();
    });

    // Load building PNGs
    const assets = [
      ['lemonade_stand', 'assets/lemonade_stand.png'],
      ['ice_cream_truck', 'assets/ice_cream_truck.png'],
      ['cookie_shop', 'assets/cookie_shop.png'],
      ['pet_shop', 'assets/pet_shop.png'],
      ['toy_store', 'assets/toy_store.png'],
      ['movie_theater', 'assets/movie_theater.png'],
      ['arcade', 'assets/arcade.png'],
      ['water_park', 'assets/water_park.png'],
      ['theme_park', 'assets/theme_park.png'],
      ['space_station', 'assets/space_station.png'],
    ];

    for (const [key, path] of assets) {
      this.load.image(key, path);
    }
  }

  create() {
    this.scene.start('ConnectScene');
  }
}
