import { WIDTH, HEIGHT, formatNumber } from '../constants.js';

export class Leaderboard {
  constructor(scene) {
    this.scene = scene;
    this.cityViewName = null;

    const panelX = WIDTH - 365;
    const panelY = 200;
    const panelW = 350;
    const panelH = HEIGHT - panelY - 15;

    // Panel background
    this.bg = scene.add.graphics();
    this.bg.setScrollFactor(0);
    this.bg.setDepth(800);
    this.bg.fillStyle(0xf0f2fa, 0.95);
    this.bg.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
    this.bg.lineStyle(2, 0xd0d4e8, 1);
    this.bg.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);

    // Title
    this.title = scene.add.text(panelX + panelW / 2, panelY + 15, 'Leaderboard', {
      fontFamily: 'Arial',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#2d3a5e',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(801);

    // Player entries (DOM for clickable names)
    this.entriesContainer = null;
    this.panelX = panelX;
    this.panelY = panelY;
    this.panelW = panelW;
    this.panelH = panelH;

    // City view back button (hidden by default)
    this.cityViewLabel = scene.add.text(panelX + panelW / 2, panelY + 40, '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#6677aa',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(801);

    this.backBtnBg = scene.add.graphics();
    this.backBtnBg.setScrollFactor(0);
    this.backBtnBg.setDepth(801);
    this.backBtnBg.visible = false;

    this.backBtnText = scene.add.text(panelX + panelW / 2, panelY + panelH - 40, 'Back to My City', {
      fontFamily: 'Arial',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(802).setVisible(false);

    this.backBtnZone = scene.add.zone(panelX + panelW / 2, panelY + panelH - 30, 120, 30)
      .setScrollFactor(0)
      .setDepth(802)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);

    this.backBtnZone.on('pointerdown', () => {
      scene.leaveCityView();
    });

    // Leaderboard entry texts
    this.entryTexts = [];
    this.entryZones = [];
    const medalColors = ['#ffc832', '#bec3cd', '#cd965a'];

    for (let i = 0; i < 10; i++) {
      const y = panelY + 45 + i * 44;
      const rank = i + 1;

      // Rank number
      const rankText = scene.add.text(panelX + 15, y + 4, `${rank}.`, {
        fontFamily: 'Arial',
        fontSize: '14px',
        fontStyle: 'bold',
        color: i < 3 ? medalColors[i] : '#888',
      }).setScrollFactor(0).setDepth(801);

      // Name
      const nameText = scene.add.text(panelX + 38, y + 2, '', {
        fontFamily: 'Arial',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#2d3a5e',
      }).setScrollFactor(0).setDepth(801);

      // Coins
      const coinsText = scene.add.text(panelX + 38, y + 20, '', {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#888',
      }).setScrollFactor(0).setDepth(801);

      // Click zone for viewing city
      const zone = scene.add.zone(panelX + panelW / 2, y + 15, panelW - 20, 40)
        .setScrollFactor(0)
        .setDepth(802)
        .setInteractive({ useHandCursor: true });

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
    for (let i = 0; i < 10; i++) {
      const entry = this.entryTexts[i];
      if (i < leaderboard.length) {
        const p = leaderboard[i];
        entry.nameText.setText(p.name);
        let detail = formatNumber(p.coins) + ' coins';
        if (p.rebirths > 0) detail += ` (R${p.rebirths})`;
        entry.coinsText.setText(detail);

        // Highlight current player
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
    this.backBtnBg.visible = true;
    this.backBtnBg.clear();
    this.backBtnBg.fillStyle(0x3778c8, 1);
    this.backBtnBg.fillRoundedRect(
      this.panelX + this.panelW / 2 - 65,
      this.panelY + this.panelH - 45,
      130, 30, 6
    );
    this.backBtnText.setVisible(true);
    this.backBtnZone.setVisible(true);
  }

  hideCityView() {
    this.cityViewName = null;
    this.cityViewLabel.setText('');
    this.backBtnBg.visible = false;
    this.backBtnText.setVisible(false);
    this.backBtnZone.setVisible(false);
  }
}
