import {
  PLOT_COLS, ROW_HEIGHT, PLOT_W, PLOT_H,
  ROAD_V_POSITIONS, ROAD_THICK,
  NEIGHBOURHOOD_X, HOUSE_W, HOUSE_H,
  COMMERCIAL_W, TOWN_WORLD_W,
} from '../constants.js';

const MAX_NPCS = 50;

// Color palettes for deterministic NPC appearance
const SKIN_PALETTE = [0xf0d2b4, 0xd4a67a, 0xc49060, 0x8d5e3c, 0xf5e0c8, 0xba7e50];
const SHIRT_PALETTE = [0x4488cc, 0xcc4444, 0x44aa44, 0xddaa33, 0x8855cc, 0xcc6688, 0x44bbaa, 0xdd7733];
const PANTS_PALETTE = [0x323278, 0x2a4060, 0x505050, 0x3c3c28, 0x4a2828, 0x283c50];
const HAIR_PALETTE = [0x281e14, 0x5a3c1e, 0x1e1e1e, 0x8c6e46, 0xc8a060, 0x6e2828];

export class NPCSystem {
  constructor(scene) {
    this.scene = scene;
    this.npcs = [];
    this.tick = 0;
    this._lastPop = -1;
  }

  _seededRng(seed) {
    let s = (seed * 137 + 53) | 0;
    return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }

  _getHousePositions(population) {
    const numHouses = population >= 100 ? Math.max(1, Math.floor(population / 100)) : 0;
    if (numHouses === 0) return [];
    const cols = 6;
    const colSpacing = HOUSE_W + 40;
    const rowSpacing = HOUSE_H + 50;
    const positions = [];
    for (let i = 0; i < numHouses; i++) {
      positions.push({
        x: NEIGHBOURHOOD_X + (i % cols) * colSpacing,
        y: 30 + Math.floor(i / cols) * rowSpacing,
      });
    }
    return positions;
  }

  init(population, buildings) {
    const count = Math.min(population, MAX_NPCS);
    if (count === this._lastPop) return;
    this._lastPop = count;

    // Destroy old NPCs
    for (const npc of this.npcs) {
      if (npc.graphics) npc.graphics.destroy();
    }
    this.npcs = [];

    if (count <= 0) return;

    const houses = this._getHousePositions(population);
    const occupiedPlots = [];
    for (let i = 0; i < buildings.length && i < 72; i++) {
      if (buildings[i]) {
        const col = i % 6;
        const row = Math.floor(i / 6);
        occupiedPlots.push({
          x: PLOT_COLS[col] + PLOT_W / 2,
          y: row * ROW_HEIGHT + 35 + PLOT_H / 2,
        });
      }
    }

    const totalRows = Math.ceil(44 / 6);
    const worldH = totalRows * ROW_HEIGHT + 100;

    // Horizontal road y positions (center of each row's road)
    const hRoads = [];
    for (let row = 0; row <= totalRows; row++) {
      hRoads.push(row * ROW_HEIGHT + 15);
    }

    for (let i = 0; i < count; i++) {
      const rng = this._seededRng(i * 31 + 7);
      const isHouseSpawn = rng() < 0.6 && houses.length > 0 && occupiedPlots.length > 0;

      const skin = SKIN_PALETTE[Math.floor(rng() * SKIN_PALETTE.length)];
      const shirt = SHIRT_PALETTE[Math.floor(rng() * SHIRT_PALETTE.length)];
      const pants = PANTS_PALETTE[Math.floor(rng() * PANTS_PALETTE.length)];
      const hair = HAIR_PALETTE[Math.floor(rng() * HAIR_PALETTE.length)];

      const g = this.scene.add.graphics();
      this.scene.addTownObj(g);

      if (isHouseSpawn) {
        const home = houses[Math.floor(rng() * houses.length)];
        const target = occupiedPlots[Math.floor(rng() * occupiedPlots.length)];
        this.npcs.push({
          x: home.x + HOUSE_W / 2,
          y: home.y + HOUSE_H,
          speed: 0.3 + rng() * 0.3,
          direction: 'right',
          state: 'walking',
          spawnType: 'house',
          home: { x: home.x + HOUSE_W / 2, y: home.y + HOUSE_H },
          targetPlot: { x: target.x, y: target.y },
          returning: false,
          enterTimer: 0,
          skin, shirt, pants, hair,
          graphics: g,
        });
      } else {
        // Road walker
        const useVertical = rng() < 0.5;
        let sx, sy, walkDir;
        if (useVertical && ROAD_V_POSITIONS.length > 0) {
          sx = ROAD_V_POSITIONS[Math.floor(rng() * ROAD_V_POSITIONS.length)];
          sy = rng() * worldH;
          walkDir = rng() < 0.5 ? 'down' : 'up';
        } else if (hRoads.length > 0) {
          sy = hRoads[Math.floor(rng() * hRoads.length)];
          sx = rng() * COMMERCIAL_W;
          walkDir = rng() < 0.5 ? 'left' : 'right';
        } else {
          sx = rng() * COMMERCIAL_W;
          sy = rng() * worldH;
          walkDir = 'right';
        }
        this.npcs.push({
          x: sx,
          y: sy,
          speed: 0.3 + rng() * 0.3,
          direction: walkDir === 'left' ? 'left' : 'right',
          state: 'walking',
          spawnType: 'road',
          walkDir,
          skin, shirt, pants, hair,
          graphics: g,
        });
      }
    }
  }

