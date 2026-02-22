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

    // Simple building shapes for silhouette
    const buildings = [
      [50, 35], [100, 55], [160, 40], [220, 70], [290, 45],
      [350, 80], [420, 50], [490, 65], [560, 40], [630, 55],
      [700, 75], [770, 45], [840, 60], [910, 35], [960, 50],
    ];
    for (const [bx, bh] of buildings) {
      bg.fillStyle(0x151528, 1);
      bg.fillRect(bx, silhouetteY + 40 - bh, 40, bh);
      // Window lights
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

    // Title
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

    // Form panel
    const panelX = WIDTH / 2 - 180;
    const panelY = 200;
    const panelW = 360;
    const panelH = 320;

    const panel = this.add.graphics();
    panel.fillStyle(0x202040, 0.85);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
    panel.lineStyle(2, 0x3778c8, 0.6);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

    // Build grade options HTML
    let gradeOptions = '';
    for (const [g, label] of Object.entries(GRADE_LABELS)) {
      const sel = g === '3' ? ' selected' : '';
      gradeOptions += `<option value="${g}"${sel}>Grade ${g}: ${label}</option>`;
    }

    // DOM form
    const formHTML = `
      <div style="width: 320px; font-family: Arial, sans-serif; color: #ddd;">
        <div style="margin-bottom: 14px;">
          <label style="font-size: 14px; color: #8899bb; display: block; margin-bottom: 4px;">Player Name</label>
          <input id="name-input" type="text" class="game-input" style="width: 100%;" placeholder="Enter your name" maxlength="20" />
        </div>
        <div style="margin-bottom: 14px;">
          <label style="font-size: 14px; color: #8899bb; display: block; margin-bottom: 4px;">Server Address</label>
          <input id="server-input" type="text" class="game-input" style="width: 100%;" value="localhost" />
        </div>
        <div style="margin-bottom: 20px;">
          <label style="font-size: 14px; color: #8899bb; display: block; margin-bottom: 4px;">Math Grade</label>
          <select id="grade-select" class="game-select" style="width: 100%;">
            ${gradeOptions}
          </select>
        </div>
        <button id="play-btn" class="game-btn game-btn-green" style="width: 100%; padding: 12px; font-size: 18px;">
          Play
        </button>
        <div id="error-msg" style="color: #ff6666; font-size: 14px; margin-top: 10px; text-align: center; min-height: 20px;"></div>
      </div>
    `;

    const form = this.add.dom(WIDTH / 2, panelY + panelH / 2 + 5).createFromHTML(formHTML);

    const nameInput = form.getChildByID('name-input');
    const serverInput = form.getChildByID('server-input');
    const gradeSelect = form.getChildByID('grade-select');
    const playBtn = form.getChildByID('play-btn');
    const errorMsg = form.getChildByID('error-msg');

    // Focus name input after a moment
    this.time.delayedCall(100, () => nameInput.focus());

    const doConnect = () => {
      const name = nameInput.value.trim();
      const server = serverInput.value.trim();
      const grade = parseInt(gradeSelect.value);

      if (!name) {
        errorMsg.textContent = 'Please enter a name';
        return;
      }
      if (!server) {
        errorMsg.textContent = 'Please enter a server address';
        return;
      }

      errorMsg.textContent = 'Connecting...';
      errorMsg.style.color = '#88bbff';
      playBtn.disabled = true;
      playBtn.textContent = 'Connecting...';

      // Determine WebSocket URL
      let wsUrl;
      if (server.startsWith('ws://') || server.startsWith('wss://')) {
        wsUrl = server;
      } else {
        const port = 5556;
        wsUrl = `ws://${server}:${port}`;
      }

      this.scene.start('GameScene', { name, wsUrl, grade });
    };

    playBtn.addEventListener('click', doConnect);
    nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doConnect(); });
    serverInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doConnect(); });
  }
}
