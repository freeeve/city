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
    this.buildingSprites = []; // track created sprites for cleanup

    // Draw static town elements
    this.drawGrass();
    this.drawRoads();
    this.drawPlots();
  }

  drawGrass() {
    // Use total rows needed for all 44 buildings
    const totalRows = Math.ceil(44 / 6); // 8 rows
    const worldH = totalRows * ROW_HEIGHT + 100;
    const g = this.scene.add.graphics();
    g.setDepth(-10);

    // Base grass
    g.fillStyle(GRASS_1, 1);
    g.fillRect(-50, -50, TOWN_WORLD_W + 100, worldH + 100);

    // Grass patches for variety
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

    // Vertical roads
    for (const rx of ROAD_V_POSITIONS) {
      // Sidewalk
      g.fillStyle(SIDEWALK, 1);
      g.fillRect(rx - ROAD_THICK / 2 - 6, -50, ROAD_THICK + 12, worldH + 100);
      // Road surface
      g.fillStyle(ROAD_FILL, 1);
      g.fillRect(rx - ROAD_THICK / 2, -50, ROAD_THICK, worldH + 100);
      // Edge lines
      g.fillStyle(ROAD_EDGE, 1);
      g.fillRect(rx - ROAD_THICK / 2, -50, 2, worldH + 100);
      g.fillRect(rx + ROAD_THICK / 2 - 2, -50, 2, worldH + 100);
      // Center dashes
      for (let dy = 0; dy < worldH; dy += 30) {
        g.fillStyle(ROAD_DASH, 1);
        g.fillRect(rx - 1, dy, 2, 15);
      }
    }

    // Horizontal roads (between rows)
    for (let row = 0; row <= totalRows; row++) {
      const ry = row * ROW_HEIGHT + 15;
      // Sidewalk
      g.fillStyle(SIDEWALK, 1);
      g.fillRect(-50, ry - ROAD_THICK / 2 - 4, TOWN_WORLD_W + 100, ROAD_THICK + 8);
      // Road surface
      g.fillStyle(ROAD_FILL, 1);
      g.fillRect(-50, ry - ROAD_THICK / 2, TOWN_WORLD_W + 100, ROAD_THICK);
      // Edge lines
      g.fillStyle(ROAD_EDGE, 1);
      g.fillRect(-50, ry - ROAD_THICK / 2, TOWN_WORLD_W + 100, 2);
      g.fillRect(-50, ry + ROAD_THICK / 2 - 2, TOWN_WORLD_W + 100, 2);
      // Center dashes
      for (let dx = 0; dx < TOWN_WORLD_W; dx += 30) {
        g.fillStyle(ROAD_DASH, 1);
        g.fillRect(dx, ry - 1, 15, 2);
      }
    }
  }

  drawPlots() {
    // Empty plot outlines
    this.plotGraphics = this.scene.add.graphics();
    this.plotGraphics.setDepth(1);
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

    // Draw empty plots
    for (let i = 0; i < 72; i++) {
      const { x, y } = this.getPlotPosition(i);
      if (i < this.buildings.length) continue; // occupied

      // Dashed outline
      this.plotGraphics.lineStyle(1, 0x88aa66, 0.5);
      const dashLen = 6;
      const gap = 4;
      // Top & bottom
      for (let dx = 0; dx < PLOT_W; dx += dashLen + gap) {
        const len = Math.min(dashLen, PLOT_W - dx);
        this.plotGraphics.strokeRect(x + dx, y, len, 0.5);
        this.plotGraphics.strokeRect(x + dx, y + PLOT_H, len, 0.5);
      }
      // Left & right
      for (let dy = 0; dy < PLOT_H; dy += dashLen + gap) {
        const len = Math.min(dashLen, PLOT_H - dy);
        this.plotGraphics.strokeRect(x, y + dy, 0.5, len);
        this.plotGraphics.strokeRect(x + PLOT_W, y + dy, 0.5, len);
      }
    }
  }

  updateBuildings(buildings) {
    // Clean up old building sprites
    for (const sprite of this.buildingSprites) {
      sprite.destroy();
    }
    this.buildingSprites = [];
    this.buildings = buildings;

    this.refreshPlots();

    // Draw each building
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

  drawImageBuilding(name, imageKey, x, y) {
    // 3D oblique shell around the PNG
    const bw = PLOT_W - 10;
    const bh = PLOT_H - 10;
    const bx = x + 5;
    const by = y + 5;

    const [cr, cg, cb] = BUILDING_COLORS[name] || [128, 128, 128];
    const baseColor = rgb(cr, cg, cb);
    const sideColor = rgb(
      Math.max(0, cr - 40),
      Math.max(0, cg - 40),
      Math.max(0, cb - 40)
    );
    const topColor = rgb(
      Math.min(255, cr + 30),
      Math.min(255, cg + 30),
      Math.min(255, cb + 30)
    );

    const g = this.scene.add.graphics();
    g.setDepth(by + bh); // depth sort by bottom y

    // Side face (right side of oblique projection)
    g.fillStyle(sideColor, 1);
    g.fillPoints([
      { x: bx + bw, y: by },
      { x: bx + bw + SIDE_DX, y: by + SIDE_DY },
      { x: bx + bw + SIDE_DX, y: by + bh + SIDE_DY },
      { x: bx + bw, y: by + bh },
    ], true);

    // Top face
    g.fillStyle(topColor, 1);
    g.fillPoints([
      { x: bx, y: by },
      { x: bx + SIDE_DX, y: by + SIDE_DY },
      { x: bx + bw + SIDE_DX, y: by + SIDE_DY },
      { x: bx + bw, y: by },
    ], true);

    this.buildingSprites.push(g);

    // Building image
    const img = this.scene.add.image(bx + bw / 2, by + bh / 2, imageKey);
    img.setDisplaySize(bw, bh);
    img.setDepth(by + bh + 1);
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
      Math.max(0, cr - 40),
      Math.max(0, cg - 40),
      Math.max(0, cb - 40)
    );
    const topColor = rgb(
      Math.min(255, cr + 30),
      Math.min(255, cg + 30),
      Math.min(255, cb + 30)
    );

    const g = this.scene.add.graphics();
    g.setDepth(by + bh);

    // Side face
    g.fillStyle(sideColor, 1);
    g.fillPoints([
      { x: bx + bw, y: by },
      { x: bx + bw + SIDE_DX, y: by + SIDE_DY },
      { x: bx + bw + SIDE_DX, y: by + bh + SIDE_DY },
      { x: bx + bw, y: by + bh },
    ], true);

    // Top face
    g.fillStyle(topColor, 1);
    g.fillPoints([
      { x: bx, y: by },
      { x: bx + SIDE_DX, y: by + SIDE_DY },
      { x: bx + bw + SIDE_DX, y: by + SIDE_DY },
      { x: bx + bw, y: by },
    ], true);

    // Front face
    g.fillStyle(baseColor, 1);
    g.fillRect(bx, by, bw, bh);

    // Outline
    g.lineStyle(1, 0x333333, 0.3);
    g.strokeRect(bx, by, bw, bh);

    // Windows
    const winRows = Math.min(3, Math.floor(bh / 25));
    const winCols = Math.min(4, Math.floor(bw / 22));
    const winW = 10;
    const winH = 12;
    const winColor = rgb(
      Math.min(255, cr + 60),
      Math.min(255, cg + 60),
      Math.min(255, cb + 60)
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

    // Name label
    const label = this.scene.add.text(bx + bw / 2, by + bh - 8, name, {
      fontFamily: 'Arial',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(by + bh + 2);

    this.buildingSprites.push(g);
    this.buildingSprites.push(label);
  }

  depthSort() {
    // Buildings are already depth-sorted by their y position when created
    // Player character updates its own depth
  }
}
