import { WIDTH, HEIGHT, TOWN_X, TOWN_VIEW_W, formatNumber } from '../constants.js';

export class Leaderboard {
  constructor(scene) {
    this.scene = scene;
    this.cityViewName = null;
    const ui = (obj) => scene.addUIObj(obj);

    const panelX = TOWN_X + TOWN_VIEW_W + 15;
    const panelY = 250;
    const panelW = 350;
    const panelH = HEIGHT - panelY - 15;

    // Panel background
    this.bg = ui(scene.add.graphics());
    this.bg.setScrollFactor(0);
    this.bg.setDepth(800);
    this.bg.fillStyle(0xf0f2fa, 0.95);
    this.bg.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
    this.bg.lineStyle(2, 0xd0d4e8, 1);
    this.bg.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);

    // Title
    this.title = ui(scene.add.text(panelX + panelW / 2, panelY + 15, 'Leaderboard', {
      fontFamily: 'Arial',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#2d3a5e',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(801));

    this.panelX = panelX;
    this.panelY = panelY;
    this.panelW = panelW;
    this.panelH = panelH;

    // City view back button (hidden by default)
    this.cityViewLabel = ui(scene.add.text(panelX + panelW / 2, panelY + 40, '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#6677aa',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(801));

    // Back button (DOM for reliable clicking)
    const backHTML = `<button id="lb-back-btn" style="
      background: #3778c8; color: white; border: none; border-radius: 6px;
      padding: 6px 16px; font-family: Arial, sans-serif; font-size: 14px;
      font-weight: bold; cursor: pointer; display: none;
    ">Back to My City</button>`;
    this.backBtnDOM = ui(scene.add.dom(panelX + panelW / 2, panelY + panelH - 30).createFromHTML(backHTML));
    this.backBtnDOM.setScrollFactor(0);
    this.backBtnDOM.setDepth(802);
    this.backBtnEl = this.backBtnDOM.getChildByID('lb-back-btn');
    this.backBtnEl.addEventListener('click', () => scene.leaveCityView());

    // Leaderboard entry texts
    this.entryTexts = [];
    this.entryZones = [];
    const medalColors = ['#ffc832', '#bec3cd', '#cd965a'];

    for (let i = 0; i < 6; i++) {
      const y = panelY + 45 + i * 38;
      const rank = i + 1;

      const rankText = ui(scene.add.text(panelX + 15, y + 4, `${rank}.`, {
        fontFamily: 'Arial',
        fontSize: '14px',
        fontStyle: 'bold',
        color: i < 3 ? medalColors[i] : '#888',
      }).setScrollFactor(0).setDepth(801));

      const nameText = ui(scene.add.text(panelX + 38, y + 2, '', {
        fontFamily: 'Arial',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#2d3a5e',
      }).setScrollFactor(0).setDepth(801));

      const coinsText = ui(scene.add.text(panelX + 38, y + 20, '', {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#888',
      }).setScrollFactor(0).setDepth(801));

      const zone = ui(scene.add.zone(panelX + panelW / 2, y + 15, panelW - 20, 40)
        .setScrollFactor(0)
        .setDepth(802)
        .setInteractive({ useHandCursor: true }));

      zone.on('pointerdown', () => {
        const text = nameText.text;
        if (text && text !== scene.playerName) {
          scene.viewCity(text);
        }
      });

      this.entryTexts.push({ rankText, nameText, coinsText });
      this.entryZones.push(zone);
    }
  }

  update(leaderboard) {
    for (let i = 0; i < 6; i++) {
      const entry = this.entryTexts[i];
      if (i < leaderboard.length) {
        const p = leaderboard[i];
        entry.nameText.setText(p.name);
        let detail = formatNumber(p.coins) + ' coins';
        if (p.rebirths > 0) detail += ` (R${p.rebirths})`;
        entry.coinsText.setText(detail);

        if (p.name === this.scene.playerName) {
          entry.nameText.setColor('#3778c8');
        } else {
          entry.nameText.setColor('#2d3a5e');
        }

        entry.rankText.setVisible(true);
        entry.nameText.setVisible(true);
        entry.coinsText.setVisible(true);
        this.entryZones[i].setVisible(true);
      } else {
        entry.rankText.setVisible(false);
        entry.nameText.setVisible(false);
        entry.coinsText.setVisible(false);
        this.entryZones[i].setVisible(false);
      }
    }
  }

  showCityView(playerName) {
    this.cityViewName = playerName;
    this.cityViewLabel.setText(`Viewing ${playerName}'s City`);
    this.backBtnEl.style.display = 'block';
  }

  hideCityView() {
    this.cityViewName = null;
    this.cityViewLabel.setText('');
    this.backBtnEl.style.display = 'none';
  }
}
