import { SKIN_PALETTE, SHIRT_PALETTE, PANTS_PALETTE, HAIR_PALETTE } from '../town/NPCSystem.js';

const hex = (c) => '#' + c.toString(16).padStart(6, '0');

export class SettingsOverlay {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.el = null;
  }

  toggle() {
    if (this.visible) this.hide();
    else this.show();
  }

  show() {
    this.visible = true;
    this.render();
  }

  hide() {
    this.visible = false;
    if (this.el) {
      this.el.remove();
      this.el = null;
    }
  }

  render() {
    if (this.el) this.el.remove();

    const player = this.scene.player;
    const palettes = {
      skin: SKIN_PALETTE,
      hair: HAIR_PALETTE,
      shirt: SHIRT_PALETTE,
      pants: PANTS_PALETTE,
    };

    // Track current selections (read from player)
    const selected = {
      skin: player.skin,
      hair: player.hair,
      shirt: player.shirt,
      pants: player.pants,
    };

    // Overlay backdrop
    const overlay = document.createElement('div');
    overlay.id = 'settings-overlay';
    overlay.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.7); display: flex; justify-content: center;
      align-items: center; z-index: 100; font-family: 'Press Start 2P', monospace;
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.hide();
    });

    // Modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      width: min(380px, calc(100vw - 24px)); background: #f0f2fa; border-radius: 12px;
      padding: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    `;
    modal.addEventListener('click', (e) => e.stopPropagation());

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;';
    header.innerHTML = `
      <h2 style="margin:0; color:#2d3a5e; font-size:14px;">Settings</h2>
      <button id="settings-close-btn" style="background:#dc4646; color:white; border:none;
        border-radius:4px; padding:6px 14px; font-size:8px; cursor:pointer;
        font-family: 'Press Start 2P', monospace;">Close</button>
    `;
    modal.appendChild(header);

    // Character section
    const charSection = document.createElement('div');

    const charLabel = document.createElement('div');
    charLabel.style.cssText = 'font-size:10px; color:#2d3a5e; margin-bottom:12px;';
    charLabel.textContent = 'Character';
    charSection.appendChild(charLabel);

    const charRow = document.createElement('div');
    charRow.style.cssText = 'display:flex; align-items:flex-start; gap:16px;';

    // Preview canvas
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 60;
    canvas.style.cssText = `
      border-radius: 6px; background: rgba(30,30,60,0.15);
      image-rendering: pixelated; flex-shrink: 0;
    `;
    charRow.appendChild(canvas);

    // Palette swatches
    const palettesDiv = document.createElement('div');
    palettesDiv.style.cssText = 'flex:1; min-width:0;';

    const swatchRow = (label, palette, group) => {
      const row = document.createElement('div');
      row.style.cssText = 'margin-bottom:8px;';
      const lbl = document.createElement('span');
      lbl.style.cssText = 'font-size:7px; color:#666; margin-right:8px; display:inline-block; width:40px;';
      lbl.textContent = label;
      row.appendChild(lbl);

      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:inline-flex; gap:4px; vertical-align:middle; flex-wrap:wrap;';
      for (let i = 0; i < palette.length; i++) {
        const s = document.createElement('div');
        s.className = 'settings-swatch';
        s.dataset.group = group;
        s.dataset.index = i;
        const isSelected = selected[group] === palette[i];
        s.style.cssText = `
          width:22px; height:22px; border-radius:4px; cursor:pointer;
          background:${hex(palette[i])};
          border:2px solid ${isSelected ? '#2d3a5e' : 'transparent'};
          box-sizing:border-box; flex-shrink:0;
        `;
        wrap.appendChild(s);
      }
      row.appendChild(wrap);
      return row;
    };

    palettesDiv.appendChild(swatchRow('Skin', SKIN_PALETTE, 'skin'));
    palettesDiv.appendChild(swatchRow('Hair', HAIR_PALETTE, 'hair'));
    palettesDiv.appendChild(swatchRow('Shirt', SHIRT_PALETTE, 'shirt'));
    palettesDiv.appendChild(swatchRow('Pants', PANTS_PALETTE, 'pants'));
    charRow.appendChild(palettesDiv);

    charSection.appendChild(charRow);
    modal.appendChild(charSection);

    overlay.appendChild(modal);

    // Append to game container
    const container = this.scene.game.canvas.parentElement;
    container.appendChild(overlay);
    this.el = overlay;

    // Preview drawing
    const ctx = canvas.getContext('2d');
    const drawPreview = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2 + 6;
      const sc = 2;

      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 5 * sc, 10 * sc, 4 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = hex(selected.skin);
      ctx.beginPath();
      ctx.arc(cx, cy - 13 * sc, 5 * sc, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = hex(selected.hair);
      ctx.fillRect(cx - 5 * sc, cy - 18 * sc, 10 * sc, 4 * sc);

      ctx.fillStyle = hex(selected.shirt);
      ctx.fillRect(cx - 4 * sc, cy - 8 * sc, 8 * sc, 9 * sc);
      ctx.fillRect(cx - 6 * sc, cy - 7 * sc, 2 * sc, 6 * sc);
      ctx.fillRect(cx + 4 * sc, cy - 5 * sc, 2 * sc, 6 * sc);

      ctx.fillStyle = hex(selected.pants);
      ctx.fillRect(cx - 4 * sc, cy + 1 * sc, 3 * sc, 7 * sc);
      ctx.fillRect(cx + 1 * sc, cy + 1 * sc, 3 * sc, 6 * sc);

      ctx.fillStyle = '#222222';
      ctx.fillRect(cx + 1 * sc, cy - 14 * sc, 2 * sc, 2 * sc);
    };
    drawPreview();

    // Update swatch borders
    const updateBorders = () => {
      overlay.querySelectorAll('.settings-swatch').forEach((el) => {
        const group = el.dataset.group;
        const idx = parseInt(el.dataset.index);
        const isSelected = selected[group] === palettes[group][idx];
        el.style.border = isSelected ? '2px solid #2d3a5e' : '2px solid transparent';
      });
    };

    // Swatch click handler
    palettesDiv.addEventListener('click', (e) => {
      const swatch = e.target.closest('.settings-swatch');
      if (!swatch) return;
      const group = swatch.dataset.group;
      const idx = parseInt(swatch.dataset.index);
      selected[group] = palettes[group][idx];

      // Apply to player character immediately
      player[group] = selected[group];
      player.draw();

      updateBorders();
      drawPreview();
    });

    // Close button
    overlay.querySelector('#settings-close-btn').addEventListener('click', () => this.hide());
  }
}
