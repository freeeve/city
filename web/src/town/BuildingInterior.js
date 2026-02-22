import { PX_FONT, rgb, PLOT_COLS, ROW_HEIGHT, PLOT_W, PLOT_H } from '../constants.js';
import { BUILDING_COLORS } from '../shared.js';

/**
 * Building interior — renders a room the player can walk around inside.
 * Shown as an overlay within the town world at a fixed offset position.
 */

const ROOM_W = 320;
const ROOM_H = 260;
const WALL_THICK = 16;
const DOOR_W = 40;
const DOOR_H = 50;

// Interior descriptions for each building type
const INTERIOR_ITEMS = {
  'Lemonade Stand': { type: 'shop', items: ['counter', 'lemons', 'pitcher', 'cups', 'sign'] },
  'Ice Cream Truck': { type: 'shop', items: ['freezer', 'cones', 'flavors', 'counter'] },
  'Cookie Shop': { type: 'bakery', items: ['oven', 'display', 'cookies', 'counter', 'jars'] },
  'Flower Shop': { type: 'shop', items: ['displays', 'flowers', 'counter', 'watering_can'] },
  'Pet Shop': { type: 'pets', items: ['fish_tank', 'cages', 'counter', 'food_shelf'] },
  'Bakery': { type: 'bakery', items: ['oven', 'bread_shelf', 'counter', 'cake_display'] },
  'Toy Store': { type: 'shop', items: ['shelves', 'toys', 'counter', 'train_set'] },
  'Bookstore': { type: 'library', items: ['bookshelves', 'reading_nook', 'counter', 'lamp'] },
  'Movie Theater': { type: 'theater', items: ['screen', 'seats', 'popcorn', 'projector'] },
  'Pizza Place': { type: 'restaurant', items: ['oven', 'counter', 'tables', 'menu'] },
  'Arcade': { type: 'arcade', items: ['cabinets', 'claw_machine', 'counter', 'neon'] },
  'Gym': { type: 'gym', items: ['weights', 'treadmill', 'bench', 'mirror'] },
  'Hospital': { type: 'hospital', items: ['beds', 'desk', 'monitors', 'curtain'] },
  'Water Park': { type: 'pool', items: ['pool', 'slides', 'lounge', 'lifeguard'] },
  'Library': { type: 'library', items: ['bookshelves', 'desks', 'computer', 'globe'] },
  'Museum': { type: 'museum', items: ['paintings', 'statues', 'display_cases', 'bench'] },
};

export class BuildingInterior {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.buildingName = null;
    this.buildingIndex = -1;
    this.objects = [];
    this.enterPrompt = null;
    this.exitPrompt = null;

    // Room position in world space (far away from town)
    this.roomX = 5000;
    this.roomY = 5000;

    // Player position within room (relative to room origin)
    this.playerRoomX = ROOM_W / 2;
    this.playerRoomY = ROOM_H - 50;

    // Saved town position
    this.savedPlayerX = 0;
    this.savedPlayerY = 0;

    // Enter prompt (shown when near a building)
    this._createEnterPrompt();

