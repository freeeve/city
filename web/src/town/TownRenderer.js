import Phaser from 'phaser';
import {
  GRASS_1, GRASS_2, GRASS_3, ROAD_FILL, ROAD_EDGE, ROAD_DASH, SIDEWALK,
  ROAD_THICK, ROW_HEIGHT, PLOT_W, PLOT_H, PLOT_COLS, ROAD_V_POSITIONS,
  TOWN_WORLD_W, COMMERCIAL_W, NEIGHBOURHOOD_X, HOUSE_W, HOUSE_H,
  DEPTH_PX, SIDE_DX, SIDE_DY, rgb,
} from '../constants.js';
import { BUILDING_COLORS, BUILDING_IMAGES, BUILDING_ORDER } from '../shared.js';

const HOUSE_COLORS = [
  [180,120,90], [160,170,185], [200,180,140], [170,140,130],
  [190,200,170], [220,200,180], [150,160,180], [200,160,140],
];
const ROOF_COLORS = [
  [140,60,50], [80,80,90], [120,90,60], [60,80,60],
];

export class TownRenderer {
  constructor(scene) {
    this.scene = scene;
    this.buildings = [];
    this.buildingSprites = [];
    this.houseSprites = [];

    this.drawGrass();
    this.drawRoads();
    this.drawPlots();
    this.drawDecorations();
  }

  drawGrass() {
    const totalRows = Math.ceil(44 / 6);
    const worldH = totalRows * ROW_HEIGHT + 100;
    const g = this.scene.add.graphics();
    g.setDepth(-10);
    this.scene.addTownObj(g);

    g.fillStyle(GRASS_1, 1);
    g.fillRect(-50, -50, TOWN_WORLD_W + 100, worldH + 100);

    const patchColors = [GRASS_2, GRASS_3, 0x70bc50, 0x5da840];
    const rng = (seed) => {
      let s = seed;
      return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    };
    const r = rng(42);
    for (let i = 0; i < 60; i++) {
      const px = r() * TOWN_WORLD_W;
      const py = r() * worldH;
      const pw = 30 + r() * 80;
      const ph = 20 + r() * 50;
      g.fillStyle(patchColors[Math.floor(r() * patchColors.length)], 0.3);
      g.fillRoundedRect(px, py, pw, ph, 8);
    }
  }

  drawRoads() {
    const totalRows = Math.ceil(44 / 6);
    const worldH = totalRows * ROW_HEIGHT + 100;
    const g = this.scene.add.graphics();
    g.setDepth(0);
    this.scene.addTownObj(g);

    // Vertical roads
    for (const rx of ROAD_V_POSITIONS) {
      // Outer curb
      g.fillStyle(rgb(185, 180, 170), 1);
      g.fillRect(rx - ROAD_THICK / 2 - 7, -50, ROAD_THICK + 14, worldH + 100);
      // Sidewalk
      g.fillStyle(SIDEWALK, 1);
      g.fillRect(rx - ROAD_THICK / 2 - 5, -50, ROAD_THICK + 10, worldH + 100);
      // Road surface
      g.fillStyle(ROAD_FILL, 1);
      g.fillRect(rx - ROAD_THICK / 2, -50, ROAD_THICK, worldH + 100);
      // Road texture (subtle horizontal lines)
      for (let dy = 0; dy < worldH + 100; dy += 8) {
        const shade = (dy % 16 < 8) ? 0x8a8882 : 0x8c8a84;
        g.fillStyle(shade, 0.3);
        g.fillRect(rx - ROAD_THICK / 2 + 1, -50 + dy, ROAD_THICK - 2, 1);
      }
      // 3D curb edges
      g.fillStyle(rgb(150, 145, 135), 1);
      g.fillRect(rx - ROAD_THICK / 2 - 1, -50, 3, worldH + 100);
      g.fillRect(rx + ROAD_THICK / 2 - 1, -50, 3, worldH + 100);
      // Double yellow center line
      const cx = rx;
      g.fillStyle(rgb(220, 200, 80), 1);
      g.fillRect(cx - 3, -50, 2, worldH + 100);
      g.fillRect(cx + 1, -50, 2, worldH + 100);
    }

    // Horizontal roads (only in commercial zone)
    for (let row = 0; row <= totalRows; row++) {
      const ry = row * ROW_HEIGHT + 15;
      // Outer curb
      g.fillStyle(rgb(185, 180, 170), 1);
      g.fillRect(-50, ry - ROAD_THICK / 2 - 5, COMMERCIAL_W + 100, ROAD_THICK + 10);
      // Sidewalk
      g.fillStyle(SIDEWALK, 1);
      g.fillRect(-50, ry - ROAD_THICK / 2 - 3, COMMERCIAL_W + 100, ROAD_THICK + 6);
      // Road surface
      g.fillStyle(ROAD_FILL, 1);
      g.fillRect(-50, ry - ROAD_THICK / 2, COMMERCIAL_W + 100, ROAD_THICK);
      // 3D curb edges
      g.fillStyle(rgb(150, 145, 135), 1);
      g.fillRect(-50, ry - ROAD_THICK / 2 - 1, COMMERCIAL_W + 100, 2);
      g.fillRect(-50, ry + ROAD_THICK / 2 - 1, COMMERCIAL_W + 100, 2);
      // Center dashes (white)
      for (let dx = 0; dx < COMMERCIAL_W; dx += 30) {
        g.fillStyle(ROAD_DASH, 1);
        g.fillRect(dx, ry - 1, 15, 2);
      }
    }
  }

