import { GameEngine } from './game/engine.js';
import { GameUI } from './game/ui.js';
import { soundEngine } from './game/audio.js';
import confetti from 'canvas-confetti';

document.addEventListener('DOMContentLoaded', () => {
  const canvasContainer = document.getElementById('canvas-container');
  const uiContainer = document.getElementById('ui-container');

  let ui = null;

  // UI callbacks to receive engine events
  const uiCallbacks = {
    onTick: (tickData) => {
      if (ui) ui.updateHUD(tickData);
    },
    onTsunamiAlert: (waveDef, spawnZ) => {
      if (ui) {
        ui.showToast(`🚨 ${waveDef.warningText}! Speed: ${waveDef.speed}m/s!`, 'danger');
      }
    },
    onTsunamiEnded: () => {
      if (ui) {
        ui.showToast(`✅ Wave broken against airport safety shield!`, 'success');
      }
    },
    onPlaneCollected: (planeDef) => {
      if (ui) {
        ui.showToast(`✈️ Rescued ${planeDef.name}! Bring to Airport Base to generate $${planeDef.baseIncome}/s!`, 'info');
      }
    },
    onPlanesDeposited: (result) => {
      if (ui) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
        let msg = `🛬 Deposited ${result.deposited} planes in Hangar Pads!`;
        if (result.sold > 0) {
          msg += ` (Sold ${result.sold} for +$${result.cashEarned.toLocaleString()})`;
        }
        ui.showToast(msg, 'success');
      }
    },
    onZoneChange: (zone) => {
      if (ui) {
        ui.showToast(`📍 Entered ${zone.name}! Rarer aircraft ahead!`, 'info');
      }
    },
    onNotification: (msg, type) => {
      if (ui) {
        ui.showToast(msg, type);
      }
    }
  };

  // Initialize Engine & UI
  const engine = new GameEngine(canvasContainer, uiCallbacks);
  ui = new GameUI(uiContainer, engine);

  // Audio start on first interaction
  const unlockAudio = () => {
    soundEngine.init();
    soundEngine.resume();
    soundEngine.startBgm();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };

  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);
});
