import Phaser from 'phaser';
import { WIDTH, HEIGHT, PX_FONT } from '../constants.js';
import { GRADE_LABELS } from '../shared.js';
import { SKIN_PALETTE, SHIRT_PALETTE, PANTS_PALETTE, HAIR_PALETTE } from '../town/NPCSystem.js';

export class ConnectScene extends Phaser.Scene {
  constructor() {
    super('ConnectScene');
  }

  create() {
    // Background gradient
    const bg = this.add.graphics();
    for (let y = 0; y < HEIGHT; y++) {
      const t = y / HEIGHT;
      const r = Math.floor(26 + t * 20);
      const g = Math.floor(26 + t * 30);
      const b = Math.floor(46 + t * 40);
      bg.fillStyle((r << 16) | (g << 8) | b, 1);
      bg.fillRect(0, y, WIDTH, 1);
    }

    // Stars
    for (let i = 0; i < 80; i++) {
      const sx = Math.random() * WIDTH;
      const sy = Math.random() * HEIGHT * 0.6;
      const size = Math.random() * 2 + 0.5;
      const alpha = Math.random() * 0.6 + 0.2;
      bg.fillStyle(0xffffff, alpha);
      bg.fillCircle(sx, sy, size);
    }

    // City silhouette
    const silhouetteY = HEIGHT - 120;
    bg.fillStyle(0x1a1a30, 1);
    bg.fillRect(0, silhouetteY + 40, WIDTH, 80);

    const buildings = [
      [50, 35], [100, 55], [160, 40], [220, 70], [290, 45],
      [350, 80], [420, 50], [490, 65], [560, 40], [630, 55],
      [700, 75], [770, 45], [840, 60], [910, 35], [960, 50],
    ];
    for (const [bx, bh] of buildings) {
      bg.fillStyle(0x151528, 1);
      bg.fillRect(bx, silhouetteY + 40 - bh, 40, bh);
      for (let wy = silhouetteY + 40 - bh + 5; wy < silhouetteY + 35; wy += 12) {
        for (let wx = bx + 6; wx < bx + 34; wx += 10) {
          if (Math.random() > 0.4) {
            const wc = Math.random() > 0.5 ? 0xffe882 : 0xffcc44;
            bg.fillStyle(wc, 0.6);
            bg.fillRect(wx, wy, 5, 6);
          }
        }
      }
    }

    // Title (Phaser text — no click needed)
    this.add.text(WIDTH / 2, 100, 'CITY', {
      fontFamily: PX_FONT,
      fontSize: '48px',
      color: '#ffffff',
      stroke: '#2d64b4',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 155, 'Build your city by solving math problems!', {
      fontFamily: PX_FONT,
      fontSize: '10px',
      color: '#aabbdd',
    }).setOrigin(0.5);

    // ── Plain HTML form (bypasses Phaser DOM for reliable clicks) ──
    let gradeOptions = '';
    for (const [g, label] of Object.entries(GRADE_LABELS)) {
      const sel = g === '3' ? ' selected' : '';
      gradeOptions += `<option value="${g}"${sel}>Grade ${g}: ${label}</option>`;
    }

    const overlay = document.createElement('div');
    overlay.id = 'connect-overlay';
    overlay.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; justify-content: center; align-items: center;
      z-index: 100; pointer-events: none;
    `;

    const formPanel = document.createElement('div');
    formPanel.style.cssText = `
      pointer-events: auto;
      width: min(340px, calc(100vw - 32px)); padding: 24px;
      background: rgba(32, 32, 64, 0.9);
      border: 2px solid rgba(55, 120, 200, 0.6);
      border-radius: 12px;
      font-family: 'Press Start 2P', monospace;
      color: #ddd;
      margin-top: 80px;
    `;

    // Build color swatch rows HTML
    const hex = (c) => '#' + c.toString(16).padStart(6, '0');
    const swatchRow = (label, palette, name) => {
      const swatches = palette.map((c, i) =>
        `<div class="swatch" data-group="${name}" data-index="${i}" style="
          width: 20px; height: 20px; border-radius: 4px; cursor: pointer;
          background: ${hex(c)}; border: 2px solid transparent;
          box-sizing: border-box; flex-shrink: 0;
        "></div>`
      ).join('');
      return `<div style="margin-bottom: 6px;">
        <span style="font-size: 7px; color: #8899bb; margin-right: 6px; display: inline-block; width: 36px;">${label}</span>
        <div style="display: inline-flex; gap: 4px; vertical-align: middle; flex-wrap: wrap;">${swatches}</div>
      </div>`;
    };