  update() {
    this.tick++;
    for (const npc of this.npcs) {
      if (npc.spawnType === 'house') {
        this._updateHouseNPC(npc);
      } else {
        this._updateRoadNPC(npc);
      }
      this._drawNPC(npc);
    }
  }

  _updateHouseNPC(npc) {
    if (npc.state === 'entering') {
      npc.enterTimer--;
      if (npc.enterTimer <= 0) {
        npc.state = 'walking';
        npc.returning = !npc.returning;
      }
      return;
    }

    const target = npc.returning ? npc.home : npc.targetPlot;
    const dx = target.x - npc.x;
    const dy = target.y - npc.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) {
      // Arrived at destination
      npc.state = 'entering';
      npc.enterTimer = npc.returning
        ? 60 + Math.floor(Math.random() * 90)
        : 90 + Math.floor(Math.random() * 60);
      return;
    }

    // Move toward target
    const nx = dx / dist;
    const ny = dy / dist;
    npc.x += nx * npc.speed;
    npc.y += ny * npc.speed;
    npc.direction = dx < 0 ? 'left' : 'right';
  }

  _updateRoadNPC(npc) {
    const totalRows = Math.ceil(44 / 6);
    const worldH = totalRows * ROW_HEIGHT + 100;

    switch (npc.walkDir) {
      case 'right':
        npc.x += npc.speed;
        npc.direction = 'right';
        if (npc.x > COMMERCIAL_W + 20) npc.x = -20;
        break;
      case 'left':
        npc.x -= npc.speed;
        npc.direction = 'left';
        if (npc.x < -20) npc.x = COMMERCIAL_W + 20;
        break;
      case 'down':
        npc.y += npc.speed;
        npc.direction = 'right';
        if (npc.y > worldH + 20) npc.y = -20;
        break;
      case 'up':
        npc.y -= npc.speed;
        npc.direction = 'left';
        if (npc.y < -20) npc.y = worldH + 20;
        break;
    }
  }

  _drawNPC(npc) {
    const g = npc.graphics;
    g.clear();

    if (npc.state === 'entering') {
      g.setDepth(-100);
      return;
    }

    const x = npc.x;
    const y = npc.y;

    // Shadow
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(x, y + 5, 20, 8);

    // Head
    g.fillStyle(npc.skin, 1);
    g.fillCircle(x, y - 13, 5);

    // Hair
    g.fillStyle(npc.hair, 1);
    g.fillRect(x - 5, y - 18, 10, 4);

    // Body / shirt
    g.fillStyle(npc.shirt, 1);
    g.fillRect(x - 4, y - 8, 8, 9);

    // Arms (animated)
    const armPhase = Math.floor(this.tick / 6) % 2;
    if (armPhase === 0) {
      g.fillStyle(npc.shirt, 1);
      g.fillRect(x - 6, y - 7, 2, 6);
      g.fillRect(x + 4, y - 5, 2, 6);
    } else {
      g.fillStyle(npc.shirt, 1);
      g.fillRect(x - 6, y - 5, 2, 6);
      g.fillRect(x + 4, y - 7, 2, 6);
    }

    // Legs (animated)
    const legPhase = Math.floor(this.tick / 6) % 2;
    const dir = npc.direction;
    const lxOff = dir === 'right'
      ? (legPhase === 0 ? -2 : 2)
      : (legPhase === 0 ? 2 : -2);
    g.fillStyle(npc.pants, 1);
    g.fillRect(x - 4 + lxOff, y + 1, 3, legPhase === 0 ? 7 : 6);
    g.fillRect(x + 1 - lxOff, y + 1, 3, legPhase === 0 ? 6 : 7);

    // Eyes
    g.fillStyle(0x222222, 1);
    if (dir === 'left') {
      g.fillRect(x - 3, y - 14, 2, 2);
    } else {
      g.fillRect(x + 1, y - 14, 2, 2);
    }

    // Depth sort by y
    g.setDepth(y + 10);
  }

  destroy() {
    for (const npc of this.npcs) {
      if (npc.graphics) npc.graphics.destroy();
    }
    this.npcs = [];
    this._lastPop = -1;
  }
}
