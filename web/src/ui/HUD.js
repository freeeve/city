import { WIDTH, HEADER_TOP, HEADER_BOT, COIN_GOLD, formatNumber, rgb } from '../constants.js';

export class HUD {
  constructor(scene) {
    this.scene = scene;
    const ui = (obj) => scene.addUIObj(obj);

    // Header background
    this.headerBg = ui(scene.add.graphics());
    this.headerBg.setScrollFactor(0);
    this.headerBg.setDepth(900);
    this.drawHeader();

    // Coin icon (small circle)
    this.coinIcon = ui(scene.add.graphics());
    this.coinIcon.setScrollFactor(0);
    this.coinIcon.setDepth(901);
    this.coinIcon.fillStyle(COIN_GOLD, 1);
    this.coinIcon.fillCircle(30, 22, 10);
    this.coinIcon.fillStyle(0xc8a01e, 1);
    this.coinIcon.fillCircle(30, 22, 6);
    this.coinIcon.fillStyle(COIN_GOLD, 1);
    this.coinIcon.fillCircle(29, 21, 5);

    // Coins text
    this.coinsText = ui(scene.add.text(46, 12, '0', {
      fontFamily: 'Arial',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffd23c',
    }).setScrollFactor(0).setDepth(901));

    // Population
    this.popText = ui(scene.add.text(220, 12, 'Pop: 0', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ddeeff',
    }).setScrollFactor(0).setDepth(901));

    // Bonus
    this.bonusText = ui(scene.add.text(220, 30, 'Bonus: x1.0', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#aaccee',
    }).setScrollFactor(0).setDepth(901));

    // Income
    this.incomeText = ui(scene.add.text(380, 12, 'Income: +0', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#88ddaa',
    }).setScrollFactor(0).setDepth(901));

    // Rebirths
    this.rebirthText = ui(scene.add.text(380, 30, '', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#ddaaff',
    }).setScrollFactor(0).setDepth(901));

    // Shop button (DOM for reliable click handling)
    const shopHTML = `<button id="hud-shop-btn" style="
      background: #3cbe5a; color: white; border: none; border-radius: 6px;
      padding: 6px 20px; font-family: Arial, sans-serif; font-size: 16px;
      font-weight: bold; cursor: pointer;
    ">Shop</button>`;
    this.shopBtnDOM = ui(scene.add.dom(WIDTH - 70, 22).createFromHTML(shopHTML));
    this.shopBtnDOM.setScrollFactor(0);
    this.shopBtnDOM.setDepth(902);
    const shopBtnEl = this.shopBtnDOM.getChildByID('hud-shop-btn');
    console.log('[HUD] Shop button element:', shopBtnEl);
    shopBtnEl.addEventListener('click', () => {
      console.log('[HUD] Shop button clicked');
      scene.shopOverlay.toggle();
    });
    shopBtnEl.addEventListener('mouseenter', () => { shopBtnEl.style.background = '#2da048'; });
    shopBtnEl.addEventListener('mouseleave', () => { shopBtnEl.style.background = '#3cbe5a'; });

    // Rebirth button (DOM, shows when coins >= 1M)
    const rebirthHTML = `<button id="hud-rebirth-btn" style="
      background: #8c50dc; color: white; border: none; border-radius: 4px;
      padding: 4px 14px; font-family: Arial, sans-serif; font-size: 14px;
      font-weight: bold; cursor: pointer; display: none;
    ">Rebirth</button>`;
    this.rebirthBtnDOM = ui(scene.add.dom(WIDTH - 155, 22).createFromHTML(rebirthHTML));
    this.rebirthBtnDOM.setScrollFactor(0);
    this.rebirthBtnDOM.setDepth(902);
    this.rebirthBtnEl = this.rebirthBtnDOM.getChildByID('hud-rebirth-btn');
    this.rebirthBtnEl.addEventListener('click', () => scene.requestRebirth());
    this.rebirthBtnEl.addEventListener('mouseenter', () => { this.rebirthBtnEl.style.background = '#783cbe'; });
    this.rebirthBtnEl.addEventListener('mouseleave', () => { this.rebirthBtnEl.style.background = '#8c50dc'; });
  }

  drawHeader() {
    this.headerBg.clear();
    for (let y = 0; y < 50; y++) {
      const t = y / 50;
      const r = Math.floor(45 + t * 20);
      const g = Math.floor(100 + t * 40);
      const b = Math.floor(180 + t * 40);
      this.headerBg.fillStyle((r << 16) | (g << 8) | b, 1);
      this.headerBg.fillRect(0, y, WIDTH, 1);
    }
    this.headerBg.fillStyle(0x1e3a6e, 1);
    this.headerBg.fillRect(0, 48, WIDTH, 2);
  }

  update(state) {
    this.coinsText.setText(formatNumber(state.coins));
    this.popText.setText(`Pop: ${formatNumber(state.population)}`);
    this.bonusText.setText(`Bonus: x${state.pop_bonus.toFixed(1)}`);
    this.incomeText.setText(`Income: +${formatNumber(state.income)}`);

    if (state.rebirths > 0) {
      this.rebirthText.setText(`Rebirths: ${state.rebirths}`);
    } else {
      this.rebirthText.setText('');
    }

    const canRebirth = state.coins >= 1_000_000;
    this.rebirthBtnEl.style.display = canRebirth ? 'block' : 'none';
  }
}