    formPanel.innerHTML = `
      <div style="margin-bottom: 14px;">
        <label style="font-size: 8px; color: #8899bb; display: block; margin-bottom: 6px;">Player Name</label>
        <input id="connect-name" type="text" style="
          width: 100%; padding: 8px 10px; font-size: 10px;
          font-family: 'Press Start 2P', monospace;
          border: 2px solid #b4bee2; border-radius: 6px;
          background: #fafaff; color: #333; outline: none;
          box-sizing: border-box;
        " placeholder="Enter name" maxlength="20" />
      </div>
      <div style="margin-bottom: 14px;">
        <label style="font-size: 8px; color: #8899bb; display: block; margin-bottom: 6px;">Server Address</label>
        <input id="connect-server" type="text" style="
          width: 100%; padding: 8px 10px; font-size: 10px;
          font-family: 'Press Start 2P', monospace;
          border: 2px solid #b4bee2; border-radius: 6px;
          background: #fafaff; color: #333; outline: none;
          box-sizing: border-box;
        " value="localhost" />
      </div>
      <div style="margin-bottom: 14px;">
        <label style="font-size: 8px; color: #8899bb; display: block; margin-bottom: 6px;">Math Grade</label>
        <select id="connect-grade" style="
          width: 100%; padding: 8px 10px; font-size: 9px;
          font-family: 'Press Start 2P', monospace;
          border: 2px solid #b4bee2; border-radius: 6px;
          background: #fafaff; color: #333; outline: none;
          box-sizing: border-box;
        ">${gradeOptions}</select>
      </div>
      <div style="margin-bottom: 14px;">
        <label style="font-size: 8px; color: #8899bb; display: block; margin-bottom: 8px;">Character</label>
        <div style="display: flex; align-items: flex-start; gap: 14px;">
          <canvas id="connect-preview" width="48" height="60" style="
            border-radius: 6px; background: rgba(0,0,0,0.3);
            image-rendering: pixelated; flex-shrink: 0;
          "></canvas>
          <div id="connect-palettes" style="flex: 1; min-width: 0;">
            ${swatchRow('Skin', SKIN_PALETTE, 'skin')}
            ${swatchRow('Hair', HAIR_PALETTE, 'hair')}
            ${swatchRow('Shirt', SHIRT_PALETTE, 'shirt')}
            ${swatchRow('Pants', PANTS_PALETTE, 'pants')}
          </div>
        </div>
      </div>
      <button id="connect-play" style="
        width: 100%; padding: 12px; font-size: 11px;
        font-family: 'Press Start 2P', monospace;
        background: #3cbe5a; color: white; border: none;
        border-radius: 6px; cursor: pointer;
      ">Play</button>
      <div id="connect-error" style="
        color: #ff6666; font-size: 8px; margin-top: 10px;
        text-align: center; min-height: 16px;
      "></div>
    `;

    overlay.appendChild(formPanel);
    const container = this.game.canvas.parentElement;
    container.appendChild(overlay);
    this._overlay = overlay;

    // Wire up events
    const nameInput = overlay.querySelector('#connect-name');
    const serverInput = overlay.querySelector('#connect-server');
    const gradeSelect = overlay.querySelector('#connect-grade');
    const playBtn = overlay.querySelector('#connect-play');
    const errorMsg = overlay.querySelector('#connect-error');

