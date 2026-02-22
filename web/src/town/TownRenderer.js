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
      // Double yellow center line — break at intersections
      const cx = rx;
      g.fillStyle(rgb(220, 200, 80), 1);
      let prevY = -50;
      for (let row = 0; row <= totalRows; row++) {
        const ry = row * ROW_HEIGHT + 15;
        const gapTop = ry - ROAD_THICK / 2;
        const gapBot = ry + ROAD_THICK / 2;
        // Draw segment from prevY to gapTop
        if (gapTop > prevY) {
          g.fillRect(cx - 3, prevY, 2, gapTop - prevY);
          g.fillRect(cx + 1, prevY, 2, gapTop - prevY);
        }
        prevY = gapBot;
      }
      // Final segment from last intersection to end
      if (prevY < worldH + 50) {
        g.fillRect(cx - 3, prevY, 2, worldH + 50 - prevY);
        g.fillRect(cx + 1, prevY, 2, worldH + 50 - prevY);
      }
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
      // Center dashes (white) — skip intersection zones
      for (let dx = 0; dx < COMMERCIAL_W; dx += 30) {
        let inIntersection = false;
        for (const vx of ROAD_V_POSITIONS) {
          if (dx + 15 > vx - ROAD_THICK / 2 && dx < vx + ROAD_THICK / 2) {
            inIntersection = true;
            break;
          }
        }
        if (!inIntersection) {
          g.fillStyle(ROAD_DASH, 1);
          g.fillRect(dx, ry - 1, 15, 2);
        }
      }
    }

    // Road intersections — clean surface + crosswalk markings
    const halfR = ROAD_THICK / 2;
    for (const rx of ROAD_V_POSITIONS) {
      for (let row = 0; row <= totalRows; row++) {
        const ry = row * ROW_HEIGHT + 15;

        // Clean road surface at intersection (covers yellow lines)
        g.fillStyle(ROAD_FILL, 1);
        g.fillRect(rx - halfR, ry - halfR, ROAD_THICK, ROAD_THICK);

        // Crosswalk stripes on all four approaches
        g.fillStyle(0xffffff, 0.55);
        const stripeW = 5, stripeGap = 8;
        const numStripes = Math.floor(ROAD_THICK / stripeGap);

        // North approach (above intersection)
        for (let i = 0; i < numStripes; i++) {
          g.fillRect(rx - halfR + 3 + i * stripeGap, ry - halfR - 5, stripeW, 4);
        }
        // South approach (below intersection)
        for (let i = 0; i < numStripes; i++) {
          g.fillRect(rx - halfR + 3 + i * stripeGap, ry + halfR + 1, stripeW, 4);
        }
        // West approach (left of intersection)
        for (let i = 0; i < numStripes; i++) {
          g.fillRect(rx - halfR - 5, ry - halfR + 3 + i * stripeGap, 4, stripeW);
        }
        // East approach (right of intersection)
        for (let i = 0; i < numStripes; i++) {
          g.fillRect(rx + halfR + 1, ry - halfR + 3 + i * stripeGap, 4, stripeW);
        }
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
    const sideColor = rgb(Math.max(0, cr - 40), Math.max(0, cg - 40), Math.max(0, cb - 40));
    const topColor = rgb(Math.min(255, cr + 30), Math.min(255, cg + 30), Math.min(255, cb + 30));
    const lightColor = rgb(Math.min(255, cr + 60), Math.min(255, cg + 60), Math.min(255, cb + 60));
    const darkColor = rgb(Math.max(0, cr - 60), Math.max(0, cg - 60), Math.max(0, cb - 60));

    const g = this._addTownGraphics();
    g.setDepth(by + bh);

    // 3D side face
    g.fillStyle(sideColor, 1);
    g.fillPoints([
      { x: bx + bw, y: by }, { x: bx + bw + SIDE_DX, y: by + SIDE_DY },
      { x: bx + bw + SIDE_DX, y: by + bh + SIDE_DY }, { x: bx + bw, y: by + bh },
    ], true);
    // 3D top face
    g.fillStyle(topColor, 1);
    g.fillPoints([
      { x: bx, y: by }, { x: bx + SIDE_DX, y: by + SIDE_DY },
      { x: bx + bw + SIDE_DX, y: by + SIDE_DY }, { x: bx + bw, y: by },
    ], true);
    // Front face
    g.fillStyle(baseColor, 1);
    g.fillRect(bx, by, bw, bh);
    g.lineStyle(1, 0x333333, 0.3);
    g.strokeRect(bx, by, bw, bh);

    // Draw building-specific details
    this._drawBuildingDetails(g, name, bx, by, bw, bh, cr, cg, cb, baseColor, sideColor, lightColor, darkColor);

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

  _drawBuildingDetails(g, name, bx, by, bw, bh, cr, cg, cb, base, side, light, dark) {
    const cx = bx + bw / 2, cy = by + bh / 2;
    switch (name) {
      case 'Flower Shop': {
        // Green striped awning
        g.fillStyle(rgb(60, 160, 60), 1);
        g.fillRect(bx, by, bw, 12);
        for (let i = 0; i < bw; i += 12) {
          g.fillStyle(rgb(40, 130, 40), 1);
          g.fillRect(bx + i, by, 6, 12);
        }
        // Display window with flowers
        g.fillStyle(rgb(200, 230, 200), 0.8);
        g.fillRect(bx + 6, by + 16, bw - 12, 35);
        g.lineStyle(1, rgb(80, 60, 40), 0.8);
        g.strokeRect(bx + 6, by + 16, bw - 12, 35);
        // Flower pots in window
        const flowerC = [0xff6088, 0xffcc44, 0xff88cc, 0xaa66ff, 0xff8844];
        for (let i = 0; i < 5; i++) {
          const fx = bx + 14 + i * 18;
          g.fillStyle(rgb(160, 90, 50), 1);
          g.fillRect(fx - 3, by + 42, 8, 8);
          g.fillStyle(0x44aa33, 1);
          g.fillRect(fx, by + 34, 2, 8);
          g.fillStyle(flowerC[i], 1);
          g.fillCircle(fx + 1, by + 32, 4);
          g.fillStyle(0xffee44, 1);
          g.fillCircle(fx + 1, by + 32, 1.5);
        }
        // Door
        g.fillStyle(rgb(80, 50, 30), 1);
        g.fillRect(cx - 8, by + bh - 28, 16, 28);
        break;
      }
      case 'Bakery': {
        // Warm awning
        g.fillStyle(rgb(180, 120, 60), 1);
        g.fillRect(bx, by, bw, 10);
        // Display window with pastries
        g.fillStyle(rgb(255, 240, 210), 0.85);
        g.fillRect(bx + 6, by + 14, bw - 12, 30);
        // Bread/pastry shapes
        g.fillStyle(rgb(200, 160, 80), 1);
        g.fillEllipse(bx + 20, by + 30, 14, 8);
        g.fillEllipse(bx + 45, by + 28, 10, 10);
        g.fillEllipse(bx + 70, by + 30, 16, 7);
        g.fillStyle(rgb(220, 180, 100), 1);
        g.fillEllipse(bx + 90, by + 30, 12, 9);
        // Oven glow at bottom
        g.fillStyle(rgb(255, 140, 40), 0.3);
        g.fillRect(bx + 10, by + bh - 30, bw - 20, 14);
        // Chimney smoke
        g.fillStyle(rgb(200, 200, 200), 0.3);
        g.fillCircle(bx + bw - 15, by - 5, 5);
        g.fillCircle(bx + bw - 18, by - 12, 4);
        // Door
        g.fillStyle(rgb(140, 80, 40), 1);
        g.fillRect(cx - 7, by + bh - 26, 14, 26);
        break;
      }
      case 'Bookstore': {
        // Wood frame
        g.fillStyle(rgb(100, 70, 40), 1);
        g.fillRect(bx + 4, by + 4, bw - 8, 8);
        // Window with bookshelves
        g.fillStyle(rgb(240, 230, 200), 0.9);
        g.fillRect(bx + 6, by + 14, bw - 12, 40);
        // Book rows
        const bookColors = [0xcc3333, 0x3366cc, 0x33aa55, 0xccaa33, 0x8833cc, 0xcc6633];
        for (let row = 0; row < 3; row++) {
          for (let b = 0; b < 8; b++) {
            g.fillStyle(bookColors[(row * 8 + b) % bookColors.length], 1);
            g.fillRect(bx + 10 + b * 11, by + 17 + row * 13, 8, 11);
          }
          g.fillStyle(rgb(120, 90, 60), 1);
          g.fillRect(bx + 8, by + 28 + row * 13, bw - 16, 2);
        }
        // Door
        g.fillStyle(rgb(90, 60, 30), 1);
        g.fillRect(cx - 7, by + bh - 24, 14, 24);
        // Reading lamp
        g.fillStyle(0xffee66, 0.4);
        g.fillCircle(bx + 15, by + 10, 6);
        break;
      }
      case 'Pizza Place': {
        // Red/white awning
        g.fillStyle(rgb(200, 40, 30), 1);
        g.fillRect(bx, by, bw, 10);
        for (let i = 0; i < bw; i += 14) {
          g.fillStyle(0xffffff, 1);
          g.fillRect(bx + i, by, 7, 10);
        }
        // Pizza shape in window
        g.fillStyle(rgb(220, 200, 120), 0.9);
        g.fillRect(bx + 8, by + 14, bw - 16, 35);
        g.fillStyle(rgb(230, 190, 80), 1);
        g.fillCircle(cx, by + 32, 14);
        // Pepperoni
        g.fillStyle(rgb(180, 40, 30), 1);
        g.fillCircle(cx - 5, by + 28, 3);
        g.fillCircle(cx + 6, by + 30, 3);
        g.fillCircle(cx - 2, by + 36, 3);
        g.fillCircle(cx + 4, by + 24, 2);
        // Oven glow
        g.fillStyle(rgb(255, 100, 20), 0.25);
        g.fillRect(bx + 8, by + bh - 30, bw - 16, 14);
        // Door
        g.fillStyle(rgb(140, 30, 20), 1);
        g.fillRect(cx - 7, by + bh - 24, 14, 24);
        break;
      }
      case 'Gym': {
        // Metal facade
        g.fillStyle(rgb(90, 90, 90), 1);
        g.fillRect(bx + 4, by + 4, bw - 8, 10);
        // Windows
        g.fillStyle(rgb(180, 220, 255), 0.7);
        g.fillRect(bx + 6, by + 18, bw - 12, 25);
        // Dumbbell icon
        g.fillStyle(rgb(50, 50, 50), 1);
        g.fillRect(cx - 18, cy - 2, 36, 4);
        g.fillRect(cx - 20, cy - 8, 6, 16);
        g.fillRect(cx + 14, cy - 8, 6, 16);
        g.fillRect(cx - 24, cy - 6, 4, 12);
        g.fillRect(cx + 20, cy - 6, 4, 12);
        // Door
        g.fillStyle(rgb(50, 50, 50), 1);
        g.fillRect(cx - 10, by + bh - 28, 20, 28);
        g.fillStyle(rgb(200, 200, 200), 1);
        g.fillRect(cx - 1, by + bh - 22, 2, 16);
        break;
      }
      case 'Hospital': {
        // Red cross
        g.fillStyle(rgb(220, 30, 30), 1);
        g.fillRect(cx - 4, by + 8, 8, 24);
        g.fillRect(cx - 12, by + 16, 24, 8);
        // Windows (blue tint)
        g.fillStyle(rgb(200, 220, 255), 0.7);
        for (let r = 0; r < 2; r++) {
          for (let c = 0; c < 4; c++) {
            g.fillRect(bx + 8 + c * 24, by + 38 + r * 20, 16, 14);
            g.lineStyle(1, rgb(180, 180, 200), 0.5);
            g.strokeRect(bx + 8 + c * 24, by + 38 + r * 20, 16, 14);
          }
        }
        // Entrance
        g.fillStyle(rgb(220, 220, 230), 1);
        g.fillRect(cx - 12, by + bh - 24, 24, 24);
        g.fillStyle(rgb(180, 200, 220), 1);
        g.fillRect(cx - 1, by + bh - 24, 2, 20);
        break;
      }
      case 'Library': {
        // Columns
        g.fillStyle(rgb(200, 190, 170), 1);
        g.fillRect(bx + 8, by + 10, 8, bh - 20);
        g.fillRect(bx + bw - 16, by + 10, 8, bh - 20);
        g.fillRect(cx - 4, by + 10, 8, bh - 20);
        // Pediment (triangular top)
        g.fillStyle(rgb(180, 170, 150), 1);
        g.fillTriangle(bx + 2, by + 10, cx, by - 2, bx + bw - 2, by + 10);
        // Arch windows
        g.fillStyle(rgb(180, 200, 220), 0.7);
        g.fillRect(bx + 22, by + 20, 20, 30);
        g.fillRect(bx + bw - 42, by + 20, 20, 30);
        // Books through window
        g.fillStyle(rgb(180, 50, 30), 0.6);
        g.fillRect(bx + 24, by + 35, 4, 12);
        g.fillStyle(rgb(30, 80, 160), 0.6);
        g.fillRect(bx + 30, by + 35, 4, 12);
        // Door
        g.fillStyle(rgb(120, 100, 70), 1);
        g.fillRect(cx - 8, by + bh - 26, 16, 26);
        break;
      }
      case 'Museum': {
        // Classical columns
        for (let i = 0; i < 5; i++) {
          const mx = bx + 10 + i * 22;
          g.fillStyle(rgb(220, 210, 190), 1);
          g.fillRect(mx, by + 14, 6, bh - 28);
          g.fillStyle(rgb(200, 190, 170), 1);
          g.fillRect(mx - 1, by + 12, 8, 4);
          g.fillRect(mx - 1, by + bh - 16, 8, 4);
        }
        // Pediment
        g.fillStyle(rgb(210, 200, 180), 1);
        g.fillTriangle(bx, by + 14, cx, by, bx + bw, by + 14);
        g.lineStyle(1, rgb(170, 160, 140), 0.6);
        g.strokeTriangle(bx, by + 14, cx, by, bx + bw, by + 14);
        // Grand entrance
        g.fillStyle(rgb(100, 80, 60), 1);
        g.fillRect(cx - 12, by + bh - 30, 24, 30);
        g.fillStyle(rgb(140, 120, 100), 1);
        g.fillRect(cx - 10, by + bh - 28, 20, 2);
        break;
      }
      case 'Stadium': {
        // Arched roof
        g.fillStyle(rgb(110, 160, 80), 1);
        g.fillRect(bx + 4, by + 8, bw - 8, 6);
        // Field green inside
        g.fillStyle(rgb(60, 160, 50), 0.8);
        g.fillRect(bx + 8, by + 20, bw - 16, 40);
        // Field lines
        g.lineStyle(1, 0xffffff, 0.5);
        g.lineBetween(cx, by + 20, cx, by + 60);
        g.strokeCircle(cx, by + 40, 10);
        // Bleachers (rows)
        for (let r = 0; r < 3; r++) {
          g.fillStyle(rgb(120 + r * 20, 120 + r * 20, 130 + r * 20), 1);
          g.fillRect(bx + 6, by + 62 + r * 8, bw - 12, 6);
        }
        // Entrance
        g.fillStyle(rgb(60, 100, 40), 1);
        g.fillRect(cx - 10, by + bh - 18, 20, 18);
        break;
      }
      case 'Airport': {
        // Control tower
        g.fillStyle(rgb(160, 175, 190), 1);
        g.fillRect(bx + bw - 22, by + 4, 16, 40);
        // Tower windows (wrap-around glass)
        g.fillStyle(rgb(150, 210, 240), 0.8);
        g.fillRect(bx + bw - 20, by + 8, 12, 10);
        // Runway stripe
        g.fillStyle(rgb(80, 80, 80), 1);
        g.fillRect(bx + 6, by + bh - 16, bw - 30, 10);
        g.fillStyle(0xffffff, 0.7);
        for (let d = 0; d < bw - 34; d += 12) {
          g.fillRect(bx + 10 + d, by + bh - 12, 6, 2);
        }
        // Terminal windows
        g.fillStyle(rgb(180, 210, 230), 0.6);
        for (let c = 0; c < 4; c++) {
          g.fillRect(bx + 8 + c * 18, by + 20, 12, 20);
        }
        // Door
        g.fillStyle(rgb(120, 140, 160), 1);
        g.fillRect(bx + 8, by + bh - 28, 20, 12);
        break;
      }
      case 'Underwater Base': {
        // Water tint
        g.fillStyle(rgb(20, 80, 140), 0.3);
        g.fillRect(bx, by, bw, bh);
        // Dome
        g.fillStyle(rgb(120, 180, 220), 0.6);
        g.fillEllipse(cx, by + 15, bw - 20, 24);
        // Portholes
        for (let i = 0; i < 3; i++) {
          const px = bx + 18 + i * 30;
          g.fillStyle(rgb(60, 140, 180), 1);
          g.fillCircle(px, cy + 5, 8);
          g.fillStyle(rgb(100, 180, 220), 0.7);
          g.fillCircle(px, cy + 5, 6);
          g.lineStyle(2, rgb(80, 80, 90), 1);
          g.strokeCircle(px, cy + 5, 8);
        }
        // Bubbles
        g.fillStyle(rgb(150, 200, 240), 0.4);
        g.fillCircle(bx + 12, by + 10, 3);
        g.fillCircle(bx + 20, by + 5, 2);
        g.fillCircle(bx + bw - 15, by + 8, 4);
        // Airlock
        g.fillStyle(rgb(60, 100, 130), 1);
        g.fillRect(cx - 8, by + bh - 20, 16, 20);
        break;
      }
      case 'Sky Castle': {
        // Clouds at base
        g.fillStyle(0xffffff, 0.6);
        g.fillEllipse(bx + 15, by + bh - 5, 30, 12);
        g.fillEllipse(cx, by + bh, 40, 14);
        g.fillEllipse(bx + bw - 15, by + bh - 3, 28, 10);
        // Towers
        g.fillStyle(rgb(180, 200, 240), 1);
        g.fillRect(bx + 8, by + 10, 18, bh - 25);
        g.fillRect(bx + bw - 26, by + 10, 18, bh - 25);
        // Battlements
        for (let i = 0; i < 3; i++) {
          g.fillRect(bx + 6 + i * 7, by + 6, 5, 6);
          g.fillRect(bx + bw - 28 + i * 7, by + 6, 5, 6);
        }
        // Center wall
        g.fillStyle(rgb(190, 210, 245), 1);
        g.fillRect(bx + 26, by + 20, bw - 52, bh - 35);
        // Gate
        g.fillStyle(rgb(120, 140, 170), 1);
        g.fillRect(cx - 8, by + bh - 30, 16, 15);
        // Flag
        g.fillStyle(rgb(60, 60, 70), 1);
        g.fillRect(cx, by - 2, 2, 14);
        g.fillStyle(0xff4444, 1);
        g.fillTriangle(cx + 2, by - 2, cx + 12, by + 3, cx + 2, by + 8);
        // Tower windows
        g.fillStyle(rgb(130, 170, 220), 0.7);
        g.fillRect(bx + 13, by + 22, 8, 8);
        g.fillRect(bx + bw - 21, by + 22, 8, 8);
        break;
      }
      case 'Robot Factory': {
        // Smokestack
        g.fillStyle(rgb(120, 120, 130), 1);
        g.fillRect(bx + bw - 18, by - 8, 10, 20);
        // Smoke
        g.fillStyle(rgb(180, 180, 180), 0.3);
        g.fillCircle(bx + bw - 13, by - 14, 5);
        g.fillCircle(bx + bw - 16, by - 22, 4);
        // Gear
        g.lineStyle(2, rgb(100, 100, 110), 0.8);
        g.strokeCircle(bx + 25, by + 25, 12);
        g.fillStyle(rgb(100, 100, 110), 0.8);
        g.fillCircle(bx + 25, by + 25, 5);
        // Conveyor belt
        g.fillStyle(rgb(80, 80, 80), 1);
        g.fillRect(bx + 6, by + bh - 14, bw - 12, 6);
        for (let i = 0; i < bw - 16; i += 8) {
          g.fillStyle(rgb(100, 100, 100), 1);
          g.fillRect(bx + 8 + i, by + bh - 14, 2, 6);
        }
        // Robot arm
        g.fillStyle(rgb(160, 160, 170), 1);
        g.fillRect(bx + 50, by + 16, 4, 30);
        g.fillRect(bx + 46, by + 14, 12, 4);
        // Door
        g.fillStyle(rgb(100, 110, 120), 1);
        g.fillRect(cx - 8, by + bh - 26, 16, 12);
        break;
      }
      case 'Volcano Lair': {
        // Volcano shape
        g.fillStyle(rgb(140, 40, 15), 1);
        g.fillTriangle(bx, by + bh, cx, by + 5, bx + bw, by + bh);
        // Lava streaks
        g.fillStyle(rgb(255, 140, 30), 0.7);
        g.fillTriangle(cx - 3, by + 20, cx, by + 10, cx + 3, by + 20);
        g.lineStyle(2, rgb(255, 100, 20), 0.6);
        g.lineBetween(cx - 8, by + 25, cx - 15, by + bh - 10);
        g.lineBetween(cx + 5, by + 22, cx + 12, by + bh - 5);
        // Crater glow
        g.fillStyle(rgb(255, 160, 40), 0.4);
        g.fillCircle(cx, by + 8, 8);
        // Evil door
        g.fillStyle(rgb(60, 20, 10), 1);
        g.fillRect(cx - 6, by + bh - 20, 12, 16);
        g.fillStyle(0xff3333, 1);
        g.fillCircle(cx, by + bh - 14, 2);
        break;
      }
      case 'Crystal Palace': {
        // Large crystals
        const crystalColors = [rgb(200, 180, 240), rgb(180, 160, 230), rgb(220, 200, 255), rgb(160, 140, 220)];
        for (let i = 0; i < 4; i++) {
          const cxx = bx + 12 + i * 24;
          const ch = 30 + (i % 2) * 15;
          g.fillStyle(crystalColors[i], 1);
          g.fillTriangle(cxx, by + bh - 10, cxx + 8, by + bh - ch, cxx + 16, by + bh - 10);
          g.fillStyle(crystalColors[(i + 1) % 4], 0.5);
          g.fillTriangle(cxx + 8, by + bh - ch, cxx + 16, by + bh - 10, cxx + 12, by + bh - ch + 5);
        }
        // Sparkles
        g.fillStyle(0xffffff, 0.8);
        g.fillCircle(bx + 20, by + 30, 2);
        g.fillCircle(bx + 55, by + 20, 1.5);
        g.fillCircle(bx + 80, by + 35, 2);
        g.fillCircle(bx + 40, by + 15, 1);
        break;
      }
      case 'Time Machine': {
        // Clock face
        g.fillStyle(rgb(80, 180, 160), 0.3);
        g.fillCircle(cx, cy - 5, 30);
        g.lineStyle(2, rgb(60, 160, 140), 0.8);
        g.strokeCircle(cx, cy - 5, 30);
        // Hour marks
        for (let h = 0; h < 12; h++) {
          const a = (h / 12) * Math.PI * 2 - Math.PI / 2;
          g.fillStyle(rgb(60, 160, 140), 1);
          g.fillCircle(cx + Math.cos(a) * 25, cy - 5 + Math.sin(a) * 25, 2);
        }
        // Hands
        g.lineStyle(2, rgb(40, 120, 100), 1);
        g.lineBetween(cx, cy - 5, cx + 12, cy - 15);
        g.lineBetween(cx, cy - 5, cx - 5, cy + 10);
        // Center hub
        g.fillStyle(rgb(80, 200, 180), 1);
        g.fillCircle(cx, cy - 5, 4);
        // Base panel
        g.fillStyle(rgb(70, 150, 130), 1);
        g.fillRect(bx + 10, by + bh - 16, bw - 20, 10);
        break;
      }
      case 'Dragon Tower': {
        // Stone brick pattern
        g.lineStyle(1, rgb(120, 30, 40), 0.4);
        for (let r = 0; r < bh; r += 8) {
          g.lineBetween(bx, by + r, bx + bw, by + r);
          const off = (r / 8) % 2 === 0 ? 0 : bw / 4;
          for (let c = off; c < bw; c += bw / 2) {
            g.lineBetween(bx + c, by + r, bx + c, by + r + 8);
          }
        }
        // Battlements
        g.fillStyle(rgb(140, 35, 50), 1);
        for (let i = 0; i < 5; i++) g.fillRect(bx + 4 + i * 20, by - 4, 12, 8);
        // Dragon fire
        g.fillStyle(rgb(255, 180, 30), 0.6);
        g.fillCircle(bx + 20, by - 10, 6);
        g.fillStyle(rgb(255, 100, 20), 0.5);
        g.fillCircle(bx + 18, by - 16, 4);
        g.fillCircle(bx + 24, by - 14, 3);
        // Dragon eye window
        g.fillStyle(rgb(255, 220, 50), 1);
        g.fillEllipse(cx, cy, 12, 8);
        g.fillStyle(rgb(30, 10, 10), 1);
        g.fillEllipse(cx, cy, 4, 7);
        // Arched door
        g.fillStyle(rgb(80, 20, 30), 1);
        g.fillRect(cx - 7, by + bh - 22, 14, 22);
        break;
      }
      case 'Moon Colony': {
        // Lunar surface
        g.fillStyle(rgb(190, 190, 180), 1);
        g.fillRect(bx, by + bh - 16, bw, 16);
        // Craters
        g.fillStyle(rgb(170, 170, 160), 1);
        g.fillCircle(bx + 15, by + bh - 10, 6);
        g.fillCircle(bx + 60, by + bh - 8, 4);
        g.fillCircle(bx + 90, by + bh - 12, 5);
        // Main dome
        g.fillStyle(rgb(200, 210, 195), 0.8);
        g.fillEllipse(cx, by + 35, 60, 40);
        g.lineStyle(1, rgb(180, 180, 170), 0.6);
        g.strokeEllipse(cx, by + 35, 60, 40);
        // Dome glass reflection
        g.fillStyle(0xffffff, 0.15);
        g.fillEllipse(cx - 8, by + 25, 20, 12);
        // Habitat modules
        g.fillStyle(rgb(190, 200, 185), 1);
        g.fillRect(bx + 6, by + 40, 22, 30);
        g.fillRect(bx + bw - 28, by + 40, 22, 30);
        // Module windows
        g.fillStyle(rgb(150, 200, 230), 0.7);
        g.fillRect(bx + 10, by + 45, 8, 6);
        g.fillRect(bx + bw - 24, by + 45, 8, 6);
        // Flag
        g.fillStyle(rgb(80, 80, 80), 1);
        g.fillRect(cx + 15, by + 10, 2, 25);
        g.fillStyle(rgb(150, 200, 255), 1);
        g.fillRect(cx + 17, by + 10, 10, 7);
        // Stars
        g.fillStyle(0xffffff, 0.6);
        g.fillCircle(bx + 10, by + 8, 1);
        g.fillCircle(bx + 30, by + 5, 1);
        g.fillCircle(bx + bw - 10, by + 10, 1);
        break;
      }
      case 'Galactic Hub': {
        // Space background
        g.fillStyle(rgb(20, 15, 40), 0.4);
        g.fillRect(bx, by, bw, bh);
        // Stars
        g.fillStyle(0xffffff, 0.7);
        for (let i = 0; i < 12; i++) {
          g.fillCircle(bx + 8 + (i * 37) % (bw - 16), by + 5 + (i * 23) % (bh - 10), 1);
        }
        // Ring station
        g.lineStyle(3, rgb(120, 100, 180), 0.8);
        g.strokeCircle(cx, cy, 28);
        g.lineStyle(2, rgb(100, 80, 160), 0.6);
        g.strokeCircle(cx, cy, 22);
        // Core
        g.fillStyle(rgb(140, 120, 200), 1);
        g.fillCircle(cx, cy, 8);
        g.fillStyle(rgb(180, 160, 240), 1);
        g.fillCircle(cx, cy, 4);
        // Docking arms
        g.fillStyle(rgb(100, 80, 160), 0.8);
        g.fillRect(cx - 2, cy - 32, 4, 10);
        g.fillRect(cx - 2, cy + 22, 4, 10);
        g.fillRect(cx - 32, cy - 2, 10, 4);
        g.fillRect(cx + 22, cy - 2, 10, 4);
        break;
      }
      case 'Dyson Sphere': {
        // Sun glow
        g.fillStyle(rgb(255, 220, 50), 0.2);
        g.fillCircle(cx, cy, 35);
        // Sun
        g.fillStyle(rgb(255, 200, 40), 1);
        g.fillCircle(cx, cy, 16);
        g.fillStyle(rgb(255, 240, 120), 1);
        g.fillCircle(cx, cy, 10);
        g.fillStyle(0xffffff, 0.6);
        g.fillCircle(cx - 3, cy - 3, 4);
        // Collection rings
        g.lineStyle(2, rgb(200, 160, 40), 0.7);
        g.strokeEllipse(cx, cy, 60, 30);
        g.strokeEllipse(cx, cy, 30, 55);
        // Orbiting nodes
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          g.fillStyle(rgb(220, 180, 50), 1);
          g.fillCircle(cx + Math.cos(a) * 28, cy + Math.sin(a) * 14, 3);
        }
        break;
      }
      case 'Quantum Computer': {
        // Dark screen
        g.fillStyle(rgb(10, 30, 40), 0.8);
        g.fillRect(bx + 6, by + 6, bw - 12, bh - 20);
        // Circuit traces (cyan)
        g.lineStyle(1, rgb(0, 220, 240), 0.7);
        g.lineBetween(bx + 15, by + 15, bx + 40, by + 15);
        g.lineBetween(bx + 40, by + 15, bx + 40, by + 35);
        g.lineBetween(bx + 40, by + 35, bx + 70, by + 35);
        g.lineBetween(bx + 20, by + 50, bx + 60, by + 50);
        g.lineBetween(bx + 60, by + 50, bx + 60, by + 25);
        g.lineBetween(bx + 30, by + 65, bx + 80, by + 65);
        // Nodes
        g.fillStyle(rgb(0, 240, 255), 1);
        g.fillCircle(bx + 15, by + 15, 3);
        g.fillCircle(bx + 70, by + 35, 3);
        g.fillCircle(bx + 20, by + 50, 3);
        g.fillCircle(bx + 80, by + 65, 3);
        // Glowing core
        g.fillStyle(rgb(0, 200, 220), 0.3);
        g.fillCircle(cx, cy, 15);
        g.fillStyle(rgb(0, 255, 255), 0.5);
        g.fillCircle(cx, cy, 6);
        // LEDs
        const ledColors = [0x00ff00, 0xff0000, 0x0088ff, 0xffcc00];
        for (let i = 0; i < 8; i++) {
          g.fillStyle(ledColors[i % 4], 0.8);
          g.fillCircle(bx + 12 + i * 11, by + bh - 10, 2);
        }
        break;
      }
      case 'Terraformer': {
        // Glass dome
        g.fillStyle(rgb(100, 200, 140), 0.3);
        g.fillEllipse(cx, by + 20, bw - 20, 30);
        g.lineStyle(1, rgb(80, 180, 120), 0.6);
        g.strokeEllipse(cx, by + 20, bw - 20, 30);
        // Plants inside
        for (let i = 0; i < 5; i++) {
          const px = bx + 15 + i * 18;
          g.fillStyle(rgb(40, 160, 80), 1);
          g.fillRect(px, by + 20, 2, 20);
          g.fillStyle(rgb(50, 180, 90), 1);
          g.fillCircle(px + 1, by + 18, 5);
        }
        // Soil band
        g.fillStyle(rgb(120, 80, 40), 1);
        g.fillRect(bx + 8, by + 40, bw - 16, 8);
        // Water drops
        g.fillStyle(rgb(80, 180, 220), 0.6);
        g.fillCircle(bx + 20, by + 52, 3);
        g.fillCircle(bx + 50, by + 55, 2);
        g.fillCircle(bx + 80, by + 53, 3);
        // Base machinery
        g.fillStyle(rgb(50, 140, 80), 1);
        g.fillRect(bx + 6, by + bh - 20, bw - 12, 14);
        break;
      }
      case 'Star Forge': {
        // Furnace glow
        g.fillStyle(rgb(255, 100, 20), 0.3);
        g.fillRect(bx + 6, by + 6, bw - 12, bh - 12);
        // Anvil
        g.fillStyle(rgb(100, 100, 110), 1);
        g.fillRect(cx - 15, cy + 5, 30, 8);
        g.fillRect(cx - 8, cy + 13, 16, 12);
        // Flames
        const flameColors = [rgb(255, 200, 50), rgb(255, 140, 30), rgb(255, 80, 10)];
        for (let i = 0; i < 5; i++) {
          g.fillStyle(flameColors[i % 3], 0.7);
          g.fillTriangle(bx + 10 + i * 20, cy, bx + 15 + i * 20, by + 8, bx + 20 + i * 20, cy);
        }
        // Sparks
        g.fillStyle(rgb(255, 255, 100), 0.8);
        g.fillCircle(bx + 30, by + 20, 2);
        g.fillCircle(bx + 60, by + 15, 1.5);
        g.fillCircle(bx + 80, by + 25, 2);
        break;
      }
      case 'Antimatter Plant': {
        // Containment rings
        g.lineStyle(2, rgb(200, 0, 220), 0.6);
        g.strokeEllipse(cx, cy, 50, 20);
        g.lineStyle(2, rgb(160, 0, 180), 0.5);
        g.strokeEllipse(cx, cy, 20, 50);
        // Core glow
        g.fillStyle(rgb(180, 0, 200), 0.2);
        g.fillCircle(cx, cy, 20);
        g.fillStyle(rgb(0, 220, 240), 0.4);
        g.fillCircle(cx, cy, 10);
        g.fillStyle(0xffffff, 0.6);
        g.fillCircle(cx, cy, 4);
        // Warning stripes
        g.fillStyle(rgb(220, 200, 30), 1);
        g.fillRect(bx + 6, by + bh - 10, 12, 4);
        g.fillRect(bx + bw - 18, by + bh - 10, 12, 4);
        break;
      }
      case 'Warp Gate': {
        // Space bg
        g.fillStyle(rgb(15, 10, 30), 0.4);
        g.fillRect(bx, by, bw, bh);
        // Portal ring
        g.lineStyle(3, rgb(80, 60, 240), 0.8);
        g.strokeCircle(cx, cy, 30);
        g.lineStyle(2, rgb(120, 100, 255), 0.5);
        g.strokeCircle(cx, cy, 25);
        // Swirl inside
        g.fillStyle(rgb(60, 40, 180), 0.3);
        g.fillCircle(cx, cy, 22);
        g.fillStyle(rgb(100, 80, 220), 0.3);
        g.fillCircle(cx, cy, 14);
        g.fillStyle(rgb(160, 140, 255), 0.4);
        g.fillCircle(cx, cy, 6);
        g.fillStyle(0xffffff, 0.6);
        g.fillCircle(cx, cy, 2);
        // Energy bolts
        g.fillStyle(rgb(100, 100, 255), 0.8);
        g.fillCircle(cx, cy - 32, 3);
        g.fillCircle(cx, cy + 32, 3);
        g.fillCircle(cx - 32, cy, 3);
        g.fillCircle(cx + 32, cy, 3);
        break;
      }
      case 'Planet Engine': {
        // Exhaust at bottom
        g.fillStyle(rgb(255, 160, 40), 0.5);
        g.fillRect(bx + 15, by + bh - 12, bw - 30, 12);
        g.fillStyle(rgb(255, 120, 20), 0.4);
        g.fillRect(bx + 20, by + bh - 8, bw - 40, 8);
        // Pipes
        g.fillStyle(rgb(140, 80, 40), 1);
        g.fillRect(bx + 6, by + 15, 8, bh - 30);
        g.fillRect(bx + bw - 14, by + 15, 8, bh - 30);
        // Rivets
        g.fillStyle(rgb(100, 60, 30), 1);
        for (let r = 0; r < 4; r++) {
          g.fillCircle(bx + 10, by + 20 + r * 18, 2);
          g.fillCircle(bx + bw - 10, by + 20 + r * 18, 2);
        }
        // Viewport
        g.fillStyle(rgb(60, 100, 160), 1);
        g.fillCircle(cx, cy - 8, 12);
        g.fillStyle(rgb(40, 70, 120), 1);
        g.fillCircle(cx, cy - 8, 8);
        break;
      }
      case 'Galaxy Brain': {
        // Brain hemispheres
        g.fillStyle(rgb(240, 130, 200), 0.8);
        g.fillEllipse(cx - 12, cy - 5, 30, 35);
        g.fillEllipse(cx + 12, cy - 5, 30, 35);
        // Brain folds
        g.lineStyle(1, rgb(220, 80, 160), 0.5);
        g.lineBetween(cx - 20, cy - 10, cx - 5, cy - 15);
        g.lineBetween(cx - 18, cy, cx - 3, cy - 5);
        g.lineBetween(cx + 5, cy - 15, cx + 20, cy - 10);
        g.lineBetween(cx + 3, cy - 5, cx + 18, cy);
        // Sparkles/neurons
        g.fillStyle(0xffffff, 0.8);
        g.fillCircle(cx - 15, cy - 12, 2);
        g.fillCircle(cx + 10, cy - 18, 2);
        g.fillCircle(cx, cy + 8, 2);
        g.fillCircle(cx + 18, cy - 3, 1.5);
        g.fillCircle(cx - 8, cy + 5, 1.5);
        // Pedestal
        g.fillStyle(rgb(220, 80, 170), 1);
        g.fillRect(cx - 15, by + bh - 12, 30, 8);
        break;
      }
      case 'Universe Simulator': {
        // Dark screen
        g.fillStyle(rgb(8, 8, 25), 0.9);
        g.fillRect(bx + 4, by + 4, bw - 8, bh - 16);
        // Star field
        g.fillStyle(0xffffff, 0.7);
        for (let i = 0; i < 25; i++) {
          const sx = bx + 8 + (i * 31) % (bw - 16);
          const sy = by + 8 + (i * 19) % (bh - 24);
          g.fillCircle(sx, sy, i % 3 === 0 ? 1.5 : 0.8);
        }
        // Spiral galaxy
        g.fillStyle(rgb(100, 80, 200), 0.5);
        g.fillCircle(cx, cy - 5, 10);
        g.fillStyle(rgb(150, 130, 240), 0.4);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          const r = 8 + i * 1.5;
          g.fillCircle(cx + Math.cos(a) * r, cy - 5 + Math.sin(a) * r * 0.5, 2);
        }
        // Console lights
        g.fillStyle(0x00ff00, 0.6);
        g.fillCircle(bx + 15, by + bh - 8, 2);
        g.fillStyle(0x00aa00, 0.6);
        g.fillCircle(bx + 25, by + bh - 8, 2);
        g.fillStyle(0xff0000, 0.4);
        g.fillCircle(bx + 35, by + bh - 8, 2);
        break;
      }
      case 'Multiverse Portal': {
        // Vortex rings
        for (let i = 4; i >= 0; i--) {
          const alpha = 0.2 + i * 0.1;
          g.lineStyle(2, rgb(180 + i * 10, 30 + i * 10, 240), alpha);
          g.strokeCircle(cx, cy, 10 + i * 7);
        }
        // Portal particles
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const r = 20 + (i % 3) * 8;
          g.fillStyle(rgb(220, 80, 255), 0.6);
          g.fillCircle(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6, 2);
        }
        // Bright center
        g.fillStyle(rgb(240, 100, 255), 0.4);
        g.fillCircle(cx, cy, 12);
        g.fillStyle(0xffffff, 0.7);
        g.fillCircle(cx, cy, 4);
        break;
      }
      case 'Reality Engine': {
        // Large gear
        g.lineStyle(3, rgb(200, 200, 160), 0.8);
        g.strokeCircle(cx - 10, cy - 5, 20);
        g.fillStyle(rgb(200, 200, 160), 0.6);
        g.fillCircle(cx - 10, cy - 5, 8);
        // Gear teeth
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          g.fillStyle(rgb(200, 200, 160), 0.8);
          g.fillCircle(cx - 10 + Math.cos(a) * 20, cy - 5 + Math.sin(a) * 20, 4);
        }
        // Small gear
        g.lineStyle(2, rgb(180, 180, 140), 0.7);
        g.strokeCircle(cx + 20, cy + 12, 12);
        g.fillStyle(rgb(180, 180, 140), 0.5);
        g.fillCircle(cx + 20, cy + 12, 5);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          g.fillStyle(rgb(180, 180, 140), 0.7);
          g.fillCircle(cx + 20 + Math.cos(a) * 12, cy + 12 + Math.sin(a) * 12, 3);
        }
        // Control panel
        g.fillStyle(rgb(160, 160, 120), 1);
        g.fillRect(bx + 10, by + bh - 14, bw - 20, 8);
        g.fillStyle(0x00ff00, 0.6);
        g.fillCircle(bx + 20, by + bh - 10, 2);
        g.fillStyle(0xff0000, 0.5);
        g.fillCircle(bx + 30, by + bh - 10, 2);
        break;
      }
      case 'Cosmic Citadel': {
        // Central tower
        g.fillStyle(rgb(100, 65, 140), 1);
        g.fillRect(cx - 10, by + 5, 20, bh - 15);
        // Pointed roof
        g.fillStyle(rgb(120, 80, 160), 1);
        g.fillTriangle(cx - 14, by + 5, cx, by - 10, cx + 14, by + 5);
        // Side spires
        g.fillStyle(rgb(90, 55, 130), 1);
        g.fillRect(bx + 8, by + 25, 12, bh - 35);
        g.fillRect(bx + bw - 20, by + 25, 12, bh - 35);
        g.fillTriangle(bx + 6, by + 25, bx + 14, by + 12, bx + 22, by + 25);
        g.fillTriangle(bx + bw - 22, by + 25, bx + bw - 14, by + 12, bx + bw - 6, by + 25);
        // Glowing windows
        g.fillStyle(rgb(150, 180, 255), 0.7);
        g.fillRect(cx - 4, by + 20, 8, 6);
        g.fillRect(cx - 4, by + 35, 8, 6);
        g.fillRect(cx - 4, by + 50, 8, 6);
        // Stars
        g.fillStyle(rgb(150, 130, 255), 0.6);
        g.fillCircle(bx + 30, by + 8, 1.5);
        g.fillCircle(bx + bw - 30, by + 12, 1.5);
        break;
      }
      case 'Infinity Tower': {
        // Tower body (gold)
        g.fillStyle(rgb(220, 190, 80), 1);
        g.fillRect(cx - 12, by + 5, 24, bh - 10);
        // Spiral bands
        g.lineStyle(2, rgb(200, 170, 60), 0.6);
        for (let sy = 0; sy < bh - 10; sy += 12) {
          g.lineBetween(cx - 12, by + 5 + sy, cx + 12, by + 11 + sy);
        }
        // Glowing top
        g.fillStyle(rgb(255, 240, 100), 0.4);
        g.fillCircle(cx, by + 2, 10);
        g.fillStyle(rgb(255, 250, 180), 0.7);
        g.fillCircle(cx, by + 2, 5);
        // Infinity symbol (figure-8)
        g.lineStyle(2, rgb(255, 220, 80), 0.8);
        g.strokeCircle(cx - 8, cy, 8);
        g.strokeCircle(cx + 8, cy, 8);
        break;
      }
      case 'Omega Station': {
        // Main dome
        g.fillStyle(rgb(140, 200, 240), 0.7);
        g.fillEllipse(cx, by + 18, bw - 24, 28);
        // Satellite dishes
        g.lineStyle(2, rgb(120, 180, 220), 0.8);
        g.strokeCircle(bx + 15, by + 30, 8);
        g.strokeCircle(bx + bw - 15, by + 30, 8);
        g.fillStyle(rgb(100, 160, 200), 1);
        g.fillRect(bx + 14, by + 30, 2, 15);
        g.fillRect(bx + bw - 16, by + 30, 2, 15);
        // Antenna
        g.fillStyle(rgb(80, 80, 90), 1);
        g.fillRect(cx - 1, by - 6, 2, 20);
        g.fillStyle(0xff3333, 0.8);
        g.fillCircle(cx, by - 8, 3);
        // Panel windows
        g.fillStyle(rgb(150, 210, 245), 0.6);
        for (let c = 0; c < 3; c++) {
          g.fillRect(bx + 20 + c * 25, by + 45, 16, 20);
        }
        // Base
        g.fillStyle(rgb(120, 180, 220), 1);
        g.fillRect(bx + 10, by + bh - 14, bw - 20, 8);
        break;
      }
      case 'Big Bang Lab': {
        // Containment frame
        g.lineStyle(2, rgb(200, 40, 40), 0.8);
        g.strokeRect(bx + 8, by + 8, bw - 16, bh - 16);
        // Explosion burst
        g.fillStyle(rgb(255, 60, 30), 0.2);
        g.fillCircle(cx, cy, 30);
        g.fillStyle(rgb(255, 100, 40), 0.3);
        g.fillCircle(cx, cy, 20);
        // Rays
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          g.lineStyle(2, rgb(255, 80 + i * 10, 30), 0.5);
          g.lineBetween(cx, cy, cx + Math.cos(a) * 32, cy + Math.sin(a) * 32);
        }
        // Central sphere
        g.fillStyle(rgb(255, 200, 80), 0.8);
        g.fillCircle(cx, cy, 8);
        g.fillStyle(0xffffff, 0.7);
        g.fillCircle(cx, cy, 3);
        // Warning corners
        g.fillStyle(rgb(255, 220, 30), 1);
        g.fillRect(bx + 10, by + 10, 6, 6);
        g.fillRect(bx + bw - 16, by + 10, 6, 6);
        g.fillRect(bx + 10, by + bh - 16, 6, 6);
        g.fillRect(bx + bw - 16, by + bh - 16, 6, 6);
        break;
      }
      default: {
        // Generic windows + door for any unhandled building
        const winColor = rgb(Math.min(255, cr + 60), Math.min(255, cg + 60), Math.min(255, cb + 60));
        for (let wr = 0; wr < 3; wr++) {
          for (let wc = 0; wc < 4; wc++) {
            g.fillStyle(winColor, 0.6);
            g.fillRect(bx + 8 + wc * 22, by + 10 + wr * 25, 10, 12);
          }
        }
        g.fillStyle(dark, 1);
        g.fillRect(cx - 7, by + bh - 24, 14, 24);
        break;
      }
    }
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
