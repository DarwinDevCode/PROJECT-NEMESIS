/**
 * PrepareScene.js
 * Escena de transición antes del combate.
 * Muestra el número de partida y crea tensión antes de pelear.
 */

import Phaser from 'phaser';
import { SCENES } from '../game/constants.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/config.js';

export default class PrepareScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PREPARE);
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const saveData = this.registry.get('saveData');
    const matchNumber = (saveData?.playerStats?.totalMatches || 0) + 1;

    // Fondo
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x050508).setOrigin(0);

    const title = this.add.text(cx, cy - 20, `COMBATE #${matchNumber}`, {
      fontSize: '32px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      fontStyle: 'bold',
      letterSpacing: 4
    }).setOrigin(0.5).setAlpha(0);

    const subtitle = this.add.text(cx, cy + 30, 'NEMESIS ESTÁ LISTO', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#cc2222',
    }).setOrigin(0.5).setAlpha(0);

    // Animación de entrada
    this.tweens.add({
      targets: [title, subtitle],
      alpha: 1,
      duration: 1000,
      onComplete: () => {
        this.time.delayedCall(1500, () => {
          this.scene.start(SCENES.ARENA);
        });
      }
    });
  }
}
