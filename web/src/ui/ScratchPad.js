import { WIDTH, HEIGHT, TOWN_X, TOWN_VIEW_W, PX_FONT } from '../constants.js';

// Scratch Paper — Draw/Type/Clear pad in the top-right area
// Uses an offscreen canvas for freehand drawing, and a DOM textarea for typing.

export class ScratchPad {
  constructor(scene) {
    this.scene = scene;
    this.mode = 'draw'; // 'draw' or 'type'
    const ui = (obj) => scene.addUIObj(obj);

    // Layout — right of the math panel, above the leaderboard
    const lx = TOWN_X + TOWN_VIEW_W + 15;
    const spW = WIDTH - lx - 15;
    const spH = 185;
    const spY = 55;
    this.lx = lx;
    this.spW = spW;
    this.spH = spH;
    this.spY = spY;
    this.padX = lx + 6;
    this.padY = spY + 36;
    this.padW = spW - 12;
    this.padH = spH - 42;

    // Card background
    this.bg = ui(scene.add.graphics());
    this.bg.setScrollFactor(0);
    this.bg.setDepth(5200);
    this.drawCard();

    // Header bar
    this.header = ui(scene.add.graphics());
    this.header.setScrollFactor(0);
    this.header.setDepth(5201);
    this.drawHeaderBar();

    // Title
    this.titleText = ui(scene.add.text(lx + 14, spY + 10, 'Scratch Paper', {
      fontFamily: PX_FONT,
      fontSize: '8px',
      color: '#ffffff',
    }).setScrollFactor(0).setDepth(5202));

    // Mode buttons + Clear (DOM for easier interaction)
    const btnY = spY + 4;
    const btnsHTML = `
      <div style="display: flex; gap: 4px; font-family: 'Press Start 2P', monospace;">
        <button id="scratch-draw-btn" style="
          padding: 3px 8px; font-size: 7px; border: none;
          border-radius: 3px; cursor: pointer;
          background: rgba(255,255,255,0.55); color: #fff;
          font-family: 'Press Start 2P', monospace;
        ">Draw</button>
        <button id="scratch-type-btn" style="
          padding: 3px 8px; font-size: 7px; border: none;
          border-radius: 3px; cursor: pointer;
          background: rgba(255,255,255,0.16); color: #b4b9cc;
          font-family: 'Press Start 2P', monospace;
        ">Type</button>
        <button id="scratch-clear-btn" style="
          padding: 3px 8px; font-size: 7px; border: none;
          border-radius: 3px; cursor: pointer;
          background: rgba(255,255,255,0.2); color: #dce1f0;
          font-family: 'Press Start 2P', monospace;
        ">Clear</button>
      </div>
    `;
    this.btnsDOM = ui(scene.add.dom(lx + spW - 82, btnY + 11).createFromHTML(btnsHTML));
    this.btnsDOM.setScrollFactor(0);
    this.btnsDOM.setDepth(5203);

    const drawBtn = this.btnsDOM.getChildByID('scratch-draw-btn');
    const typeBtn = this.btnsDOM.getChildByID('scratch-type-btn');
    const clearBtn = this.btnsDOM.getChildByID('scratch-clear-btn');

    drawBtn.addEventListener('click', (e) => { e.stopPropagation(); this.setMode('draw'); });
    typeBtn.addEventListener('click', (e) => { e.stopPropagation(); this.setMode('type'); });
    clearBtn.addEventListener('click', (e) => { e.stopPropagation(); this.clearPad(); });

    this.drawBtnEl = drawBtn;
    this.typeBtnEl = typeBtn;

    // Off-screen canvas for drawing
    this.drawCanvas = document.createElement('canvas');
    this.drawCanvas.width = this.padW;
    this.drawCanvas.height = this.padH;
    this.drawCtx = this.drawCanvas.getContext('2d');
    this.drawCtx.fillStyle = '#f5f5f0';
    this.drawCtx.fillRect(0, 0, this.padW, this.padH);

    // Phaser texture from canvas (for displaying the drawing)
    if (scene.textures.exists('scratchCanvas')) {
      scene.textures.remove('scratchCanvas');
    }
    this.canvasTexture = scene.textures.createCanvas('scratchCanvas', this.padW, this.padH);
    this.canvasImage = ui(scene.add.image(this.padX + this.padW / 2, this.padY + this.padH / 2, 'scratchCanvas'));
    this.canvasImage.setScrollFactor(0);
    this.canvasImage.setDepth(5202);
    this.canvasImage.setDisplaySize(this.padW, this.padH);
    this.refreshCanvasTexture();

    // Textarea for type mode (hidden by default)
    const taHTML = `
      <textarea id="scratch-textarea" style="
        width: ${this.padW - 4}px;
        height: ${this.padH - 4}px;
        font-family: 'Press Start 2P', monospace;
        font-size: 10px;
        color: #32323c;
        background: #f5f5f0;
        border: 1px solid #c8c8c3;
        border-radius: 3px;
        padding: 4px 6px;
        resize: none;
        outline: none;
        line-height: 1.6;
      " placeholder="Type here..."></textarea>
    `;
    this.textareaDOM = ui(scene.add.dom(this.padX + this.padW / 2, this.padY + this.padH / 2).createFromHTML(taHTML));
    this.textareaDOM.setScrollFactor(0);
    this.textareaDOM.setDepth(5202);
    this.textareaDOM.setVisible(false);

    const ta = this.textareaDOM.getChildByID('scratch-textarea');
    ta.addEventListener('keydown', (e) => e.stopPropagation());
    ta.addEventListener('keyup', (e) => e.stopPropagation());
    ta.addEventListener('keypress', (e) => e.stopPropagation());

    // Border around pad area
    this.padBorder = ui(scene.add.graphics());
    this.padBorder.setScrollFactor(0);
    this.padBorder.setDepth(5203);
    this.padBorder.lineStyle(1, 0xc8c8c3, 1);
    this.padBorder.strokeRect(this.padX, this.padY, this.padW, this.padH);

    // Drawing state
    this.isDrawing = false;
    this.lastPos = null;

    // Interactive zone for drawing (only active in draw mode)
    this.drawZone = ui(scene.add.zone(
      this.padX + this.padW / 2, this.padY + this.padH / 2,
      this.padW, this.padH
    ).setScrollFactor(0).setDepth(5202).setInteractive({ useHandCursor: false }));

    this.drawZone.on('pointerdown', (pointer) => {
      if (this.mode !== 'draw') return;
      this.isDrawing = true;
      this.lastPos = { x: pointer.x - this.padX, y: pointer.y - this.padY };
    });

    scene.input.on('pointermove', (pointer) => {
      if (!this.isDrawing || this.mode !== 'draw') return;
      const cx = pointer.x - this.padX;
      const cy = pointer.y - this.padY;
      if (cx >= 0 && cx <= this.padW && cy >= 0 && cy <= this.padH) {
        if (this.lastPos) {
          this.drawCtx.strokeStyle = '#32323c';
          this.drawCtx.lineWidth = 2;
          this.drawCtx.lineCap = 'round';
          this.drawCtx.beginPath();
          this.drawCtx.moveTo(this.lastPos.x, this.lastPos.y);
          this.drawCtx.lineTo(cx, cy);
          this.drawCtx.stroke();
        }
        this.lastPos = { x: cx, y: cy };
        this.refreshCanvasTexture();
      } else {
        this.lastPos = null;
      }
    });

    scene.input.on('pointerup', () => {
      this.isDrawing = false;
      this.lastPos = null;
    });
  }

