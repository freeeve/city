import Phaser from 'phaser';
import { WIDTH, HEIGHT, rgb, formatNumber } from '../constants.js';
import { BUILDINGS, BUILDING_ORDER, BUILDING_COLORS, BUILDING_POPULATION, CARS, CAR_ORDER, UNLOCK_REQUIREMENTS, BUILDING_IMAGES } from '../shared.js';

export class ShopOverlay {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.scrollY = 0;
    this.container = null;
    this.domElement = null;
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
    if (this.domElement) {
      this.domElement.destroy();
      this.domElement = null;
    }
    if (this.backdrop) {
      this.backdrop.destroy();
      this.backdrop = null;
    }
  }

  render() {
    if (this.domElement) this.domElement.destroy();
    if (this.backdrop) this.backdrop.destroy();

    // Dark backdrop
    this.backdrop = this.scene.add.graphics();
    this.backdrop.setScrollFactor(0);
    this.backdrop.setDepth(950);
    this.backdrop.fillStyle(0x000000, 0.7);
    this.backdrop.fillRect(0, 0, WIDTH, HEIGHT);
    this.backdrop.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, WIDTH, HEIGHT),
      Phaser.Geom.Rectangle.Contains
    );
    this.backdrop.on('pointerdown', () => this.hide());
    // Hide from town camera
    this.scene.addUIObj(this.backdrop);

    const state = this.scene.gameState;
    const pop = state.population;
    const coins = state.coins;

    let html = `<div style="
      width: 560px;
      max-height: ${HEIGHT - 80}px;
      background: #f0f2fa;
      border-radius: 12px;
      padding: 20px;
      font-family: Arial, sans-serif;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    " onclick="event.stopPropagation();">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h2 style="margin: 0; color: #2d3a5e; font-size: 24px;">Shop</h2>
        <button id="shop-close-btn" style="
          background: #dc4646;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 16px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
        ">Close</button>
      </div>
      <div style="color: #666; font-size: 14px; margin-bottom: 12px;">
        Coins: ${formatNumber(coins)} | Population: ${formatNumber(pop)}
      </div>
      <h3 style="color: #2d3a5e; margin: 8px 0;">Buildings</h3>`;

    for (const name of BUILDING_ORDER) {
      const b = BUILDINGS[name];
      const bPop = BUILDING_POPULATION[name] || 0;
      const req = UNLOCK_REQUIREMENTS[name] || 0;
      const locked = req > 0 && pop < req;
      const canAfford = coins >= b.cost;
      const [cr, cg, cb] = BUILDING_COLORS[name] || [128, 128, 128];
      const colorHex = `rgb(${cr},${cg},${cb})`;

      html += `<div style="
        display: flex;
        align-items: center;
        padding: 8px 10px;
        margin: 4px 0;
        background: ${locked ? '#e0e0e0' : '#ffffff'};
        border-radius: 8px;
        border: 1px solid ${locked ? '#ccc' : '#dde0ee'};
        opacity: ${locked ? '0.6' : '1'};
      ">
        <div style="
          width: 36px;
          height: 36px;
          background: ${colorHex};
          border-radius: 6px;
          margin-right: 12px;
          flex-shrink: 0;
        "></div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: bold; color: #2d3a5e; font-size: 14px;">${name}</div>
          <div style="font-size: 12px; color: #666;">
            Cost: ${formatNumber(b.cost)} | Income: +${formatNumber(b.income)} | Pop: +${bPop}
            ${locked ? ` | Needs ${formatNumber(req)} pop` : ''}
          </div>
        </div>
        <button class="shop-buy-btn" data-name="${name}" style="
          background: ${locked ? '#aaa' : (canAfford ? '#3cbe5a' : '#999')};
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: bold;
          cursor: ${locked || !canAfford ? 'not-allowed' : 'pointer'};
          flex-shrink: 0;
        " ${locked || !canAfford ? 'disabled' : ''}>Buy</button>
      </div>`;
    }

    html += `<h3 style="color: #2d3a5e; margin: 16px 0 8px;">Vehicles</h3>`;

    for (const name of CAR_ORDER) {
      const c = CARS[name];
      const req = UNLOCK_REQUIREMENTS[name] || 0;
      const locked = req > 0 && pop < req;
      const canAfford = coins >= c.cost;
      const [cr, cg, cb] = c.color;
      const colorHex = `rgb(${cr},${cg},${cb})`;

      html += `<div style="
        display: flex;
        align-items: center;
        padding: 8px 10px;
        margin: 4px 0;
        background: ${locked ? '#e0e0e0' : '#ffffff'};
        border-radius: 8px;
        border: 1px solid ${locked ? '#ccc' : '#dde0ee'};
        opacity: ${locked ? '0.6' : '1'};
      ">
        <div style="
          width: 36px;
          height: 36px;
          background: ${colorHex};
          border-radius: 6px;
          margin-right: 12px;
          flex-shrink: 0;
        "></div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: bold; color: #2d3a5e; font-size: 14px;">${name}</div>
          <div style="font-size: 12px; color: #666;">
            Cost: ${formatNumber(c.cost)} | Pop: +${c.population}
            ${locked ? ` | Needs ${formatNumber(req)} pop` : ''}
          </div>
        </div>
        <button class="shop-buy-btn" data-name="${name}" style="
          background: ${locked ? '#aaa' : (canAfford ? '#3cbe5a' : '#999')};
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: bold;
          cursor: ${locked || !canAfford ? 'not-allowed' : 'pointer'};
          flex-shrink: 0;
        " ${locked || !canAfford ? 'disabled' : ''}>Buy</button>
      </div>`;
    }

    html += `</div>`;

    this.domElement = this.scene.add.dom(WIDTH / 2, HEIGHT / 2).createFromHTML(html);
    this.domElement.setScrollFactor(0);
    this.domElement.setDepth(951);
    this.scene.addUIObj(this.domElement);

    const closeBtn = this.domElement.getChildByID('shop-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hide();
      });
    }

    const buyBtns = this.domElement.node.querySelectorAll('.shop-buy-btn');
    buyBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemName = btn.getAttribute('data-name');
        if (!btn.disabled) {
          this.scene.buyItem(itemName);
          this.scene.time.delayedCall(200, () => {
            if (this.visible) this.render();
          });
        }
      });
    });
  }
}
