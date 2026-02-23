import Phaser from 'phaser';
import { WIDTH, HEIGHT, TOWN_X, TOWN_Y, TOWN_VIEW_W, ROW_HEIGHT } from '../constants.js';
import { WebSocketClient } from '../network.js';
import { HUD } from '../ui/HUD.js';
import { MathPanel } from '../ui/MathPanel.js';
import { ShopOverlay } from '../ui/ShopOverlay.js';
import { Leaderboard } from '../ui/Leaderboard.js';
import { ScratchPad } from '../ui/ScratchPad.js';
import { TownRenderer } from '../town/TownRenderer.js';
import { PlayerCharacter } from '../town/PlayerCharacter.js';
import { BuildingInterior } from '../town/BuildingInterior.js';
import { VirtualJoystick } from '../ui/VirtualJoystick.js';
import { MusicPlayer } from '../audio/MusicPlayer.js';
import { NPCSystem } from '../town/NPCSystem.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.playerName = data.name;
    this.wsUrl = data.wsUrl;
    this.grade = data.grade;
    this.appearance = data.appearance;
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
    this.player = new PlayerCharacter(this, this.playerName, this.appearance);

    // Snap camera to player immediately so character starts centered
    const viewH = HEIGHT - TOWN_Y - 15;
    const cam = this.cameras.main;
    cam.scrollX = this.player.x - TOWN_X - TOWN_VIEW_W / 2;
    cam.scrollY = this.player.y - TOWN_Y - viewH / 2;

    // Building interior system
    this.buildingInterior = new BuildingInterior(this);

    // NPC pedestrian system
    this.npcSystem = new NPCSystem(this);
    this.frameTick = 0;

    // Frame overlay — covers areas outside the town viewport so town
    // objects only show through the viewport window. Depth 750 = above
    // all town objects but below all UI elements.
    const frame = this.add.graphics();
    frame.setScrollFactor(0);
    frame.setDepth(5000);
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

    // Virtual joystick (mobile only)
    const container = this.game.canvas.parentElement;
    this.joystick = new VirtualJoystick(container);

    // Music player (starts on first user click due to browser autoplay policy)
    this.music = new MusicPlayer();
    this.input.once('pointerdown', () => {
      this.music.start();
    });

    // Make canvas focusable so clicking it blurs DOM inputs
    this.game.canvas.setAttribute('tabindex', '0');
    this.game.canvas.style.outline = 'none';

    // Click on game area -> blur any focused DOM input so movement keys work
    this.input.on('pointerdown', () => {
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) {
        el.blur();
      }
    });

    // Prevent iOS rubber-banding
    const canvas = this.game.canvas;
    canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    // Key bindings (default capture so Phaser reliably tracks key state;
    // DOM inputs use stopPropagation so Phaser won't interfere with typing)
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard.addKey('W'),
      A: this.input.keyboard.addKey('A'),
      S: this.input.keyboard.addKey('S'),
      D: this.input.keyboard.addKey('D'),
    };

    // E key for entering/exiting buildings
    this.enterKey = this.input.keyboard.addKey('E');
    this.enterKeyJustPressed = false;
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
      const prevPop = this.gameState.population;
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
      // Spawn/update NPCs when population changes
      if (msg.population !== prevPop) {
        this.npcSystem.init(msg.population, msg.buildings);
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
    // Handle E key for building entry/exit
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      const active = document.activeElement;
      const typing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT');
      if (!typing) {
        if (this.buildingInterior.visible) {
          this.buildingInterior.exit();
        } else {
          const idx = this.player.getNearbyBuildingIndex();
          if (idx >= 0 && idx < this.gameState.buildings.length) {
            this.buildingInterior.enter(this.gameState.buildings[idx], idx);
          } else {
            // Check for house entry
            const houseIdx = this.player.getNearbyHouseIndex(this.gameState.population);
            if (houseIdx >= 0) {
              this.buildingInterior.enterHouse(houseIdx);
            }
          }
        }
      }
    }

    // Movement handling
    if (this.buildingInterior.visible) {
      // Inside a building — use interior movement
      this.buildingInterior.handleMovement(this.cursors, this.wasd, this.joystick);
    } else if (!this.shopOverlay.visible) {
      // Normal town movement
      this.player.handleMovement(this.cursors, this.wasd, this.joystick);
      this.buildingInterior.updatePrompt();
    }

    // Hide/show joystick when shop is open
    if (this.joystick && this.joystick.visible) {
      if (this.shopOverlay.visible) {
        this.joystick.hide();
      } else {
        this.joystick.show();
      }
    }

    // Camera follow player — center player in the town viewport area
    const px = this.player.x;
    const py = this.player.y;
    const cam = this.cameras.main;
    const lerp = 0.5;
    const viewH = HEIGHT - TOWN_Y - 15;
    const targetX = px - TOWN_X - TOWN_VIEW_W / 2;
    const targetY = py - TOWN_Y - viewH / 2;
    cam.scrollX += (targetX - cam.scrollX) * lerp;
    cam.scrollY += (targetY - cam.scrollY) * lerp;

    // Soft clamp: keep camera within world bounds (skip when inside a building)
    if (!this.buildingInterior.visible) {
      const totalRows = Math.ceil(44 / 6);
      const worldH = totalRows * ROW_HEIGHT + 100;
      if (cam.scrollX < -50) cam.scrollX = -50;
      if (cam.scrollY < -TOWN_Y) cam.scrollY = -TOWN_Y;
      if (cam.scrollY > worldH - viewH) cam.scrollY = worldH - viewH;
    }

    // Result flash
    if (this.resultFlash) {
      this.resultFlash.timer--;
      if (this.resultFlash.timer <= 0) {
        this.resultFlash = null;
      }
    }

    // Update NPC pedestrians
    this.frameTick++;
    this.npcSystem.update();

    // Depth sort town objects
    this.townRenderer.depthSort();
  }
}
