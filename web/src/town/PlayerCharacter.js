import { TOWN_WORLD_W, ROW_HEIGHT } from '../constants.js';

export class PlayerCharacter {
  constructor(scene, name) {
    this.scene = scene;
    this.name = name;
    this.x = 80;
    this.y = 140;
    this.speed = 3;
    this.dir = 'right';
    this.moving = false;

    // Character body (simple colored shape)
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(5000); // will be updated per-frame

    // Name label
    this.nameLabel = scene.add.text(0, 0, name, {
      fontFamily: 'Arial',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#333333',
      strokeThickness: 2,
    }).setOrigin(0.5, 0);

    // Red triangle indicator
    this.indicator = scene.add.graphics();

    this.draw();
  }

  draw() {
    const x = this.x;
    const y = this.y;

    // Body (simple character)
    this.graphics.clear();

    // Shadow
    this.graphics.fillStyle(0x000000, 0.15);
    this.graphics.fillEllipse(x, y + 20, 20, 8);

    // Body
    this.graphics.fillStyle(0x4488cc, 1);
    this.graphics.fillRoundedRect(x - 8, y - 8, 16, 24, 4);

    // Head
    this.graphics.fillStyle(0xffcc88, 1);
    this.graphics.fillCircle(x, y - 14, 8);

    // Eyes
    this.graphics.fillStyle(0x333333, 1);
    if (this.dir === 'left') {
      this.graphics.fillCircle(x - 3, y - 15, 1.5);
    } else {
      this.graphics.fillCircle(x + 3, y - 15, 1.5);
    }

    // Red triangle above head
    this.indicator.clear();
    this.indicator.fillStyle(0xff3333, 1);
    this.indicator.fillTriangle(
      x, y - 30,
      x - 5, y - 24,
      x + 5, y - 24
    );

    // Update depth based on y position
    const depth = y + 20;
    this.graphics.setDepth(depth);
    this.indicator.setDepth(depth + 1);

    // Name label below
    this.nameLabel.setPosition(x, y + 22);
    this.nameLabel.setDepth(depth + 1);
  }

  handleMovement(cursors, wasd) {
    // Don't move if an input element is focused
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
      return;
    }

    let dx = 0;
    let dy = 0;

    if (cursors.left.isDown || wasd.A.isDown) dx -= this.speed;
    if (cursors.right.isDown || wasd.D.isDown) dx += this.speed;
    if (cursors.up.isDown || wasd.W.isDown) dy -= this.speed;
    if (cursors.down.isDown || wasd.S.isDown) dy += this.speed;

    this.moving = dx !== 0 || dy !== 0;

    if (dx !== 0 || dy !== 0) {
      this.x += dx;
      this.y += dy;

      // Clamp to town bounds
      const totalRows = Math.ceil(44 / 6);
      const worldH = totalRows * ROW_HEIGHT + 100;
      this.x = Math.max(0, Math.min(TOWN_WORLD_W, this.x));
      this.y = Math.max(0, Math.min(worldH, this.y));

      if (dx < 0) this.dir = 'left';
      else if (dx > 0) this.dir = 'right';

      this.draw();

      // Send position to server
      this.scene.net.send({
        type: 'own_pos',
        x: this.x,
        y: this.y,
        dir: this.dir,
        moving: this.moving,
      });
    }
  }
}