  drawPlots() {
    this.plotGraphics = this.scene.add.graphics();
    this.plotGraphics.setDepth(1);
    this.scene.addTownObj(this.plotGraphics);
    this.plotLabels = [];
    this.refreshPlots();
  }

  drawDecorations() {
    const totalRows = Math.ceil(44 / 6);
    const worldH = totalRows * ROW_HEIGHT + 100;
    const g = this.scene.add.graphics();
    g.setDepth(3);
    this.scene.addTownObj(g);

    const rng = this.seededRng(777);

    // Trees scattered across the world
    const treePositions = [
      [50, 60], [240, 130], [480, 70], [830, 110], [950, 260],
      [50, 320], [520, 300], [770, 220], [180, 480], [480, 530],
      [120, 700], [600, 680], [830, 600], [350, 850], [700, 900],
      [60, 1000], [400, 1050], [900, 1000], [200, 1200], [750, 1150],
      // Neighbourhood trees
      [1120, 200], [1300, 100], [1450, 300], [1150, 500], [1400, 450],
    ];
    for (const [tx, ty] of treePositions) {
      if (this._overlapsRoad(tx, ty, 20, 30) || this._overlapsPlot(tx, ty, 20, 30)) continue;
      const scale = 0.7 + rng() * 0.6;
      this.drawTree(g, tx, ty, scale);
    }

    // Street lamps along vertical roads
    for (const roadX of ROAD_V_POSITIONS) {
      for (let ly = 60; ly < worldH; ly += 120) {
        if (this._onHorizontalRoad(ly)) continue;
        this.drawLamp(g, roadX - ROAD_THICK / 2 - 12, ly);
      }
      for (let ly = 120; ly < worldH; ly += 120) {
        if (this._onHorizontalRoad(ly)) continue;
        this.drawLamp(g, roadX + ROAD_THICK / 2 + 8, ly);
      }
    }

    // Bushes along roads
    const bushPositions = [
      [280, 60], [620, 90], [280, 200], [620, 250],
      [280, 340], [620, 380], [280, 500], [620, 550],
      [100, 180], [800, 180], [100, 450], [800, 450],
    ];
    for (const [bx, by] of bushPositions) {
      if (this._overlapsRoad(bx, by, 18, 10) || this._overlapsPlot(bx, by, 18, 10)) continue;
      this.drawBush(g, bx, by, 0.6 + rng() * 0.4);
    }

    // Flowers scattered on grass
    const flowerColors = [0xff6478, 0xffc850, 0xb478ff, 0x78c8ff, 0xff9664, 0xffb4c8];
    for (let i = 0; i < 40; i++) {
      const fx = rng() * TOWN_WORLD_W;
      const fy = rng() * worldH;
      if (this._overlapsRoad(fx, fy, 6, 6) || this._overlapsPlot(fx, fy, 6, 6)) continue;
      const fc = flowerColors[Math.floor(rng() * flowerColors.length)];
      // Stem
      g.fillStyle(0x3c8c32, 1);
      g.fillRect(fx, fy - 4, 1, 4);
      // Petals
      g.fillStyle(fc, 1);
      g.fillCircle(fx, fy - 5, 2);
      // Center
      g.fillStyle(0xffee44, 1);
      g.fillCircle(fx, fy - 5, 1);
    }

    // Park benches near roads
    const benchPositions = [
      [270, 50], [610, 130], [270, 280], [610, 400], [270, 520], [610, 650],
    ];
    for (const [bx, by] of benchPositions) {
      if (this._overlapsRoad(bx, by, 20, 10)) continue;
      this.drawBench(g, bx, by);
    }

    // Small ponds
    const pondPositions = [[70, 80, 36, 20], [470, 300, 30, 18], [170, 550, 34, 20]];
    for (const [px, py, pw, ph] of pondPositions) {
      if (this._overlapsPlot(px, py, pw, ph) || this._overlapsRoad(px, py, pw, ph)) continue;
      // Water
      g.fillStyle(rgb(100, 160, 210), 0.6);
      g.fillEllipse(px + pw / 2, py + ph / 2, pw, ph);
      // Highlight
      g.fillStyle(0xffffff, 0.2);
      g.fillEllipse(px + pw / 2 - 4, py + ph / 2 - 3, pw * 0.4, ph * 0.3);
      // Rim
      g.lineStyle(1, rgb(70, 130, 70), 0.5);
      g.strokeEllipse(px + pw / 2, py + ph / 2, pw + 2, ph + 2);
    }
  }