    // Character appearance state (default: first color in each palette)
    const appearance = {
      skin: SKIN_PALETTE[0],
      hair: HAIR_PALETTE[0],
      shirt: SHIRT_PALETTE[0],
      pants: PANTS_PALETTE[0],
    };
    const palettes = { skin: SKIN_PALETTE, hair: HAIR_PALETTE, shirt: SHIRT_PALETTE, pants: PANTS_PALETTE };

    // Preview canvas drawing
    const previewCanvas = overlay.querySelector('#connect-preview');
    const ctx = previewCanvas.getContext('2d');

    const drawPreview = () => {
      const w = previewCanvas.width;
      const h = previewCanvas.height;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2 + 6;
      const s = 2; // scale factor

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 5 * s, 10 * s, 4 * s, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = hex(appearance.skin);
      ctx.beginPath();
      ctx.arc(cx, cy - 13 * s, 5 * s, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = hex(appearance.hair);
      ctx.fillRect(cx - 5 * s, cy - 18 * s, 10 * s, 4 * s);

      // Body / shirt
      ctx.fillStyle = hex(appearance.shirt);
      ctx.fillRect(cx - 4 * s, cy - 8 * s, 8 * s, 9 * s);

      // Arms
      ctx.fillRect(cx - 6 * s, cy - 7 * s, 2 * s, 6 * s);
      ctx.fillRect(cx + 4 * s, cy - 5 * s, 2 * s, 6 * s);

      // Legs
      ctx.fillStyle = hex(appearance.pants);
      ctx.fillRect(cx - 4 * s, cy + 1 * s, 3 * s, 7 * s);
      ctx.fillRect(cx + 1 * s, cy + 1 * s, 3 * s, 6 * s);

      // Eyes
      ctx.fillStyle = '#222222';
      ctx.fillRect(cx + 1 * s, cy - 14 * s, 2 * s, 2 * s);
    };

    drawPreview();

    // Highlight selected swatches
    const updateSwatchBorders = () => {
      overlay.querySelectorAll('.swatch').forEach((el) => {
        const group = el.dataset.group;
        const idx = parseInt(el.dataset.index);
        const isSelected = appearance[group] === palettes[group][idx];
        el.style.border = isSelected ? '2px solid #fff' : '2px solid transparent';
      });
    };
    updateSwatchBorders();

    // Swatch click handler
    overlay.querySelector('#connect-palettes').addEventListener('click', (e) => {
      const swatch = e.target.closest('.swatch');
      if (!swatch) return;
      const group = swatch.dataset.group;
      const idx = parseInt(swatch.dataset.index);
      appearance[group] = palettes[group][idx];
      updateSwatchBorders();
      drawPreview();
    });

    setTimeout(() => nameInput.focus(), 100);

    const doConnect = () => {
      const name = nameInput.value.trim();
      const server = serverInput.value.trim();
      const grade = parseInt(gradeSelect.value);

      if (!name) { errorMsg.textContent = 'Please enter a name'; return; }
      if (!server) { errorMsg.textContent = 'Please enter a server address'; return; }

      errorMsg.textContent = 'Connecting...';
      errorMsg.style.color = '#88bbff';
      playBtn.disabled = true;
      playBtn.textContent = 'Connecting...';

      let wsUrl;
      if (server.startsWith('ws://') || server.startsWith('wss://')) {
        wsUrl = server;
      } else {
        wsUrl = `ws://${server}:5556`;
      }

      // Remove overlay before switching scenes
      overlay.remove();
      this.scene.start('GameScene', { name, wsUrl, grade, appearance });
    };

    playBtn.addEventListener('click', doConnect);
    nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doConnect(); });
    serverInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doConnect(); });
  }

  shutdown() {
    // Clean up overlay if scene is stopped
    if (this._overlay) {
      this._overlay.remove();
      this._overlay = null;
    }
  }
}