  drawCard() {
    this.bg.clear();
    // Shadow
    this.bg.fillStyle(0x000000, 0.08);
    this.bg.fillRoundedRect(this.lx + 2, this.spY + 2, this.spW, this.spH, 14);
    // White card
    this.bg.fillStyle(0xffffff, 1);
    this.bg.fillRoundedRect(this.lx, this.spY, this.spW, this.spH, 14);
  }

  drawHeaderBar() {
    this.header.clear();
    // Gradient header
    for (let y = 0; y < 32; y++) {
      const t = y / 32;
      const r = Math.floor(45 + t * 20);
      const g = Math.floor(100 + t * 40);
      const b = Math.floor(180 + t * 40);
      this.header.fillStyle((r << 16) | (g << 8) | b, 1);
      this.header.fillRect(this.lx, this.spY + y, this.spW, 1);
    }
    // Rounded top corners (clip by drawing card behind)
    this.header.fillStyle(0xffffff, 1);
    this.header.fillRect(this.lx, this.spY + 30, this.spW, 6);
  }

  setMode(mode) {
    this.mode = mode;
    if (mode === 'draw') {
      this.drawBtnEl.style.background = 'rgba(255,255,255,0.55)';
      this.drawBtnEl.style.color = '#fff';
      this.typeBtnEl.style.background = 'rgba(255,255,255,0.16)';
      this.typeBtnEl.style.color = '#b4b9cc';
      this.canvasImage.setVisible(true);
      this.textareaDOM.setVisible(false);
      this.drawZone.setInteractive({ useHandCursor: false });
    } else {
      this.typeBtnEl.style.background = 'rgba(255,255,255,0.55)';
      this.typeBtnEl.style.color = '#fff';
      this.drawBtnEl.style.background = 'rgba(255,255,255,0.16)';
      this.drawBtnEl.style.color = '#b4b9cc';
      this.canvasImage.setVisible(false);
      this.textareaDOM.setVisible(true);
      this.drawZone.disableInteractive();
    }
  }

  clearPad() {
    if (this.mode === 'draw') {
      this.drawCtx.fillStyle = '#f5f5f0';
      this.drawCtx.fillRect(0, 0, this.padW, this.padH);
      this.refreshCanvasTexture();
    } else {
      const ta = this.textareaDOM.getChildByID('scratch-textarea');
      if (ta) ta.value = '';
    }
  }

  refreshCanvasTexture() {
    const ctx = this.canvasTexture.getContext();
    ctx.drawImage(this.drawCanvas, 0, 0);
    this.canvasTexture.refresh();
  }
}