  drawTree(g, x, y, scale) {
    const s = scale;
    // Trunk
    g.fillStyle(rgb(120, 85, 50), 1);
    g.fillRect(x - 2 * s, y - 10 * s, 4 * s, 14 * s);
    // Shadow
    g.fillStyle(0x000000, 0.08);
    g.fillEllipse(x, y + 5 * s, 16 * s, 6 * s);
    // Foliage layers
    g.fillStyle(rgb(50, 130, 45), 1);
    g.fillCircle(x, y - 16 * s, 10 * s);
    g.fillStyle(rgb(60, 150, 55), 1);
    g.fillCircle(x - 3 * s, y - 14 * s, 8 * s);
    g.fillCircle(x + 4 * s, y - 18 * s, 7 * s);
    // Highlight
    g.fillStyle(rgb(80, 175, 65), 0.5);
    g.fillCircle(x - 2 * s, y - 20 * s, 5 * s);
  }

  drawBush(g, x, y, scale) {
    const s = scale;
    g.fillStyle(rgb(55, 120, 45), 1);
    g.fillEllipse(x, y, 14 * s, 8 * s);
    g.fillStyle(rgb(65, 140, 55), 0.7);
    g.fillEllipse(x - 3 * s, y - 1, 10 * s, 6 * s);
    g.fillEllipse(x + 4 * s, y + 1, 10 * s, 6 * s);
  }

  drawLamp(g, x, y) {
    // Pole
    g.fillStyle(rgb(80, 80, 90), 1);
    g.fillRect(x, y - 28, 2, 28);
    // Arm
    g.fillRect(x - 3, y - 28, 8, 2);
    // Lamp housing
    g.fillStyle(rgb(60, 60, 70), 1);
    g.fillRect(x - 2, y - 32, 6, 4);
    // Light glow
    g.fillStyle(0xffffcc, 0.15);
    g.fillCircle(x + 1, y - 28, 8);
    // Light
    g.fillStyle(0xffee88, 0.8);
    g.fillCircle(x + 1, y - 30, 3);
  }

  drawBench(g, x, y) {
    // Seat
    g.fillStyle(rgb(140, 90, 50), 1);
    g.fillRect(x, y, 18, 4);
    // Back
    g.fillStyle(rgb(120, 75, 40), 1);
    g.fillRect(x, y - 6, 18, 3);
    // Legs
    g.fillStyle(rgb(60, 60, 60), 1);
    g.fillRect(x + 2, y + 4, 2, 4);
    g.fillRect(x + 14, y + 4, 2, 4);
  }

