import { TOWN_WORLD_W, ROW_HEIGHT } from '../constants.js';

// Pixel-art pedestrian character matching the Python client's draw_pedestrian
export class PlayerCharacter {
  constructor(scene, name) {
    this.scene = scene;
    this.name = name;
    this.x = 80;
    this.y = 140;
    this.speed = 3;
    this.dir = 'right';
    this.moving = false;
    this.tick = 0;

    // Deterministic colors from seed (matching Python's color_seed=12345)
    this.skin = 0xf0d2b4;   // (240, 210, 180)
    this.shirt = 0x4488cc;   // blueish shirt
    this.pants = 0x323278;   // (50, 50, 120)
    this.hair = 0x281e14;    // (40, 30, 20)

    // Graphics objects
    this.graphics = scene.add.graphics();
    scene.addTownObj(this.graphics);

    this.indicator = scene.add.graphics();
    scene.addTownObj(this.indicator);

    this.nameLabel = scene.add.text(0, 0, name, {
      fontFamily: 'Arial',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      backgroundColor: 'rgba(0,0,0,0.55)',
      padding: { x: 3, y: 1 },
    }).setOrigin(0.5, 0);
    scene.addTownObj(this.nameLabel);

    this.draw();
  }

  draw() {
    const x = this.x;
    const y = this.y;
    const g = this.graphics;
    g.clear();

    // Shadow
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(x, y + 5, 20, 8);

    // --- Pixel-art pedestrian (~18px tall) ---
    // Head (circle r=5, centered at (x, y-13))
    g.fillStyle(this.skin, 1);
    g.fillCircle(x, y - 13, 5);

    // Hair (arc on top of head)
    g.fillStyle(this.hair, 1);
    g.fillRect(x - 5, y - 18, 10, 4);

    // Body / shirt (8x9 rect)
    g.fillStyle(this.shirt, 1);
    g.fillRect(x - 4, y - 8, 8, 9);

    // Arms (animated)
    const armPhase = Math.floor(this.tick / 6) % 2;
    if (armPhase === 0) {
      g.fillStyle(this.shirt, 1);
      g.fillRect(x - 6, y - 7, 2, 6);  // left arm
      g.fillRect(x + 4, y - 5, 2, 6);  // right arm
    } else {
      g.fillStyle(this.shirt, 1);
      g.fillRect(x - 6, y - 5, 2, 6);
      g.fillRect(x + 4, y - 7, 2, 6);
    }

    // Legs (animated)
    const legPhase = Math.floor(this.tick / 6) % 2;
    const lxOff = this.dir === 'right'
      ? (legPhase === 0 ? -2 : 2)
      : (legPhase === 0 ? 2 : -2);
    g.fillStyle(this.pants, 1);
    g.fillRect(x - 4 + lxOff, y + 1, 3, legPhase === 0 ? 7 : 6);
    g.fillRect(x + 1 - lxOff, y + 1, 3, legPhase === 0 ? 6 : 7);

    // Eyes (tiny dots on head)
    g.fillStyle(0x222222, 1);
    if (this.dir === 'left') {
      g.fillRect(x - 3, y - 14, 2, 2);
    } else {
      g.fillRect(x + 1, y - 14, 2, 2);
    }

    // --- Red triangle indicator above head ---
    this.indicator.clear();
    // Filled red triangle
    this.indicator.fillStyle(0xff3c3c, 1);
    this.indicator.fillTriangle(
      x, y - 17,       // bottom point (pointing down)
      x - 5, y - 24,   // top-left
      x + 5, y - 24    // top-right
    );
    // White outline
    this.indicator.lineStyle(1, 0xffffff, 0.8);
    this.indicator.strokeTriangle(
      x, y - 17,
      x - 5, y - 24,
      x + 5, y - 24
    );

    // Depth sort by y
    const depth = y + 10;
    g.setDepth(depth);
    this.indicator.setDepth(depth + 1);

    // Name label below feet
    this.nameLabel.setPosition(x, y + 10);
    this.nameLabel.setDepth(depth + 1);
  }

  handleMovement(cursors, wasd) {
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

    const wasMoving = this.moving;
    this.moving = dx !== 0 || dy !== 0;

    if (this.moving) {
      this.tick++;
      this.x += dx;
      this.y += dy;

      const totalRows = Math.ceil(44 / 6);
      const worldH = totalRows * ROW_HEIGHT + 100;
      this.x = Math.max(0, Math.min(TOWN_WORLD_W, this.x));
      this.y = Math.max(0, Math.min(worldH, this.y));

      if (dx < 0) this.dir = 'left';
      else if (dx > 0) this.dir = 'right';

      this.draw();

      this.scene.net.send({
        type: 'own_pos',
        x: this.x,
        y: this.y,
        dir: this.dir,
        moving: this.moving,
      });
    } else if (wasMoving) {
      // Stopped moving — redraw in idle pose (tick stays frozen)
      this.draw();
    }
  }
}
