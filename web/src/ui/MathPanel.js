import { WIDTH, HEIGHT, ACCENT } from '../constants.js';

export class MathPanel {
  constructor(scene) {
    this.scene = scene;
    this.resultTimer = 0;

    const panelX = 15;
    const panelY = 55;
    const panelW = WIDTH - 30;
    const panelH = 135;

    // Panel background
    this.bg = scene.add.graphics();
    this.bg.setScrollFactor(0);
    this.bg.setDepth(900);
    this.bg.fillStyle(0xf5f5ff, 1);
    this.bg.fillRoundedRect(panelX, panelY, panelW, panelH, 10);
    this.bg.lineStyle(2, 0xd0d4e8, 1);
    this.bg.strokeRoundedRect(panelX, panelY, panelW, panelH, 10);

    // Problem text
    this.problemText = scene.add.text(panelX + 20, panelY + 15, 'Connecting...', {
      fontFamily: 'Arial',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#2d3a5e',
    }).setScrollFactor(0).setDepth(901);

    // Result text (correct/wrong feedback)
    this.resultText = scene.add.text(panelX + 20, panelY + 55, '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#44dd66',
    }).setScrollFactor(0).setDepth(901);

    // DOM input for answer
    const formHTML = `
      <div style="display: flex; gap: 8px; align-items: center;">
        <input id="answer-input" type="number" class="game-input"
          style="width: 160px; font-size: 22px; padding: 8px 12px;"
          placeholder="Answer" />
        <button id="submit-btn" class="game-btn game-btn-green"
          style="font-size: 18px; padding: 10px 24px;">
          Submit
        </button>
      </div>
    `;

    this.form = scene.add.dom(panelX + 130, panelY + 100).createFromHTML(formHTML);
    this.form.setScrollFactor(0);
    this.form.setDepth(901);

    const answerInput = this.form.getChildByID('answer-input');
    const submitBtn = this.form.getChildByID('submit-btn');

    const doSubmit = () => {
      const val = answerInput.value.trim();
      if (val === '') return;
      scene.submitAnswer(val);
      answerInput.value = '';
      answerInput.focus();
    };

    submitBtn.addEventListener('click', doSubmit);
    answerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSubmit();
      e.stopPropagation(); // Prevent WASD from moving character while typing
    });
    answerInput.addEventListener('keyup', (e) => e.stopPropagation());
    answerInput.addEventListener('keypress', (e) => e.stopPropagation());

    // Focus answer input after scene loads
    scene.time.delayedCall(300, () => answerInput.focus());
  }

  updateProblem(text) {
    this.problemText.setText(text);
  }

  showResult(result, reward) {
    if (result === 'correct') {
      this.resultText.setText(`Correct! +${reward} coins`);
      this.resultText.setColor('#44dd66');
    } else {
      this.resultText.setText('Wrong! Try the next one.');
      this.resultText.setColor('#ff4444');
    }
    this.resultTimer = 90;

    // Clear result after a delay
    this.scene.time.delayedCall(3000, () => {
      this.resultText.setText('');
    });
  }
}