  // Helpers for collision checking
  _overlapsRoad(x, y, w, h) {
    for (const rx of ROAD_V_POSITIONS) {
      if (x + w > rx - ROAD_THICK / 2 - 8 && x < rx + ROAD_THICK / 2 + 8) return true;
    }
    const totalRows = Math.ceil(44 / 6);
    for (let row = 0; row <= totalRows; row++) {
      const ry = row * ROW_HEIGHT + 15;
      if (y + h > ry - ROAD_THICK / 2 - 6 && y < ry + ROAD_THICK / 2 + 6) return true;
    }
    return false;
  }

  _overlapsPlot(x, y, w, h) {
    for (let i = 0; i < 72; i++) {
      const col = i % 6;
      const row = Math.floor(i / 6);
      const px = PLOT_COLS[col];
      const py = row * ROW_HEIGHT + 35;
      if (x + w > px && x < px + PLOT_W && y + h > py && y < py + PLOT_H) return true;
    }
    return false;
  }

  _onHorizontalRoad(y) {
    const totalRows = Math.ceil(44 / 6);
    for (let row = 0; row <= totalRows; row++) {
      const ry = row * ROW_HEIGHT + 15;
      if (y > ry - ROAD_THICK / 2 - 6 && y < ry + ROAD_THICK / 2 + 6) return true;
    }
    return false;
  }

  getPlotPosition(index) {
    const col = index % 6;
    const row = Math.floor(index / 6);
    const x = PLOT_COLS[col];
    const y = row * ROW_HEIGHT + 35;
    return { x, y };
  }

  refreshPlots() {
    this.plotGraphics.clear();

    // Destroy old plot labels
    for (const label of this.plotLabels) label.destroy();
    this.plotLabels = [];

    for (let i = 0; i < 72; i++) {
      const { x, y } = this.getPlotPosition(i);
      if (i < this.buildings.length) continue;

      // Light fill to distinguish from grass
      this.plotGraphics.fillStyle(0xffffff, 0.15);
      this.plotGraphics.fillRect(x, y, PLOT_W, PLOT_H);

      // Visible dashed border
      this.plotGraphics.lineStyle(1, 0xffffff, 0.45);
      const dashLen = 6;
      const gap = 4;
      for (let dx = 0; dx < PLOT_W; dx += dashLen + gap) {
        const len = Math.min(dashLen, PLOT_W - dx);
        this.plotGraphics.lineBetween(x + dx, y, x + dx + len, y);
        this.plotGraphics.lineBetween(x + dx, y + PLOT_H, x + dx + len, y + PLOT_H);
      }
      for (let dy = 0; dy < PLOT_H; dy += dashLen + gap) {
        const len = Math.min(dashLen, PLOT_H - dy);
        this.plotGraphics.lineBetween(x, y + dy, x, y + dy + len);
        this.plotGraphics.lineBetween(x + PLOT_W, y + dy, x + PLOT_W, y + dy + len);
      }

      // "FOR SALE" label
      const label = this.scene.add.text(x + PLOT_W / 2, y + PLOT_H / 2, 'FOR SALE', {
        fontFamily: 'Arial',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#3d7a2a',
        strokeThickness: 2,
      }).setOrigin(0.5, 0.5).setDepth(2).setAlpha(0.6);
      this.scene.addTownObj(label);
      this.plotLabels.push(label);
    }
  }

  updateBuildings(buildings) {
    for (const sprite of this.buildingSprites) {
      sprite.destroy();
    }
    this.buildingSprites = [];
    this.buildings = buildings;

    this.refreshPlots();

    for (let i = 0; i < buildings.length && i < 72; i++) {
      const name = buildings[i];
      const { x, y } = this.getPlotPosition(i);
      const imageKey = BUILDING_IMAGES[name];

      if (imageKey && this.scene.textures.exists(imageKey)) {
        this.drawImageBuilding(name, imageKey, x, y);
      } else {
        this.drawColorBuilding(name, x, y);
      }
    }

    // Update neighbourhood based on current population
    const pop = this.scene.gameState ? this.scene.gameState.population : 0;
    this.updateNeighbourhood(pop);
  }

  // Helper: create a graphics/image for the town layer
  _addTownGraphics() {
    const g = this.scene.add.graphics();
    this.scene.addTownObj(g);
    this.buildingSprites.push(g);
    return g;
  }

