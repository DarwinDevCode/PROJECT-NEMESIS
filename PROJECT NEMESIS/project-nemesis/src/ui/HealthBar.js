/**
 * HealthBar.js
 * Barra de vida con transición suave de color (verde → amarillo → rojo)
 * y animación de disminución progresiva.
 */

import { GAME_WIDTH } from '../game/config.js';

export default class HealthBar {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {boolean} flipped - Si true, la barra crece de derecha a izquierda (para Nemesis)
   */
  constructor(scene, x, y, width = 200, height = 16, flipped = false) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.flipped = flipped;

    this.maxHP = 100;
    this.currentHP = 100;
    this._displayHP = 100; // Para animación suave

    // Fondo de la barra
    this.bgGraphics = scene.add.graphics();
    this.bgGraphics.setDepth(100);

    // Barra de vida
    this.barGraphics = scene.add.graphics();
    this.barGraphics.setDepth(101);

    // Barra de daño (se vacía más lento, efecto "sangrado")
    this.damageGraphics = scene.add.graphics();
    this.damageGraphics.setDepth(100);

    // Label del nombre
    this.label = null;

    this._draw();
  }

  /**
   * Establece el label de la barra.
   * @param {string} name
   * @param {string} color
   */
  setLabel(name, color = '#ffffff') {
    this.label = this.scene.add.text(this.x, this.y - 18, name, {
      fontSize: '11px',
      fontFamily: 'Courier New',
      color: color,
      fontStyle: 'bold',
    });
    this.label.setDepth(102);

    if (this.flipped) {
      this.label.setOrigin(1, 0);
      this.label.setX(this.x + this.width);
    }
  }

  /**
   * Actualiza la vida mostrada.
   * @param {number} currentHP
   * @param {number} maxHP
   */
  setValue(currentHP, maxHP) {
    this.currentHP = currentHP;
    this.maxHP = maxHP;
  }

  /**
   * Actualización por frame para animación suave.
   * @param {number} delta
   */
  update(delta) {
    // Animar la barra de daño (se vacía más lento)
    const targetHP = this.currentHP;
    if (this._displayHP > targetHP) {
      this._displayHP -= delta * 0.05; // Velocidad de vaciado
      if (this._displayHP < targetHP) this._displayHP = targetHP;
    } else {
      this._displayHP = targetHP;
    }

    this._draw();
  }

  /**
   * Dibuja la barra.
   * @private
   */
  _draw() {
    const ratio = Math.max(0, this.currentHP / this.maxHP);
    const displayRatio = Math.max(0, this._displayHP / this.maxHP);

    // ─── Fondo ────────────────────────────────────────────
    this.bgGraphics.clear();
    this.bgGraphics.fillStyle(0x1a1a1a, 0.9);
    this.bgGraphics.fillRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
    this.bgGraphics.lineStyle(1, 0x333333, 0.8);
    this.bgGraphics.strokeRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);

    // ─── Barra de daño (rojo oscuro, se vacía lento) ──────
    this.damageGraphics.clear();
    if (displayRatio > ratio) {
      this.damageGraphics.fillStyle(0x660000, 0.8);
      if (this.flipped) {
        const damageWidth = this.width * displayRatio;
        this.damageGraphics.fillRect(
          this.x + this.width - damageWidth, this.y,
          damageWidth, this.height
        );
      } else {
        this.damageGraphics.fillRect(
          this.x, this.y,
          this.width * displayRatio, this.height
        );
      }
    }

    // ─── Barra de vida ────────────────────────────────────
    this.barGraphics.clear();
    const color = this._getColor(ratio);
    this.barGraphics.fillStyle(color, 1);

    if (this.flipped) {
      const barWidth = this.width * ratio;
      this.barGraphics.fillRect(
        this.x + this.width - barWidth, this.y,
        barWidth, this.height
      );
    } else {
      this.barGraphics.fillRect(
        this.x, this.y,
        this.width * ratio, this.height
      );
    }

    // Brillo sutil en la parte superior
    this.barGraphics.fillStyle(0xffffff, 0.15);
    if (this.flipped) {
      const barWidth = this.width * ratio;
      this.barGraphics.fillRect(
        this.x + this.width - barWidth, this.y,
        barWidth, this.height / 3
      );
    } else {
      this.barGraphics.fillRect(
        this.x, this.y,
        this.width * ratio, this.height / 3
      );
    }
  }

  /**
   * Calcula el color de la barra según el ratio de vida.
   * Verde → Amarillo → Rojo
   * @param {number} ratio - 0-1
   * @returns {number} Color hex
   * @private
   */
  _getColor(ratio) {
    if (ratio > 0.6) {
      // Verde: 0x44cc44 → 0xcccc44
      const t = (ratio - 0.6) / 0.4;
      const r = Math.round(0x44 + (0xcc - 0x44) * (1 - t));
      const g = 0xcc;
      const b = 0x44;
      return (r << 16) | (g << 8) | b;
    } else if (ratio > 0.25) {
      // Amarillo → Naranja: 0xcccc44 → 0xcc4422
      const t = (ratio - 0.25) / 0.35;
      const r = 0xcc;
      const g = Math.round(0x44 + (0xcc - 0x44) * t);
      const b = Math.round(0x22 + (0x44 - 0x22) * t);
      return (r << 16) | (g << 8) | b;
    } else {
      // Rojo: 0xcc2222
      return 0xcc2222;
    }
  }

  /**
   * Destruye todos los elementos gráficos.
   */
  destroy() {
    this.bgGraphics.destroy();
    this.barGraphics.destroy();
    this.damageGraphics.destroy();
    if (this.label) this.label.destroy();
  }
}
