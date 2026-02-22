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

    // Shop button
    this.shopBtn = ui(scene.add.graphics());
    this.shopBtn.setScrollFactor(0);
    this.shopBtn.setDepth(901);
    this.drawShopButton(false);

    this.shopBtnZone = ui(scene.add.zone(WIDTH - 70, 22, 100, 34)
      .setScrollFactor(0)
      .setDepth(902)
      .setInteractive({ useHandCursor: true }));

    this.shopBtnZone.on('pointerover', () => this.drawShopButton(true));
    this.shopBtnZone.on('pointerout', () => this.drawShopButton(false));
    this.shopBtnZone.on('pointerdown', () => {
      scene.shopOverlay.toggle();
    });

    // Rebirth button (shows when coins >= 1M)
    this.rebirthBtn = ui(scene.add.graphics());
    this.rebirthBtn.setScrollFactor(0);
    this.rebirthBtn.setDepth(901);
    this.rebirthBtn.visible = false;

    this.rebirthBtnText = ui(scene.add.text(WIDTH - 165, 14, 'Rebirth', {
      fontFamily: 'Arial',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setScrollFactor(0).setDepth(902).setVisible(false));

    this.rebirthBtnZone = ui(scene.add.zone(WIDTH - 155, 22, 65, 28)
      .setScrollFactor(0)
      .setDepth(902)
      .setInteractive({ useHandCursor: true })
      .setVisible(false));

    this.rebirthBtnZone.on('pointerdown', () => {
      scene.requestRebirth();
    });
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

  drawShopButton(hover) {
    this.shopBtn.clear();
    const color = hover ? 0x2da046 : 0x3cbe5a;
    this.shopBtn.fillStyle(color, 1);
    this.shopBtn.fillRoundedRect(WIDTH - 120, 6, 100, 34, 6);
    if (!this.shopLabel) {
      this.shopLabel = this.scene.addUIObj(this.scene.add.text(WIDTH - 70, 15, 'Shop', {
        fontFamily: 'Arial',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(902));
    }
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
    this.rebirthBtn.visible = canRebirth;
    this.rebirthBtnText.setVisible(canRebirth);
    this.rebirthBtnZone.setVisible(canRebirth);

    if (canRebirth) {
      this.rebirthBtn.clear();
      this.rebirthBtn.fillStyle(0x8c50dc, 1);
      this.rebirthBtn.fillRoundedRect(WIDTH - 190, 8, 65, 28, 4);
    }
  }
}
