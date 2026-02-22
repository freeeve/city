import Phaser from 'phaser';
import { WIDTH, HEIGHT, PX_FONT } from '../constants.js';
import { GRADE_LABELS } from '../shared.js';

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
      <div style="margin-bottom: 20px;">
        <label style="font-size: 8px; color: #8899bb; display: block; margin-bottom: 6px;">Math Grade</label>
        <select id="connect-grade" style="
          width: 100%; padding: 8px 10px; font-size: 9px;
          font-family: 'Press Start 2P', monospace;
          border: 2px solid #b4bee2; border-radius: 6px;
          background: #fafaff; color: #333; outline: none;
          box-sizing: border-box;
        ">${gradeOptions}</select>
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
      this.scene.start('GameScene', { name, wsUrl, grade });
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
