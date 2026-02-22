/**
 * Virtual joystick for mobile touch controls.
 * Plain HTML overlay — only visible on touch devices.
 */
export class VirtualJoystick {
  constructor(container) {
    this.dx = 0;
    this.dy = 0;
    this.active = false;
    this.visible = false;
    this._touchId = null;

    // Only show on touch devices
    if (!('ontouchstart' in window)) return;
    this.visible = true;

    const outerSize = 120;
    const knobSize = 50;
    this.maxDist = (outerSize - knobSize) / 2;

    // Outer circle
    this.el = document.createElement('div');
    this.el.id = 'virtual-joystick';
    this.el.style.cssText = `
      position: absolute; bottom: 20px; left: 20px; z-index: 50;
      width: ${outerSize}px; height: ${outerSize}px;
      border-radius: 50%; background: rgba(0,0,0,0.25);
      border: 2px solid rgba(255,255,255,0.2);
      touch-action: none; pointer-events: auto;
    `;

    // Inner knob
    this.knob = document.createElement('div');
    this.knob.style.cssText = `
      position: absolute; width: ${knobSize}px; height: ${knobSize}px;
      border-radius: 50%; background: rgba(255,255,255,0.35);
      border: 2px solid rgba(255,255,255,0.4);
      left: ${(outerSize - knobSize) / 2}px;
      top: ${(outerSize - knobSize) / 2}px;
      transition: none; pointer-events: none;
    `;
    this.el.appendChild(this.knob);
    container.appendChild(this.el);

    this.centerX = outerSize / 2;
    this.centerY = outerSize / 2;
    this.knobRestX = (outerSize - knobSize) / 2;
    this.knobRestY = (outerSize - knobSize) / 2;
    this.knobSize = knobSize;

    this.el.addEventListener('touchstart', (e) => this._onTouchStart(e), { passive: false });
    document.addEventListener('touchmove', (e) => this._onTouchMove(e), { passive: false });
    document.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: false });
    document.addEventListener('touchcancel', (e) => this._onTouchEnd(e), { passive: false });
  }

  _onTouchStart(e) {
    e.preventDefault();
    if (this._touchId !== null) return;
    const touch = e.changedTouches[0];
    this._touchId = touch.identifier;
    this.active = true;
    this._updateFromTouch(touch);
  }

  _onTouchMove(e) {
    if (this._touchId === null) return;
    for (const touch of e.changedTouches) {
      if (touch.identifier === this._touchId) {
        e.preventDefault();
        this._updateFromTouch(touch);
        break;
      }
    }
  }

  _onTouchEnd(e) {
    if (this._touchId === null) return;
    for (const touch of e.changedTouches) {
      if (touch.identifier === this._touchId) {
        this._touchId = null;
        this.active = false;
        this.dx = 0;
        this.dy = 0;
        this.knob.style.left = `${this.knobRestX}px`;
        this.knob.style.top = `${this.knobRestY}px`;
        break;
      }
    }
  }

  _updateFromTouch(touch) {
    const rect = this.el.getBoundingClientRect();
    const localX = touch.clientX - rect.left - this.centerX;
    const localY = touch.clientY - rect.top - this.centerY;

    const dist = Math.sqrt(localX * localX + localY * localY);
    let clampedX = localX;
    let clampedY = localY;
    if (dist > this.maxDist) {
      clampedX = (localX / dist) * this.maxDist;
      clampedY = (localY / dist) * this.maxDist;
    }

    this.dx = clampedX / this.maxDist;
    this.dy = clampedY / this.maxDist;

    this.knob.style.left = `${this.knobRestX + clampedX}px`;
    this.knob.style.top = `${this.knobRestY + clampedY}px`;
  }

  hide() {
    if (this.el) this.el.style.display = 'none';
  }

  show() {
    if (this.el) this.el.style.display = '';
  }

  destroy() {
    if (this.el) this.el.remove();
  }
}