    // Enter button for mobile
    this._createEnterButton();
  }

  _createEnterPrompt() {
    this.enterPrompt = this.scene.add.text(0, 0, '', {
      fontFamily: PX_FONT,
      fontSize: '8px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 6, y: 4 },
      stroke: '#3cbe5a',
      strokeThickness: 1,
    }).setOrigin(0.5, 1).setDepth(2000).setVisible(false);
    this.scene.addTownObj(this.enterPrompt);
  }

  _createEnterButton() {
    const container = this.scene.game.canvas.parentElement;
    this.enterBtn = document.createElement('button');
    this.enterBtn.id = 'enter-building-btn';
    this.enterBtn.textContent = 'Enter';
    this.enterBtn.style.cssText = `
      position: absolute; bottom: 20px; right: 20px; z-index: 50;
      padding: 10px 20px; font-family: 'Press Start 2P', monospace;
      font-size: 10px; background: #3cbe5a; color: white;
      border: 2px solid rgba(255,255,255,0.3); border-radius: 8px;
      cursor: pointer; display: none; touch-action: none;
    `;
    this.enterBtn.addEventListener('click', () => {
      if (this.visible) {
        this.exit();
      } else {
        this._tryEnter();
      }
    });
    container.appendChild(this.enterBtn);
  }

  _tryEnter() {
    const player = this.scene.player;
    const idx = player.getNearbyBuildingIndex();
    if (idx >= 0 && idx < this.scene.gameState.buildings.length) {
      this.enter(this.scene.gameState.buildings[idx], idx);
    }
  }

  /**
   * Update the enter prompt based on player position.
   * Called from GameScene.update().
   */
  updatePrompt() {
    if (this.visible) {
      this.enterPrompt.setVisible(false);
      return;
    }

    const player = this.scene.player;
    const idx = player.getNearbyBuildingIndex();

    if (idx >= 0 && idx < this.scene.gameState.buildings.length) {
      const name = this.scene.gameState.buildings[idx];
      const col = idx % 6;
      const row = Math.floor(idx / 6);
      const px = PLOT_COLS[col] + PLOT_W / 2;
      const py = row * ROW_HEIGHT + 35 - 10;

      this.enterPrompt.setText(`[E] Enter ${name}`);
      this.enterPrompt.setPosition(px, py);
      this.enterPrompt.setVisible(true);

      // Show mobile enter button
      this.enterBtn.style.display = 'block';
      this.enterBtn.textContent = 'Enter';
      this.enterBtn.style.background = '#3cbe5a';
    } else {
      this.enterPrompt.setVisible(false);
      this.enterBtn.style.display = 'none';
    }
  }

  enter(buildingName, buildingIndex) {
    if (this.visible) return;

    this.visible = true;
    this.buildingName = buildingName;
    this.buildingIndex = buildingIndex;

    const player = this.scene.player;
    this.savedPlayerX = player.x;
    this.savedPlayerY = player.y;
    player.insideBuilding = true;

    // Position player inside the room
    this.playerRoomX = ROOM_W / 2;
    this.playerRoomY = ROOM_H - 50;
    player.x = this.roomX + this.playerRoomX;
    player.y = this.roomY + this.playerRoomY;
    player.draw();

    // Render the interior
    this._renderRoom();

    // Update enter/exit button
    this.enterBtn.style.display = 'block';
    this.enterBtn.textContent = 'Exit';
    this.enterBtn.style.background = '#dc4646';
    this.enterPrompt.setVisible(false);

    // Hide virtual joystick enter prompt
  }

  exit() {
    if (!this.visible) return;

    this.visible = false;
    this._destroyRoom();

    const player = this.scene.player;
    player.x = this.savedPlayerX;
    player.y = this.savedPlayerY;
    player.insideBuilding = false;
    player.draw();

    this.enterBtn.style.display = 'none';
    this.buildingName = null;
    this.buildingIndex = -1;
  }

  /**
   * Handle player movement inside the room.
   * Called from GameScene.update() when player is inside a building.
   */
  handleMovement(cursors, wasd, joystick) {
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
      return;
    }

    let dx = 0, dy = 0;
    const speed = 3;

    if (joystick && joystick.active) {
      dx = joystick.dx * speed;
      dy = joystick.dy * speed;
    } else {
      if (cursors.left.isDown || wasd.A.isDown) dx -= speed;
      if (cursors.right.isDown || wasd.D.isDown) dx += speed;
      if (cursors.up.isDown || wasd.W.isDown) dy -= speed;
      if (cursors.down.isDown || wasd.S.isDown) dy += speed;
    }

    const moving = Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3;

    if (moving) {
      this.playerRoomX += dx;
      this.playerRoomY += dy;

      // Clamp to room bounds (inside walls)
      this.playerRoomX = Math.max(WALL_THICK + 10, Math.min(ROOM_W - WALL_THICK - 10, this.playerRoomX));
      this.playerRoomY = Math.max(WALL_THICK + 10, Math.min(ROOM_H - WALL_THICK - 10, this.playerRoomY));

      // Check if player reached the door
      const doorCenterX = ROOM_W / 2;
      const doorY = ROOM_H - WALL_THICK;
      if (Math.abs(this.playerRoomX - doorCenterX) < DOOR_W / 2 &&
          this.playerRoomY > doorY - 15) {
        this.exit();
        return;
      }

      const player = this.scene.player;
      player.x = this.roomX + this.playerRoomX;
      player.y = this.roomY + this.playerRoomY;
      player.tick++;
      if (dx < -0.3) player.dir = 'left';
      else if (dx > 0.3) player.dir = 'right';
      player.draw();
    }

    // Update exit prompt position
    if (this.exitPrompt) {
      const nearDoor = Math.abs(this.playerRoomX - ROOM_W / 2) < DOOR_W &&
                        this.playerRoomY > ROOM_H - WALL_THICK - 40;
      this.exitPrompt.setAlpha(nearDoor ? 1.0 : 0.4);
    }
  }

  _renderRoom() {
    this._destroyRoom();

    const [cr, cg, cb] = BUILDING_COLORS[this.buildingName] || [128, 128, 128];
    const rx = this.roomX;
    const ry = this.roomY;

    const g = this.scene.add.graphics();
    g.setDepth(4);
    this.scene.addTownObj(g);
    this.objects.push(g);

    // Floor
    const floorR = Math.min(255, cr + 40);
    const floorG = Math.min(255, cg + 40);
    const floorB = Math.min(255, cb + 40);
    g.fillStyle(rgb(floorR, floorG, floorB), 1);
    g.fillRect(rx, ry, ROOM_W, ROOM_H);

    // Floor tile pattern
    g.lineStyle(1, rgb(Math.max(0, floorR - 20), Math.max(0, floorG - 20), Math.max(0, floorB - 20)), 0.2);
    for (let tx = 0; tx < ROOM_W; tx += 32) {
      g.lineBetween(rx + tx, ry, rx + tx, ry + ROOM_H);
    }
    for (let ty = 0; ty < ROOM_H; ty += 32) {
      g.lineBetween(rx, ry + ty, rx + ROOM_W, ry + ty);
    }

    // Walls
    const wallColor = rgb(Math.max(0, cr - 20), Math.max(0, cg - 20), Math.max(0, cb - 20));
    const wallDark = rgb(Math.max(0, cr - 50), Math.max(0, cg - 50), Math.max(0, cb - 50));

    // Top wall
    g.fillStyle(wallColor, 1);
    g.fillRect(rx, ry, ROOM_W, WALL_THICK);
    g.fillStyle(wallDark, 1);
    g.fillRect(rx, ry + WALL_THICK - 2, ROOM_W, 2);

    // Left wall
    g.fillStyle(wallColor, 1);
    g.fillRect(rx, ry, WALL_THICK, ROOM_H);
    g.fillStyle(wallDark, 1);
    g.fillRect(rx + WALL_THICK - 2, ry, 2, ROOM_H);

    // Right wall
    g.fillStyle(wallColor, 1);
    g.fillRect(rx + ROOM_W - WALL_THICK, ry, WALL_THICK, ROOM_H);
    g.fillStyle(wallDark, 1);
    g.fillRect(rx + ROOM_W - WALL_THICK, ry, 2, ROOM_H);

    // Bottom wall (with door gap)
    const doorLeft = rx + ROOM_W / 2 - DOOR_W / 2;
    g.fillStyle(wallColor, 1);
    g.fillRect(rx, ry + ROOM_H - WALL_THICK, doorLeft - rx, WALL_THICK);
    g.fillRect(doorLeft + DOOR_W, ry + ROOM_H - WALL_THICK, rx + ROOM_W - doorLeft - DOOR_W, WALL_THICK);
    g.fillStyle(wallDark, 1);
    g.fillRect(rx, ry + ROOM_H - WALL_THICK, doorLeft - rx, 2);
    g.fillRect(doorLeft + DOOR_W, ry + ROOM_H - WALL_THICK, rx + ROOM_W - doorLeft - DOOR_W, 2);

    // Door frame
    g.fillStyle(rgb(100, 70, 40), 1);
    g.fillRect(doorLeft - 4, ry + ROOM_H - WALL_THICK, 4, WALL_THICK);
    g.fillRect(doorLeft + DOOR_W, ry + ROOM_H - WALL_THICK, 4, WALL_THICK);
    g.fillRect(doorLeft - 4, ry + ROOM_H - WALL_THICK, DOOR_W + 8, 4);

    // Door mat
    g.fillStyle(rgb(140, 100, 60), 1);
    g.fillRect(doorLeft + 4, ry + ROOM_H - 10, DOOR_W - 8, 8);

    // Exit text
    this.exitPrompt = this.scene.add.text(
      rx + ROOM_W / 2, ry + ROOM_H - 4,
      'EXIT', {
        fontFamily: PX_FONT,
        fontSize: '8px',
        color: '#ffffff',
        backgroundColor: 'rgba(220,70,70,0.8)',
        padding: { x: 8, y: 3 },
      }
    ).setOrigin(0.5, 0.5).setDepth(2000);
    this.scene.addTownObj(this.exitPrompt);
    this.objects.push(this.exitPrompt);

    // Building name header
    const nameLabel = this.scene.add.text(
      rx + ROOM_W / 2, ry + 5,
      this.buildingName, {
        fontFamily: PX_FONT,
        fontSize: '10px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      }
    ).setOrigin(0.5, 0).setDepth(2001);
    this.scene.addTownObj(nameLabel);
    this.objects.push(nameLabel);

    // Render building-specific interior items
    this._renderInteriorItems(g, rx, ry, cr, cg, cb);
  }

  _renderInteriorItems(g, rx, ry, cr, cg, cb) {
    const name = this.buildingName;
    const left = rx + WALL_THICK + 4;
    const top = ry + WALL_THICK + 4;
    const innerW = ROOM_W - WALL_THICK * 2 - 8;
    const innerH = ROOM_H - WALL_THICK * 2 - 8;
    const cx = rx + ROOM_W / 2;
    const cy = ry + ROOM_H / 2;

    switch (name) {
      case 'Lemonade Stand': {
        // Counter at top
        g.fillStyle(rgb(200, 170, 100), 1);
        g.fillRect(left + 20, top + 10, innerW - 40, 20);
        g.fillStyle(rgb(180, 150, 80), 1);
        g.fillRect(left + 20, top + 30, innerW - 40, 4);
        // Lemons
        g.fillStyle(0xffee44, 1);
        for (let i = 0; i < 5; i++) {
          g.fillCircle(left + 40 + i * 28, top + 18, 6);
        }
        // Pitcher
        g.fillStyle(rgb(180, 220, 255), 0.7);
        g.fillRect(cx - 8, top + 50, 16, 24);
        g.fillStyle(0xffee44, 0.5);
        g.fillRect(cx - 6, top + 54, 12, 16);
        // Cups
        g.fillStyle(0xffffff, 1);
        for (let i = 0; i < 4; i++) {
          g.fillRect(left + 30 + i * 50, top + 55, 12, 16);
        }
        // Sign
        this._addText('Fresh Lemonade!', cx, top + 90, '#996600');
        break;
      }
      case 'Ice Cream Truck': {
        // Freezer display
        g.fillStyle(rgb(200, 230, 255), 1);
        g.fillRect(left + 10, top + 5, innerW - 20, 40);
        g.lineStyle(1, rgb(150, 180, 200), 1);
        g.strokeRect(left + 10, top + 5, innerW - 20, 40);
        // Ice cream flavors
        const colors = [0xff88aa, 0x88ddff, 0xffee88, 0xcc88ff, 0x88ff88, 0xffaa66];
        for (let i = 0; i < 6; i++) {
          g.fillStyle(colors[i], 1);
          g.fillCircle(left + 30 + i * 40, top + 25, 12);
        }
        // Counter
        g.fillStyle(rgb(180, 180, 190), 1);
        g.fillRect(left + 10, top + 50, innerW - 20, 16);
        // Cone stack
        g.fillStyle(rgb(200, 170, 100), 1);
        for (let i = 0; i < 3; i++) {
          g.fillTriangle(left + 50 + i * 30, top + 80, left + 56 + i * 30, top + 100, left + 62 + i * 30, top + 80);
        }
        this._addText('Choose a flavor!', cx, top + 120, '#4488cc');
        break;
      }
      case 'Cookie Shop': {
        // Oven in back
        g.fillStyle(rgb(80, 80, 90), 1);
        g.fillRect(left + innerW - 60, top + 5, 50, 45);
        g.fillStyle(rgb(255, 140, 40), 0.3);
        g.fillRect(left + innerW - 55, top + 15, 40, 20);
        // Display case
        g.fillStyle(rgb(220, 200, 180), 1);
        g.fillRect(left + 10, top + 10, innerW - 80, 35);
        g.fillStyle(rgb(255, 240, 220), 0.8);
        g.fillRect(left + 12, top + 12, innerW - 84, 31);
        // Cookies
        const cookieColors = [rgb(180, 120, 50), rgb(160, 100, 40), rgb(200, 140, 60)];
        for (let i = 0; i < 8; i++) {
          g.fillStyle(cookieColors[i % 3], 1);
          g.fillCircle(left + 25 + i * 22, top + 28, 7);
          g.fillStyle(rgb(80, 50, 20), 1);
          g.fillCircle(left + 23 + i * 22, top + 26, 1.5);
          g.fillCircle(left + 27 + i * 22, top + 30, 1.5);
        }
        // Cookie jars
        g.fillStyle(rgb(200, 180, 160), 0.7);
        for (let i = 0; i < 3; i++) {
          g.fillRect(left + 20 + i * 60, top + 60, 24, 32);
          g.fillStyle(rgb(160, 140, 120), 1);
          g.fillRect(left + 18 + i * 60, top + 58, 28, 4);
        }
        this._addText('Fresh baked daily!', cx, top + 110, '#8B4513');
        break;
      }
      case 'Flower Shop': {
        // Flower displays along walls
        const flowerC = [0xff6088, 0xffcc44, 0xff88cc, 0xaa66ff, 0xff8844, 0x88ccff];
        for (let i = 0; i < 6; i++) {
          const fx = left + 15 + i * 40;
          g.fillStyle(rgb(120, 80, 50), 1);
          g.fillRect(fx, top + 10, 24, 20);
          g.fillStyle(0x44aa33, 1);
          g.fillRect(fx + 6, top + 2, 3, 10);
          g.fillRect(fx + 14, top, 3, 12);
          g.fillStyle(flowerC[i], 1);
          g.fillCircle(fx + 7, top, 6);
          g.fillCircle(fx + 15, top - 2, 5);
        }
        // Counter
        g.fillStyle(rgb(180, 150, 120), 1);
        g.fillRect(left + 10, top + 50, innerW - 20, 16);
        // Watering can
        g.fillStyle(rgb(100, 160, 200), 1);
        g.fillRect(left + 20, top + 80, 20, 16);
        g.fillRect(left + 40, top + 80, 12, 4);
        this._addText('Beautiful blooms!', cx, top + 120, '#dd5588');
        break;
      }
      case 'Pet Shop': {
        // Fish tank (large, left side)
        g.fillStyle(rgb(80, 160, 220), 0.4);
        g.fillRect(left + 10, top + 10, 90, 60);
        g.lineStyle(2, rgb(60, 120, 180), 0.8);
        g.strokeRect(left + 10, top + 10, 90, 60);
        // Fish
        g.fillStyle(0xff6644, 1);
        g.fillEllipse(left + 40, top + 35, 12, 6);
        g.fillStyle(0xffcc44, 1);
        g.fillEllipse(left + 70, top + 45, 10, 5);
        g.fillStyle(0x44bbff, 1);
        g.fillEllipse(left + 55, top + 55, 8, 4);
        // Bubbles
        g.fillStyle(0xffffff, 0.3);
        g.fillCircle(left + 30, top + 20, 2);
        g.fillCircle(left + 60, top + 25, 3);
        g.fillCircle(left + 80, top + 18, 2);
        // Cages (right side)
        for (let i = 0; i < 2; i++) {
          const cageX = left + 120 + i * 70;
          g.fillStyle(rgb(200, 200, 200), 1);
          g.fillRect(cageX, top + 10, 50, 40);
          g.lineStyle(1, rgb(120, 120, 120), 0.6);
          for (let bar = 0; bar < 6; bar++) {
            g.lineBetween(cageX + 8 + bar * 8, top + 10, cageX + 8 + bar * 8, top + 50);
          }
        }
        // Counter
        g.fillStyle(rgb(180, 160, 140), 1);
        g.fillRect(left + 10, top + 80, innerW - 20, 14);
        this._addText('Adopt a friend!', cx, top + 110, '#44aa88');
        break;
      }
      case 'Bakery': {
        // Bread display shelf
        g.fillStyle(rgb(160, 120, 80), 1);
        g.fillRect(left + 10, top + 5, innerW - 20, 50);
        // Shelves
        for (let s = 0; s < 2; s++) {
          g.fillStyle(rgb(140, 100, 60), 1);
          g.fillRect(left + 12, top + 25 + s * 20, innerW - 24, 3);
        }
        // Bread
        g.fillStyle(rgb(210, 170, 80), 1);
        g.fillEllipse(left + 30, top + 18, 20, 10);
        g.fillEllipse(left + 70, top + 16, 16, 12);
        g.fillEllipse(left + 110, top + 18, 22, 8);
        g.fillEllipse(left + 40, top + 38, 18, 10);
        g.fillEllipse(left + 80, top + 36, 20, 8);
        // Cake display
        g.fillStyle(rgb(255, 220, 220), 1);
        g.fillRect(cx - 15, top + 65, 30, 25);
        g.fillStyle(rgb(255, 150, 150), 1);
        g.fillRect(cx - 15, top + 65, 30, 5);
        // Oven
        g.fillStyle(rgb(80, 80, 90), 1);
        g.fillRect(left + innerW - 50, top + 10, 40, 35);
        g.fillStyle(rgb(255, 130, 30), 0.3);
        g.fillRect(left + innerW - 46, top + 18, 32, 20);
        this._addText('Warm & fresh!', cx, top + 110, '#cc8844');
        break;
      }
      case 'Toy Store': {
        // Toy shelves
        for (let s = 0; s < 3; s++) {
          const sy = top + 8 + s * 30;
          g.fillStyle(rgb(200, 180, 160), 1);
          g.fillRect(left + 10, sy, innerW - 20, 24);
          g.fillStyle(rgb(180, 160, 140), 1);
          g.fillRect(left + 10, sy + 24, innerW - 20, 3);
        }
        // Toys (colorful blocks and shapes)
        const toyColors = [0xff4444, 0x44bbff, 0xffcc00, 0x44dd44, 0xff88cc, 0xaa66ff];
        for (let i = 0; i < 12; i++) {
          const tx = left + 20 + (i % 6) * 38;
          const ty = top + 12 + Math.floor(i / 6) * 30;
          g.fillStyle(toyColors[i % 6], 1);
          if (i % 3 === 0) g.fillRect(tx, ty, 14, 14);
          else if (i % 3 === 1) g.fillCircle(tx + 7, ty + 7, 7);
          else g.fillTriangle(tx, ty + 14, tx + 7, ty, tx + 14, ty + 14);
        }
        // Train set
        g.fillStyle(rgb(100, 100, 110), 1);
        g.fillRect(left + 30, top + 100, 60, 12);
        g.fillStyle(0xff3333, 1);
        g.fillRect(left + 30, top + 92, 20, 12);
        g.fillStyle(0x333333, 1);
        g.fillCircle(left + 36, top + 112, 4);
        g.fillCircle(left + 50, top + 112, 4);
        g.fillCircle(left + 70, top + 112, 4);
        this._addText('Welcome to Toy World!', cx, top + 130, '#4488cc');
        break;
      }
      case 'Bookstore': {
        // Bookshelves along top wall
        const bookColors = [0xcc3333, 0x3366cc, 0x33aa55, 0xccaa33, 0x8833cc, 0xcc6633, 0x336699, 0xaa3366];
        for (let shelf = 0; shelf < 3; shelf++) {
          const sy = top + 5 + shelf * 28;
          g.fillStyle(rgb(120, 85, 55), 1);
          g.fillRect(left + 5, sy, innerW - 10, 24);
          // Books
          for (let b = 0; b < 12; b++) {
            g.fillStyle(bookColors[b % bookColors.length], 1);
            g.fillRect(left + 10 + b * 20, sy + 2, 14, 20);
          }
          g.fillStyle(rgb(100, 70, 40), 1);
          g.fillRect(left + 5, sy + 24, innerW - 10, 3);
        }
        // Reading nook (comfy chair)
        g.fillStyle(rgb(160, 100, 60), 1);
        g.fillRect(left + 20, top + 100, 40, 30);
        g.fillStyle(rgb(180, 120, 80), 1);
        g.fillRect(left + 22, top + 95, 36, 10);
        // Lamp
        g.fillStyle(rgb(60, 60, 60), 1);
        g.fillRect(left + 70, top + 90, 3, 35);
        g.fillStyle(0xffee88, 0.6);
        g.fillCircle(left + 71, top + 88, 10);
        g.fillStyle(0xffcc44, 1);
        g.fillTriangle(left + 61, top + 88, left + 71, top + 78, left + 81, top + 88);
        this._addText('Lost in a good book...', cx, top + 145, '#664422');
        break;
      }
      case 'Movie Theater': {
        // Screen
        g.fillStyle(rgb(40, 40, 50), 1);
        g.fillRect(left + 20, top + 5, innerW - 40, 50);
        g.fillStyle(rgb(180, 200, 220), 0.3);
        g.fillRect(left + 24, top + 9, innerW - 48, 42);
        // Projector beam
        g.fillStyle(0xffffff, 0.05);
        g.fillTriangle(cx, top + 100, left + 30, top + 10, left + innerW - 30, top + 10);
        // Seats (rows)
        for (let row = 0; row < 3; row++) {
          for (let seat = 0; seat < 6; seat++) {
            g.fillStyle(rgb(180, 40, 40), 1);
            g.fillRect(left + 20 + seat * 38, top + 70 + row * 28, 28, 20);
            g.fillStyle(rgb(160, 30, 30), 1);
            g.fillRect(left + 20 + seat * 38, top + 68 + row * 28, 28, 4);
          }
        }
        // Popcorn
        g.fillStyle(rgb(255, 220, 100), 1);
        g.fillRect(left + innerW - 40, top + 70, 24, 30);
        g.fillStyle(0xffffff, 1);
        for (let p = 0; p < 4; p++) {
          g.fillCircle(left + innerW - 34 + p * 6, top + 68, 4);
        }
        this._addText('Now Showing!', cx, top + 160, '#cc2222');
        break;
      }
      case 'Arcade': {
        // Arcade cabinets
        const cabinetColors = [0x2244aa, 0xaa2244, 0x22aa44, 0xaa8822];
        for (let i = 0; i < 4; i++) {
          const cabX = left + 10 + i * 65;
          g.fillStyle(cabinetColors[i], 1);
          g.fillRect(cabX, top + 10, 50, 70);
          g.fillStyle(rgb(30, 30, 40), 1);
          g.fillRect(cabX + 5, top + 15, 40, 30);
          // Screen glow
          g.fillStyle(0x00ff00, 0.3);
          g.fillRect(cabX + 7, top + 17, 36, 26);
          // Joystick + buttons
          g.fillStyle(0x333333, 1);
          g.fillCircle(cabX + 15, top + 55, 4);
          g.fillStyle(0xff3333, 1);
          g.fillCircle(cabX + 30, top + 52, 3);
          g.fillStyle(0x3333ff, 1);
          g.fillCircle(cabX + 38, top + 55, 3);
        }
        // Claw machine
        g.fillStyle(rgb(220, 200, 100), 1);
        g.fillRect(left + 30, top + 100, 50, 50);
        g.fillStyle(rgb(200, 220, 255), 0.6);
        g.fillRect(left + 34, top + 104, 42, 30);
        // Neon sign
        this._addText('GAME OVER?', cx, top + 90, '#00ff00');
        this._addText('INSERT COIN', cx, top + 165, '#ff8800');
        break;
      }
      case 'Pizza Place': {
        // Pizza oven
        g.fillStyle(rgb(180, 80, 30), 1);
        g.fillRect(left + innerW - 70, top + 5, 60, 45);
        g.fillStyle(rgb(255, 120, 40), 0.4);
        g.fillEllipse(left + innerW - 40, top + 25, 40, 24);
        // Counter
        g.fillStyle(rgb(200, 180, 140), 1);
        g.fillRect(left + 10, top + 10, innerW - 90, 20);
        // Pizzas
        g.fillStyle(rgb(230, 190, 80), 1);
        g.fillCircle(left + 40, top + 20, 12);
        g.fillCircle(left + 80, top + 20, 12);
        g.fillStyle(rgb(180, 40, 30), 1);
        g.fillCircle(left + 36, top + 16, 3);
        g.fillCircle(left + 44, top + 22, 3);
        g.fillCircle(left + 76, top + 18, 3);
        g.fillCircle(left + 84, top + 24, 3);
        // Tables
        for (let t = 0; t < 3; t++) {
          g.fillStyle(rgb(160, 120, 80), 1);
          g.fillRect(left + 20 + t * 80, top + 70, 50, 30);
          g.fillStyle(rgb(140, 100, 60), 1);
          g.fillRect(left + 38 + t * 80, top + 100, 14, 20);
          // Checkered tablecloth
          g.fillStyle(0xff4444, 0.2);
          for (let cx2 = 0; cx2 < 50; cx2 += 10) {
            for (let cy2 = 0; cy2 < 30; cy2 += 10) {
              if ((cx2 + cy2) % 20 === 0) {
                g.fillRect(left + 20 + t * 80 + cx2, top + 70 + cy2, 10, 10);
              }
            }
          }
        }
        this._addText('Mama mia!', cx, top + 135, '#cc3322');
        break;
      }
      case 'Gym': {
        // Weight rack
        g.fillStyle(rgb(60, 60, 70), 1);
        g.fillRect(left + 10, top + 5, 60, 50);
        // Dumbbells on rack
        for (let w = 0; w < 3; w++) {
          g.fillStyle(rgb(100, 100, 110), 1);
          g.fillRect(left + 18, top + 12 + w * 15, 44, 4);
          g.fillStyle(rgb(40, 40, 50), 1);
          g.fillRect(left + 15, top + 10 + w * 15, 6, 8);
          g.fillRect(left + 59, top + 10 + w * 15, 6, 8);
        }
        // Treadmill
        g.fillStyle(rgb(50, 50, 60), 1);
        g.fillRect(left + 90, top + 10, 50, 40);
        g.fillStyle(rgb(80, 80, 90), 1);
        g.fillRect(left + 92, top + 30, 46, 18);
        // Bench press
        g.fillStyle(rgb(60, 60, 70), 1);
        g.fillRect(left + 160, top + 20, 60, 10);
        g.fillRect(left + 180, top + 10, 20, 30);
        // Mirror
        g.fillStyle(rgb(200, 220, 240), 0.5);
        g.fillRect(left + innerW - 50, top + 5, 40, 60);
        g.lineStyle(1, rgb(180, 180, 190), 0.8);
        g.strokeRect(left + innerW - 50, top + 5, 40, 60);
        this._addText('No pain no gain!', cx, top + 100, '#555555');
        break;
      }
      case 'Hospital': {
        // Reception desk
        g.fillStyle(rgb(220, 220, 230), 1);
        g.fillRect(left + 10, top + 5, innerW - 20, 20);
        // Red cross
        g.fillStyle(0xdd3333, 1);
        g.fillRect(cx - 3, top + 8, 6, 14);
        g.fillRect(cx - 7, top + 12, 14, 6);
        // Hospital beds
        for (let b = 0; b < 2; b++) {
          g.fillStyle(rgb(230, 230, 240), 1);
          g.fillRect(left + 20 + b * 130, top + 50, 80, 40);
          g.fillStyle(rgb(200, 210, 220), 1);
          g.fillRect(left + 20 + b * 130, top + 48, 80, 4);
          // Pillow
          g.fillStyle(0xffffff, 1);
          g.fillRect(left + 22 + b * 130, top + 52, 20, 14);
          // Monitor
          g.fillStyle(rgb(40, 40, 50), 1);
          g.fillRect(left + 95 + b * 130 - (b * 130), top + 45, 20, 16);
          g.fillStyle(0x00ff00, 0.6);
          g.lineStyle(1, 0x00ff00, 0.8);
          g.lineBetween(left + 97 + b * 130 - (b * 130), top + 53, left + 102 + b * 130 - (b * 130), top + 48);
          g.lineBetween(left + 102 + b * 130 - (b * 130), top + 48, left + 107 + b * 130 - (b * 130), top + 56);
          g.lineBetween(left + 107 + b * 130 - (b * 130), top + 56, left + 112 + b * 130 - (b * 130), top + 53);
        }
        this._addText('Get well soon!', cx, top + 110, '#3366cc');
        break;
      }
      default: {
        // Generic interior — counter, shelves, and some items
        // Counter
        g.fillStyle(rgb(Math.min(255, cr + 20), Math.min(255, cg + 20), Math.min(255, cb + 20)), 1);
        g.fillRect(left + 20, top + 10, innerW - 40, 18);
        g.fillStyle(rgb(cr, cg, cb), 1);
        g.fillRect(left + 20, top + 28, innerW - 40, 4);
        // Shelves
        for (let s = 0; s < 2; s++) {
          g.fillStyle(rgb(Math.max(0, cr - 30), Math.max(0, cg - 30), Math.max(0, cb - 30)), 1);
          g.fillRect(left + 10, top + 50 + s * 35, innerW - 20, 26);
          g.fillStyle(rgb(Math.max(0, cr - 10), Math.max(0, cg - 10), Math.max(0, cb - 10)), 1);
          g.fillRect(left + 10, top + 76 + s * 35, innerW - 20, 3);
        }
        // Generic items on shelves
        for (let i = 0; i < 8; i++) {
          g.fillStyle(rgb(
            (cr + i * 30) % 256,
            (cg + i * 20) % 256,
            (cb + i * 40) % 256
          ), 0.8);
          g.fillRect(left + 20 + (i % 4) * 55, top + 55 + Math.floor(i / 4) * 35, 18, 18);
        }
        this._addText(`Welcome to ${name}!`, cx, top + 135, '#444444');
        break;
      }
    }
  }

  _addText(text, x, y, color) {
    const t = this.scene.add.text(x, y, text, {
      fontFamily: PX_FONT,
      fontSize: '7px',
      color: color,
      stroke: '#ffffff',
      strokeThickness: 1,
    }).setOrigin(0.5, 0.5).setDepth(2001);
    this.scene.addTownObj(t);
    this.objects.push(t);
  }

  _destroyRoom() {
    for (const obj of this.objects) {
      obj.destroy();
    }
    this.objects = [];
    this.exitPrompt = null;
  }

  destroy() {
    this._destroyRoom();
    if (this.enterPrompt) this.enterPrompt.destroy();
    if (this.enterBtn) this.enterBtn.remove();
  }
}