  drawImageBuilding(name, imageKey, x, y) {
    const bw = PLOT_W - 10;
    const bh = PLOT_H - 10;
    const bx = x + 5;
    const by = y + 5;

    const [cr, cg, cb] = BUILDING_COLORS[name] || [128, 128, 128];
    const sideColor = rgb(
      Math.max(0, cr - 40), Math.max(0, cg - 40), Math.max(0, cb - 40)
    );
    const topColor = rgb(
      Math.min(255, cr + 30), Math.min(255, cg + 30), Math.min(255, cb + 30)
    );

    const g = this._addTownGraphics();
    g.setDepth(by + bh);

    g.fillStyle(sideColor, 1);
    g.fillPoints([
      { x: bx + bw, y: by },
      { x: bx + bw + SIDE_DX, y: by + SIDE_DY },
      { x: bx + bw + SIDE_DX, y: by + bh + SIDE_DY },
      { x: bx + bw, y: by + bh },
    ], true);

    g.fillStyle(topColor, 1);
    g.fillPoints([
      { x: bx, y: by },
      { x: bx + SIDE_DX, y: by + SIDE_DY },
      { x: bx + bw + SIDE_DX, y: by + SIDE_DY },
      { x: bx + bw, y: by },
    ], true);

    const img = this.scene.add.image(bx + bw / 2, by + bh / 2, imageKey);
    img.setDisplaySize(bw, bh);
    img.setDepth(by + bh + 1);
    this.scene.addTownObj(img);
    this.buildingSprites.push(img);
  }

