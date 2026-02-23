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
        // Checkered floor accent
        g.fillStyle(0xffffff, 0.08);
        for (let fx = 0; fx < innerW; fx += 24) {
          for (let fy = 0; fy < innerH; fy += 24) {
            if ((fx + fy) % 48 === 0) g.fillRect(left + fx, top + fy, 24, 24);
          }
        }
        // Counter at top with cash register
        g.fillStyle(rgb(200, 170, 100), 1);
        g.fillRect(left + 20, top + 10, innerW - 40, 20);
        g.fillStyle(rgb(180, 150, 80), 1);
        g.fillRect(left + 20, top + 30, innerW - 40, 4);
        // Cash register on counter
        g.fillStyle(rgb(80, 80, 90), 1);
        g.fillRect(left + innerW - 60, top + 4, 22, 16);
        g.fillStyle(rgb(60, 60, 70), 1);
        g.fillRect(left + innerW - 58, top + 6, 18, 8);
        g.fillStyle(0x00ff00, 0.5);
        g.fillRect(left + innerW - 56, top + 7, 14, 6);
        // Lemons in bowl
        g.fillStyle(rgb(180, 160, 120), 1);
        g.fillEllipse(left + 50, top + 18, 32, 8);
        g.fillStyle(0xffee44, 1);
        for (let i = 0; i < 5; i++) {
          g.fillCircle(left + 38 + i * 8, top + 16, 5);
        }
        g.fillStyle(0xeedd33, 1);
        g.fillCircle(left + 46, top + 12, 4);
        g.fillCircle(left + 54, top + 13, 4);
        // Pitcher with condensation
        g.fillStyle(rgb(180, 220, 255), 0.7);
        g.fillRect(cx - 8, top + 45, 16, 28);
        g.fillRect(cx - 10, top + 43, 20, 4);
        g.fillStyle(0xffee44, 0.5);
        g.fillRect(cx - 6, top + 50, 12, 18);
        // Handle
        g.fillStyle(rgb(160, 200, 240), 0.7);
        g.fillRect(cx + 8, top + 48, 6, 3);
        g.fillRect(cx + 12, top + 48, 3, 14);
        g.fillRect(cx + 8, top + 60, 6, 3);
        // Condensation drops
        g.fillStyle(0xffffff, 0.3);
        g.fillCircle(cx - 6, top + 55, 1.5);
        g.fillCircle(cx + 4, top + 62, 1);
        // Cups with straws
        g.fillStyle(0xffffff, 1);
        for (let i = 0; i < 4; i++) {
          g.fillRect(left + 30 + i * 55, top + 55, 12, 16);
          // Straw
          g.fillStyle(rgb(220, 50, 50), 1);
          g.fillRect(left + 34 + i * 55, top + 48, 2, 18);
          g.fillStyle(0xffffff, 1);
        }
        // Hanging string lights across ceiling
        g.lineStyle(1, rgb(80, 80, 80), 0.5);
        g.lineBetween(left + 5, top + 2, left + innerW - 5, top + 5);
        const bulbColors2 = [0xffee44, 0xff8844, 0xffee44, 0xff6644, 0xffee44];
        for (let i = 0; i < 5; i++) {
          g.fillStyle(bulbColors2[i], 0.7);
          g.fillCircle(left + 25 + i * 50, top + 4 + (i % 2) * 2, 3);
        }
        // Lemon tree in pot (corner)
        g.fillStyle(rgb(140, 90, 50), 1);
        g.fillRect(left + innerW - 30, top + 100, 20, 18);
        g.fillStyle(rgb(80, 60, 30), 1);
        g.fillRect(left + innerW - 24, top + 80, 6, 22);
        g.fillStyle(0x44aa33, 1);
        g.fillCircle(left + innerW - 21, top + 74, 12);
        g.fillStyle(0xffee44, 1);
        g.fillCircle(left + innerW - 25, top + 78, 3);
        g.fillCircle(left + innerW - 16, top + 72, 3);
        // Price sign on wall
        g.fillStyle(rgb(240, 220, 180), 1);
        g.fillRect(left + 5, top + 5, 40, 22);
        g.lineStyle(1, rgb(180, 140, 60), 1);
        g.strokeRect(left + 5, top + 5, 40, 22);
        this._addText('$1.00', left + 25, top + 16, '#996600');
        // Welcome mat detail
        g.fillStyle(rgb(100, 140, 60), 0.4);
        g.fillRect(cx - 20, top + innerH - 20, 40, 12);
        this._addText('Fresh Lemonade!', cx, top + 95, '#996600');
        break;
      }
      case 'Ice Cream Truck': {
        // Checkered pink & white floor
        g.fillStyle(0xff88aa, 0.08);
        for (let fx = 0; fx < innerW; fx += 20) {
          for (let fy = 0; fy < innerH; fy += 20) {
            if ((fx + fy) % 40 === 0) g.fillRect(left + fx, top + fy, 20, 20);
          }
        }
        // Freezer display with frost effect
        g.fillStyle(rgb(200, 230, 255), 1);
        g.fillRect(left + 10, top + 5, innerW - 20, 40);
        g.lineStyle(2, rgb(150, 180, 200), 1);
        g.strokeRect(left + 10, top + 5, innerW - 20, 40);
        // Frost on glass
        g.fillStyle(0xffffff, 0.15);
        g.fillRect(left + 12, top + 7, 20, 8);
        g.fillRect(left + innerW - 40, top + 30, 16, 10);
        // Ice cream flavors with labels
        const colors = [0xff88aa, 0x88ddff, 0xffee88, 0xcc88ff, 0x88ff88, 0xffaa66];
        const flavorNames = ['Strwb', 'Mint', 'Vanla', 'Grape', 'Lime', 'Mango'];
        for (let i = 0; i < 6; i++) {
          g.fillStyle(colors[i], 1);
          g.fillCircle(left + 30 + i * 40, top + 25, 12);
          // Flavor swirl
          g.fillStyle(0xffffff, 0.3);
          g.fillCircle(left + 28 + i * 40, top + 22, 4);
        }
        // Counter with register
        g.fillStyle(rgb(180, 180, 190), 1);
        g.fillRect(left + 10, top + 50, innerW - 20, 16);
        g.fillStyle(rgb(160, 160, 170), 1);
        g.fillRect(left + 10, top + 66, innerW - 20, 3);
        // Register
        g.fillStyle(rgb(70, 70, 80), 1);
        g.fillRect(left + 15, top + 44, 24, 14);
        g.fillStyle(rgb(100, 200, 100), 0.4);
        g.fillRect(left + 17, top + 46, 20, 8);
        // Cone stack (pyramid)
        g.fillStyle(rgb(200, 170, 100), 1);
        for (let i = 0; i < 3; i++) {
          g.fillTriangle(left + 50 + i * 30, top + 80, left + 56 + i * 30, top + 100, left + 62 + i * 30, top + 80);
        }
        // Sprinkle containers
        const sprinkleC = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44];
        for (let i = 0; i < 4; i++) {
          g.fillStyle(rgb(200, 200, 210), 0.8);
          g.fillRect(left + 160 + i * 20, top + 80, 14, 22);
          g.fillStyle(sprinkleC[i], 0.7);
          g.fillRect(left + 162 + i * 20, top + 84, 10, 14);
        }
        // Waffle cone maker
        g.fillStyle(rgb(60, 60, 70), 1);
        g.fillRect(left + innerW - 50, top + 75, 35, 25);
        g.fillStyle(rgb(200, 170, 100), 0.5);
        g.fillCircle(left + innerW - 33, top + 87, 8);
        // Hanging menu board
        g.fillStyle(rgb(40, 40, 50), 1);
        g.fillRect(left + innerW - 55, top + 3, 45, 20);
        this._addText('MENU', left + innerW - 33, top + 8, '#ffffff');
        this._addText('$2-$5', left + innerW - 33, top + 18, '#ffcc44');
        // Napkin dispenser on counter
        g.fillStyle(rgb(180, 180, 190), 1);
        g.fillRect(cx + 30, top + 50, 14, 12);
        g.fillStyle(0xffffff, 1);
        g.fillRect(cx + 33, top + 48, 8, 4);
        this._addText('Choose a flavor!', cx, top + 120, '#4488cc');
        break;
      }
      case 'Cookie Shop': {
        // Warm brown floor with rug
        g.fillStyle(rgb(160, 100, 50), 0.15);
        g.fillRect(left + 30, top + 90, innerW - 60, 60);
        g.lineStyle(1, rgb(140, 80, 40), 0.2);
        g.strokeRect(left + 30, top + 90, innerW - 60, 60);
        // Oven in back with details
        g.fillStyle(rgb(80, 80, 90), 1);
        g.fillRect(left + innerW - 65, top + 5, 55, 50);
        g.fillStyle(rgb(70, 70, 80), 1);
        g.fillRect(left + innerW - 63, top + 7, 51, 3);
        g.fillStyle(rgb(255, 140, 40), 0.3);
        g.fillRect(left + innerW - 58, top + 15, 42, 24);
        // Oven door handle
        g.fillStyle(rgb(140, 140, 150), 1);
        g.fillRect(left + innerW - 55, top + 42, 36, 3);
        // Temperature dial
        g.fillStyle(rgb(200, 200, 210), 1);
        g.fillCircle(left + innerW - 50, top + 10, 4);
        g.fillStyle(0xff3333, 1);
        g.fillRect(left + innerW - 51, top + 8, 2, 4);
        // Timer
        g.fillStyle(rgb(200, 200, 210), 1);
        g.fillCircle(left + innerW - 36, top + 10, 4);
        this._addText('12m', left + innerW - 36, top + 10, '#333333');
        // Display case with glass top
        g.fillStyle(rgb(220, 200, 180), 1);
        g.fillRect(left + 10, top + 10, innerW - 85, 40);
        g.fillStyle(rgb(255, 240, 220), 0.8);
        g.fillRect(left + 12, top + 12, innerW - 89, 36);
        // Glass cover
        g.lineStyle(1, rgb(200, 220, 240), 0.5);
        g.strokeRect(left + 12, top + 12, innerW - 89, 36);
        // Cookies with more variety
        const cookieColors = [rgb(180, 120, 50), rgb(160, 100, 40), rgb(200, 140, 60), rgb(170, 90, 35)];
        for (let i = 0; i < 8; i++) {
          g.fillStyle(cookieColors[i % 4], 1);
          g.fillCircle(left + 25 + i * 22, top + 30, 7);
          // Chocolate chips
          g.fillStyle(rgb(60, 30, 10), 1);
          g.fillCircle(left + 23 + i * 22, top + 28, 1.5);
          g.fillCircle(left + 27 + i * 22, top + 32, 1.5);
          g.fillCircle(left + 25 + i * 22, top + 26, 1);
        }
        // Cookie jars with labels
        g.fillStyle(rgb(200, 180, 160), 0.7);
        const jarLabels = ['Choc', 'Oat', 'Sugar'];
        for (let i = 0; i < 3; i++) {
          g.fillRect(left + 20 + i * 65, top + 62, 26, 34);
          g.fillStyle(rgb(220, 200, 180), 0.9);
          g.fillCircle(left + 33 + i * 65, top + 60, 14);
          g.fillStyle(rgb(160, 140, 120), 1);
          g.fillRect(left + 18 + i * 65, top + 59, 30, 4);
          this._addText(jarLabels[i], left + 33 + i * 65, top + 80, '#8B4513');
          g.fillStyle(rgb(200, 180, 160), 0.7);
        }
        // Mixing bowl on side table
        g.fillStyle(rgb(200, 200, 210), 1);
        g.fillEllipse(left + innerW - 30, top + 70, 24, 10);
        g.fillStyle(rgb(230, 210, 180), 0.8);
        g.fillEllipse(left + innerW - 30, top + 68, 18, 6);
        // Whisk
        g.fillStyle(rgb(160, 160, 170), 1);
        g.fillRect(left + innerW - 22, top + 58, 2, 14);
        // Ceiling lamp
        g.fillStyle(rgb(200, 160, 80), 0.6);
        g.fillRect(cx - 12, top, 24, 6);
        g.fillStyle(0xffee88, 0.2);
        g.fillRect(cx - 30, top + 6, 60, 40);
        // Chalkboard menu
        g.fillStyle(rgb(40, 50, 40), 1);
        g.fillRect(left + 5, top + 3, 50, 30);
        g.lineStyle(1, rgb(160, 120, 60), 1);
        g.strokeRect(left + 5, top + 3, 50, 30);
        this._addText('Today:', left + 30, top + 12, '#ffffff');
        this._addText('Snickr', left + 30, top + 24, '#ffcc88');
        this._addText('Fresh baked daily!', cx, top + 115, '#8B4513');
        break;
      }
      case 'Flower Shop': {
        // Earthy floor accent
        g.fillStyle(rgb(120, 100, 60), 0.08);
        for (let fx = 0; fx < innerW; fx += 16) {
          for (let fy = 0; fy < innerH; fy += 16) {
            if ((fx + fy) % 32 === 0) g.fillRect(left + fx, top + fy, 16, 16);
          }
        }
        // Flower displays along back wall (enhanced)
        const flowerC = [0xff6088, 0xffcc44, 0xff88cc, 0xaa66ff, 0xff8844, 0x88ccff];
        const flowerNames = ['Rose', 'Daisy', 'Tulip', 'Iris', 'Lily', 'Forget'];
        for (let i = 0; i < 6; i++) {
          const fx = left + 12 + i * 42;
          // Pot
          g.fillStyle(rgb(160, 90, 50), 1);
          g.fillRect(fx + 2, top + 14, 22, 18);
          g.fillStyle(rgb(140, 75, 40), 1);
          g.fillRect(fx, top + 12, 26, 4);
          // Soil
          g.fillStyle(rgb(80, 50, 30), 1);
          g.fillRect(fx + 4, top + 14, 18, 4);
          // Stems
          g.fillStyle(0x44aa33, 1);
          g.fillRect(fx + 8, top - 2, 2, 18);
          g.fillRect(fx + 15, top - 5, 2, 21);
          // Leaves
          g.fillStyle(0x55bb44, 1);
          g.fillEllipse(fx + 5, top + 6, 6, 3);
          g.fillEllipse(fx + 20, top + 3, 6, 3);
          // Flower heads
          g.fillStyle(flowerC[i], 1);
          g.fillCircle(fx + 9, top - 4, 6);
          g.fillCircle(fx + 16, top - 7, 5);
          // Petal details
          g.fillStyle(0xffffff, 0.3);
          g.fillCircle(fx + 9, top - 5, 2);
          g.fillCircle(fx + 16, top - 8, 2);
        }
        // Counter with register and wrapping paper
        g.fillStyle(rgb(180, 150, 120), 1);
        g.fillRect(left + 10, top + 45, innerW - 20, 18);
        g.fillStyle(rgb(160, 130, 100), 1);
        g.fillRect(left + 10, top + 63, innerW - 20, 3);
        // Register
        g.fillStyle(rgb(80, 80, 90), 1);
        g.fillRect(left + innerW - 50, top + 38, 24, 14);
        g.fillStyle(0x00ff00, 0.4);
        g.fillRect(left + innerW - 48, top + 40, 20, 8);
        // Wrapping paper rolls
        g.fillStyle(rgb(220, 180, 200), 0.8);
        g.fillRect(left + 15, top + 47, 30, 8);
        g.fillStyle(rgb(180, 220, 180), 0.8);
        g.fillRect(left + 50, top + 47, 30, 8);
        // Ribbon spools
        g.fillStyle(rgb(220, 80, 80), 1);
        g.fillCircle(left + 95, top + 51, 5);
        g.fillStyle(rgb(80, 80, 220), 1);
        g.fillCircle(left + 110, top + 51, 5);
        // Watering can (detailed)
        g.fillStyle(rgb(80, 140, 180), 1);
        g.fillRect(left + 18, top + 80, 24, 18);
        g.fillRect(left + 42, top + 82, 16, 4);
        g.fillStyle(rgb(60, 120, 160), 1);
        g.fillRect(left + 56, top + 80, 4, 3);
        g.fillRect(left + 56, top + 79, 8, 2);
        // Handle
        g.fillStyle(rgb(100, 160, 200), 1);
        g.fillRect(left + 20, top + 76, 20, 4);
        // Hanging baskets from ceiling
        for (let h = 0; h < 2; h++) {
          const hx = left + 50 + h * 130;
          g.lineStyle(1, rgb(100, 80, 60), 0.6);
          g.lineBetween(hx + 10, top, hx + 10, top + 5);
          g.fillStyle(rgb(120, 80, 50), 0.8);
          g.fillRect(hx, top + 5, 20, 10);
          g.fillStyle(0x44aa33, 1);
          g.fillCircle(hx + 5, top + 3, 5);
          g.fillCircle(hx + 15, top + 2, 6);
          g.fillStyle(0xff88cc, 0.8);
          g.fillCircle(hx + 10, top, 4);
        }
        // Potted plant on floor
        g.fillStyle(rgb(160, 90, 50), 1);
        g.fillRect(left + innerW - 35, top + 85, 24, 26);
        g.fillStyle(0x44aa33, 1);
        g.fillCircle(left + innerW - 23, top + 78, 14);
        g.fillStyle(0x55bb44, 0.6);
        g.fillCircle(left + innerW - 18, top + 80, 8);
        // Window with sunlight
        g.fillStyle(rgb(180, 220, 255), 0.3);
        g.fillRect(left + innerW - 10, top + 15, 8, 24);
        g.lineStyle(1, rgb(140, 140, 150), 0.6);
        g.strokeRect(left + innerW - 10, top + 15, 8, 24);
        this._addText('Beautiful blooms!', cx, top + 125, '#dd5588');
        break;
      }
      case 'Pet Shop': {
        // Paw print floor pattern
        g.fillStyle(rgb(180, 150, 120), 0.12);
        for (let i = 0; i < 6; i++) {
          const px2 = left + 20 + i * 42;
          const py2 = top + innerH - 30 - (i % 2) * 20;
          g.fillCircle(px2, py2, 4);
          g.fillCircle(px2 - 3, py2 - 5, 2);
          g.fillCircle(px2 + 3, py2 - 5, 2);
          g.fillCircle(px2 - 5, py2 - 2, 2);
          g.fillCircle(px2 + 5, py2 - 2, 2);
        }
        // Fish tank (large, left side) with stand
        g.fillStyle(rgb(80, 60, 40), 1);
        g.fillRect(left + 8, top + 68, 94, 8);
        g.fillRect(left + 14, top + 76, 6, 18);
        g.fillRect(left + 92, top + 76, 6, 18);
        g.fillStyle(rgb(80, 160, 220), 0.4);
        g.fillRect(left + 10, top + 10, 90, 60);
        g.lineStyle(2, rgb(60, 120, 180), 0.8);
        g.strokeRect(left + 10, top + 10, 90, 60);
        // Sand and plants at bottom
        g.fillStyle(rgb(200, 180, 140), 0.5);
        g.fillRect(left + 12, top + 58, 86, 10);
        g.fillStyle(0x44aa33, 0.6);
        g.fillRect(left + 20, top + 48, 3, 14);
        g.fillRect(left + 24, top + 50, 3, 12);
        g.fillRect(left + 75, top + 46, 3, 16);
        g.fillRect(left + 80, top + 50, 3, 12);
        // Fish (more detailed)
        g.fillStyle(0xff6644, 1);
        g.fillEllipse(left + 40, top + 32, 14, 7);
        g.fillTriangle(left + 30, top + 32, left + 26, top + 26, left + 26, top + 38);
        g.fillStyle(0x222222, 1);
        g.fillCircle(left + 46, top + 30, 1.5);
        g.fillStyle(0xffcc44, 1);
        g.fillEllipse(left + 70, top + 42, 12, 6);
        g.fillTriangle(left + 62, top + 42, left + 58, top + 37, left + 58, top + 47);
        g.fillStyle(0x222222, 1);
        g.fillCircle(left + 75, top + 41, 1.5);
        g.fillStyle(0x44bbff, 1);
        g.fillEllipse(left + 55, top + 52, 10, 5);
        // Treasure chest in tank
        g.fillStyle(rgb(160, 120, 40), 0.5);
        g.fillRect(left + 45, top + 58, 10, 6);
        // Bubbles
        g.fillStyle(0xffffff, 0.3);
        g.fillCircle(left + 30, top + 18, 2);
        g.fillCircle(left + 32, top + 24, 1.5);
        g.fillCircle(left + 60, top + 22, 3);
        g.fillCircle(left + 62, top + 28, 2);
        g.fillCircle(left + 80, top + 15, 2);
        // Cages with animals (right side)
        for (let i = 0; i < 2; i++) {
          const cageX = left + 118 + i * 72;
          g.fillStyle(rgb(220, 220, 220), 1);
          g.fillRect(cageX, top + 10, 54, 44);
          g.fillStyle(rgb(200, 200, 200), 1);
          g.fillRect(cageX, top + 8, 54, 4);
          g.lineStyle(1, rgb(120, 120, 120), 0.6);
          for (let bar = 0; bar < 6; bar++) {
            g.lineBetween(cageX + 8 + bar * 8, top + 12, cageX + 8 + bar * 8, top + 54);
          }
          // Animals inside
          if (i === 0) {
            // Hamster
            g.fillStyle(rgb(200, 160, 100), 1);
            g.fillEllipse(cageX + 27, top + 38, 14, 10);
            g.fillCircle(cageX + 34, top + 32, 6);
            g.fillStyle(0x222222, 1);
            g.fillCircle(cageX + 36, top + 31, 1.5);
            // Wheel
            g.lineStyle(1, rgb(140, 140, 150), 0.8);
            g.strokeCircle(cageX + 15, top + 36, 8);
          } else {
            // Bird
            g.fillStyle(rgb(100, 200, 80), 1);
            g.fillEllipse(cageX + 27, top + 34, 10, 12);
            g.fillCircle(cageX + 27, top + 24, 6);
            g.fillStyle(0xff8833, 1);
            g.fillTriangle(cageX + 33, top + 23, cageX + 38, top + 24, cageX + 33, top + 25);
            g.fillStyle(0x222222, 1);
            g.fillCircle(cageX + 30, top + 23, 1.5);
            // Perch
            g.fillStyle(rgb(120, 80, 40), 1);
            g.fillRect(cageX + 10, top + 40, 34, 3);
          }
        }
        // Counter with register and treats
        g.fillStyle(rgb(180, 160, 140), 1);
        g.fillRect(left + 10, top + 100, innerW - 20, 16);
        g.fillStyle(rgb(160, 140, 120), 1);
        g.fillRect(left + 10, top + 116, innerW - 20, 3);
        // Register
        g.fillStyle(rgb(70, 70, 80), 1);
        g.fillRect(left + 15, top + 94, 22, 12);
        // Pet food shelf
        g.fillStyle(rgb(140, 110, 80), 1);
        g.fillRect(left + 120, top + 70, 80, 24);
        g.fillStyle(rgb(120, 90, 60), 1);
        g.fillRect(left + 120, top + 94, 80, 3);
        // Food bags
        const bagColors = [rgb(200, 60, 60), rgb(60, 120, 200), rgb(60, 160, 60)];
        for (let b = 0; b < 3; b++) {
          g.fillStyle(bagColors[b], 0.8);
          g.fillRect(left + 126 + b * 24, top + 74, 18, 18);
        }
        // Dog bone treat on counter
        g.fillStyle(rgb(220, 200, 160), 1);
        g.fillRect(left + 60, top + 103, 16, 5);
        g.fillCircle(left + 60, top + 106, 4);
        g.fillCircle(left + 76, top + 106, 4);
        this._addText('Adopt a friend!', cx, top + 135, '#44aa88');
        break;
      }
      case 'Bakery': {
        // Flour-dusted floor accent
        g.fillStyle(0xffffff, 0.05);
        g.fillCircle(left + 40, top + 100, 15);
        g.fillCircle(left + 100, top + 120, 10);
        g.fillCircle(left + innerW - 50, top + 95, 12);
        // Bread display shelf (back wall)
        g.fillStyle(rgb(160, 120, 80), 1);
        g.fillRect(left + 10, top + 5, innerW - 75, 55);
        // Shelves with brackets
        for (let s = 0; s < 2; s++) {
          g.fillStyle(rgb(140, 100, 60), 1);
          g.fillRect(left + 12, top + 25 + s * 22, innerW - 79, 3);
          // Brackets
          g.fillStyle(rgb(100, 70, 40), 1);
          g.fillRect(left + 20, top + 25 + s * 22, 4, 6);
          g.fillRect(left + innerW - 80, top + 25 + s * 22, 4, 6);
        }
        // Bread variety
        g.fillStyle(rgb(210, 170, 80), 1);
        g.fillEllipse(left + 30, top + 18, 20, 10);
        // Score marks on bread
        g.lineStyle(1, rgb(180, 140, 60), 0.5);
        g.lineBetween(left + 24, top + 16, left + 28, top + 19);
        g.lineBetween(left + 30, top + 15, left + 34, top + 18);
        g.fillStyle(rgb(190, 150, 70), 1);
        g.fillEllipse(left + 70, top + 16, 16, 12);
        g.fillStyle(rgb(220, 180, 90), 1);
        g.fillEllipse(left + 110, top + 18, 22, 8);
        // Baguette
        g.fillStyle(rgb(200, 160, 70), 1);
        g.fillRect(left + 140, top + 13, 40, 8);
        g.fillEllipse(left + 140, top + 17, 6, 5);
        g.fillEllipse(left + 180, top + 17, 6, 5);
        // Second shelf breads
        g.fillStyle(rgb(190, 140, 60), 1);
        g.fillEllipse(left + 40, top + 38, 18, 10);
        g.fillEllipse(left + 80, top + 36, 20, 8);
        // Croissants
        g.fillStyle(rgb(220, 180, 80), 1);
        g.fillTriangle(left + 120, top + 42, left + 140, top + 35, left + 140, top + 42);
        g.fillTriangle(left + 150, top + 42, left + 170, top + 35, left + 170, top + 42);
        // Cake display case (glass)
        g.fillStyle(rgb(240, 230, 220), 1);
        g.fillRect(cx - 25, top + 68, 50, 30);
        g.fillStyle(rgb(200, 230, 255), 0.3);
        g.fillRect(cx - 23, top + 62, 46, 8);
        g.lineStyle(1, rgb(180, 200, 220), 0.5);
        g.strokeRect(cx - 25, top + 62, 50, 36);
        // Layered cake inside
        g.fillStyle(rgb(255, 220, 220), 1);
        g.fillRect(cx - 15, top + 72, 30, 22);
        g.fillStyle(rgb(255, 180, 180), 1);
        g.fillRect(cx - 15, top + 72, 30, 4);
        g.fillRect(cx - 15, top + 82, 30, 4);
        // Frosting
        g.fillStyle(rgb(255, 240, 240), 1);
        g.fillRect(cx - 15, top + 70, 30, 4);
        // Cherry on top
        g.fillStyle(0xff3333, 1);
        g.fillCircle(cx, top + 69, 3);
        // Oven (more detailed)
        g.fillStyle(rgb(80, 80, 90), 1);
        g.fillRect(left + innerW - 55, top + 5, 45, 45);
        g.fillStyle(rgb(70, 70, 80), 1);
        g.fillRect(left + innerW - 53, top + 7, 41, 3);
        g.fillStyle(rgb(255, 130, 30), 0.3);
        g.fillRect(left + innerW - 50, top + 15, 36, 22);
        // Oven window
        g.fillStyle(rgb(200, 120, 40), 0.15);
        g.fillRect(left + innerW - 48, top + 17, 32, 18);
        // Handle
        g.fillStyle(rgb(140, 140, 150), 1);
        g.fillRect(left + innerW - 48, top + 40, 32, 3);
        // Temperature knobs
        g.fillStyle(rgb(200, 200, 210), 1);
        g.fillCircle(left + innerW - 45, top + 10, 3);
        g.fillCircle(left + innerW - 35, top + 10, 3);
        // Flour sack
        g.fillStyle(rgb(230, 220, 200), 1);
        g.fillRect(left + 10, top + 70, 22, 28);
        this._addText('FLOUR', left + 21, top + 84, '#998877');
        // Rolling pin
        g.fillStyle(rgb(180, 150, 110), 1);
        g.fillRect(left + 45, top + 80, 30, 5);
        g.fillStyle(rgb(140, 110, 70), 1);
        g.fillCircle(left + 45, top + 82, 4);
        g.fillCircle(left + 75, top + 82, 4);
        // Ceiling pendant light
        g.fillStyle(rgb(60, 60, 60), 1);
        g.fillRect(cx - 1, top, 2, 8);
        g.fillStyle(0xffee88, 0.5);
        g.fillTriangle(cx - 10, top + 8, cx, top + 3, cx + 10, top + 8);
        g.fillStyle(0xffee88, 0.1);
        g.fillTriangle(cx - 30, top + 40, cx, top + 8, cx + 30, top + 40);
        this._addText('Warm & fresh!', cx, top + 115, '#cc8844');
        break;
      }
      case 'Toy Store': {
        // Colorful star pattern floor
        g.fillStyle(0xffcc00, 0.06);
        for (let s = 0; s < 4; s++) {
          const sx2 = left + 30 + s * 60;
          const sy2 = top + innerH - 25;
          g.fillTriangle(sx2, sy2 - 8, sx2 - 6, sy2 + 4, sx2 + 6, sy2 + 4);
          g.fillTriangle(sx2, sy2 + 6, sx2 - 6, sy2 - 3, sx2 + 6, sy2 - 3);
        }
        // Toy shelves with colored edges
        const shelfColors = [rgb(200, 80, 80), rgb(80, 160, 80), rgb(80, 80, 200)];
        for (let s = 0; s < 3; s++) {
          const sy = top + 5 + s * 30;
          g.fillStyle(rgb(230, 220, 210), 1);
          g.fillRect(left + 10, sy, innerW - 20, 24);
          g.fillStyle(shelfColors[s], 0.6);
          g.fillRect(left + 10, sy + 24, innerW - 20, 3);
        }
        // Toys with more variety and detail
        const toyColors = [0xff4444, 0x44bbff, 0xffcc00, 0x44dd44, 0xff88cc, 0xaa66ff];
        for (let i = 0; i < 12; i++) {
          const tx = left + 18 + (i % 6) * 40;
          const ty = top + 9 + Math.floor(i / 6) * 30;
          g.fillStyle(toyColors[i % 6], 1);
          if (i % 4 === 0) {
            g.fillRect(tx, ty, 14, 14);
            g.fillStyle(0xffffff, 0.3);
            g.fillRect(tx + 2, ty + 2, 4, 4);
          } else if (i % 4 === 1) {
            g.fillCircle(tx + 7, ty + 7, 7);
            g.fillStyle(0xffffff, 0.3);
            g.fillCircle(tx + 5, ty + 5, 3);
          } else if (i % 4 === 2) {
            g.fillTriangle(tx, ty + 14, tx + 7, ty, tx + 14, ty + 14);
          } else {
            // Teddy bear shape
            g.fillCircle(tx + 7, ty + 9, 6);
            g.fillCircle(tx + 7, ty + 4, 4);
            g.fillCircle(tx + 3, ty + 1, 2);
            g.fillCircle(tx + 11, ty + 1, 2);
          }
        }
        // Train set with track (bigger, more detail)
        // Oval track
        g.lineStyle(3, rgb(120, 100, 80), 0.6);
        g.strokeRect(left + 20, top + 98, 110, 40);
        // Track ties
        g.fillStyle(rgb(100, 80, 50), 0.4);
        for (let t = 0; t < 10; t++) {
          g.fillRect(left + 25 + t * 11, top + 96, 3, 4);
          g.fillRect(left + 25 + t * 11, top + 136, 3, 4);
        }
        // Train engine
        g.fillStyle(0xff3333, 1);
        g.fillRect(left + 25, top + 100, 24, 14);
        g.fillStyle(rgb(40, 40, 50), 1);
        g.fillRect(left + 25, top + 98, 24, 4);
        // Smokestack
        g.fillStyle(rgb(40, 40, 50), 1);
        g.fillRect(left + 30, top + 92, 6, 8);
        // Smoke puffs
        g.fillStyle(rgb(200, 200, 200), 0.3);
        g.fillCircle(left + 33, top + 89, 4);
        g.fillCircle(left + 28, top + 86, 3);
        // Train cars
        g.fillStyle(0x4488cc, 1);
        g.fillRect(left + 55, top + 101, 20, 12);
        g.fillStyle(0x44cc44, 1);
        g.fillRect(left + 80, top + 101, 20, 12);
        // Wheels
        g.fillStyle(0x333333, 1);
        g.fillCircle(left + 31, top + 114, 3);
        g.fillCircle(left + 43, top + 114, 3);
        g.fillCircle(left + 61, top + 114, 3);
        g.fillCircle(left + 71, top + 114, 3);
        g.fillCircle(left + 86, top + 114, 3);
        g.fillCircle(left + 96, top + 114, 3);
        // Stuffed animal display
        g.fillStyle(rgb(200, 160, 100), 1);
        g.fillCircle(left + innerW - 35, top + 105, 14);
        g.fillCircle(left + innerW - 35, top + 95, 10);
        g.fillCircle(left + innerW - 41, top + 88, 5);
        g.fillCircle(left + innerW - 29, top + 88, 5);
        g.fillStyle(0x222222, 1);
        g.fillCircle(left + innerW - 37, top + 93, 2);
        g.fillCircle(left + innerW - 33, top + 93, 2);
        // Price tag
        g.fillStyle(0xffffff, 1);
        g.fillRect(left + innerW - 42, top + 115, 14, 8);
        this._addText('$5', left + innerW - 35, top + 119, '#cc3333');
        // Balloon
        g.fillStyle(0xff4444, 0.7);
        g.fillCircle(left + innerW - 15, top + 15, 10);
        g.fillStyle(0xff4444, 0.5);
        g.fillCircle(left + innerW - 13, top + 12, 4);
        g.lineStyle(1, rgb(100, 100, 100), 0.4);
        g.lineBetween(left + innerW - 15, top + 25, left + innerW - 15, top + 50);
        // Register at counter
        g.fillStyle(rgb(180, 160, 140), 1);
        g.fillRect(left + innerW - 55, top + 70, 45, 16);
        g.fillStyle(rgb(70, 70, 80), 1);
        g.fillRect(left + innerW - 48, top + 64, 22, 12);
        this._addText('Welcome to Toy World!', cx, top + 145, '#4488cc');
        break;
      }
      case 'Bookstore': {
        // Warm wood floor
        g.fillStyle(rgb(160, 120, 70), 0.1);
        for (let fx = 0; fx < innerW; fx += 32) {
          g.fillRect(left + fx, top, 2, innerH);
        }
        // Bookshelves along top wall (enhanced with varying book heights)
        const bookColors = [0xcc3333, 0x3366cc, 0x33aa55, 0xccaa33, 0x8833cc, 0xcc6633, 0x336699, 0xaa3366, 0x996644, 0x449966];
        for (let shelf = 0; shelf < 3; shelf++) {
          const sy = top + 5 + shelf * 28;
          g.fillStyle(rgb(120, 85, 55), 1);
          g.fillRect(left + 5, sy, innerW - 10, 24);
          // Books with varying heights and widths
          let bx = left + 8;
          for (let b = 0; b < 14; b++) {
            const bw = 10 + (b * 3) % 8;
            const bh = 14 + (b * 5) % 10;
            g.fillStyle(bookColors[b % bookColors.length], 1);
            g.fillRect(bx, sy + 24 - bh - 2, bw, bh);
            // Spine detail
            g.fillStyle(0xffffff, 0.15);
            g.fillRect(bx + 1, sy + 24 - bh, bw - 2, 2);
            bx += bw + 2;
            if (bx > left + innerW - 18) break;
          }
          g.fillStyle(rgb(100, 70, 40), 1);
          g.fillRect(left + 5, sy + 24, innerW - 10, 3);
        }
        // Reading nook (comfy armchair with cushion)
        g.fillStyle(rgb(140, 80, 45), 1);
        g.fillRect(left + 14, top + 98, 48, 34);
        g.fillStyle(rgb(160, 100, 60), 1);
        g.fillRect(left + 18, top + 100, 40, 28);
        g.fillStyle(rgb(180, 120, 80), 1);
        g.fillRect(left + 16, top + 93, 44, 10);
        // Armrests
        g.fillStyle(rgb(140, 80, 45), 1);
        g.fillRect(left + 14, top + 98, 6, 28);
        g.fillRect(left + 56, top + 98, 6, 28);
        // Cushion
        g.fillStyle(rgb(180, 140, 90), 0.5);
        g.fillRect(left + 22, top + 104, 32, 18);
        // Open book on chair
        g.fillStyle(0xffffff, 0.8);
        g.fillRect(left + 30, top + 108, 12, 8);
        g.fillRect(left + 42, top + 108, 12, 8);
        // Floor lamp (enhanced)
        g.fillStyle(rgb(60, 60, 60), 1);
        g.fillRect(left + 72, top + 92, 3, 38);
        g.fillStyle(rgb(50, 50, 50), 1);
        g.fillRect(left + 66, top + 128, 15, 4);
        g.fillStyle(0xffee88, 0.5);
        g.fillCircle(left + 73, top + 88, 12);
        g.fillStyle(rgb(180, 140, 80), 1);
        g.fillTriangle(left + 61, top + 90, left + 73, top + 78, left + 85, top + 90);
        // Light glow on floor
        g.fillStyle(0xffee88, 0.06);
        g.fillCircle(left + 73, top + 115, 25);
        // Coffee corner
        g.fillStyle(rgb(140, 100, 60), 1);
        g.fillRect(left + innerW - 55, top + 95, 40, 20);
        // Coffee maker
        g.fillStyle(rgb(40, 40, 50), 1);
        g.fillRect(left + innerW - 50, top + 85, 18, 16);
        g.fillStyle(rgb(80, 40, 20), 0.4);
        g.fillRect(left + innerW - 48, top + 88, 14, 6);
        // Coffee cup
        g.fillStyle(0xffffff, 1);
        g.fillRect(left + innerW - 28, top + 90, 8, 10);
        g.fillStyle(rgb(80, 40, 20), 0.6);
        g.fillRect(left + innerW - 27, top + 91, 6, 4);
        // Stack of books on coffee table
        g.fillStyle(0x3366cc, 1);
        g.fillRect(left + innerW - 48, top + 98, 16, 3);
        g.fillStyle(0xcc3333, 1);
        g.fillRect(left + innerW - 46, top + 95, 14, 3);
        // Cat sleeping on shelf
        g.fillStyle(rgb(60, 60, 60), 1);
        g.fillEllipse(left + innerW - 30, top + 18, 16, 8);
        g.fillCircle(left + innerW - 22, top + 15, 5);
        // Ears
        g.fillTriangle(left + innerW - 25, top + 11, left + innerW - 23, top + 8, left + innerW - 21, top + 11);
        g.fillTriangle(left + innerW - 20, top + 11, left + innerW - 18, top + 8, left + innerW - 16, top + 11);
        // Staff picks sign
        g.fillStyle(rgb(40, 50, 40), 1);
        g.fillRect(left + 100, top + 95, 55, 24);
        g.lineStyle(1, rgb(160, 120, 60), 0.8);
        g.strokeRect(left + 100, top + 95, 55, 24);
        this._addText('Staff', left + 127, top + 102, '#ffffff');
        this._addText('Picks!', left + 127, top + 113, '#ffcc88');
        this._addText('Lost in a good book...', cx, top + 145, '#664422');
        break;
      }
      case 'Movie Theater': {
        // Dark carpet floor
        g.fillStyle(rgb(40, 20, 20), 0.2);
        g.fillRect(left, top, innerW, innerH);
        // Carpet pattern
        g.fillStyle(rgb(120, 40, 40), 0.08);
        for (let fx = 0; fx < innerW; fx += 12) {
          for (let fy = 0; fy < innerH; fy += 12) {
            if ((fx + fy) % 24 === 0) g.fillRect(left + fx, top + fy, 8, 8);
          }
        }
        // Screen with movie playing (scene)
        g.fillStyle(rgb(30, 30, 40), 1);
        g.fillRect(left + 15, top + 3, innerW - 30, 55);
        // Screen border
        g.lineStyle(2, rgb(60, 60, 70), 1);
        g.strokeRect(left + 15, top + 3, innerW - 30, 55);
        // Movie scene - sunset landscape
        g.fillStyle(rgb(200, 120, 60), 0.5);
        g.fillRect(left + 19, top + 7, innerW - 38, 20);
        g.fillStyle(rgb(40, 80, 120), 0.5);
        g.fillRect(left + 19, top + 27, innerW - 38, 25);
        // Sun in movie
        g.fillStyle(rgb(255, 200, 60), 0.6);
        g.fillCircle(cx, top + 20, 8);
        // Mountains
        g.fillStyle(rgb(60, 60, 80), 0.5);
        g.fillTriangle(left + 40, top + 30, left + 70, top + 15, left + 100, top + 30);
        g.fillTriangle(left + 120, top + 30, left + 160, top + 12, left + 200, top + 30);
        // Projector beam (more visible)
        g.fillStyle(0xffffff, 0.04);
        g.fillTriangle(cx, top + 130, left + 25, top + 7, left + innerW - 25, top + 7);
        // Dust particles in beam
        g.fillStyle(0xffffff, 0.15);
        g.fillCircle(cx - 20, top + 50, 1);
        g.fillCircle(cx + 15, top + 70, 1);
        g.fillCircle(cx - 5, top + 90, 1);
        g.fillCircle(cx + 25, top + 40, 1);
        // Seats (rows with arm rests and numbering)
        for (let row = 0; row < 3; row++) {
          for (let seat = 0; seat < 6; seat++) {
            // Seat cushion
            g.fillStyle(rgb(180, 40, 40), 1);
            g.fillRect(left + 18 + seat * 40, top + 72 + row * 28, 30, 20);
            // Seat back
            g.fillStyle(rgb(160, 30, 30), 1);
            g.fillRect(left + 18 + seat * 40, top + 70 + row * 28, 30, 4);
            // Armrests
            g.fillStyle(rgb(60, 60, 70), 1);
            g.fillRect(left + 17 + seat * 40, top + 72 + row * 28, 3, 18);
            g.fillRect(left + 47 + seat * 40, top + 72 + row * 28, 3, 18);
            // Cup holder
            g.fillStyle(rgb(40, 40, 50), 1);
            g.fillCircle(left + 48 + seat * 40, top + 85 + row * 28, 3);
          }
        }
        // Aisle lights
        g.fillStyle(rgb(255, 200, 100), 0.2);
        for (let l = 0; l < 3; l++) {
          g.fillCircle(left + 8, top + 80 + l * 28, 2);
          g.fillCircle(left + innerW - 8, top + 80 + l * 28, 2);
        }
        // Popcorn stand (enhanced)
        g.fillStyle(rgb(255, 220, 100), 1);
        g.fillRect(left + innerW - 45, top + 68, 28, 35);
        g.fillStyle(rgb(220, 50, 50), 1);
        g.fillRect(left + innerW - 45, top + 65, 28, 5);
        // Popcorn overflowing
        g.fillStyle(0xffffff, 1);
        for (let p = 0; p < 5; p++) {
          g.fillCircle(left + innerW - 40 + p * 5, top + 66, 4);
        }
        // Popcorn bucket stripe
        g.fillStyle(rgb(220, 50, 50), 0.5);
        g.fillRect(left + innerW - 45, top + 78, 28, 3);
        g.fillRect(left + innerW - 45, top + 88, 28, 3);
        // Drink next to popcorn
        g.fillStyle(rgb(200, 40, 40), 1);
        g.fillRect(left + innerW - 55, top + 80, 10, 18);
        g.fillStyle(0xffffff, 1);
        g.fillRect(left + innerW - 53, top + 76, 2, 10);
        // Exit signs on walls
        g.fillStyle(rgb(200, 40, 40), 0.6);
        g.fillRect(left + 3, top + 3, 24, 10);
        this._addText('EXIT', left + 15, top + 8, '#ffffff');
        g.fillStyle(rgb(200, 40, 40), 0.6);
        g.fillRect(left + innerW - 27, top + 3, 24, 10);
        this._addText('EXIT', left + innerW - 15, top + 8, '#ffffff');
        this._addText('Now Showing!', cx, top + 162, '#cc2222');
        break;
      }
      case 'Arcade': {
        // Dark floor with neon reflection
        g.fillStyle(rgb(20, 10, 30), 0.3);
        g.fillRect(left, top, innerW, innerH);
        // Neon strip on ceiling
        g.fillStyle(0xff00ff, 0.1);
        g.fillRect(left + 5, top, innerW - 10, 3);
        g.fillStyle(0x00ffff, 0.1);
        g.fillRect(left + 5, top + 3, innerW - 10, 2);
        // Arcade cabinets with unique screens
        const cabinetColors = [0x2244aa, 0xaa2244, 0x22aa44, 0xaa8822];
        const screenContents = [0x00ff00, 0xff00ff, 0x00ffff, 0xffff00];
        for (let i = 0; i < 4; i++) {
          const cabX = left + 8 + i * 67;
          // Cabinet body
          g.fillStyle(cabinetColors[i], 1);
          g.fillRect(cabX, top + 8, 52, 74);
          g.fillStyle(rgb(20, 20, 30), 1);
          g.fillRect(cabX + 2, top + 6, 48, 4);
          // Marquee with glow
          g.fillStyle(screenContents[i], 0.3);
          g.fillRect(cabX + 4, top + 8, 44, 6);
          // Screen with game
          g.fillStyle(rgb(10, 10, 15), 1);
          g.fillRect(cabX + 5, top + 16, 42, 32);
          // Game graphics on screen
          g.fillStyle(screenContents[i], 0.4);
          if (i === 0) {
            // Space invaders
            for (let a = 0; a < 4; a++) {
              g.fillRect(cabX + 10 + a * 10, top + 22, 6, 4);
              g.fillRect(cabX + 10 + a * 10, top + 28, 6, 4);
            }
            g.fillStyle(0x00ff00, 0.8);
            g.fillRect(cabX + 22, top + 40, 8, 4);
          } else if (i === 1) {
            // Pac-man
            g.fillStyle(0xffff00, 0.7);
            g.fillCircle(cabX + 26, top + 32, 6);
            g.fillStyle(rgb(10, 10, 15), 1);
            g.fillTriangle(cabX + 26, top + 32, cabX + 34, top + 28, cabX + 34, top + 36);
            g.fillStyle(0xff00ff, 0.5);
            g.fillCircle(cabX + 38, top + 32, 4);
          } else if (i === 2) {
            // Tetris
            g.fillStyle(0x00ffff, 0.5);
            g.fillRect(cabX + 20, top + 36, 8, 8);
            g.fillRect(cabX + 28, top + 36, 8, 8);
            g.fillStyle(0xff8800, 0.5);
            g.fillRect(cabX + 12, top + 28, 8, 8);
            g.fillRect(cabX + 12, top + 36, 8, 8);
            g.fillStyle(0xff00ff, 0.5);
            g.fillRect(cabX + 28, top + 28, 16, 8);
          } else {
            // Racing
            g.fillStyle(0xaaaaaa, 0.5);
            g.fillRect(cabX + 18, top + 20, 16, 28);
            g.fillStyle(0xff3333, 0.7);
            g.fillRect(cabX + 22, top + 38, 8, 6);
          }
          // Control panel
          g.fillStyle(rgb(40, 40, 50), 1);
          g.fillRect(cabX + 4, top + 50, 44, 20);
          // Joystick
          g.fillStyle(0x222222, 1);
          g.fillCircle(cabX + 16, top + 58, 5);
          g.fillStyle(0x333333, 1);
          g.fillRect(cabX + 14, top + 52, 4, 8);
          // Buttons
          g.fillStyle(0xff3333, 1);
          g.fillCircle(cabX + 30, top + 55, 3);
          g.fillStyle(0x3333ff, 1);
          g.fillCircle(cabX + 38, top + 58, 3);
          g.fillStyle(0xffff00, 1);
          g.fillCircle(cabX + 42, top + 53, 2.5);
          // Coin slot
          g.fillStyle(rgb(80, 80, 90), 1);
          g.fillRect(cabX + 18, top + 72, 16, 3);
          g.fillStyle(rgb(60, 60, 70), 1);
          g.fillRect(cabX + 22, top + 72, 8, 6);
        }
        // Claw machine with stuffed animals
        g.fillStyle(rgb(220, 200, 100), 1);
        g.fillRect(left + 25, top + 98, 55, 55);
        g.fillStyle(rgb(200, 230, 255), 0.5);
        g.fillRect(left + 29, top + 102, 47, 32);
        // Stuffed animals inside
        g.fillStyle(0xff88aa, 0.8);
        g.fillCircle(left + 40, top + 128, 5);
        g.fillStyle(0x88ccff, 0.8);
        g.fillCircle(left + 52, top + 130, 5);
        g.fillStyle(0xffcc44, 0.8);
        g.fillCircle(left + 64, top + 127, 5);
        // Claw
        g.fillStyle(rgb(180, 180, 190), 1);
        g.fillRect(left + 50, top + 100, 4, 16);
        g.lineBetween(left + 48, top + 116, left + 44, top + 122);
        g.lineBetween(left + 56, top + 116, left + 60, top + 122);
        // Prize counter
        g.fillStyle(rgb(80, 60, 100), 1);
        g.fillRect(left + 100, top + 110, 60, 18);
        // Prizes on display
        g.fillStyle(0xffcc00, 0.8);
        g.fillCircle(left + 115, top + 106, 5);
        g.fillStyle(0x44ff44, 0.8);
        g.fillCircle(left + 135, top + 107, 4);
        g.fillStyle(0xff4444, 0.8);
        g.fillRect(left + 148, top + 104, 8, 8);
        // Ticket counter
        this._addText('TICKETS', left + 130, top + 119, '#ffcc00');
        // Neon wall signs
        this._addText('GAME OVER?', cx, top + 92, '#00ff00');
        this._addText('INSERT COIN', cx, top + 168, '#ff8800');
        // Score display
        g.fillStyle(rgb(20, 20, 30), 1);
        g.fillRect(left + innerW - 55, top + 95, 45, 14);
        this._addText('HI: 99999', left + innerW - 33, top + 102, '#ff4444');
        break;
      }
      case 'Pizza Place': {
        // Terracotta tile floor
        g.fillStyle(rgb(180, 100, 50), 0.08);
        for (let fx = 0; fx < innerW; fx += 20) {
          for (let fy = 0; fy < innerH; fy += 20) {
            g.fillRect(left + fx, top + fy, 18, 18);
          }
        }
        // Brick pizza oven (enhanced)
        g.fillStyle(rgb(160, 70, 30), 1);
        g.fillRect(left + innerW - 75, top + 3, 65, 50);
        // Brick pattern
        g.fillStyle(rgb(180, 80, 30), 1);
        for (let by = 0; by < 4; by++) {
          for (let bx2 = 0; bx2 < 5; bx2++) {
            const off = by % 2 === 0 ? 0 : 6;
            g.fillRect(left + innerW - 73 + bx2 * 13 + off, top + 5 + by * 12, 11, 10);
          }
        }
        // Oven opening with fire
        g.fillStyle(rgb(40, 20, 10), 1);
        g.fillEllipse(left + innerW - 43, top + 30, 36, 22);
        g.fillStyle(rgb(255, 120, 30), 0.5);
        g.fillEllipse(left + innerW - 43, top + 34, 28, 14);
        g.fillStyle(rgb(255, 180, 50), 0.3);
        g.fillEllipse(left + innerW - 43, top + 36, 18, 8);
        // Pizza in oven
        g.fillStyle(rgb(230, 190, 80), 0.7);
        g.fillCircle(left + innerW - 43, top + 30, 8);
        // Counter with pizza display
        g.fillStyle(rgb(200, 180, 140), 1);
        g.fillRect(left + 10, top + 8, innerW - 95, 24);
        g.fillStyle(rgb(180, 160, 120), 1);
        g.fillRect(left + 10, top + 32, innerW - 95, 3);
        // Pizzas on counter (detailed)
        // Pepperoni pizza
        g.fillStyle(rgb(230, 190, 80), 1);
        g.fillCircle(left + 35, top + 20, 12);
        g.fillStyle(rgb(220, 60, 30), 0.6);
        g.fillCircle(left + 35, top + 20, 10);
        g.fillStyle(rgb(180, 40, 30), 1);
        for (let p = 0; p < 5; p++) {
          const a = p * Math.PI * 2 / 5;
          g.fillCircle(left + 35 + Math.cos(a) * 6, top + 20 + Math.sin(a) * 6, 2.5);
        }
        // Margherita pizza
        g.fillStyle(rgb(230, 190, 80), 1);
        g.fillCircle(left + 75, top + 20, 12);
        g.fillStyle(rgb(200, 60, 30), 0.5);
        g.fillCircle(left + 75, top + 20, 10);
        g.fillStyle(0xffffff, 0.6);
        g.fillCircle(left + 72, top + 17, 3);
        g.fillCircle(left + 78, top + 22, 3);
        g.fillStyle(0x44aa33, 0.7);
        g.fillRect(left + 73, top + 19, 4, 3);
        // Pizza sliced lines
        g.lineStyle(1, rgb(160, 120, 50), 0.3);
        g.lineBetween(left + 35 - 10, top + 20, left + 35 + 10, top + 20);
        g.lineBetween(left + 35, top + 10, left + 35, top + 30);
        // Menu board on wall
        g.fillStyle(rgb(40, 50, 40), 1);
        g.fillRect(left + 5, top + 3, 55, 30);
        g.lineStyle(1, rgb(140, 100, 50), 1);
        g.strokeRect(left + 5, top + 3, 55, 30);
        this._addText('MENU', left + 32, top + 10, '#ffffff');
        this._addText('Marg $8', left + 32, top + 20, '#ffcc88');
        this._addText('Pepp $9', left + 32, top + 28, '#ffcc88');
        // Tables with chairs (enhanced)
        for (let t = 0; t < 2; t++) {
          const tx2 = left + 20 + t * 120;
          // Table
          g.fillStyle(rgb(160, 120, 80), 1);
          g.fillRect(tx2, top + 70, 55, 30);
          // Leg
          g.fillStyle(rgb(120, 90, 50), 1);
          g.fillRect(tx2 + 22, top + 100, 12, 16);
          // Checkered tablecloth
          g.fillStyle(0xff4444, 0.15);
          for (let cx2 = 0; cx2 < 55; cx2 += 10) {
            for (let cy2 = 0; cy2 < 30; cy2 += 10) {
              if ((cx2 + cy2) % 20 === 0) g.fillRect(tx2 + cx2, top + 70 + cy2, 10, 10);
            }
          }
          // Chairs
          g.fillStyle(rgb(100, 70, 40), 1);
          g.fillRect(tx2 - 8, top + 78, 8, 14);
          g.fillRect(tx2 + 55, top + 78, 8, 14);
          // Place settings
          g.fillStyle(0xffffff, 0.5);
          g.fillCircle(tx2 + 15, top + 80, 6);
          g.fillCircle(tx2 + 40, top + 80, 6);
          // Napkin
          g.fillStyle(0xffffff, 0.7);
          g.fillTriangle(tx2 + 15, top + 88, tx2 + 11, top + 95, tx2 + 19, top + 95);
        }
        // Wine bottle on shelf
        g.fillStyle(rgb(60, 40, 30), 1);
        g.fillRect(left + innerW - 12, top + 20, 8, 24);
        g.fillRect(left + innerW - 10, top + 16, 4, 6);
        // Italian flag
        g.fillStyle(0x44aa44, 1);
        g.fillRect(left + 110, top + 3, 8, 16);
        g.fillStyle(0xffffff, 1);
        g.fillRect(left + 118, top + 3, 8, 16);
        g.fillStyle(0xff4444, 1);
        g.fillRect(left + 126, top + 3, 8, 16);
        this._addText('Mama mia!', cx, top + 140, '#cc3322');
        break;
      }
      case 'Gym': {
        // Rubber mat floor
        g.fillStyle(rgb(50, 50, 60), 0.15);
        for (let fx = 0; fx < innerW; fx += 16) {
          for (let fy = 0; fy < innerH; fy += 16) {
            if ((fx + fy) % 32 === 0) g.fillRect(left + fx, top + fy, 15, 15);
          }
        }
        // Weight rack (enhanced with labeled weights)
        g.fillStyle(rgb(50, 50, 60), 1);
        g.fillRect(left + 8, top + 3, 65, 55);
        g.fillStyle(rgb(40, 40, 50), 1);
        g.fillRect(left + 8, top + 3, 65, 3);
        // Dumbbells with weight labels
        const weights = ['10', '20', '35'];
        for (let w = 0; w < 3; w++) {
          // Bar
          g.fillStyle(rgb(120, 120, 130), 1);
          g.fillRect(left + 18, top + 12 + w * 16, 46, 3);
          // Weight plates
          g.fillStyle(rgb(40, 40, 50), 1);
          g.fillRect(left + 14, top + 9 + w * 16, 8, 9);
          g.fillRect(left + 60, top + 9 + w * 16, 8, 9);
          // Second plates (bigger weights)
          if (w > 0) {
            g.fillStyle(rgb(50, 50, 60), 1);
            g.fillRect(left + 12, top + 10 + w * 16, 4, 7);
            g.fillRect(left + 66, top + 10 + w * 16, 4, 7);
          }
          this._addText(weights[w], left + 42, top + 14 + w * 16, '#888888');
        }
        // Treadmill (enhanced with display)
        g.fillStyle(rgb(40, 40, 50), 1);
        g.fillRect(left + 88, top + 8, 55, 48);
        // Display panel
        g.fillStyle(rgb(30, 30, 40), 1);
        g.fillRect(left + 93, top + 10, 44, 14);
        g.fillStyle(0x00ff00, 0.5);
        g.fillRect(left + 95, top + 12, 40, 10);
        this._addText('3.2mi', left + 115, top + 17, '#00ff00');
        // Belt
        g.fillStyle(rgb(70, 70, 80), 1);
        g.fillRect(left + 90, top + 30, 50, 22);
        // Belt texture
        g.fillStyle(rgb(60, 60, 70), 1);
        for (let b = 0; b < 5; b++) {
          g.fillRect(left + 93 + b * 10, top + 32, 6, 18);
        }
        // Handles
        g.fillStyle(rgb(100, 100, 110), 1);
        g.fillRect(left + 88, top + 8, 3, 30);
        g.fillRect(left + 140, top + 8, 3, 30);
        // Bench press (enhanced)
        g.fillStyle(rgb(50, 50, 60), 1);
        g.fillRect(left + 158, top + 22, 65, 10);
        // Upright posts
        g.fillStyle(rgb(60, 60, 70), 1);
        g.fillRect(left + 162, top + 8, 6, 30);
        g.fillRect(left + 212, top + 8, 6, 30);
        // Barbell on rack
        g.fillStyle(rgb(140, 140, 150), 1);
        g.fillRect(left + 160, top + 14, 62, 3);
        g.fillStyle(rgb(40, 40, 50), 1);
        g.fillRect(left + 156, top + 11, 8, 9);
        g.fillRect(left + 218, top + 11, 8, 9);
        // Bench pad
        g.fillStyle(rgb(30, 30, 35), 1);
        g.fillRect(left + 175, top + 24, 30, 6);
        // Mirror (full wall, enhanced)
        g.fillStyle(rgb(200, 220, 240), 0.4);
        g.fillRect(left + innerW - 55, top + 3, 48, 65);
        g.lineStyle(1, rgb(180, 190, 200), 0.8);
        g.strokeRect(left + innerW - 55, top + 3, 48, 65);
        // Mirror reflection (faint player silhouette)
        g.fillStyle(rgb(150, 170, 200), 0.15);
        g.fillRect(left + innerW - 35, top + 30, 10, 20);
        g.fillCircle(left + innerW - 30, top + 26, 5);
        // Exercise ball
        g.fillStyle(rgb(80, 140, 200), 0.8);
        g.fillCircle(left + 30, top + 85, 12);
        g.fillStyle(0xffffff, 0.15);
        g.fillCircle(left + 27, top + 81, 5);
        // Yoga mat rolled up
        g.fillStyle(rgb(160, 80, 160), 0.7);
        g.fillEllipse(left + 70, top + 90, 8, 20);
        g.fillStyle(rgb(140, 60, 140), 0.8);
        g.fillCircle(left + 70, top + 80, 4);
        g.fillCircle(left + 70, top + 100, 4);
        // Water cooler
        g.fillStyle(rgb(180, 200, 220), 0.8);
        g.fillRect(left + innerW - 50, top + 78, 18, 30);
        g.fillStyle(rgb(100, 160, 220), 0.4);
        g.fillRect(left + innerW - 48, top + 72, 14, 10);
        // Cup
        g.fillStyle(0xffffff, 0.6);
        g.fillRect(left + innerW - 42, top + 94, 4, 6);
        // Motivational poster
        g.fillStyle(rgb(40, 40, 50), 1);
        g.fillRect(left + 90, top + 70, 50, 22);
        g.lineStyle(1, rgb(80, 80, 90), 1);
        g.strokeRect(left + 90, top + 70, 50, 22);
        this._addText('PUSH', left + 115, top + 76, '#ff4444');
        this._addText('HARDER', left + 115, top + 86, '#ff4444');
        // Towel rack
        g.fillStyle(rgb(100, 100, 110), 1);
        g.fillRect(left + 5, top + 70, 25, 3);
        g.fillStyle(0xffffff, 0.6);
        g.fillRect(left + 8, top + 73, 12, 14);
        g.fillStyle(rgb(100, 160, 220), 0.6);
        g.fillRect(left + 20, top + 73, 8, 14);
        this._addText('No pain no gain!', cx, top + 115, '#555555');
        break;
      }
      case 'Hospital': {
        // Clean white floor with subtle grid
        g.fillStyle(rgb(220, 225, 230), 0.15);
        g.fillRect(left, top, innerW, innerH);
        g.lineStyle(1, rgb(200, 210, 220), 0.1);
        for (let fx = 0; fx < innerW; fx += 24) {
          g.lineBetween(left + fx, top, left + fx, top + innerH);
        }
        for (let fy = 0; fy < innerH; fy += 24) {
          g.lineBetween(left, top + fy, left + innerW, top + fy);
        }
        // Reception desk (enhanced)
        g.fillStyle(rgb(220, 220, 230), 1);
        g.fillRect(left + 10, top + 5, innerW - 20, 24);
        g.fillStyle(rgb(200, 200, 210), 1);
        g.fillRect(left + 10, top + 29, innerW - 20, 3);
        // Desk front panel
        g.fillStyle(rgb(180, 190, 210), 1);
        g.fillRect(left + 12, top + 7, innerW - 24, 3);
        // Computer on desk
        g.fillStyle(rgb(50, 50, 60), 1);
        g.fillRect(left + 20, top + 3, 28, 18);
        g.fillStyle(rgb(80, 140, 200), 0.4);
        g.fillRect(left + 22, top + 5, 24, 12);
        g.fillStyle(rgb(60, 60, 70), 1);
        g.fillRect(left + 30, top + 21, 12, 3);
        g.fillRect(left + 26, top + 24, 20, 2);
        // Red cross on wall
        g.fillStyle(0xdd3333, 1);
        g.fillRect(cx - 3, top + 5, 6, 16);
        g.fillRect(cx - 8, top + 10, 16, 6);
        // White circle behind cross
        g.fillStyle(0xffffff, 0.3);
        g.fillCircle(cx, top + 13, 12);
        g.fillStyle(0xdd3333, 1);
        g.fillRect(cx - 3, top + 5, 6, 16);
        g.fillRect(cx - 8, top + 10, 16, 6);
        // Hospital beds with curtains
        for (let b = 0; b < 2; b++) {
          const bx = left + 15 + b * 135;
          // Curtain rail
          g.fillStyle(rgb(160, 160, 170), 1);
          g.fillRect(bx - 2, top + 40, 88, 2);
          // Curtain (partially drawn)
          g.fillStyle(rgb(180, 210, 200), 0.4);
          g.fillRect(bx + 70, top + 42, 16, 52);
          // Bed frame
          g.fillStyle(rgb(200, 200, 210), 1);
          g.fillRect(bx + 2, top + 48, 72, 4);
          // Mattress
          g.fillStyle(rgb(230, 230, 240), 1);
          g.fillRect(bx + 4, top + 52, 68, 36);
          // Pillow
          g.fillStyle(0xffffff, 1);
          g.fillRect(bx + 6, top + 54, 22, 14);
          g.fillStyle(rgb(240, 240, 250), 1);
          g.fillRect(bx + 8, top + 56, 18, 10);
          // Blanket
          g.fillStyle(rgb(180, 210, 230), 0.5);
          g.fillRect(bx + 4, top + 68, 68, 18);
          // Bed rails
          g.fillStyle(rgb(180, 180, 190), 1);
          g.fillRect(bx, top + 52, 2, 38);
          g.fillRect(bx + 74, top + 52, 2, 38);
          // Heart monitor
          g.fillStyle(rgb(40, 40, 50), 1);
          g.fillRect(bx + 78, top + 45, 22, 18);
          g.fillStyle(rgb(10, 10, 15), 1);
          g.fillRect(bx + 80, top + 47, 18, 12);
          // EKG line
          g.lineStyle(1, 0x00ff00, 0.8);
          g.lineBetween(bx + 82, top + 54, bx + 85, top + 54);
          g.lineBetween(bx + 85, top + 54, bx + 87, top + 50);
          g.lineBetween(bx + 87, top + 50, bx + 89, top + 56);
          g.lineBetween(bx + 89, top + 56, bx + 91, top + 52);
          g.lineBetween(bx + 91, top + 52, bx + 96, top + 54);
          // IV stand
          g.fillStyle(rgb(160, 160, 170), 1);
          g.fillRect(bx + 62, top + 38, 2, 50);
          g.fillRect(bx + 56, top + 36, 14, 3);
          // IV bag
          g.fillStyle(rgb(200, 230, 255), 0.5);
          g.fillRect(bx + 58, top + 38, 8, 12);
          // IV tube
          g.lineStyle(1, rgb(200, 230, 255), 0.4);
          g.lineBetween(bx + 62, top + 50, bx + 50, top + 60);
        }
        // Medicine cabinet
        g.fillStyle(rgb(220, 220, 230), 1);
        g.fillRect(left + innerW - 45, top + 35, 35, 30);
        g.lineStyle(1, rgb(180, 180, 190), 0.8);
        g.strokeRect(left + innerW - 45, top + 35, 35, 30);
        g.lineBetween(left + innerW - 28, top + 35, left + innerW - 28, top + 65);
        // Medicine bottles
        g.fillStyle(rgb(255, 140, 60), 0.7);
        g.fillRect(left + innerW - 42, top + 40, 8, 12);
        g.fillStyle(rgb(100, 160, 220), 0.7);
        g.fillRect(left + innerW - 32, top + 42, 8, 10);
        g.fillStyle(rgb(220, 60, 60), 0.7);
        g.fillRect(left + innerW - 24, top + 38, 8, 14);
        // Hand sanitizer dispenser
        g.fillStyle(rgb(200, 200, 210), 1);
        g.fillRect(left + 5, top + 45, 10, 18);
        g.fillStyle(rgb(100, 180, 100), 0.6);
        g.fillRect(left + 7, top + 48, 6, 10);
        // Wheelchair
        g.fillStyle(rgb(40, 40, 50), 1);
        g.fillCircle(left + innerW - 30, top + 100, 8);
        g.fillCircle(left + innerW - 14, top + 100, 8);
        g.fillStyle(rgb(60, 60, 70), 1);
        g.fillCircle(left + innerW - 30, top + 100, 5);
        g.fillCircle(left + innerW - 14, top + 100, 5);
        g.fillStyle(rgb(80, 80, 100), 1);
        g.fillRect(left + innerW - 30, top + 88, 18, 12);
        this._addText('Get well soon!', cx, top + 120, '#3366cc');
        break;
      }
      case 'Water Park': {
        // Large pool in center
        g.fillStyle(rgb(60, 140, 220), 0.6);
        g.fillRect(left + 20, top + 40, innerW - 40, 80);
        g.lineStyle(2, rgb(40, 100, 180), 0.8);
        g.strokeRect(left + 20, top + 40, innerW - 40, 80);
        // Water ripples
        g.lineStyle(1, rgb(100, 180, 255), 0.3);
        for (let w = 0; w < 5; w++) {
          const wy = top + 55 + w * 14;
          g.lineBetween(left + 30, wy, left + 60, wy - 3);
          g.lineBetween(left + 60, wy - 3, left + 90, wy);
          g.lineBetween(left + 120, wy, left + 150, wy - 3);
          g.lineBetween(left + 150, wy - 3, left + 180, wy);
        }
        // Pool ladder
        g.fillStyle(rgb(180, 180, 190), 1);
        g.fillRect(left + 22, top + 38, 4, 30);
        g.fillRect(left + 34, top + 38, 4, 30);
        g.fillRect(left + 22, top + 46, 16, 3);
        g.fillRect(left + 22, top + 56, 16, 3);
        // Water slide (curved shape)
        g.fillStyle(rgb(220, 60, 60), 1);
        g.fillRect(left + innerW - 60, top + 5, 50, 12);
        g.fillRect(left + innerW - 30, top + 5, 12, 35);
        g.fillStyle(rgb(200, 50, 50), 1);
        g.fillRect(left + innerW - 60, top + 17, 30, 8);
        // Lounge chairs
        for (let i = 0; i < 3; i++) {
          g.fillStyle(rgb(240, 220, 180), 1);
          g.fillRect(left + 25 + i * 70, top + 135, 40, 12);
          g.fillRect(left + 25 + i * 70, top + 130, 12, 8);
        }
        // Lifeguard chair
        g.fillStyle(rgb(200, 160, 100), 1);
        g.fillRect(left + 10, top + 8, 20, 4);
        g.fillRect(left + 14, top + 12, 4, 20);
        g.fillRect(left + 24, top + 12, 4, 20);
        this._addText('Splash zone!', cx, top + 160, '#2288cc');
        break;
      }
      case 'Library': {
        // Tall bookshelves along back wall
        const libColors = [0x8B4513, 0x2F4F4F, 0x8B0000, 0x2E8B57, 0x4B0082, 0xDAA520, 0x191970, 0xB22222];
        for (let shelf = 0; shelf < 2; shelf++) {
          const sy = top + 5 + shelf * 32;
          g.fillStyle(rgb(100, 70, 45), 1);
          g.fillRect(left + 5, sy, innerW - 10, 28);
          for (let b = 0; b < 14; b++) {
            const bh = 12 + (b * 3) % 8;
            g.fillStyle(libColors[b % libColors.length], 1);
            g.fillRect(left + 10 + b * 18, sy + 28 - bh - 2, 12, bh);
          }
          g.fillStyle(rgb(80, 55, 35), 1);
          g.fillRect(left + 5, sy + 28, innerW - 10, 3);
        }
        // Study desks
        for (let d = 0; d < 2; d++) {
          g.fillStyle(rgb(160, 130, 90), 1);
          g.fillRect(left + 20 + d * 130, top + 80, 80, 30);
          g.fillStyle(rgb(140, 110, 70), 1);
          g.fillRect(left + 50 + d * 130, top + 110, 20, 15);
          // Open book on desk
          g.fillStyle(0xffffff, 1);
          g.fillRect(left + 30 + d * 130, top + 84, 28, 18);
          g.fillRect(left + 60 + d * 130, top + 84, 28, 18);
          g.lineStyle(1, 0x333333, 0.3);
          g.lineBetween(left + 58 + d * 130, top + 84, left + 58 + d * 130, top + 102);
        }
        // Globe
        g.fillStyle(rgb(60, 120, 180), 1);
        g.fillCircle(left + innerW - 30, top + 85, 14);
        g.fillStyle(rgb(80, 180, 80), 0.5);
        g.fillRect(left + innerW - 38, top + 78, 8, 6);
        g.fillRect(left + innerW - 26, top + 84, 10, 5);
        // Stand
        g.fillStyle(rgb(80, 60, 40), 1);
        g.fillRect(left + innerW - 32, top + 99, 4, 14);
        g.fillRect(left + innerW - 38, top + 112, 16, 3);
        // Computer station
        g.fillStyle(rgb(60, 60, 70), 1);
        g.fillRect(left + 10, top + 85, 30, 22);
        g.fillStyle(rgb(100, 140, 180), 0.7);
        g.fillRect(left + 13, top + 88, 24, 14);
        g.fillStyle(rgb(80, 80, 90), 1);
        g.fillRect(left + 18, top + 107, 14, 3);
        g.fillRect(left + 22, top + 110, 6, 5);
        this._addText('Knowledge is power!', cx, top + 140, '#2F4F4F');
        break;
      }
      case 'Museum': {
        // Paintings on walls (top)
        const frameColors = [0xDAA520, 0x8B4513, 0xC0C0C0];
        for (let p = 0; p < 3; p++) {
          const px2 = left + 20 + p * 85;
          g.lineStyle(3, frameColors[p], 1);
          g.strokeRect(px2, top + 8, 50, 35);
          // Abstract art inside frames
          g.fillStyle(rgb(200 - p * 40, 150 + p * 30, 180 - p * 20), 0.8);
          g.fillRect(px2 + 4, top + 12, 42, 27);
          g.fillStyle(rgb(100 + p * 50, 80, 120 + p * 30), 0.6);
          g.fillCircle(px2 + 25, top + 25, 8);
          g.fillRect(px2 + 10, top + 18, 12, 15);
        }
        // Display cases
        for (let d = 0; d < 2; d++) {
          g.fillStyle(rgb(220, 210, 200), 1);
          g.fillRect(left + 30 + d * 120, top + 60, 70, 30);
          g.fillStyle(rgb(200, 230, 255), 0.4);
          g.fillRect(left + 34 + d * 120, top + 50, 62, 12);
          // Artifacts inside
          g.fillStyle(rgb(200, 180, 60), 1);
          if (d === 0) {
            // Vase
            g.fillRect(left + 55, top + 64, 14, 20);
            g.fillRect(left + 52, top + 62, 20, 4);
          } else {
            // Crown
            g.fillStyle(0xFFD700, 1);
            g.fillRect(left + 160, top + 70, 24, 10);
            g.fillTriangle(left + 160, top + 70, left + 164, top + 62, left + 168, top + 70);
            g.fillTriangle(left + 168, top + 70, left + 172, top + 62, left + 176, top + 70);
            g.fillTriangle(left + 176, top + 70, left + 180, top + 62, left + 184, top + 70);
          }
        }
        // Statue on pedestal
        g.fillStyle(rgb(180, 180, 190), 1);
        g.fillRect(cx - 12, top + 105, 24, 30);
        g.fillCircle(cx, top + 100, 10);
        g.fillStyle(rgb(160, 160, 170), 1);
        g.fillRect(cx - 16, top + 135, 32, 8);
        // Bench
        g.fillStyle(rgb(120, 80, 50), 1);
        g.fillRect(left + 20, top + 130, 50, 10);
        g.fillRect(left + 25, top + 140, 6, 8);
        g.fillRect(left + 59, top + 140, 6, 8);
        this._addText('Art & History', cx, top + 160, '#8B4513');
        break;
      }
      case 'Theme Park': {
        // Roller coaster track (back wall)
        g.lineStyle(3, rgb(200, 60, 60), 1);
        g.lineBetween(left + 10, top + 40, left + 40, top + 10);
        g.lineBetween(left + 40, top + 10, left + 80, top + 35);
        g.lineBetween(left + 80, top + 35, left + 110, top + 15);
        g.lineBetween(left + 110, top + 15, left + 160, top + 40);
        g.lineBetween(left + 160, top + 40, left + 200, top + 8);
        g.lineBetween(left + 200, top + 8, left + innerW - 10, top + 35);
        // Coaster supports
        g.lineStyle(1, rgb(100, 100, 110), 0.6);
        for (let s = 0; s < 6; s++) {
          const sx2 = left + 20 + s * 42;
          g.lineBetween(sx2, top + 40, sx2, top + 55);
        }
        // Ferris wheel
        g.lineStyle(2, rgb(80, 80, 200), 1);
        const fwX = left + 60;
        const fwY = top + 90;
        g.strokeCircle(fwX, fwY, 30);
        g.lineBetween(fwX, fwY - 30, fwX, fwY + 30);
        g.lineBetween(fwX - 30, fwY, fwX + 30, fwY);
        g.lineBetween(fwX - 21, fwY - 21, fwX + 21, fwY + 21);
        g.lineBetween(fwX - 21, fwY + 21, fwX + 21, fwY - 21);
        // Gondolas
        g.fillStyle(rgb(255, 200, 50), 1);
        g.fillRect(fwX - 6, fwY - 36, 12, 8);
        g.fillRect(fwX - 6, fwY + 28, 12, 8);
        g.fillStyle(rgb(50, 200, 100), 1);
        g.fillRect(fwX - 36, fwY - 4, 12, 8);
        g.fillRect(fwX + 24, fwY - 4, 12, 8);
        // Carousel
        g.fillStyle(rgb(200, 100, 150), 1);
        g.fillRect(left + 140, top + 70, 80, 50);
        g.fillStyle(rgb(220, 120, 170), 1);
        g.fillRect(left + 140, top + 65, 80, 8);
        // Horses
        g.fillStyle(0xffffff, 1);
        g.fillRect(left + 155, top + 85, 10, 20);
        g.fillStyle(rgb(180, 140, 100), 1);
        g.fillRect(left + 185, top + 85, 10, 20);
        g.fillStyle(0xaaaaaa, 1);
        g.fillRect(left + 200, top + 85, 10, 20);
        // Ticket booth
        g.fillStyle(rgb(220, 180, 60), 1);
        g.fillRect(left + 10, top + 130, 40, 24);
        g.fillStyle(rgb(200, 160, 40), 1);
        g.fillRect(left + 10, top + 128, 40, 4);
        this._addText('Rides & Fun!', cx, top + 160, '#cc3388');
        break;
      }
      case 'Stadium': {
        // Playing field (green)
        g.fillStyle(rgb(60, 140, 60), 1);
        g.fillRect(left + 30, top + 30, innerW - 60, 80);
        g.lineStyle(2, 0xffffff, 0.8);
        g.strokeRect(left + 30, top + 30, innerW - 60, 80);
        // Center circle
        g.strokeCircle(cx, top + 70, 18);
        // Center line
        g.lineBetween(cx, top + 30, cx, top + 110);
        // Goals
        g.lineStyle(2, 0xffffff, 0.6);
        g.strokeRect(left + 30, top + 55, 12, 30);
        g.strokeRect(left + innerW - 42, top + 55, 12, 30);
        // Spectator stands (rows of seats)
        for (let row = 0; row < 2; row++) {
          for (let seat = 0; seat < 10; seat++) {
            const seatColor = (seat + row) % 3 === 0 ? rgb(200, 50, 50) :
                              (seat + row) % 3 === 1 ? rgb(50, 50, 200) : rgb(200, 200, 50);
            g.fillStyle(seatColor, 1);
            g.fillRect(left + 15 + seat * 26, top + 5 + row * 12, 20, 8);
          }
        }
        // Bottom stands
        for (let seat = 0; seat < 8; seat++) {
          g.fillStyle(rgb(200, 50, 50), 1);
          g.fillRect(left + 35 + seat * 28, top + 120, 20, 8);
        }
        // Scoreboard
        g.fillStyle(rgb(30, 30, 40), 1);
        g.fillRect(cx - 30, top + 135, 60, 18);
        g.fillStyle(rgb(255, 50, 50), 1);
        this._addText('3 - 2', cx, top + 144, '#ff4444');
        this._addText('GO TEAM!', cx, top + 165, '#cc4444');
        break;
      }
      case 'Airport': {
        // Departure board
        g.fillStyle(rgb(30, 30, 40), 1);
        g.fillRect(left + 20, top + 5, innerW - 40, 40);
        g.fillStyle(rgb(50, 50, 60), 1);
        for (let r = 0; r < 3; r++) {
          g.fillRect(left + 24, top + 10 + r * 12, innerW - 48, 8);
          g.fillStyle(0x00ff00, 0.8);
          g.fillRect(left + 26, top + 11 + r * 12, 40, 6);
          g.fillStyle(0xffcc00, 0.8);
          g.fillRect(left + 80, top + 11 + r * 12, 50, 6);
          g.fillStyle(rgb(50, 50, 60), 1);
        }
        this._addText('DEPARTURES', cx, top + 8, '#00cc00');
        // Check-in counters
        for (let c = 0; c < 3; c++) {
          g.fillStyle(rgb(180, 180, 190), 1);
          g.fillRect(left + 15 + c * 88, top + 55, 70, 18);
          // Monitor
          g.fillStyle(rgb(40, 40, 50), 1);
          g.fillRect(left + 35 + c * 88, top + 48, 30, 10);
          g.fillStyle(rgb(100, 160, 220), 0.6);
          g.fillRect(left + 37 + c * 88, top + 49, 26, 8);
        }
        // Conveyor belt
        g.fillStyle(rgb(80, 80, 90), 1);
        g.fillRect(left + 15, top + 85, innerW - 30, 12);
        g.fillStyle(rgb(60, 60, 70), 1);
        for (let b = 0; b < 8; b++) {
          g.fillRect(left + 20 + b * 30, top + 85, 2, 12);
        }
        // Luggage
        g.fillStyle(rgb(50, 80, 140), 1);
        g.fillRect(left + 40, top + 79, 20, 14);
        g.fillStyle(rgb(180, 60, 60), 1);
        g.fillRect(left + 100, top + 80, 18, 12);
        g.fillStyle(rgb(60, 140, 60), 1);
        g.fillRect(left + 170, top + 79, 22, 14);
        // Seating area
        for (let s = 0; s < 5; s++) {
          g.fillStyle(rgb(100, 100, 120), 1);
          g.fillRect(left + 20 + s * 48, top + 115, 36, 14);
        }
        // Window with plane silhouette
        g.fillStyle(rgb(150, 200, 240), 0.4);
        g.fillRect(left + innerW - 55, top + 110, 45, 30);
        g.fillStyle(0xffffff, 0.5);
        g.fillTriangle(left + innerW - 45, top + 130, left + innerW - 20, top + 122, left + innerW - 20, top + 130);
        g.fillRect(left + innerW - 35, top + 126, 20, 6);
        this._addText('Now Boarding!', cx, top + 155, '#2266aa');
        break;
      }
      case 'Space Station': {
        // Viewport windows showing stars
        g.fillStyle(rgb(10, 10, 30), 1);
        g.fillRect(left + 20, top + 5, innerW - 40, 40);
        g.lineStyle(2, rgb(120, 130, 150), 1);
        g.strokeRect(left + 20, top + 5, innerW - 40, 40);
        // Stars through window
        g.fillStyle(0xffffff, 0.8);
        for (let s = 0; s < 15; s++) {
          const sx = left + 25 + (s * 37) % (innerW - 50);
          const sy = top + 10 + (s * 13) % 30;
          g.fillCircle(sx, sy, 1 + (s % 2));
        }
        // Earth in window
        g.fillStyle(rgb(40, 100, 200), 0.7);
        g.fillCircle(left + innerW / 2, top + 40, 18);
        g.fillStyle(rgb(50, 160, 60), 0.5);
        g.fillRect(left + innerW / 2 - 10, top + 32, 12, 8);
        g.fillRect(left + innerW / 2 + 2, top + 38, 8, 6);
        // Control panels
        g.fillStyle(rgb(60, 65, 75), 1);
        g.fillRect(left + 10, top + 55, innerW - 20, 30);
        // Buttons and lights
        const btnColors = [0xff3333, 0x33ff33, 0x3333ff, 0xffff33, 0xff33ff, 0x33ffff];
        for (let b = 0; b < 12; b++) {
          g.fillStyle(btnColors[b % 6], 0.8);
          g.fillCircle(left + 25 + b * 22, top + 65, 3);
        }
        // Screens
        for (let s = 0; s < 3; s++) {
          g.fillStyle(rgb(20, 30, 40), 1);
          g.fillRect(left + 15 + s * 85, top + 75, 60, 20);
          g.fillStyle(rgb(0, 100, 80), 0.6);
          g.fillRect(left + 17 + s * 85, top + 77, 56, 16);
          // Blinking data
          g.fillStyle(0x00ff00, 0.4);
          for (let d = 0; d < 4; d++) {
            g.fillRect(left + 20 + s * 85 + d * 14, top + 80, 8, 3);
          }
        }
        // Airlock hatch (circular)
        g.lineStyle(2, rgb(150, 150, 160), 1);
        g.strokeCircle(cx, top + 120, 18);
        g.lineStyle(1, rgb(120, 120, 130), 0.6);
        g.lineBetween(cx - 12, top + 108, cx + 12, top + 132);
        g.lineBetween(cx - 12, top + 132, cx + 12, top + 108);
        // Equipment locker
        g.fillStyle(rgb(100, 100, 110), 1);
        g.fillRect(left + 10, top + 105, 30, 40);
        g.fillStyle(rgb(80, 80, 90), 1);
        g.fillRect(left + 24, top + 110, 3, 30);
        this._addText('Mission Control', cx, top + 155, '#33aaff');
        break;
      }
      case 'Underwater Base': {
        // Porthole windows showing ocean
        for (let p = 0; p < 3; p++) {
          const px2 = left + 30 + p * 80;
          g.fillStyle(rgb(20, 60, 120), 0.7);
          g.fillCircle(px2, top + 22, 16);
          g.lineStyle(3, rgb(140, 140, 150), 1);
          g.strokeCircle(px2, top + 22, 16);
          // Fish swimming past
          g.fillStyle(rgb(255, 140, 50), 0.6);
          g.fillEllipse(px2 - 5, top + 20, 8, 4);
          g.fillStyle(rgb(80, 200, 200), 0.6);
          g.fillEllipse(px2 + 6, top + 28, 6, 3);
          // Bubbles
          g.fillStyle(0xffffff, 0.2);
          g.fillCircle(px2 + 3, top + 14, 2);
          g.fillCircle(px2 - 4, top + 10, 1.5);
        }
        // Submarine console
        g.fillStyle(rgb(70, 80, 90), 1);
        g.fillRect(left + 10, top + 50, innerW - 20, 25);
        g.fillStyle(rgb(40, 50, 60), 1);
        g.fillRect(left + 15, top + 52, 60, 18);
        g.fillStyle(rgb(0, 120, 100), 0.6);
        g.fillRect(left + 17, top + 54, 56, 14);
        // Sonar ping
        g.lineStyle(1, 0x00ff88, 0.5);
        g.strokeCircle(left + 45, top + 61, 4);
        g.strokeCircle(left + 45, top + 61, 8);
        // Depth gauge
        g.fillStyle(rgb(40, 40, 50), 1);
        g.fillRect(left + innerW - 50, top + 52, 35, 18);
        g.fillStyle(0x00ffaa, 0.8);
        this._addText('-300m', left + innerW - 33, top + 61, '#00ffaa');
        // Coral and sea plants
        g.fillStyle(rgb(200, 80, 120), 1);
        g.fillRect(left + 20, top + 100, 6, 20);
        g.fillCircle(left + 23, top + 98, 8);
        g.fillStyle(rgb(40, 180, 80), 1);
        g.fillRect(left + 50, top + 105, 3, 25);
        g.fillRect(left + 56, top + 108, 3, 22);
        g.fillRect(left + 62, top + 102, 3, 28);
        // Diving equipment
        g.fillStyle(rgb(200, 200, 60), 1);
        g.fillCircle(left + innerW - 30, top + 110, 10);
        g.fillStyle(rgb(60, 60, 70), 1);
        g.fillRect(left + innerW - 36, top + 120, 12, 20);
        this._addText('Deep sea secrets!', cx, top + 150, '#0088aa');
        break;
      }
      case 'Sky Castle': {
        // Cloud floor patches
        g.fillStyle(0xffffff, 0.3);
        g.fillEllipse(left + 40, top + 150, 60, 16);
        g.fillEllipse(left + 140, top + 145, 80, 18);
        g.fillEllipse(left + innerW - 40, top + 155, 50, 12);
        // Throne
        g.fillStyle(rgb(180, 140, 60), 1);
        g.fillRect(cx - 20, top + 20, 40, 40);
        g.fillRect(cx - 24, top + 10, 48, 14);
        g.fillStyle(rgb(220, 40, 40), 1);
        g.fillRect(cx - 16, top + 24, 32, 32);
        // Crown on throne
        g.fillStyle(0xFFD700, 1);
        g.fillRect(cx - 10, top + 8, 20, 6);
        g.fillTriangle(cx - 10, top + 8, cx - 6, top + 2, cx - 2, top + 8);
        g.fillTriangle(cx - 2, top + 8, cx + 2, top + 2, cx + 6, top + 8);
        g.fillTriangle(cx + 6, top + 8, cx + 10, top + 2, cx + 14, top + 8);
        // Pillars
        for (let p = 0; p < 2; p++) {
          const px2 = p === 0 ? left + 20 : left + innerW - 30;
          g.fillStyle(rgb(200, 200, 210), 1);
          g.fillRect(px2, top + 5, 16, 140);
          g.fillStyle(rgb(220, 220, 230), 1);
          g.fillRect(px2 - 3, top + 3, 22, 8);
          g.fillRect(px2 - 3, top + 140, 22, 8);
        }
        // Stained glass window
        g.fillStyle(rgb(100, 150, 220), 0.5);
        g.fillRect(left + 60, top + 15, 40, 35);
        g.fillStyle(rgb(220, 180, 60), 0.4);
        g.fillRect(left + 65, top + 18, 14, 28);
        g.fillStyle(rgb(180, 60, 60), 0.4);
        g.fillRect(left + 82, top + 18, 14, 28);
        g.lineStyle(1, rgb(160, 160, 170), 0.8);
        g.strokeRect(left + 60, top + 15, 40, 35);
        // Treasure chest
        g.fillStyle(rgb(140, 100, 40), 1);
        g.fillRect(left + innerW - 70, top + 80, 36, 24);
        g.fillStyle(rgb(120, 80, 30), 1);
        g.fillRect(left + innerW - 70, top + 78, 36, 6);
        g.fillStyle(0xFFD700, 1);
        g.fillRect(left + innerW - 56, top + 84, 8, 4);
        this._addText('Above the clouds!', cx, top + 165, '#6688cc');
        break;
      }
      case 'Robot Factory': {
        // Assembly line conveyor
        g.fillStyle(rgb(70, 70, 80), 1);
        g.fillRect(left + 10, top + 60, innerW - 20, 16);
        g.fillStyle(rgb(50, 50, 60), 1);
        for (let b = 0; b < 10; b++) {
          g.fillRect(left + 15 + b * 26, top + 60, 3, 16);
        }
        // Robots on conveyor in various stages
        // Robot 1 - frame only
        g.fillStyle(rgb(180, 180, 190), 1);
        g.fillRect(left + 30, top + 45, 16, 16);
        g.fillRect(left + 34, top + 38, 8, 8);
        // Robot 2 - with arms
        g.fillStyle(rgb(180, 180, 190), 1);
        g.fillRect(left + 90, top + 42, 20, 20);
        g.fillRect(left + 96, top + 34, 8, 10);
        g.fillRect(left + 82, top + 45, 8, 4);
        g.fillRect(left + 110, top + 45, 8, 4);
        g.fillStyle(0x00aaff, 1);
        g.fillRect(left + 98, top + 38, 3, 3);
        g.fillRect(left + 103, top + 38, 3, 3);
        // Robot 3 - complete
        g.fillStyle(rgb(100, 180, 220), 1);
        g.fillRect(left + 160, top + 40, 24, 22);
        g.fillRect(left + 166, top + 30, 12, 12);
        g.fillRect(left + 152, top + 44, 8, 4);
        g.fillRect(left + 184, top + 44, 8, 4);
        g.fillStyle(0xff3333, 1);
        g.fillCircle(left + 170, top + 36, 2);
        g.fillCircle(left + 178, top + 36, 2);
        // Mechanical arms
        g.fillStyle(rgb(200, 160, 40), 1);
        g.fillRect(left + 70, top + 20, 4, 30);
        g.fillRect(left + 68, top + 18, 8, 4);
        g.fillRect(left + 140, top + 20, 4, 30);
        g.fillRect(left + 138, top + 18, 8, 4);
        // Control station
        g.fillStyle(rgb(50, 55, 65), 1);
        g.fillRect(left + 10, top + 90, 80, 30);
        g.fillStyle(rgb(30, 35, 45), 1);
        g.fillRect(left + 15, top + 93, 50, 20);
        g.fillStyle(0x00ff00, 0.5);
        g.fillRect(left + 17, top + 95, 46, 16);
        // Spare parts bin
        g.fillStyle(rgb(100, 100, 110), 1);
        g.fillRect(left + innerW - 60, top + 90, 45, 30);
        // Gears
        g.fillStyle(rgb(160, 160, 170), 1);
        g.fillCircle(left + innerW - 45, top + 100, 6);
        g.fillCircle(left + innerW - 28, top + 105, 8);
        g.fillStyle(rgb(80, 80, 90), 1);
        g.fillCircle(left + innerW - 45, top + 100, 2);
        g.fillCircle(left + innerW - 28, top + 105, 3);
        this._addText('Beep boop!', cx, top + 140, '#4488cc');
        break;
      }
      case 'Volcano Lair': {
        // Lava pool in center
        g.fillStyle(rgb(200, 60, 20), 0.8);
        g.fillEllipse(cx, top + 80, 100, 40);
        g.fillStyle(rgb(255, 140, 30), 0.6);
        g.fillEllipse(cx, top + 78, 70, 26);
        g.fillStyle(rgb(255, 200, 50), 0.4);
        g.fillEllipse(cx, top + 76, 40, 14);
        // Lava bubbles
        g.fillStyle(rgb(255, 180, 40), 0.6);
        g.fillCircle(cx - 20, top + 72, 4);
        g.fillCircle(cx + 15, top + 85, 3);
        g.fillCircle(cx - 35, top + 80, 3);
        // Rock walls
        g.fillStyle(rgb(80, 50, 40), 1);
        g.fillRect(left + 5, top + 5, 30, 50);
        g.fillRect(left + innerW - 35, top + 5, 30, 50);
        g.fillStyle(rgb(100, 60, 45), 1);
        g.fillRect(left + 10, top + 10, 20, 15);
        g.fillRect(left + innerW - 30, top + 15, 20, 20);
        // Evil control console
        g.fillStyle(rgb(40, 40, 50), 1);
        g.fillRect(left + 60, top + 8, 80, 25);
        g.fillStyle(0xff0000, 0.6);
        g.fillCircle(left + 80, top + 20, 4);
        g.fillStyle(0xff8800, 0.6);
        g.fillCircle(left + 95, top + 20, 4);
        g.fillStyle(0xffff00, 0.6);
        g.fillCircle(left + 110, top + 20, 4);
        // Big red button
        g.fillStyle(rgb(220, 30, 30), 1);
        g.fillCircle(left + 100, top + 130, 12);
        g.lineStyle(2, rgb(180, 20, 20), 1);
        g.strokeCircle(left + 100, top + 130, 14);
        this._addText('DO NOT PRESS', left + 100, top + 150, '#ff4444');
        this._addText('Evil genius at work', cx, top + 165, '#ff6633');
        break;
      }
      case 'Crystal Palace': {
        // Crystal formations
        const crystalColors = [rgb(140, 180, 255), rgb(200, 140, 255), rgb(140, 255, 200), rgb(255, 200, 140)];
        for (let c2 = 0; c2 < 6; c2++) {
          const cx2 = left + 20 + c2 * 42;
          const ch = 20 + (c2 * 7) % 20;
          g.fillStyle(crystalColors[c2 % 4], 0.7);
          g.fillTriangle(cx2, top + 50 - ch, cx2 - 8, top + 50, cx2 + 8, top + 50);
          g.fillStyle(crystalColors[c2 % 4], 0.4);
          g.fillTriangle(cx2 + 4, top + 50 - ch + 5, cx2, top + 50, cx2 + 12, top + 50);
        }
        // Crystal throne / pedestal
        g.fillStyle(rgb(180, 200, 255), 0.6);
        g.fillRect(cx - 20, top + 60, 40, 30);
        g.fillStyle(rgb(200, 220, 255), 0.5);
        g.fillTriangle(cx, top + 40, cx - 20, top + 60, cx + 20, top + 60);
        // Prismatic light beams
        g.lineStyle(2, rgb(255, 200, 200), 0.3);
        g.lineBetween(left + 10, top + 5, left + 80, top + 100);
        g.lineStyle(2, rgb(200, 255, 200), 0.3);
        g.lineBetween(cx, top + 5, cx + 30, top + 120);
        g.lineStyle(2, rgb(200, 200, 255), 0.3);
        g.lineBetween(left + innerW - 10, top + 5, left + innerW - 60, top + 110);
        // Reflecting pools
        g.fillStyle(rgb(100, 140, 200), 0.3);
        g.fillEllipse(left + 50, top + 130, 40, 12);
        g.fillEllipse(left + innerW - 50, top + 130, 40, 12);
        // Glowing orb
        g.fillStyle(0xffffff, 0.4);
        g.fillCircle(cx, top + 110, 12);
        g.fillStyle(0xffffff, 0.2);
        g.fillCircle(cx, top + 110, 18);
        this._addText('Radiant beauty!', cx, top + 160, '#8888ff');
        break;
      }
      case 'Time Machine': {
        // Central time machine pod
        g.fillStyle(rgb(80, 80, 100), 1);
        g.fillEllipse(cx, top + 70, 60, 70);
        g.fillStyle(rgb(60, 60, 80), 1);
        g.fillEllipse(cx, top + 70, 50, 60);
        // Swirling portal inside
        g.lineStyle(2, rgb(100, 200, 255), 0.5);
        g.strokeCircle(cx, top + 65, 20);
        g.lineStyle(2, rgb(150, 100, 255), 0.4);
        g.strokeCircle(cx, top + 65, 14);
        g.lineStyle(2, rgb(200, 150, 255), 0.3);
        g.strokeCircle(cx, top + 65, 8);
        g.fillStyle(0xffffff, 0.3);
        g.fillCircle(cx, top + 65, 4);
        // Control panel
        g.fillStyle(rgb(50, 55, 65), 1);
        g.fillRect(left + 10, top + 10, 70, 35);
        g.fillStyle(rgb(30, 35, 45), 1);
        g.fillRect(left + 14, top + 14, 40, 24);
        g.fillStyle(0x00ccff, 0.6);
        g.fillRect(left + 16, top + 16, 36, 20);
        // Date display
        this._addText('2099', left + 34, top + 26, '#00ffff');
        // Lever
        g.fillStyle(rgb(160, 160, 170), 1);
        g.fillRect(left + 60, top + 18, 6, 24);
        g.fillStyle(0xff3333, 1);
        g.fillCircle(left + 63, top + 16, 5);
        // Clock gears
        g.fillStyle(rgb(180, 160, 60), 0.6);
        g.fillCircle(left + innerW - 30, top + 25, 14);
        g.fillCircle(left + innerW - 50, top + 35, 10);
        g.fillStyle(rgb(120, 100, 40), 0.8);
        g.fillCircle(left + innerW - 30, top + 25, 5);
        g.fillCircle(left + innerW - 50, top + 35, 4);
        // Sparks
        g.fillStyle(0xffff00, 0.6);
        g.fillCircle(cx - 28, top + 55, 2);
        g.fillCircle(cx + 30, top + 80, 2);
        g.fillCircle(cx - 15, top + 90, 1.5);
        this._addText('When are we?!', cx, top + 155, '#00ccff');
        break;
      }
      case 'Dragon Tower': {
        // Dragon nest / treasure hoard
        g.fillStyle(rgb(160, 120, 40), 0.8);
        g.fillEllipse(cx, top + 100, 100, 30);
        // Gold coins scattered
        g.fillStyle(0xFFD700, 0.9);
        for (let c2 = 0; c2 < 12; c2++) {
          g.fillCircle(cx - 40 + c2 * 8, top + 95 + (c2 % 3) * 5, 4);
        }
        // Dragon egg
        g.fillStyle(rgb(80, 180, 80), 0.8);
        g.fillEllipse(cx, top + 90, 16, 22);
        g.fillStyle(rgb(100, 200, 100), 0.5);
        g.fillEllipse(cx + 3, top + 85, 6, 8);
        // Stone walls with torch sconces
        for (let t = 0; t < 2; t++) {
          const tx2 = t === 0 ? left + 15 : left + innerW - 25;
          g.fillStyle(rgb(80, 60, 40), 1);
          g.fillRect(tx2, top + 10, 10, 20);
          g.fillStyle(rgb(255, 140, 30), 0.8);
          g.fillCircle(tx2 + 5, top + 8, 6);
          g.fillStyle(rgb(255, 200, 50), 0.5);
          g.fillCircle(tx2 + 5, top + 5, 4);
        }
        // Tapestry with dragon
        g.fillStyle(rgb(120, 30, 30), 0.8);
        g.fillRect(cx - 25, top + 5, 50, 40);
        g.lineStyle(1, rgb(180, 140, 40), 1);
        g.strokeRect(cx - 25, top + 5, 50, 40);
        // Simple dragon silhouette
        g.fillStyle(rgb(200, 60, 20), 0.8);
        g.fillTriangle(cx - 10, top + 35, cx, top + 15, cx + 10, top + 35);
        g.fillRect(cx - 5, top + 28, 10, 8);
        // Chains
        g.lineStyle(2, rgb(140, 140, 150), 0.6);
        g.lineBetween(left + 30, top + 50, left + 30, top + 90);
        g.lineBetween(left + innerW - 30, top + 50, left + innerW - 30, top + 90);
        this._addText('Here be dragons!', cx, top + 155, '#cc6633');
        break;
      }
      case 'Moon Colony': {
        // Starfield ceiling
        g.fillStyle(rgb(5, 5, 15), 1);
        g.fillRect(left + 5, top + 3, innerW - 10, 30);
        g.fillStyle(0xffffff, 0.7);
        for (let s = 0; s < 20; s++) {
          g.fillCircle(left + 10 + (s * 29) % (innerW - 20), top + 8 + (s * 7) % 20, 1);
        }
        // Dome window
        g.lineStyle(2, rgb(140, 140, 150), 0.8);
        g.strokeCircle(cx, top + 15, 20);
        g.fillStyle(rgb(10, 10, 25), 0.8);
        g.fillCircle(cx, top + 15, 18);
        // Lunar surface through window
        g.fillStyle(rgb(120, 120, 100), 0.4);
        g.fillRect(cx - 15, top + 22, 30, 10);
        // Habitat modules
        g.fillStyle(rgb(180, 180, 190), 1);
        g.fillRect(left + 15, top + 50, 80, 35);
        g.fillStyle(rgb(160, 160, 170), 1);
        g.fillRect(left + 15, top + 48, 80, 4);
        // Bunks
        g.fillStyle(rgb(100, 130, 180), 1);
        g.fillRect(left + 20, top + 55, 30, 12);
        g.fillRect(left + 20, top + 70, 30, 12);
        // Hydroponic garden
        g.fillStyle(rgb(60, 60, 70), 1);
        g.fillRect(left + 120, top + 50, 80, 40);
        g.fillStyle(rgb(40, 160, 60), 1);
        for (let p = 0; p < 4; p++) {
          g.fillRect(left + 128 + p * 18, top + 55, 10, 30);
        }
        g.fillStyle(rgb(60, 100, 180), 0.4);
        g.fillRect(left + 120, top + 85, 80, 5);
        // Oxygen tank
        g.fillStyle(rgb(200, 200, 210), 1);
        g.fillRect(left + innerW - 40, top + 60, 20, 40);
        g.fillStyle(rgb(100, 180, 220), 1);
        g.fillRect(left + innerW - 38, top + 75, 16, 6);
        this._addText('One small step...', cx, top + 150, '#aaaacc');
        break;
      }
      case 'Galactic Hub': {
        // Holographic star map (center)
        g.fillStyle(rgb(10, 15, 30), 0.8);
        g.fillCircle(cx, top + 60, 45);
        g.lineStyle(1, rgb(60, 100, 180), 0.4);
        g.strokeCircle(cx, top + 60, 45);
        g.strokeCircle(cx, top + 60, 30);
        g.strokeCircle(cx, top + 60, 15);
        // Star map points
        const starColors = [0x00aaff, 0xffaa00, 0xff4444, 0x44ff44, 0xff88ff];
        for (let s = 0; s < 10; s++) {
          g.fillStyle(starColors[s % 5], 0.7);
          const angle = s * 0.63;
          const dist = 10 + (s * 11) % 35;
          g.fillCircle(cx + Math.cos(angle) * dist, top + 60 + Math.sin(angle) * dist, 2);
        }
        // Connection lines
        g.lineStyle(1, rgb(80, 140, 220), 0.2);
        g.lineBetween(cx - 20, top + 45, cx + 10, top + 70);
        g.lineBetween(cx + 10, top + 70, cx + 30, top + 50);
        g.lineBetween(cx - 30, top + 65, cx, top + 40);
        // Communication consoles
        for (let c2 = 0; c2 < 2; c2++) {
          const cx2 = c2 === 0 ? left + 10 : left + innerW - 60;
          g.fillStyle(rgb(50, 55, 65), 1);
          g.fillRect(cx2, top + 110, 50, 28);
          g.fillStyle(rgb(30, 35, 45), 1);
          g.fillRect(cx2 + 4, top + 113, 42, 18);
          g.fillStyle(rgb(0, 80, 120), 0.6);
          g.fillRect(cx2 + 6, top + 115, 38, 14);
        }
        // Alien diplomacy chairs
        for (let a = 0; a < 4; a++) {
          g.fillStyle(rgb(80, 60, 120), 1);
          g.fillRect(left + 40 + a * 55, top + 120, 20, 20);
        }
        this._addText('Across the galaxy!', cx, top + 155, '#4488ff');
        break;
      }
      case 'Dyson Sphere': {
        // Miniature sun in center
        g.fillStyle(rgb(255, 200, 50), 0.8);
        g.fillCircle(cx, top + 60, 25);
        g.fillStyle(rgb(255, 240, 100), 0.5);
        g.fillCircle(cx, top + 60, 32);
        g.fillStyle(rgb(255, 255, 180), 0.2);
        g.fillCircle(cx, top + 60, 40);
        // Solar flares
        g.lineStyle(2, rgb(255, 180, 40), 0.5);
        g.lineBetween(cx - 25, top + 50, cx - 40, top + 38);
        g.lineBetween(cx + 20, top + 42, cx + 38, top + 30);
        g.lineBetween(cx - 18, top + 80, cx - 30, top + 95);
        // Sphere framework
        g.lineStyle(1, rgb(100, 100, 120), 0.6);
        g.strokeCircle(cx, top + 60, 48);
        // Energy collectors (panels around the sphere)
        for (let p = 0; p < 8; p++) {
          const angle = p * Math.PI / 4;
          const px2 = cx + Math.cos(angle) * 48;
          const py2 = top + 60 + Math.sin(angle) * 48;
          g.fillStyle(rgb(60, 80, 140), 0.8);
          g.fillRect(px2 - 6, py2 - 4, 12, 8);
        }
        // Power output gauge
        g.fillStyle(rgb(40, 40, 50), 1);
        g.fillRect(left + 10, top + 120, innerW - 20, 20);
        g.fillStyle(rgb(255, 200, 50), 0.8);
        g.fillRect(left + 14, top + 124, (innerW - 28) * 0.85, 12);
        this._addText('85% capacity', cx, top + 130, '#ffcc33');
        this._addText('Infinite energy!', cx, top + 155, '#ffaa22');
        break;
      }
      case 'Quantum Computer': {
        // Quantum processor core
        g.fillStyle(rgb(20, 20, 40), 1);
        g.fillRect(cx - 35, top + 20, 70, 70);
        g.lineStyle(1, rgb(0, 200, 255), 0.6);
        g.strokeRect(cx - 35, top + 20, 70, 70);
        // Qubit grid
        for (let qr = 0; qr < 5; qr++) {
          for (let qc = 0; qc < 5; qc++) {
            const qx = cx - 24 + qc * 13;
            const qy = top + 30 + qr * 13;
            g.fillStyle(rgb(0, 150 + (qr + qc) * 20, 255), 0.6);
            g.fillCircle(qx, qy, 3);
            // Entanglement lines
            if (qc < 4) {
              g.lineStyle(1, rgb(0, 200, 255), 0.2);
              g.lineBetween(qx + 3, qy, qx + 10, qy);
            }
            if (qr < 4) {
              g.lineBetween(qx, qy + 3, qx, qy + 10);
            }
          }
        }
        // Cooling system
        g.fillStyle(rgb(60, 80, 120), 1);
        g.fillRect(left + 10, top + 10, 40, 80);
        g.fillStyle(rgb(100, 200, 255), 0.3);
        g.fillRect(left + 14, top + 14, 32, 72);
        // Frost effect
        g.fillStyle(0xffffff, 0.2);
        g.fillRect(left + 12, top + 20, 5, 3);
        g.fillRect(left + 40, top + 40, 6, 2);
        g.fillRect(left + 18, top + 60, 4, 3);
        this._addText('-273°C', left + 30, top + 95, '#88ccff');
        // Output display
        g.fillStyle(rgb(30, 30, 45), 1);
        g.fillRect(left + innerW - 70, top + 15, 55, 35);
        g.fillStyle(0x00ff88, 0.5);
        this._addText('|0⟩+|1⟩', left + innerW - 42, top + 32, '#00ff88');
        // Status lights
        for (let l = 0; l < 6; l++) {
          g.fillStyle(l % 2 === 0 ? 0x00ff00 : 0x00aaff, 0.7);
          g.fillCircle(left + innerW - 60 + l * 10, top + 58, 3);
        }
        this._addText('Superposition!', cx, top + 150, '#00ccff');
        break;
      }
      case 'Terraformer': {
        // Planet display (being terraformed)
        g.fillStyle(rgb(180, 120, 60), 0.8);
        g.fillCircle(cx, top + 55, 35);
        // Green patches (terraformed areas)
        g.fillStyle(rgb(60, 160, 60), 0.6);
        g.fillEllipse(cx - 15, top + 45, 20, 12);
        g.fillEllipse(cx + 10, top + 60, 16, 10);
        g.fillEllipse(cx - 5, top + 70, 12, 8);
        // Blue water forming
        g.fillStyle(rgb(60, 120, 200), 0.5);
        g.fillEllipse(cx + 20, top + 45, 10, 14);
        // Atmosphere ring
        g.lineStyle(2, rgb(100, 180, 255), 0.3);
        g.strokeCircle(cx, top + 55, 40);
        // Terraforming beams
        g.lineStyle(2, rgb(100, 255, 100), 0.3);
        g.lineBetween(left + 20, top + 5, cx - 20, top + 35);
        g.lineBetween(left + innerW - 20, top + 5, cx + 20, top + 35);
        // Emitter arrays
        g.fillStyle(rgb(80, 80, 90), 1);
        g.fillRect(left + 10, top + 3, 30, 12);
        g.fillRect(left + innerW - 40, top + 3, 30, 12);
        g.fillStyle(0x00ff44, 0.6);
        g.fillCircle(left + 25, top + 9, 3);
        g.fillCircle(left + innerW - 25, top + 9, 3);
        // Progress display
        g.fillStyle(rgb(40, 40, 50), 1);
        g.fillRect(left + 20, top + 110, innerW - 40, 16);
        g.fillStyle(rgb(60, 180, 60), 0.8);
        g.fillRect(left + 22, top + 112, (innerW - 44) * 0.6, 12);
        this._addText('60% habitable', cx, top + 118, '#44dd44');
        this._addText('Making worlds!', cx, top + 150, '#44aa44');
        break;
      }
      case 'Star Forge': {
        // Forge furnace (glowing center)
        g.fillStyle(rgb(255, 100, 20), 0.8);
        g.fillCircle(cx, top + 50, 30);
        g.fillStyle(rgb(255, 180, 60), 0.5);
        g.fillCircle(cx, top + 50, 20);
        g.fillStyle(rgb(255, 240, 120), 0.3);
        g.fillCircle(cx, top + 50, 10);
        // Sparks
        g.fillStyle(0xffff00, 0.8);
        for (let s = 0; s < 8; s++) {
          const angle = s * Math.PI / 4;
          g.fillCircle(cx + Math.cos(angle) * 35, top + 50 + Math.sin(angle) * 35, 1.5);
        }
        // Anvil
        g.fillStyle(rgb(60, 60, 70), 1);
        g.fillRect(cx - 25, top + 90, 50, 12);
        g.fillRect(cx - 20, top + 102, 40, 15);
        g.fillRect(cx - 30, top + 88, 60, 4);
        // Hammer
        g.fillStyle(rgb(140, 100, 60), 1);
        g.fillRect(left + 20, top + 85, 4, 30);
        g.fillStyle(rgb(80, 80, 90), 1);
        g.fillRect(left + 14, top + 82, 16, 8);
        // Weapon rack
        g.fillStyle(rgb(100, 70, 40), 1);
        g.fillRect(left + innerW - 50, top + 10, 40, 80);
        // Swords
        g.fillStyle(rgb(180, 180, 200), 1);
        g.fillRect(left + innerW - 45, top + 15, 3, 30);
        g.fillRect(left + innerW - 35, top + 20, 3, 25);
        g.fillRect(left + innerW - 25, top + 15, 3, 30);
        // Hilts
        g.fillStyle(rgb(160, 120, 40), 1);
        g.fillRect(left + innerW - 48, top + 45, 9, 3);
        g.fillRect(left + innerW - 38, top + 45, 9, 3);
        g.fillRect(left + innerW - 28, top + 45, 9, 3);
        this._addText('Forging legends!', cx, top + 140, '#ff8833');
        break;
      }
      case 'Antimatter Plant': {
        // Containment chamber
        g.lineStyle(3, rgb(120, 40, 200), 0.8);
        g.strokeCircle(cx, top + 55, 35);
        g.lineStyle(1, rgb(180, 80, 255), 0.4);
        g.strokeCircle(cx, top + 55, 28);
        g.strokeCircle(cx, top + 55, 21);
        // Antimatter orb
        g.fillStyle(rgb(160, 50, 255), 0.6);
        g.fillCircle(cx, top + 55, 12);
        g.fillStyle(rgb(220, 150, 255), 0.3);
        g.fillCircle(cx, top + 55, 8);
        g.fillStyle(0xffffff, 0.4);
        g.fillCircle(cx - 3, top + 52, 3);
        // Warning signs
        g.fillStyle(rgb(220, 180, 0), 1);
        g.fillTriangle(left + 15, top + 5, left + 30, top + 5, left + 22, top + 18);
        g.fillTriangle(left + innerW - 30, top + 5, left + innerW - 15, top + 5, left + innerW - 22, top + 18);
        // Magnetic field lines
        g.lineStyle(1, rgb(100, 100, 255), 0.2);
        for (let l = 0; l < 4; l++) {
          const offset = l * 12;
          g.lineBetween(cx - 40 - offset, top + 55, cx - 35, top + 40 + l * 5);
          g.lineBetween(cx + 40 + offset, top + 55, cx + 35, top + 40 + l * 5);
        }
        // Power conduits
        g.fillStyle(rgb(50, 50, 65), 1);
        g.fillRect(left + 10, top + 100, innerW - 20, 14);
        g.fillStyle(rgb(160, 50, 255), 0.4);
        for (let p = 0; p < 8; p++) {
          g.fillRect(left + 20 + p * 30, top + 103, 16, 8);
        }
        // Energy readout
        g.fillStyle(rgb(30, 20, 40), 1);
        g.fillRect(left + 10, top + 125, 80, 20);
        g.fillStyle(rgb(200, 80, 255), 0.8);
        this._addText('1.21 GW', left + 50, top + 135, '#cc44ff');
        this._addText('Handle with care!', cx, top + 160, '#aa44ff');
        break;
      }
      case 'Warp Gate': {
        // Portal ring
        g.lineStyle(4, rgb(0, 180, 255), 0.8);
        g.strokeCircle(cx, top + 65, 45);
        g.lineStyle(2, rgb(0, 220, 255), 0.5);
        g.strokeCircle(cx, top + 65, 40);
        // Portal interior (swirling)
        g.fillStyle(rgb(10, 30, 60), 0.7);
        g.fillCircle(cx, top + 65, 38);
        // Spiral effect
        g.lineStyle(1, rgb(0, 150, 255), 0.3);
        for (let s = 0; s < 6; s++) {
          const angle = s * Math.PI / 3;
          const r1 = 10, r2 = 30;
          g.lineBetween(
            cx + Math.cos(angle) * r1, top + 65 + Math.sin(angle) * r1,
            cx + Math.cos(angle + 0.5) * r2, top + 65 + Math.sin(angle + 0.5) * r2
          );
        }
        g.fillStyle(0xffffff, 0.2);
        g.fillCircle(cx, top + 65, 5);
        // Gate pillars
        g.fillStyle(rgb(60, 70, 90), 1);
        g.fillRect(cx - 55, top + 20, 14, 90);
        g.fillRect(cx + 41, top + 20, 14, 90);
        g.fillStyle(0x00ccff, 0.4);
        g.fillRect(cx - 53, top + 30, 10, 4);
        g.fillRect(cx - 53, top + 50, 10, 4);
        g.fillRect(cx - 53, top + 70, 10, 4);
        g.fillRect(cx + 43, top + 30, 10, 4);
        g.fillRect(cx + 43, top + 50, 10, 4);
        g.fillRect(cx + 43, top + 70, 10, 4);
        // Destination sign
        g.fillStyle(rgb(20, 20, 30), 1);
        g.fillRect(left + 10, top + 130, innerW - 20, 16);
        this._addText('DEST: ANDROMEDA', cx, top + 138, '#00ccff');
        this._addText('Step through!', cx, top + 160, '#0088ff');
        break;
      }
      case 'Planet Engine': {
        // Massive engine cross-section
        g.fillStyle(rgb(60, 60, 70), 1);
        g.fillRect(left + 30, top + 20, innerW - 60, 80);
        g.fillStyle(rgb(50, 50, 60), 1);
        g.fillRect(left + 35, top + 25, innerW - 70, 70);
        // Engine cylinders
        for (let c2 = 0; c2 < 4; c2++) {
          g.fillStyle(rgb(80, 80, 95), 1);
          g.fillRect(left + 45 + c2 * 55, top + 30, 35, 55);
          // Piston
          g.fillStyle(rgb(120, 120, 140), 1);
          g.fillRect(left + 50 + c2 * 55, top + 40 + c2 * 5, 25, 12);
          // Fire
          g.fillStyle(rgb(255, 100, 20), 0.5);
          g.fillRect(left + 52 + c2 * 55, top + 70, 21, 10);
        }
        // Exhaust vents
        g.fillStyle(rgb(100, 100, 110), 1);
        g.fillRect(left + 10, top + 105, innerW - 20, 12);
        g.fillStyle(rgb(200, 100, 30), 0.3);
        for (let v = 0; v < 6; v++) {
          g.fillRect(left + 20 + v * 40, top + 108, 20, 6);
        }
        // Control room
        g.fillStyle(rgb(40, 45, 55), 1);
        g.fillRect(left + 10, top + 5, 60, 18);
        g.fillStyle(rgb(0, 200, 100), 0.5);
        g.fillRect(left + 14, top + 8, 52, 12);
        this._addText('THRUST: MAX', left + 40, top + 14, '#00ff66');
        this._addText('Moving worlds!', cx, top + 150, '#ff8833');
        break;
      }
      case 'Galaxy Brain': {
        // Giant brain structure
        g.fillStyle(rgb(200, 140, 180), 0.7);
        g.fillEllipse(cx, top + 55, 70, 50);
        // Brain folds
        g.lineStyle(1, rgb(180, 100, 140), 0.5);
        g.lineBetween(cx - 25, top + 35, cx - 10, top + 55);
        g.lineBetween(cx - 10, top + 55, cx - 20, top + 75);
        g.lineBetween(cx + 5, top + 30, cx + 15, top + 50);
        g.lineBetween(cx + 15, top + 50, cx + 5, top + 70);
        g.lineBetween(cx, top + 32, cx, top + 78);
        // Neural sparks
        g.fillStyle(0xffff88, 0.8);
        g.fillCircle(cx - 20, top + 40, 3);
        g.fillCircle(cx + 18, top + 45, 2.5);
        g.fillCircle(cx - 8, top + 65, 2);
        g.fillCircle(cx + 25, top + 60, 3);
        // Thought bubbles
        g.fillStyle(0xffffff, 0.3);
        g.fillCircle(cx + 40, top + 25, 4);
        g.fillCircle(cx + 48, top + 18, 6);
        g.fillCircle(cx + 55, top + 8, 10);
        g.fillStyle(rgb(200, 220, 255), 0.5);
        g.fillCircle(cx + 55, top + 8, 8);
        // Neural network display
        g.fillStyle(rgb(20, 20, 30), 1);
        g.fillRect(left + 10, top + 100, innerW - 20, 40);
        // Network nodes
        g.fillStyle(0x00ccff, 0.6);
        for (let n = 0; n < 8; n++) {
          g.fillCircle(left + 25 + n * 30, top + 115, 4);
        }
        g.lineStyle(1, 0x00ccff, 0.2);
        for (let n = 0; n < 7; n++) {
          g.lineBetween(left + 25 + n * 30, top + 115, left + 55 + n * 30, top + 115);
        }
        this._addText('Big thoughts!', cx, top + 155, '#cc88dd');
        break;
      }
      case 'Universe Simulator': {
        // Holographic universe display
        g.fillStyle(rgb(5, 5, 20), 0.9);
        g.fillRect(left + 15, top + 10, innerW - 30, 90);
        g.lineStyle(1, rgb(60, 80, 120), 0.6);
        g.strokeRect(left + 15, top + 10, innerW - 30, 90);
        // Galaxies
        g.fillStyle(rgb(200, 180, 255), 0.4);
        g.fillEllipse(left + 60, top + 40, 30, 12);
        g.fillStyle(rgb(255, 200, 150), 0.4);
        g.fillEllipse(left + 150, top + 60, 24, 10);
        g.fillStyle(rgb(150, 200, 255), 0.3);
        g.fillEllipse(left + 100, top + 75, 20, 8);
        // Nebula
        g.fillStyle(rgb(255, 100, 200), 0.15);
        g.fillEllipse(left + 200, top + 35, 40, 30);
        // Stars
        g.fillStyle(0xffffff, 0.6);
        for (let s = 0; s < 25; s++) {
          g.fillCircle(left + 20 + (s * 23) % (innerW - 40), top + 15 + (s * 17) % 80, 1);
        }
        // Control interface
        g.fillStyle(rgb(40, 40, 55), 1);
        g.fillRect(left + 10, top + 110, innerW - 20, 30);
        // Sliders
        for (let s = 0; s < 3; s++) {
          g.fillStyle(rgb(80, 80, 100), 1);
          g.fillRect(left + 20 + s * 80, top + 118, 60, 4);
          g.fillStyle(0x00ffaa, 1);
          g.fillCircle(left + 40 + s * 80, top + 120, 4);
        }
        this._addText('Playing god!', cx, top + 155, '#8866ff');
        break;
      }
      case 'Multiverse Portal': {
        // Multiple overlapping portal rings
        g.lineStyle(3, rgb(255, 80, 80), 0.5);
        g.strokeCircle(cx - 20, top + 55, 30);
        g.lineStyle(3, rgb(80, 255, 80), 0.5);
        g.strokeCircle(cx, top + 60, 30);
        g.lineStyle(3, rgb(80, 80, 255), 0.5);
        g.strokeCircle(cx + 20, top + 55, 30);
        // Portal interiors
        g.fillStyle(rgb(60, 10, 10), 0.4);
        g.fillCircle(cx - 20, top + 55, 25);
        g.fillStyle(rgb(10, 60, 10), 0.4);
        g.fillCircle(cx, top + 60, 25);
        g.fillStyle(rgb(10, 10, 60), 0.4);
        g.fillCircle(cx + 20, top + 55, 25);
        // Center convergence
        g.fillStyle(0xffffff, 0.5);
        g.fillCircle(cx, top + 57, 6);
        // Reality labels
        g.fillStyle(rgb(30, 30, 40), 1);
        g.fillRect(left + 10, top + 100, innerW - 20, 40);
        this._addText('Reality A', left + 50, top + 110, '#ff6666');
        this._addText('Reality B', cx, top + 120, '#66ff66');
        this._addText('Reality C', left + innerW - 50, top + 110, '#6666ff');
        this._addText('Which reality?', cx, top + 155, '#ffffff');
        break;
      }
      case 'Reality Engine': {
        // Matrix-style code rain background
        g.fillStyle(rgb(5, 10, 5), 1);
        g.fillRect(left + 5, top + 5, innerW - 10, 90);
        g.fillStyle(0x00ff00, 0.15);
        for (let col = 0; col < 20; col++) {
          for (let row = 0; row < 8; row++) {
            if (Math.random() > 0.3) {
              g.fillRect(left + 10 + col * 13, top + 8 + row * 11, 8, 8);
            }
          }
        }
        // Central processing core
        g.fillStyle(rgb(20, 60, 20), 1);
        g.fillRect(cx - 30, top + 30, 60, 40);
        g.lineStyle(2, 0x00ff00, 0.6);
        g.strokeRect(cx - 30, top + 30, 60, 40);
        g.fillStyle(0x00ff00, 0.8);
        g.fillCircle(cx, top + 50, 10);
        g.fillStyle(0x88ff88, 0.4);
        g.fillCircle(cx, top + 50, 15);
        // Reality parameters panel
        g.fillStyle(rgb(20, 20, 30), 1);
        g.fillRect(left + 10, top + 105, innerW - 20, 40);
        this._addText('Gravity: 9.81', left + 70, top + 115, '#00ff00');
        this._addText('Time: 1.0x', left + 70, top + 130, '#00ff00');
        this._addText('Physics: ON', left + innerW - 70, top + 115, '#00ff00');
        this._addText('Rewriting reality!', cx, top + 158, '#00cc00');
        break;
      }
      case 'Cosmic Citadel': {
        // Grand hall with pillars
        for (let p = 0; p < 4; p++) {
          const px2 = left + 20 + p * 65;
          g.fillStyle(rgb(120, 100, 160), 1);
          g.fillRect(px2, top + 10, 14, 120);
          g.fillStyle(rgb(140, 120, 180), 1);
          g.fillRect(px2 - 3, top + 8, 20, 6);
          g.fillRect(px2 - 3, top + 126, 20, 6);
        }
        // Central altar
        g.fillStyle(rgb(80, 60, 120), 1);
        g.fillRect(cx - 30, top + 50, 60, 30);
        g.fillRect(cx - 35, top + 48, 70, 4);
        // Cosmic orb on altar
        g.fillStyle(rgb(100, 80, 200), 0.6);
        g.fillCircle(cx, top + 40, 14);
        g.fillStyle(rgb(180, 140, 255), 0.3);
        g.fillCircle(cx, top + 40, 10);
        g.fillStyle(0xffffff, 0.4);
        g.fillCircle(cx - 3, top + 37, 3);
        // Star patterns on floor
        g.fillStyle(rgb(200, 180, 255), 0.15);
        for (let s = 0; s < 5; s++) {
          const angle = s * Math.PI * 2 / 5;
          g.fillCircle(cx + Math.cos(angle) * 50, top + 100 + Math.sin(angle) * 25, 3);
        }
        // Cosmic banners
        g.fillStyle(rgb(60, 30, 100), 0.8);
        g.fillRect(left + 5, top + 15, 12, 40);
        g.fillRect(left + innerW - 17, top + 15, 12, 40);
        g.fillStyle(rgb(200, 180, 255), 0.5);
        g.fillCircle(left + 11, top + 30, 3);
        g.fillCircle(left + innerW - 11, top + 30, 3);
        this._addText('Cosmic power!', cx, top + 155, '#aa88ff');
        break;
      }
      case 'Infinity Tower': {
        // Infinite staircase illusion
        for (let s = 0; s < 8; s++) {
          const sx = left + 30 + (s % 2) * 20;
          const sy = top + 10 + s * 16;
          const sw = innerW - 60 - (s % 2) * 40;
          g.fillStyle(rgb(120 + s * 10, 110 + s * 8, 140 + s * 5), 0.8);
          g.fillRect(sx, sy, sw, 12);
          g.fillStyle(rgb(100 + s * 10, 90 + s * 8, 120 + s * 5), 1);
          g.fillRect(sx, sy + 12, sw, 3);
        }
        // Infinity symbol at center
        g.lineStyle(3, rgb(200, 180, 255), 0.8);
        // Left loop
        g.strokeCircle(cx - 15, top + 70, 12);
        // Right loop
        g.strokeCircle(cx + 15, top + 70, 12);
        // Glowing center
        g.fillStyle(0xffffff, 0.4);
        g.fillCircle(cx, top + 70, 5);
        // Floating platforms
        g.fillStyle(rgb(100, 80, 140), 0.6);
        g.fillRect(left + 20, top + 110, 40, 8);
        g.fillRect(left + 80, top + 120, 50, 8);
        g.fillRect(left + 160, top + 105, 45, 8);
        // Mystical runes
        g.fillStyle(rgb(200, 150, 255), 0.4);
        g.fillCircle(left + 30, top + 108, 4);
        g.fillCircle(left + 50, top + 108, 4);
        g.fillCircle(left + 100, top + 118, 4);
        g.fillCircle(left + 180, top + 103, 4);
        this._addText('∞ Forever ∞', cx, top + 150, '#cc99ff');
        break;
      }
      case 'Omega Station': {
        // Command bridge layout
        g.fillStyle(rgb(30, 35, 45), 1);
        g.fillRect(left + 10, top + 5, innerW - 20, 50);
        // Main viewscreen
        g.fillStyle(rgb(10, 15, 30), 1);
        g.fillRect(left + 30, top + 8, innerW - 60, 40);
        g.lineStyle(1, rgb(60, 80, 120), 0.8);
        g.strokeRect(left + 30, top + 8, innerW - 60, 40);
        // Star view
        g.fillStyle(0xffffff, 0.5);
        for (let s = 0; s < 12; s++) {
          g.fillCircle(left + 35 + (s * 31) % (innerW - 70), top + 13 + (s * 11) % 30, 1);
        }
        // Captain's chair
        g.fillStyle(rgb(80, 40, 40), 1);
        g.fillRect(cx - 18, top + 80, 36, 24);
        g.fillStyle(rgb(100, 50, 50), 1);
        g.fillRect(cx - 22, top + 75, 44, 8);
        g.fillRect(cx - 22, top + 80, 4, 24);
        g.fillRect(cx + 18, top + 80, 4, 24);
        // Crew stations
        for (let s = 0; s < 3; s++) {
          const sx = left + 15 + s * 85;
          g.fillStyle(rgb(45, 50, 60), 1);
          g.fillRect(sx, top + 60, 55, 25);
          g.fillStyle(rgb(0, 100, 120), 0.5);
          g.fillRect(sx + 3, top + 63, 49, 18);
        }
        // Status indicators
        g.fillStyle(0x00ff00, 0.8);
        g.fillCircle(left + 20, top + 115, 3);
        g.fillStyle(0x00ff00, 0.8);
        g.fillCircle(left + 35, top + 115, 3);
        g.fillStyle(0xffaa00, 0.8);
        g.fillCircle(left + 50, top + 115, 3);
        g.fillStyle(0x00ff00, 0.8);
        g.fillCircle(left + 65, top + 115, 3);
        this._addText('ALL SYSTEMS GO', left + 42, top + 125, '#00ff88');
        this._addText('Final frontier!', cx, top + 155, '#3388ff');
        break;
      }
      case 'Big Bang Lab': {
        // Particle accelerator ring
        g.lineStyle(4, rgb(100, 100, 120), 1);
        g.strokeCircle(cx, top + 60, 45);
        g.lineStyle(2, rgb(140, 140, 160), 0.6);
        g.strokeCircle(cx, top + 60, 42);
        // Energy particles moving through ring
        const particleColors = [0xff3333, 0x33ff33, 0x3333ff, 0xffff33, 0xff33ff, 0x33ffff];
        for (let p = 0; p < 6; p++) {
          const angle = p * Math.PI / 3;
          g.fillStyle(particleColors[p], 0.8);
          g.fillCircle(cx + Math.cos(angle) * 43, top + 60 + Math.sin(angle) * 43, 3);
        }
        // Central collision point
        g.fillStyle(0xffffff, 0.8);
        g.fillCircle(cx, top + 60, 8);
        g.fillStyle(0xffffff, 0.4);
        g.fillCircle(cx, top + 60, 14);
        g.fillStyle(0xffffff, 0.15);
        g.fillCircle(cx, top + 60, 22);
        // Explosion rays from center
        g.lineStyle(1, 0xffffff, 0.2);
        for (let r = 0; r < 12; r++) {
          const angle = r * Math.PI / 6;
          g.lineBetween(cx, top + 60,
            cx + Math.cos(angle) * 35, top + 60 + Math.sin(angle) * 35);
        }
        // Data readouts
        g.fillStyle(rgb(20, 20, 30), 1);
        g.fillRect(left + 10, top + 115, innerW - 20, 30);
        g.fillStyle(0xffffff, 0.6);
        this._addText('E = mc²', cx, top + 125, '#ffffff');
        this._addText('13.8B years ago...', cx, top + 138, '#ffaa44');
        this._addText('Creating universes!', cx, top + 160, '#ff8844');
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
