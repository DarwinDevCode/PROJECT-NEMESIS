/**
 * ResultScene.js
 * Muestra el resultado final (Victoria/Derrota/Rendición) de forma épica.
 * Transiciona a AnalysisScene al continuar.
 */

import Phaser from 'phaser';
import { SCENES, COMBAT_RESULTS } from '../game/constants.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/config.js';
import SaveManager from '../systems/SaveManager.js';
import AudioManager from '../systems/AudioManager.js';

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super(SCENES.RESULT);
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const result = this.registry.get('lastMatchResult') || COMBAT_RESULTS.SURRENDER;

    // Fondo
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x050508).setOrigin(0);

    const messages = {
      [COMBAT_RESULTS.PLAYER_WIN]: { title: 'VICTORIA', color: '#44cc44', sub: 'Has superado a la máquina.' },
      [COMBAT_RESULTS.NEMESIS_WIN]: { title: 'DERROTA', color: '#cc2222', sub: 'Nemesis ha asimilado tu estilo.' },
      [COMBAT_RESULTS.SURRENDER]: { title: 'RENDICIÓN', color: '#cccc44', sub: 'Datos registrados parcialmente.' },
    };

    const msg = messages[result];

    const titleText = this.add.text(cx, cy - 30, msg.title, {
      fontSize: '64px',
      fontFamily: 'Courier New',
      color: msg.color,
      fontStyle: 'bold',
      letterSpacing: 10,
    }).setOrigin(0.5).setAlpha(0);

    const subText = this.add.text(cx, cy + 30, msg.sub, {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: '#aaaaaa',
    }).setOrigin(0.5).setAlpha(0);

    const continueText = this.add.text(cx, cy + 120, 'PRESIONA ESPACIO PARA ANÁLISIS', {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0);

    // Guardar partida al llegar aquí
    SaveManager.save(this.registry.get('saveData'));

    // Animaciones
    this.tweens.add({
      targets: [titleText, subText],
      alpha: 1,
      duration: 1000,
      onComplete: () => {
        this.tweens.add({
          targets: continueText,
          alpha: { from: 0, to: 1 },
          duration: 800,
          yoyo: true,
          repeat: -1,
        });

        this.input.keyboard.once('keydown-SPACE', () => {
          this.scene.start(SCENES.ANALYSIS);
        });
      }
    });
  }
}
