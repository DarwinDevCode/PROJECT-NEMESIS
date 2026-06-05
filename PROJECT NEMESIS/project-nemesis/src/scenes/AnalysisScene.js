/**
 * AnalysisScene.js
 * Informe post-combate detallado.
 * Muestra qué aprendió Nemesis en esta partida, el perfil detectado
 * del jugador y la nueva estrategia adoptada por la IA.
 */

import Phaser from 'phaser';
import { SCENES } from '../game/constants.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../game/config.js';

export default class AnalysisScene extends Phaser.Scene {
  constructor() {
    super(SCENES.ANALYSIS);
  }

  create() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const analysis = this.registry.get('lastAnalysisResult');

    // Fondo
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0a0a0f).setOrigin(0);

    // Título
    this.add.text(cx, 50, 'INFORME DE ANÁLISIS', {
      fontSize: '28px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    if (!analysis) {
      this._createButton(cx, GAME_HEIGHT - 50, 'VOLVER AL MENÚ', () => {
        this.scene.start(SCENES.MENU);
      });
      return;
    }

    // ─── Columna Izquierda: Análisis del Jugador ─────────
    const leftX = cx - 200;
    
    this.add.text(leftX, 100, 'PERFIL DEL JUGADOR', {
      fontSize: '18px', fontFamily: 'Courier New', color: '#4488ff', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(leftX, 130, analysis.playerProfile, {
      fontSize: '24px', fontFamily: 'Courier New', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Amenaza principal
    if (analysis.primaryThreat && analysis.primaryThreat.value > 0.1) {
      const threatNames = {
        front_attack: 'Ataques Frontales',
        special_attack: 'Ataques Especiales',
        jumping: 'Saltos Frecuentes',
        defensive: 'Exceso de Defensa'
      };
      
      this.add.text(leftX, 180, 'AMENAZA PRINCIPAL:', {
        fontSize: '14px', fontFamily: 'Courier New', color: '#aaaaaa'
      }).setOrigin(0.5);
      
      this.add.text(leftX, 205, threatNames[analysis.primaryThreat.threat] || analysis.primaryThreat.threat, {
        fontSize: '16px', fontFamily: 'Courier New', color: '#ff4444'
      }).setOrigin(0.5);
    }

    // Patrones detectados
    if (analysis.patterns && analysis.patterns.length > 0) {
      this.add.text(leftX, 260, 'PATRONES DETECTADOS:', {
        fontSize: '14px', fontFamily: 'Courier New', color: '#aaaaaa'
      }).setOrigin(0.5);

      let py = 290;
      analysis.patterns.slice(0, 3).forEach(p => {
        this.add.text(leftX, py, `• ${p.description}`, {
          fontSize: '12px', fontFamily: 'Courier New', color: '#cccccc'
        }).setOrigin(0.5);
        py += 20;
      });
    }

    // Predictibilidad
    let pyDynamic = 360;
    if (analysis.predictabilityScore !== undefined) {
      const predPercent = Math.round(analysis.predictabilityScore * 100);
      let predColor = '#00ff00';
      if (predPercent > 50) predColor = '#ffff00';
      if (predPercent > 80) predColor = '#ff0000';

      this.add.text(leftX, pyDynamic, `PREDICTIBILIDAD: ${predPercent}%`, {
        fontSize: '16px', fontFamily: 'Courier New', color: predColor, fontStyle: 'bold'
      }).setOrigin(0.5);

      pyDynamic += 30;
    }

    // Insights Temporales (Momentum)
    if (analysis.momentumInsights && analysis.momentumInsights.length > 0) {
      this.add.text(leftX, pyDynamic, 'ANÁLISIS TÁCTICO RECIENTE:', {
        fontSize: '14px', fontFamily: 'Courier New', color: '#aaaaaa'
      }).setOrigin(0.5);
      
      pyDynamic += 25;
      analysis.momentumInsights.forEach(insight => {
        this.add.text(leftX, pyDynamic, insight, {
          fontSize: '12px', fontFamily: 'Courier New', color: '#ffaa00'
        }).setOrigin(0.5);
        pyDynamic += 20;
      });
    }

    // ─── Línea Divisoria ─────────────────────────────────
    this.add.rectangle(cx, cy, 2, 300, 0x333333);

    // ─── Columna Derecha: Evolución de Nemesis ───────────
    const rightX = cx + 200;

    this.add.text(rightX, 100, 'EVOLUCIÓN DE NEMESIS', {
      fontSize: '18px', fontFamily: 'Courier New', color: '#cc2222', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(rightX, 130, analysis.evolutionName, {
      fontSize: '24px', fontFamily: 'Courier New', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Nivel y Experiencia
    this.add.text(rightX, 170, `NIVEL: ${analysis.evolutionLevel}`, {
      fontSize: '20px', fontFamily: 'Courier New', color: '#ffcc00', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(rightX, 200, `XP Total: ${Math.round(analysis.totalExperience)} (+${analysis.experienceGain} XP)`, {
      fontSize: '14px', fontFamily: 'Courier New', color: '#ccaa44'
    }).setOrigin(0.5);

    // Dominio de Habilidades
    if (analysis.allMasteries) {
      this.add.text(rightX, 230, 'DOMINIO DE HABILIDADES:', {
        fontSize: '14px', fontFamily: 'Courier New', color: '#aaaaaa'
      }).setOrigin(0.5);

      const masteryNames = {
        defensiveMastery: 'Defensa',
        offensiveMastery: 'Ofensiva',
        dashMastery: 'Evasión',
        berserkMastery: 'Berserk',
        comboPredictionMastery: 'Predicción',
        counterAttackMastery: 'Contraataque',
        spacingMastery: 'Spacing'
      };

      let py = 255;
      let count = 0;
      // Mostrar top 4 maestrías
      const sortedMasteries = Object.entries(analysis.allMasteries).sort((a, b) => b[1] - a[1]).slice(0, 4);

      sortedMasteries.forEach(([key, value]) => {
        const percent = Math.round(value * 100);
        let color = '#ffaa00';
        if (percent > 60) color = '#00ff00';
        
        this.add.text(rightX, py, `${masteryNames[key] || key}: ${percent}%`, {
          fontSize: '14px', fontFamily: 'Courier New', color: color, fontStyle: 'bold'
        }).setOrigin(0.5);
        py += 20;
      });
    }

    // Estrategia adoptada
    this.add.text(rightX, 350, 'ESTRATEGIA ACTUAL:', {
      fontSize: '14px', fontFamily: 'Courier New', color: '#aaaaaa'
    }).setOrigin(0.5);

    this.add.text(rightX, 375, analysis.nemesisProfile, {
      fontSize: '18px', fontFamily: 'Courier New', color: '#ff4444'
    }).setOrigin(0.5);

    // ─── ADAPTACIÓN PRINCIPAL (Centro Inferior) ──────────
    if (analysis.mainAdaptation) {
      this.add.rectangle(cx - 200, 480, 380, 70, 0x222233, 0.8).setOrigin(0.5);
      
      this.add.text(cx - 200, 460, 'ADAPTACIÓN PRINCIPAL', {
        fontSize: '16px', fontFamily: 'Courier New', color: '#ffff00', fontStyle: 'bold'
      }).setOrigin(0.5);

      this.add.text(cx - 200, 490, analysis.mainAdaptation, {
        fontSize: '12px', fontFamily: 'Courier New', color: '#ffffff', align: 'center', wordWrap: { width: 360 }
      }).setOrigin(0.5);
    }

    // ─── MOMENTO CLAVE DEL COMBATE (Centro Inferior Derecho) ──────────
    if (analysis.keyMoment) {
      this.add.rectangle(cx + 200, 480, 380, 80, 0x331111, 0.8).setOrigin(0.5);
      
      this.add.text(cx + 200, 455, 'MOMENTO CLAVE DEL COMBATE', {
        fontSize: '16px', fontFamily: 'Courier New', color: '#ff4444', fontStyle: 'bold'
      }).setOrigin(0.5);

      this.add.text(cx + 200, 480, `"${analysis.keyMoment}"`, {
        fontSize: '12px', fontFamily: 'Courier New', color: '#ffffff', align: 'center', fontStyle: 'italic', wordWrap: { width: 360 }
      }).setOrigin(0.5);

      this.add.text(cx + 200, 505, analysis.keyMomentNarrative || '', {
        fontSize: '12px', fontFamily: 'Courier New', color: '#ffaa00', align: 'center', wordWrap: { width: 360 }
      }).setOrigin(0.5);
    }

    // ─── Botón Continuar ─────────────────────────────────
    this._createButton(cx, GAME_HEIGHT - 60, 'VOLVER AL MENÚ', () => {
      this.scene.start(SCENES.MENU);
    });
  }

  _createButton(x, y, text, callback) {
    const btn = this.add.text(x, y, text, {
      fontSize: '20px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      backgroundColor: '#222233',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setBackgroundColor('#444466'));
    btn.on('pointerout', () => btn.setBackgroundColor('#222233'));
    btn.on('pointerdown', callback);
  }
}