  drawColorBuilding(name, x, y) {
    const bw = PLOT_W - 10;
    const bh = PLOT_H - 10;
    const bx = x + 5;
    const by = y + 5;

    const [cr, cg, cb] = BUILDING_COLORS[name] || [128, 128, 128];
    const baseColor = rgb(cr, cg, cb);
    const sideColor = rgb(
      Math.max(0, cr - 40), Math.max(0, cg - 40), Math.max(0, cb - 40)
    );
    const topColor = rgb(
      Math.min(255, cr + 30), Math.min(255, cg + 30), Math.min(255, cb + 30)
    );

    const g = this._addTownGraphics();
    g.setDepth(by + bh);

    g.fillStyle(sideColor, 1);
    g.fillPoints([
      { x: bx + bw, y: by },
      { x: bx + bw + SIDE_DX, y: by + SIDE_DY },
      { x: bx + bw + SIDE_DX, y: by + bh + SIDE_DY },
      { x: bx + bw, y: by + bh },
    ], true);

    g.fillStyle(topColor, 1);
    g.fillPoints([
      { x: bx, y: by },
      { x: bx + SIDE_DX, y: by + SIDE_DY },
      { x: bx + bw + SIDE_DX, y: by + SIDE_DY },
      { x: bx + bw, y: by },
    ], true);

    g.fillStyle(baseColor, 1);
    g.fillRect(bx, by, bw, bh);

    g.lineStyle(1, 0x333333, 0.3);
    g.strokeRect(bx, by, bw, bh);

    const winRows = Math.min(3, Math.floor(bh / 25));
    const winCols = Math.min(4, Math.floor(bw / 22));
    const winW = 10;
    const winH = 12;
    const winColor = rgb(
      Math.min(255, cr + 60), Math.min(255, cg + 60), Math.min(255, cb + 60)
    );
    for (let wr = 0; wr < winRows; wr++) {
      for (let wc = 0; wc < winCols; wc++) {
        const wx = bx + 8 + wc * (bw - 16) / Math.max(1, winCols - 1) - winW / 2;
        const wy = by + 10 + wr * 25;
        if (winCols === 1) {
          g.fillStyle(winColor, 0.6);
          g.fillRect(bx + bw / 2 - winW / 2, wy, winW, winH);
        } else {
          g.fillStyle(winColor, 0.6);
          g.fillRect(wx, wy, winW, winH);
        }
      }
    }

    const label = this.scene.add.text(bx + bw / 2, by + bh - 8, name, {
      fontFamily: 'Arial',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(by + bh + 2);
    this.scene.addTownObj(label);
    this.buildingSprites.push(label);
  }

  // --- Residential Neighbourhood ---

  getHousePositions(population) {
    const numHouses = population >= 100 ? Math.max(1, Math.floor(population / 100)) : 0;
    if (numHouses === 0) return [];
    const cols = 6;
    const colSpacing = HOUSE_W + 40;
    const rowSpacing = HOUSE_H + 50;
    const positions = [];
    for (let i = 0; i < numHouses; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions.push({
        x: NEIGHBOURHOOD_X + col * colSpacing,
        y: 30 + row * rowSpacing,
        seed: i,
      });
    }
    return positions;
  }

  seededRng(seed) {
    let s = (seed * 137 + 53) | 0;
    return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }

  updateNeighbourhood(population) {
    // Clean up old neighbourhood sprites
    if (this.houseSprites) {
      for (const s of this.houseSprites) s.destroy();
    }
    this.houseSprites = [];

    const positions = this.getHousePositions(population);
    if (positions.length === 0) return;

    // "Neighbourhood" label
    const lx = positions[0].x;
    const ly = positions[0].y - 20;
    const label = this.scene.add.text(lx + 40, ly, 'Neighbourhood', {
      fontFamily: 'Arial',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#645032',
      backgroundColor: 'rgba(255,255,255,0.7)',
      padding: { x: 8, y: 3 },
    }).setOrigin(0, 0.5).setDepth(5);
    this.scene.addTownObj(label);
    this.houseSprites.push(label);

    // Draw each house
    for (const pos of positions) {
      this.drawHouse(pos.x, pos.y, pos.seed);
    }
  }

  drawHouse(x, y, seed) {
    const rng = this.seededRng(seed);
    const hc = HOUSE_COLORS[Math.floor(rng() * HOUSE_COLORS.length)];
    const rc = ROOF_COLORS[Math.floor(rng() * ROOF_COLORS.length)];

    const wallColor = rgb(hc[0], hc[1], hc[2]);
    const darkWall = rgb(Math.max(0,hc[0]-40), Math.max(0,hc[1]-40), Math.max(0,hc[2]-40));
    const lightWall = rgb(Math.min(255,hc[0]+30), Math.min(255,hc[1]+30), Math.min(255,hc[2]+30));
    const roofColor = rgb(rc[0], rc[1], rc[2]);
    const darkRoof = rgb(Math.max(0,rc[0]-30), Math.max(0,rc[1]-30), Math.max(0,rc[2]-30));

    const w = 28, hBody = 28;
    const roofPeakY = y;
    const wallTop = y + 17;  // roof is 17px tall
    const bottom = wallTop + hBody;
    const eave = 4;
    const sideDx = 8, sideDy = -8;

    const g = this._addTownGraphics();
    g.setDepth(bottom);

    // Shadow
    g.fillStyle(0x000000, 0.1);
    g.fillEllipse(x + w / 2, bottom + 3, w + 10, 8);

    // Front wall
    g.fillStyle(wallColor, 1);
    g.fillRect(x, wallTop, w, hBody);
    // Siding lines
    g.lineStyle(1, darkWall, 0.3);
    for (let sy = 4; sy < hBody - 2; sy += 5) {
      g.lineBetween(x + 1, wallTop + sy, x + w - 1, wallTop + sy);
    }
    // Foundation
    g.fillStyle(rgb(120, 115, 110), 1);
    g.fillRect(x, wallTop + hBody - 3, w, 3);

    // 3D side face
    g.fillStyle(darkWall, 1);
    g.fillPoints([
      { x: x + w, y: wallTop },
      { x: x + w + sideDx, y: wallTop + sideDy },
      { x: x + w + sideDx, y: bottom + sideDy },
      { x: x + w, y: bottom },
    ], true);

    // Pitched roof (front triangle)
    g.fillStyle(roofColor, 1);
    g.fillTriangle(
      x - eave, wallTop,
      x + w / 2, roofPeakY,
      x + w + eave, wallTop
    );
    // Roof outline
    g.lineStyle(1, darkRoof, 0.8);
    g.strokeTriangle(
      x - eave, wallTop,
      x + w / 2, roofPeakY,
      x + w + eave, wallTop
    );
    // Shingle lines
    for (let ry = 3; ry < 17; ry += 4) {
      const t = ry / 17;
      const lx = Math.floor(x + w / 2 - (w / 2 + eave) * t);
      const rx = Math.floor(x + w / 2 + (w / 2 + eave) * t);
      g.lineBetween(lx, roofPeakY + ry, rx, roofPeakY + ry);
    }

    // Roof side face
    g.fillStyle(darkRoof, 1);
    g.fillPoints([
      { x: x + w + eave, y: wallTop },
      { x: x + w / 2, y: roofPeakY },
      { x: x + w / 2 + sideDx, y: roofPeakY + sideDy },
      { x: x + w + eave + sideDx, y: wallTop + sideDy },
    ], true);

    // Chimney (50% chance)
    if (rng() < 0.5) {
      const chimColor = rng() < 0.5 ? rgb(140, 100, 80) : rgb(120, 115, 110);
      g.fillStyle(chimColor, 1);
      g.fillRect(x + w - 8, roofPeakY - 2, 5, 12);
      g.fillStyle(rgb(100, 95, 90), 1);
      g.fillRect(x + w - 9, roofPeakY - 4, 7, 2);
    }

    // Door
    const doorX = x + w / 2 - 4;
    const doorY = wallTop + hBody - 16;
    const doorColors = [rgb(90,60,40), rgb(60,80,50), rgb(80,40,40), rgb(50,50,80)];
    const doorColor = doorColors[Math.floor(rng() * doorColors.length)];
    g.fillStyle(doorColor, 1);
    g.fillRect(doorX, doorY, 8, 13);
    g.lineStyle(1, 0x000000, 0.2);
    g.strokeRect(doorX, doorY, 8, 13);
    // Doorstep
    g.fillStyle(rgb(150, 145, 135), 1);
    g.fillRect(doorX - 1, doorY + 13, 10, 3);
    // Doorknob
    g.fillStyle(0xccaa44, 1);
    g.fillCircle(doorX + 6, doorY + 8, 1);

    // Windows
    const winGlass = rgb(180, 210, 240);
    const winY = wallTop + 7;
    // Left window
    g.fillStyle(lightWall, 1);
    g.fillRect(x + 2, winY - 1, 10, 10);
    g.fillStyle(winGlass, 1);
    g.fillRect(x + 3, winY, 8, 8);
    g.lineStyle(1, darkWall, 0.6);
    g.lineBetween(x + 7, winY, x + 7, winY + 8);
    g.lineBetween(x + 3, winY + 4, x + 11, winY + 4);
    // Window sill
    g.fillStyle(lightWall, 1);
    g.fillRect(x + 2, winY + 8, 10, 2);

    // Right window
    const w2x = x + w - 11;
    g.fillStyle(lightWall, 1);
    g.fillRect(w2x, winY - 1, 10, 10);
    g.fillStyle(winGlass, 1);
    g.fillRect(w2x + 1, winY, 8, 8);
    g.lineStyle(1, darkWall, 0.6);
    g.lineBetween(w2x + 5, winY, w2x + 5, winY + 8);
    g.lineBetween(w2x + 1, winY + 4, w2x + 9, winY + 4);
    g.fillStyle(lightWall, 1);
    g.fillRect(w2x, winY + 8, 10, 2);

    // House number
    const houseNum = (seed % 42) + 1;
    const numLabel = this.scene.add.text(doorX + 4, doorY - 10, `${houseNum}`, {
      fontFamily: 'Arial',
      fontSize: '7px',
      color: '#ddd',
      stroke: '#333',
      strokeThickness: 1,
    }).setOrigin(0.5, 0.5).setDepth(bottom + 1);
    this.scene.addTownObj(numLabel);
    this.houseSprites.push(numLabel);

    // Garden (50% chance)
    if (rng() < 0.5) {
      const gardenColors = [0x3c963c, 0x46a03c, 0x508c32];
      for (let gi = 0; gi < 3; gi++) {
        const gc = gardenColors[Math.floor(rng() * gardenColors.length)];
        g.fillStyle(gc, 1);
        g.fillCircle(x + Math.floor(rng() * 12), bottom + 1, 2 + Math.floor(rng() * 2));
      }
      // Tiny flower
      const flowerColors = [0xff6478, 0xffc850, 0xb478ff];
      g.fillStyle(flowerColors[Math.floor(rng() * flowerColors.length)], 1);
      g.fillCircle(x + 5, bottom - 1, 1);
    }
  }

  depthSort() {
    // Buildings depth-sorted by y at creation; player updates own depth
  }
}
