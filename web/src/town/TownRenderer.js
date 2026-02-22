import Phaser from 'phaser';
import {
  GRASS_1, GRASS_2, GRASS_3, ROAD_FILL, ROAD_EDGE, ROAD_DASH, SIDEWALK,
  ROAD_THICK, ROW_HEIGHT, PLOT_W, PLOT_H, PLOT_COLS, ROAD_V_POSITIONS,
  TOWN_WORLD_W, DEPTH_PX, SIDE_DX, SIDE_DY, rgb,
} from '../constants.js';
import { BUILDING_COLORS, BUILDING_IMAGES, BUILDING_ORDER } from '../shared.js';

export class TownRenderer {
  constructor(scene) {
    this.scene = scene;
    this.buildings = [];
    this.buildingSprites = [];

    this.drawGrass();
    this.drawRoads();
    this.drawPlots();
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

    for (const rx of ROAD_V_POSITIONS) {
      g.fillStyle(SIDEWALK, 1);
      g.fillRect(rx - ROAD_THICK / 2 - 6, -50, ROAD_THICK + 12, worldH + 100);
      g.fillStyle(ROAD_FILL, 1);
      g.fillRect(rx - ROAD_THICK / 2, -50, ROAD_THICK, worldH + 100);
      g.fillStyle(ROAD_EDGE, 1);
      g.fillRect(rx - ROAD_THICK / 2, -50, 2, worldH + 100);
      g.fillRect(rx + ROAD_THICK / 2 - 2, -50, 2, worldH + 100);
      for (let dy = 0; dy < worldH; dy += 30) {
        g.fillStyle(ROAD_DASH, 1);
        g.fillRect(rx - 1, dy, 2, 15);
      }
    }

    for (let row = 0; row <= totalRows; row++) {
      const ry = row * ROW_HEIGHT + 15;
      g.fillStyle(SIDEWALK, 1);
      g.fillRect(-50, ry - ROAD_THICK / 2 - 4, TOWN_WORLD_W + 100, ROAD_THICK + 8);
      g.fillStyle(ROAD_FILL, 1);
      g.fillRect(-50, ry - ROAD_THICK / 2, TOWN_WORLD_W + 100, ROAD_THICK);
      g.fillStyle(ROAD_EDGE, 1);
      g.fillRect(-50, ry - ROAD_THICK / 2, TOWN_WORLD_W + 100, 2);
      g.fillRect(-50, ry + ROAD_THICK / 2 - 2, TOWN_WORLD_W + 100, 2);
      for (let dx = 0; dx < TOWN_WORLD_W; dx += 30) {
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

  depthSort() {
    // Buildings depth-sorted by y at creation; player updates own depth
  }
}
