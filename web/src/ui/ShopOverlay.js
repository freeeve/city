import { formatNumber } from '../constants.js';
import { BUILDINGS, BUILDING_ORDER, BUILDING_COLORS, BUILDING_POPULATION, CARS, CAR_ORDER, UNLOCK_REQUIREMENTS } from '../shared.js';

/**
 * Shop overlay — uses plain HTML outside Phaser's DOM system
 * to guarantee pointer events work reliably.
 */
export class ShopOverlay {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.el = null; // plain HTML overlay element
  }

  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
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

    const state = this.scene.gameState;
    const pop = state.population;
    const coins = state.coins;

    // Create overlay container positioned over the game canvas
    const overlay = document.createElement('div');
    overlay.id = 'shop-overlay';
    overlay.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.7); display: flex; justify-content: center;
      align-items: center; z-index: 100; font-family: 'Press Start 2P', monospace;
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.hide();
    });

    // Shop modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      width: min(560px, calc(100vw - 24px)); max-height: 85vh; background: #f0f2fa; border-radius: 12px;
      padding: 20px; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    `;
    modal.addEventListener('click', (e) => e.stopPropagation());

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;';
    header.innerHTML = `
      <h2 style="margin:0; color:#2d3a5e; font-size:14px;">Shop</h2>
      <button id="shop-close-btn" style="background:#dc4646; color:white; border:none;
        border-radius:4px; padding:6px 14px; font-size:8px; cursor:pointer;
        font-family: 'Press Start 2P', monospace;">Close</button>
    `;
    modal.appendChild(header);

    // Info
    const info = document.createElement('div');
    info.style.cssText = 'color:#666; font-size:8px; margin-bottom:12px;';
    info.textContent = `Coins: ${formatNumber(coins)} | Population: ${formatNumber(pop)}`;
    modal.appendChild(info);

    // Buildings header
    const bh = document.createElement('h3');
    bh.style.cssText = 'color:#2d3a5e; margin:8px 0;';
    bh.textContent = 'Buildings';
    modal.appendChild(bh);

    // Building entries
    for (const name of BUILDING_ORDER) {
      const b = BUILDINGS[name];
      const bPop = BUILDING_POPULATION[name] || 0;
      const req = UNLOCK_REQUIREMENTS[name] || 0;
      const locked = req > 0 && pop < req;
      const canAfford = coins >= b.cost;
      const [cr, cg, cb] = BUILDING_COLORS[name] || [128, 128, 128];

      const row = document.createElement('div');
      row.style.cssText = `
        display:flex; align-items:center; padding:8px 10px; margin:4px 0;
        background:${locked ? '#e0e0e0' : '#fff'}; border-radius:8px;
        border:1px solid ${locked ? '#ccc' : '#dde0ee'}; opacity:${locked ? '0.6' : '1'};
      `;

      const swatch = document.createElement('div');
      swatch.style.cssText = `width:36px; height:36px; background:rgb(${cr},${cg},${cb});
        border-radius:6px; margin-right:12px; flex-shrink:0;`;

      const details = document.createElement('div');
      details.style.cssText = 'flex:1; min-width:0;';
      details.innerHTML = `
        <div style="color:#2d3a5e; font-size:9px;">${name}</div>
        <div style="font-size:7px; color:#666;">
          Cost: ${formatNumber(b.cost)} | Income: +${formatNumber(b.income)} | Pop: +${bPop}
          ${locked ? ` | Needs ${formatNumber(req)} pop` : ''}
        </div>`;

      const buyBtn = document.createElement('button');
      buyBtn.textContent = 'Buy';
      buyBtn.disabled = locked || !canAfford;
      buyBtn.style.cssText = `
        background:${locked ? '#aaa' : (canAfford ? '#3cbe5a' : '#999')};
        color:white; border:none; border-radius:6px; padding:6px 14px;
        font-size:8px; flex-shrink:0; font-family: 'Press Start 2P', monospace;
        cursor:${locked || !canAfford ? 'not-allowed' : 'pointer'};
      `;
      buyBtn.addEventListener('click', () => {
        this.scene.buyItem(name);
        setTimeout(() => { if (this.visible) this.render(); }, 300);
      });

      row.appendChild(swatch);
      row.appendChild(details);
      row.appendChild(buyBtn);
      modal.appendChild(row);
    }

    // Vehicles header
    const vh = document.createElement('h3');
    vh.style.cssText = 'color:#2d3a5e; margin:16px 0 8px;';
    vh.textContent = 'Vehicles';
    modal.appendChild(vh);

    for (const name of CAR_ORDER) {
      const c = CARS[name];
      const req = UNLOCK_REQUIREMENTS[name] || 0;
      const locked = req > 0 && pop < req;
      const canAfford = coins >= c.cost;
      const [cr, cg, cb] = c.color;

      const row = document.createElement('div');
      row.style.cssText = `
        display:flex; align-items:center; padding:8px 10px; margin:4px 0;
        background:${locked ? '#e0e0e0' : '#fff'}; border-radius:8px;
        border:1px solid ${locked ? '#ccc' : '#dde0ee'}; opacity:${locked ? '0.6' : '1'};
      `;

      const swatch = document.createElement('div');
      swatch.style.cssText = `width:36px; height:36px; background:rgb(${cr},${cg},${cb});
        border-radius:6px; margin-right:12px; flex-shrink:0;`;

      const details = document.createElement('div');
      details.style.cssText = 'flex:1; min-width:0;';
      details.innerHTML = `
        <div style="color:#2d3a5e; font-size:9px;">${name}</div>
        <div style="font-size:7px; color:#666;">
          Cost: ${formatNumber(c.cost)} | Pop: +${c.population}
          ${locked ? ` | Needs ${formatNumber(req)} pop` : ''}
        </div>`;

      const buyBtn = document.createElement('button');
      buyBtn.textContent = 'Buy';
      buyBtn.disabled = locked || !canAfford;
      buyBtn.style.cssText = `
        background:${locked ? '#aaa' : (canAfford ? '#3cbe5a' : '#999')};
        color:white; border:none; border-radius:6px; padding:6px 14px;
        font-size:8px; flex-shrink:0; font-family: 'Press Start 2P', monospace;
        cursor:${locked || !canAfford ? 'not-allowed' : 'pointer'};
      `;
      buyBtn.addEventListener('click', () => {
        this.scene.buyItem(name);
        setTimeout(() => { if (this.visible) this.render(); }, 300);
      });

      row.appendChild(swatch);
      row.appendChild(details);
      row.appendChild(buyBtn);
      modal.appendChild(row);
    }

    overlay.appendChild(modal);

    // Append to game container (so it covers the game canvas)
    const container = this.scene.game.canvas.parentElement;
    container.appendChild(overlay);
    this.el = overlay;

    // Wire close button
    const closeBtn = overlay.querySelector('#shop-close-btn');
    closeBtn.addEventListener('click', () => this.hide());
  }
}
