import Phaser from 'phaser';
import { WIDTH, HEIGHT, TOWN_X, TOWN_Y, TOWN_VIEW_W } from '../constants.js';
import { WebSocketClient } from '../network.js';
import { HUD } from '../ui/HUD.js';
import { MathPanel } from '../ui/MathPanel.js';
import { ShopOverlay } from '../ui/ShopOverlay.js';
import { Leaderboard } from '../ui/Leaderboard.js';
import { ScratchPad } from '../ui/ScratchPad.js';
import { TownRenderer } from '../town/TownRenderer.js';
import { PlayerCharacter } from '../town/PlayerCharacter.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.playerName = data.name;
    this.wsUrl = data.wsUrl;
    this.grade = data.grade;
    this.gameState = {
      coins: 0,
      buildings: [],
      cars: [],
      problem: { text: '...' },
      income: 0,
      population: 0,
      pop_bonus: 1.0,
      leaderboard: [],
      rebirths: 0,
    };
    this.viewingCity = null;
    this.resultFlash = null;
  }

  create() {
    // Network
    this.net = new WebSocketClient();
    this.setupNetwork();
    this.doConnect();

    // Town renderer (draws in world space, scrolls with camera)
    this.townRenderer = new TownRenderer(this);

    // Player character
    this.player = new PlayerCharacter(this, this.playerName);

    // Frame overlay — covers areas outside the town viewport so town
    // objects only show through the viewport window. Depth 750 = above
    // all town objects but below all UI elements.
    const frame = this.add.graphics();
    frame.setScrollFactor(0);
    frame.setDepth(750);
    frame.fillStyle(0xc8e1ff, 1);
    frame.fillRect(0, 0, WIDTH, TOWN_Y);                                              // top
    frame.fillRect(0, TOWN_Y, TOWN_X, HEIGHT - TOWN_Y);                               // left
    frame.fillRect(TOWN_X + TOWN_VIEW_W, TOWN_Y, WIDTH - TOWN_X - TOWN_VIEW_W, HEIGHT - TOWN_Y); // right
    frame.fillRect(TOWN_X, HEIGHT - 15, TOWN_VIEW_W, 15);                             // bottom

    // Town viewport border
    frame.lineStyle(2, 0x8899aa, 1);
    frame.strokeRect(TOWN_X, TOWN_Y, TOWN_VIEW_W, HEIGHT - TOWN_Y - 15);

    // UI elements (fixed to screen, above frame)
    this.hud = new HUD(this);
    this.mathPanel = new MathPanel(this);
    this.leaderboard = new Leaderboard(this);
    this.scratchPad = new ScratchPad(this);
    this.shopOverlay = new ShopOverlay(this);

    // Make canvas focusable so clicking it blurs DOM inputs
    this.game.canvas.setAttribute('tabindex', '0');
    this.game.canvas.style.outline = 'none';

    // Click on game area → blur any focused DOM input so movement keys work
    this.input.on('pointerdown', () => {
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) {
        el.blur();
      }
    });

    // Key bindings (default capture so Phaser reliably tracks key state;
    // DOM inputs use stopPropagation so Phaser won't interfere with typing)
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard.addKey('W'),
      A: this.input.keyboard.addKey('A'),
      S: this.input.keyboard.addKey('S'),
      D: this.input.keyboard.addKey('D'),
    };
  }

  // Town objects scroll with the camera (default behavior)
  addTownObj(obj) {
    return obj;
  }

  // UI objects stay fixed on screen
  addUIObj(obj) {
    obj.setScrollFactor(0);
    return obj;
  }

  doConnect() {
    this.net.connect(this.wsUrl).then(() => {
      this.net.send({
        type: 'join',
        name: this.playerName,
        grade: this.grade,
      });
    }).catch((err) => {
      console.error('Connection failed:', err);
      this.scene.start('ConnectScene');
    });
  }

  setupNetwork() {
    this.net.on('state', (msg) => {
      this.gameState = {
        coins: msg.coins,
        buildings: msg.buildings,
        cars: msg.cars,
        problem: msg.problem,
        income: msg.income,
        population: msg.population,
        pop_bonus: msg.pop_bonus,
        leaderboard: msg.leaderboard,
        rebirths: msg.rebirths,
      };
      this.hud.update(this.gameState);
      this.mathPanel.updateProblem(this.gameState.problem.text);
      this.leaderboard.update(this.gameState.leaderboard);
      if (!this.viewingCity) {
        this.townRenderer.updateBuildings(this.gameState.buildings);
      }
    });

    this.net.on('result', (msg) => {
      if (msg.result === 'correct') {
        this.resultFlash = {
          text: `+${msg.reward} coins!`,
          color: '#44dd66',
          timer: 90,
        };
      } else {
        this.resultFlash = {
          text: 'Wrong!',
          color: '#ff4444',
          timer: 60,
        };
      }
      this.mathPanel.showResult(msg.result, msg.reward);
    });

    this.net.on('bought', (msg) => {
      // Purchase confirmed — state update will follow
    });

    this.net.on('error', (msg) => {
      console.warn('Server error:', msg.message);
    });

    this.net.on('city_view', (msg) => {
      this.viewingCity = msg;
      this.townRenderer.updateBuildings(msg.buildings);
      this.leaderboard.showCityView(msg.player_name);
    });

    this.net.on('disconnect', () => {
      console.warn('Disconnected from server');
    });
  }

  submitAnswer(answer) {
    this.net.send({ type: 'answer', answer });
  }

  buyItem(name) {
    this.net.send({ type: 'buy', building: name });
  }

  viewCity(playerName) {
    this.net.send({ type: 'view_city', player_name: playerName });
  }

  leaveCityView() {
    this.viewingCity = null;
    this.townRenderer.updateBuildings(this.gameState.buildings);
    this.leaderboard.hideCityView();
  }

  requestRebirth() {
    this.net.send({ type: 'rebirth' });
  }

  update() {
    // Don't process movement when shop is open or typing
    if (!this.shopOverlay.visible) {
      this.player.handleMovement(this.cursors, this.wasd);
    }

    // Camera follow player — center player in the town viewport area
    const px = this.player.x;
    const py = this.player.y;
    const cam = this.cameras.main;
    const lerp = 0.12;
    const viewH = HEIGHT - TOWN_Y - 15;
    const targetX = px - TOWN_X - TOWN_VIEW_W / 2;
    const targetY = py - TOWN_Y - viewH / 2;
    cam.scrollX += (targetX - cam.scrollX) * lerp;
    cam.scrollY += (targetY - cam.scrollY) * lerp;

    // Result flash
    if (this.resultFlash) {
      this.resultFlash.timer--;
      if (this.resultFlash.timer <= 0) {
        this.resultFlash = null;
      }
    }

    // Depth sort town objects
    this.townRenderer.depthSort();
  }
}
