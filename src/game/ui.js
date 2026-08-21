import confetti from 'canvas-confetti';
import {
  PLANES_DATABASE,
  ZONES,
  REBIRTH_TIERS,
  UPGRADES,
  AIRDROP_CRATES,
  RARITIES
} from './constants.js';
import { gameState } from './state.js';
import { soundEngine } from './audio.js';

export class GameUI {
  constructor(container, engine) {
    this.container = container;
    this.engine = engine;

    this.activeModal = null;
    this.toastQueue = [];
    this.isToastShowing = false;

    // Simulated Server Leaderboard Pilots
    this.leaderboard = [
      { name: 'AceCaptain_99', rebirths: 7, money: 4800000000, title: 'Galactic Sovereign' },
      { name: 'SkyPhantom_X', rebirths: 6, money: 950000000, title: 'Celestial Sky God' },
      { name: 'VortexPilot21', rebirths: 5, money: 180000000, title: 'Orbital Commander' },
      { name: 'StealthFalcon', rebirths: 4, money: 32000000, title: 'Stealth Phantom' },
      { name: 'Mach10_Rider', rebirths: 3, money: 5400000, title: 'Supersonic Ace' },
      { name: 'PropellerKing', rebirths: 2, money: 850000, title: 'Jet Aviator' },
      { name: 'RunwayRunner01', rebirths: 1, money: 95000, title: 'Propeller Pilot' }
    ];

    this.createUIElements();
    this.setupBindings();
  }

  createUIElements() {
    this.container.innerHTML = `
      <div id="game-hud" class="hud-overlay select-none pointer-events-none">
        <!-- Top Stats Bar -->
        <header class="top-bar pointer-events-auto flex items-center justify-between px-4 py-3 gap-2">
          <!-- Left: Money & Income -->
          <div class="flex items-center gap-3">
            <div class="stat-pill money-pill">
              <span class="stat-icon text-yellow-400">💵</span>
              <div class="flex flex-col">
                <span class="text-xs text-slate-300 font-semibold tracking-wider uppercase">Cash</span>
                <span id="hud-money" class="text-lg font-black text-white tracking-wide">$0</span>
              </div>
            </div>

            <div class="stat-pill income-pill">
              <span class="stat-icon text-emerald-400">⚡</span>
              <div class="flex flex-col">
                <span class="text-xs text-slate-300 font-semibold tracking-wider uppercase">Income</span>
                <span id="hud-income" class="text-lg font-black text-emerald-400">+$0/s</span>
              </div>
            </div>

            <!-- Rebirth Pill -->
            <button id="btn-open-rebirth" class="stat-pill rebirth-pill hover:scale-105 transition-transform active:scale-95 cursor-pointer">
              <span class="stat-icon text-purple-400">🔄</span>
              <div class="flex flex-col text-left">
                <span id="hud-rebirth-title" class="text-xs text-purple-300 font-bold uppercase">Rebirth 0</span>
                <span id="hud-rebirth-mult" class="text-sm font-black text-white">x1.0 Multiplier</span>
              </div>
            </button>
          </div>

          <!-- Middle: Zone & Distance -->
          <div class="hidden md:flex flex-col items-center">
            <div class="zone-badge px-4 py-1.5 rounded-full flex items-center gap-2 border border-slate-700 bg-slate-900/80 backdrop-blur-md shadow-lg">
              <span id="hud-zone-icon">✈️</span>
              <span id="hud-zone-name" class="font-bold text-sm text-sky-400">Zone 1: Propeller Plains</span>
              <span class="text-xs text-slate-400">|</span>
              <span id="hud-distance" class="text-xs font-mono font-bold text-amber-400">0m</span>
            </div>
          </div>

          <!-- Right: Action Menu Buttons -->
          <div class="flex items-center gap-2">
            <!-- Camera Mode Switcher Pill -->
            <button id="btn-switch-camera" class="menu-btn bg-cyan-700 hover:bg-cyan-600 text-white shadow-cyan-500/20" title="Switch Camera View (HotKey: C)">
              <span id="hud-cam-icon">📹</span>
              <span id="hud-cam-label" class="font-bold text-xs uppercase">Cam: Player (C)</span>
            </button>

            <!-- Admin Command Console Button -->
            <button id="btn-menu-admin" class="menu-btn bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black animate-pulse shadow-red-500/30" title="Admin Commands & Cheats">
              <span>⚡</span> <span class="font-black text-xs uppercase tracking-wider">Admin</span>
            </button>

            <button id="btn-menu-shop" class="menu-btn bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20" title="Upgrades Shop">
              <span>🛒</span> <span class="hidden sm:inline font-bold text-xs uppercase">Upgrades</span>
            </button>
            <button id="btn-menu-crates" class="menu-btn bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20" title="Lucky Airdrop Crates">
              <span>📦</span> <span class="hidden sm:inline font-bold text-xs uppercase">Airdrops</span>
            </button>
            <button id="btn-menu-codex" class="menu-btn bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20" title="Plane Hangar Codex">
              <span>📖</span> <span class="hidden sm:inline font-bold text-xs uppercase">Planes</span>
            </button>
            <button id="btn-menu-leaderboard" class="menu-btn bg-slate-700 hover:bg-slate-600 text-white" title="Leaderboard">
              <span>🏆</span>
            </button>
            <button id="btn-menu-settings" class="menu-btn bg-slate-800 hover:bg-slate-700 text-white" title="Settings & Guide">
              <span>⚙️</span>
            </button>
          </div>
        </header>

        <!-- Tsunami Warning Alert HUD (Pops up when wave active) -->
        <div id="tsunami-alert" class="tsunami-warning-bar pointer-events-none hidden">
          <div class="tsunami-box flex items-center justify-between px-6 py-3">
            <div class="flex items-center gap-3">
              <span class="text-3xl animate-bounce">🌊</span>
              <div>
                <div id="tsunami-alert-title" class="text-red-400 font-black text-base sm:text-lg tracking-wider uppercase drop-shadow-md">
                  ⚠️ EXTREME TSUNAMI INCOMING!
                </div>
                <div class="text-xs sm:text-sm text-slate-200 font-semibold flex items-center gap-2">
                  <span>Speed: <b id="tsunami-speed-val" class="text-amber-300">Fast</b></span>
                  <span>•</span>
                  <span class="text-emerald-400">JUMP INTO A BUNKER!</span>
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs text-slate-300 font-semibold uppercase">Distance</div>
              <div id="tsunami-dist-val" class="text-xl sm:text-2xl font-black font-mono text-red-300">450m</div>
            </div>
          </div>
        </div>

        <!-- Cargo Tow Capacity HUD & Mini-Radar (Bottom Left / Right) -->
        <div class="hud-bottom-info flex items-end justify-between px-4 pb-4">
          <!-- Left: Cargo Status -->
          <div class="flex flex-col gap-2 pointer-events-auto">
            <div class="cargo-pill flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 shadow-xl backdrop-blur-md">
              <span class="text-lg">🧲</span>
              <div class="flex flex-col">
                <div class="flex items-center justify-between gap-4">
                  <span class="text-xs text-slate-300 font-bold uppercase">Carried Planes</span>
                  <span id="hud-cargo-count" class="text-xs font-black text-amber-400">0 / 1</span>
                </div>
                <div class="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1 border border-slate-700">
                  <div id="hud-cargo-bar" class="bg-amber-400 h-full w-0 transition-all duration-300"></div>
                </div>
              </div>
            </div>

            <!-- Dash Boost Cooldown Pill -->
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
              <span class="text-sm">🚀</span>
              <span class="text-xs text-slate-300 font-semibold">Dash (SHIFT / Boost):</span>
              <span id="hud-dash-status" class="text-xs font-black text-emerald-400">READY</span>
            </div>
          </div>

          <!-- Right: Mini-Radar Map -->
          <div class="flex flex-col items-end gap-1 pointer-events-auto">
            <div class="radar-wrapper p-2 rounded-2xl bg-slate-900/90 border border-slate-700 shadow-2xl backdrop-blur-md">
              <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1 pb-1 flex justify-between">
                <span>Runway Radar</span>
                <span class="text-emerald-400">SAFE BASE ▼</span>
              </div>
              <canvas id="radar-canvas" width="130" height="220" class="rounded-lg bg-slate-950 border border-slate-800"></canvas>
            </div>
          </div>
        </div>

        <!-- Mobile Touch Virtual Controls (Visible on Touch devices) -->
        <div id="mobile-controls" class="mobile-controls-layer pointer-events-none hidden">
          <!-- Virtual Joystick Zone -->
          <div id="joystick-zone" class="joystick-zone pointer-events-auto">
            <div id="joystick-knob" class="joystick-knob"></div>
          </div>

          <!-- Action Buttons (Jump & Dash) -->
          <div class="touch-action-buttons pointer-events-auto flex flex-col gap-3">
            <button id="btn-touch-dash" class="touch-btn touch-btn-dash">🚀</button>
            <button id="btn-touch-jump" class="touch-btn touch-btn-jump">🦘</button>
          </div>
        </div>

        <!-- Notification Toasts Toast Area -->
        <div id="toast-container" class="toast-container pointer-events-none"></div>

        <!-- Interaction Prompt HUD (e.g. "Step into Drop Zone", "Rebirth Altar", "Shop") -->
        <div id="interaction-prompt" class="interaction-prompt-banner hidden pointer-events-none">
          <div class="prompt-box animate-pulse">
            <span id="prompt-icon">✨</span>
            <span id="prompt-text">Press E or Step Forward</span>
          </div>
        </div>
      </div>

      <!-- Modals Container -->
      <div id="modals-layer" class="modals-layer hidden select-none">
        <div id="modal-backdrop" class="modal-backdrop"></div>
        <div id="modal-content" class="modal-box"></div>
      </div>
    `;

    this.radarCanvas = document.getElementById('radar-canvas');
    this.radarCtx = this.radarCanvas.getContext('2d');
  }

  setupBindings() {
    // Camera View Switcher
    const camBtn = document.getElementById('btn-switch-camera');
    if (camBtn) {
      camBtn.addEventListener('click', () => {
        this.engine.cycleCameraMode();
        this.updateCameraLabel(this.engine.cameraMode);
      });
    }

    // Admin Commands Menu
    const adminBtn = document.getElementById('btn-menu-admin');
    if (adminBtn) {
      adminBtn.addEventListener('click', () => {
        soundEngine.playClick();
        this.openAdminModal();
      });
    }

    // Hotkey for Admin (Backquote / Tilde or Backslash)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Backquote' || e.key === '`' || e.code === 'Slash' && e.ctrlKey) {
        if (!this.activeModal) {
          this.openAdminModal();
        } else {
          this.closeModal();
        }
      }
    });

    // Menu Buttons
    document.getElementById('btn-open-rebirth').addEventListener('click', () => {
      soundEngine.playClick();
      this.openRebirthModal();
    });

    document.getElementById('btn-menu-shop').addEventListener('click', () => {
      soundEngine.playClick();
      this.openShopModal();
    });

    document.getElementById('btn-menu-crates').addEventListener('click', () => {
      soundEngine.playClick();
      this.openCratesModal();
    });

    document.getElementById('btn-menu-codex').addEventListener('click', () => {
      soundEngine.playClick();
      this.openCodexModal();
    });

    document.getElementById('btn-menu-leaderboard').addEventListener('click', () => {
      soundEngine.playClick();
      this.openLeaderboardModal();
    });

    document.getElementById('btn-menu-settings').addEventListener('click', () => {
      soundEngine.playClick();
      this.openSettingsModal();
    });

    // Close Modal on Backdrop Click
    document.getElementById('modal-backdrop').addEventListener('click', () => {
      this.closeModal();
    });

    // Touch Virtual Joystick Setup
    this.setupTouchControls();

    // Check if touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      document.getElementById('mobile-controls').classList.remove('hidden');
    }
  }

  setupTouchControls() {
    const joyZone = document.getElementById('joystick-zone');
    const joyKnob = document.getElementById('joystick-knob');
    let isTouching = false;
    let startX = 0;
    let startY = 0;
    const maxRadius = 45;

    const handleTouchStart = (e) => {
      e.preventDefault();
      isTouching = true;
      soundEngine.resume();
      const touch = e.touches[0];
      const rect = joyZone.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
      handleTouchMove(e);
    };

    const handleTouchMove = (e) => {
      if (!isTouching) return;
      e.preventDefault();
      const touch = e.touches[0];
      let dx = touch.clientX - startX;
      let dy = touch.clientY - startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.engine.setVirtualInput(dx / maxRadius, -dy / maxRadius, false, false);
    };

    const handleTouchEnd = (e) => {
      isTouching = false;
      joyKnob.style.transform = `translate(0px, 0px)`;
      this.engine.setVirtualInput(0, 0, false, false);
    };

    joyZone.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    // Touch Jump & Dash buttons
    const btnJump = document.getElementById('btn-touch-jump');
    const btnDash = document.getElementById('btn-touch-dash');

    btnJump.addEventListener('touchstart', (e) => {
      e.preventDefault();
      soundEngine.resume();
      this.engine.handleJump();
    });

    btnDash.addEventListener('touchstart', (e) => {
      e.preventDefault();
      soundEngine.resume();
      this.engine.handleDash();
    });
  }

  updateCameraLabel(mode) {
    const camLabel = document.getElementById('hud-cam-label');
    const camIcon = document.getElementById('hud-cam-icon');
    if (!camLabel || !camIcon) return;

    switch (mode) {
      case 'tsunami':
        camIcon.textContent = '🌊';
        camLabel.textContent = 'Cam: Tsunami (C)';
        break;
      case 'drone':
        camIcon.textContent = '🛰️';
        camLabel.textContent = 'Cam: Drone (C)';
        break;
      case 'tower':
        camIcon.textContent = '🏢';
        camLabel.textContent = 'Cam: Tower (C)';
        break;
      case 'player':
      default:
        camIcon.textContent = '📹';
        camLabel.textContent = 'Cam: Player (C)';
        break;
    }
  }

  // Toast Notification
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast-pill toast-${type} animate-slide-in`;

    const icon = type === 'success' ? '🎉' : type === 'danger' ? '⚠️' : '✈️';
    toast.innerHTML = `<span class="text-base">${icon}</span> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('animate-fade-out');
      setTimeout(() => {
        if (container.contains(toast)) container.removeChild(toast);
      }, 400);
    }, 3200);
  }

  // Update HUD every tick
  updateHUD(tickData) {
    // 1. Money & Income
    document.getElementById('hud-money').textContent = `$${Math.floor(gameState.money).toLocaleString()}`;
    const incPerSec = gameState.getTotalIncomePerSecond();
    document.getElementById('hud-income').textContent = `+$${incPerSec.toLocaleString()}/s`;

    // 2. Rebirth
    const rTier = gameState.getRebirthTier();
    document.getElementById('hud-rebirth-title').textContent = `Rank ${gameState.rebirths}: ${rTier.title}`;
    document.getElementById('hud-rebirth-mult').textContent = `x${rTier.multiplier.toFixed(1)} Multiplier`;

    // 3. Zone & Distance
    const currentZ = Math.max(0, Math.floor(tickData.playerPos.z));
    document.getElementById('hud-distance').textContent = `${currentZ}m`;
    const zone = this.engine.currentZone;
    if (zone) {
      document.getElementById('hud-zone-name').textContent = `Zone ${zone.id}: ${zone.name}`;
      document.getElementById('hud-zone-name').style.color = zone.color;
    }

    // 4. Cargo Count
    const carriedCount = gameState.carriedPlanes.length;
    const maxCapacity = gameState.getMaxTowCapacity();
    document.getElementById('hud-cargo-count').textContent = `${carriedCount} / ${maxCapacity}`;
    const cargoPct = (carriedCount / maxCapacity) * 100;
    document.getElementById('hud-cargo-bar').style.width = `${cargoPct}%`;

    // 5. Dash status
    const dashStatusEl = document.getElementById('hud-dash-status');
    if (this.engine.dashCooldownTimer > 0) {
      dashStatusEl.textContent = `${this.engine.dashCooldownTimer.toFixed(1)}s`;
      dashStatusEl.className = 'text-xs font-bold text-slate-400';
    } else {
      dashStatusEl.textContent = 'READY';
      dashStatusEl.className = 'text-xs font-black text-emerald-400';
    }

    // 6. Camera Label Sync
    this.updateCameraLabel(this.engine.cameraMode);

    // 7. Tsunami Alert HUD
    const wave = tickData.activeWave;
    const alertEl = document.getElementById('tsunami-alert');
    if (wave) {
      alertEl.classList.remove('hidden');
      const dist = Math.floor(wave.z - tickData.playerPos.z);
      document.getElementById('tsunami-dist-val').textContent = `${Math.max(0, dist)}m`;
      document.getElementById('tsunami-alert-title').textContent = wave.waveDef.warningText;
      document.getElementById('tsunami-alert-title').style.color = wave.waveDef.warningColor;
      document.getElementById('tsunami-speed-val').textContent = `${wave.waveDef.speed} m/s`;
    } else {
      alertEl.classList.add('hidden');
    }

    // 7. Radar Render
    this.renderRadar(tickData);
  }

  // 2D Radar Canvas
  renderRadar(tickData) {
    const ctx = this.radarCtx;
    const w = this.radarCanvas.width;
    const h = this.radarCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Coordinate mapping:
    // Radar shows a window of runway around player or from Base (-80m) to Max Distance
    const playerZ = tickData.playerPos.z;
    const viewRange = 400; // meters shown in radar
    const minZ = playerZ - 60;
    const maxZ = playerZ + viewRange;

    const zToY = (z) => {
      // In radar: Top is further down runway (maxZ), Bottom is towards base (minZ)
      const pct = (z - minZ) / (maxZ - minZ);
      return h - pct * h;
    };

    const xToX = (x) => {
      const trackWidthMeters = 40;
      return (w / 2) + (x / trackWidthMeters) * (w * 0.75);
    };

    // Draw Runway Borders
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.15, 0);
    ctx.lineTo(w * 0.15, h);
    ctx.moveTo(w * 0.85, 0);
    ctx.lineTo(w * 0.85, h);
    ctx.stroke();

    // Draw Base Safe Forcefield Line (Z = 15)
    if (15 >= minZ && 15 <= maxZ) {
      const baseScreenY = zToY(15);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, baseScreenY);
      ctx.lineTo(w * 0.9, baseScreenY);
      ctx.stroke();
    }

    // Draw Safe Trenches
    ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    tickData.trenches.forEach(tr => {
      const u = tr.userData;
      if (u.zPos >= minZ && u.zPos <= maxZ) {
        const ty = zToY(u.zPos);
        ctx.fillRect(w * 0.15, ty - 3, w * 0.7, 6);
        ctx.strokeRect(w * 0.15, ty - 3, w * 0.7, 6);
      }
    });

    // Draw Spawned Planes
    tickData.spawnedPlanes.forEach(sp => {
      if (sp.spawnZ >= minZ && sp.spawnZ <= maxZ) {
        const px = xToX(sp.mesh.position.x);
        const py = zToY(sp.spawnZ);
        ctx.fillStyle = sp.planeDef.rarity.color || '#38bdf8';
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw Incoming Tsunami Wave
    const wave = tickData.activeWave;
    if (wave && wave.z >= minZ && wave.z <= maxZ) {
      const wy = zToY(wave.z);
      ctx.fillStyle = wave.waveDef.warningColor || '#ef4444';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.fillRect(0, wy - 4, w, 8);
      ctx.strokeRect(0, wy - 4, w, 8);
    }

    // Draw Player Dot & Vision Cone
    const playerScreenY = zToY(playerZ);
    const playerScreenX = xToX(tickData.playerPos.x);

    // Direction cone
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.beginPath();
    ctx.moveTo(playerScreenX, playerScreenY);
    ctx.arc(playerScreenX, playerScreenY, 18, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5);
    ctx.fill();

    // Player center marker
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(playerScreenX, playerScreenY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // -------------------------------------------------------------
  // Modals System
  // -------------------------------------------------------------
  openModal(htmlContent) {
    const modalsLayer = document.getElementById('modals-layer');
    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = htmlContent;
    modalsLayer.classList.remove('hidden');
    this.activeModal = true;
  }

  closeModal() {
    const modalsLayer = document.getElementById('modals-layer');
    modalsLayer.classList.add('hidden');
    this.activeModal = false;
    soundEngine.playClick();
  }

  // 1. Upgrades Shop Modal
  openShopModal() {
    const renderShop = () => {
      let cardsHtml = '';
      for (const [key, def] of Object.entries(UPGRADES)) {
        const lvl = gameState.upgrades[key] || 1;
        const isMax = lvl >= def.maxLevel;
        const cost = gameState.getUpgradeCost(key);
        const canAfford = gameState.money >= cost && !isMax;
        const currentVal = def.formatValue(def.getValue(lvl));
        const nextVal = !isMax ? def.formatValue(def.getValue(lvl + 1)) : 'MAX';

        cardsHtml += `
          <div class="upgrade-card flex items-center justify-between p-4 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-slate-600 transition-all">
            <div class="flex items-center gap-3">
              <div class="text-3xl p-2.5 rounded-xl bg-slate-900 border border-slate-700">${def.icon}</div>
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="font-black text-white text-base">${def.name}</h4>
                  <span class="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-900/60 text-blue-300 border border-blue-700">Lvl ${lvl}/${def.maxLevel}</span>
                </div>
                <p class="text-xs text-slate-400 mt-0.5">${def.description}</p>
                <div class="text-xs font-semibold text-sky-400 mt-1">
                  Current: <b>${currentVal}</b> ${!isMax ? `➔ <span class="text-emerald-400 font-bold">${nextVal}</span>` : ''}
                </div>
              </div>
            </div>

            <div>
              <button 
                data-upgrade="${key}" 
                class="btn-upgrade px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  isMax 
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : canAfford 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 active:scale-95' 
                      : 'bg-slate-700/60 text-slate-400 cursor-not-allowed border border-slate-700'
                }"
                ${isMax || !canAfford ? 'disabled' : ''}
              >
                ${isMax ? 'MAXED' : `Upgrade<br><span class="text-amber-300">$${cost.toLocaleString()}</span>`}
              </button>
            </div>
          </div>
        `;
      }

      return `
        <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-700">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🛒</span>
            <h2 class="text-xl font-black text-white tracking-wide uppercase">Pilot Upgrades Kiosk</h2>
          </div>
          <button id="modal-close-btn" class="text-slate-400 hover:text-white text-xl p-1 font-mono">✕</button>
        </div>

        <div class="modal-body py-4 flex flex-col gap-3 max-h-[65vh] overflow-y-auto pr-1">
          ${cardsHtml}
        </div>

        <div class="modal-footer pt-3 border-t border-slate-700 flex justify-between items-center text-xs text-slate-400">
          <span>Available Cash: <b class="text-amber-400 text-sm">$${Math.floor(gameState.money).toLocaleString()}</b></span>
          <span>Tip: Upgrading speed lets you reach deeper zones before tsunamis hit!</span>
        </div>
      `;
    };

    this.openModal(renderShop());

    // Bind events
    const refresh = () => {
      document.getElementById('modal-content').innerHTML = renderShop();
      bindEvents();
    };

    const bindEvents = () => {
      document.getElementById('modal-close-btn').addEventListener('click', () => this.closeModal());
      document.querySelectorAll('.btn-upgrade').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const key = btn.getAttribute('data-upgrade');
          if (gameState.buyUpgrade(key)) {
            soundEngine.playUpgrade();
            refresh();
          }
        });
      });
    };

    bindEvents();
  }

  // 2. Rebirth Altar Modal
  openRebirthModal() {
    const currentTier = gameState.getRebirthTier();
    const nextTier = gameState.getNextRebirthTier();
    const canRebirth = gameState.canRebirth();

    const renderRebirth = () => `
      <div class="modal-header flex items-center justify-between pb-3 border-b border-purple-800">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🌌</span>
          <h2 class="text-xl font-black text-purple-300 tracking-wide uppercase">Celestial Rebirth Altar</h2>
        </div>
        <button id="modal-close-btn" class="text-slate-400 hover:text-white text-xl p-1 font-mono">✕</button>
      </div>

      <div class="modal-body py-5 flex flex-col gap-4 text-center">
        <!-- Rebirth Crest -->
        <div class="p-6 rounded-2xl bg-gradient-to-b from-purple-900/40 to-slate-900 border border-purple-700/50 shadow-2xl flex flex-col items-center">
          <div class="text-5xl mb-2 animate-bounce">👑</div>
          <h3 class="text-2xl font-black text-white">${currentTier.title}</h3>
          <div class="text-sm font-bold text-purple-400 mt-1">Current Multiplier: x${currentTier.multiplier.toFixed(1)}</div>

          ${nextTier ? `
            <div class="w-full my-4 border-t border-purple-800/60"></div>
            <div class="text-xs uppercase font-bold text-slate-400 tracking-wider">Next Rebirth Evolution</div>
            <div class="text-xl font-black text-amber-400 mt-1">${nextTier.title}</div>
            
            <div class="grid grid-cols-2 gap-3 w-full mt-4 text-left">
              <div class="p-3 rounded-xl bg-purple-950/60 border border-purple-800">
                <div class="text-xs text-purple-300 font-semibold">Income Multiplier</div>
                <div class="text-lg font-black text-emerald-400">x${nextTier.multiplier.toFixed(1)} Multiplier</div>
              </div>
              <div class="p-3 rounded-xl bg-purple-950/60 border border-purple-800">
                <div class="text-xs text-purple-300 font-semibold">Speed Bonus</div>
                <div class="text-lg font-black text-sky-400">+${nextTier.bonusSpeed} m/s Base</div>
              </div>
            </div>

            <div class="mt-4 text-xs text-slate-300 font-semibold">
              ✨ Unlocks exclusive <b>${nextTier.wings || 'Cosmic'} Rebirth Wings</b> & Prestige aura!
            </div>
          ` : `
            <div class="mt-4 text-amber-300 font-bold">🌟 You have reached the Maximum Celestial Sovereign Rank!</div>
          `}
        </div>

        ${nextTier ? `
          <div class="flex flex-col gap-2">
            <div class="flex justify-between items-center px-2 text-sm">
              <span class="text-slate-300 font-semibold">Rebirth Cost:</span>
              <span class="font-black text-amber-400">$${nextTier.cost.toLocaleString()}</span>
            </div>
            <div class="flex justify-between items-center px-2 text-sm">
              <span class="text-slate-300 font-semibold">Your Balance:</span>
              <span class="font-black ${canRebirth ? 'text-emerald-400' : 'text-red-400'}">$${Math.floor(gameState.money).toLocaleString()}</span>
            </div>

            <button 
              id="btn-confirm-rebirth"
              class="w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider shadow-xl transition-all mt-2 cursor-pointer ${
                canRebirth
                  ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white shadow-purple-500/40 active:scale-95 animate-pulse'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }"
              ${!canRebirth ? 'disabled' : ''}
            >
              ${canRebirth ? '✨ ASCEND & REBIRTH NOW! ✨' : 'LOCKED - NEED MORE CASH'}
            </button>
            <p class="text-[11px] text-slate-400">Rebirthing resets speed upgrades, keeps permanent income multipliers and grants massive lifetime progression boosts!</p>
          </div>
        ` : ''}
      </div>
    `;

    this.openModal(renderRebirth());

    document.getElementById('modal-close-btn').addEventListener('click', () => this.closeModal());
    const confirmBtn = document.getElementById('btn-confirm-rebirth');
    if (confirmBtn && canRebirth) {
      confirmBtn.addEventListener('click', () => {
        if (gameState.performRebirth()) {
          soundEngine.playRebirth();
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 }
          });
          this.showToast(`👑 REBIRTH SUCCESSFUL! Reached ${gameState.getRebirthTier().title}!`, 'success');
          this.closeModal();
        }
      });
    }
  }

  // 3. Plane Hangar Codex & Fusion Modal
  openCodexModal() {
    let activeTab = 'codex'; // 'codex' or 'merge'

    const renderCodex = () => {
      const unlockedCount = gameState.unlockedPlaneIds.size;
      const totalPlanes = PLANES_DATABASE.length;
      const completionPct = Math.round((unlockedCount / totalPlanes) * 100);

      let contentHtml = '';

      if (activeTab === 'codex') {
        let cards = '';
        PLANES_DATABASE.forEach(plane => {
          const isUnlocked = gameState.unlockedPlaneIds.has(plane.id);
          const rarity = plane.rarity;

          cards += `
            <div class="p-3 rounded-xl border flex flex-col justify-between transition-all ${
              isUnlocked
                ? 'bg-slate-800/90 border-slate-700 hover:border-slate-500 shadow-md'
                : 'bg-slate-900/60 border-slate-800 opacity-60'
            }">
              <div>
                <div class="flex items-center justify-between">
                  <span class="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" style="background-color: ${rarity.color}22; color: ${rarity.color}; border: 1px solid ${rarity.color}66;">
                    ${rarity.name}
                  </span>
                  <span class="text-xs font-mono text-slate-400">Zone ${plane.zoneId}</span>
                </div>
                <h4 class="font-black text-sm text-white mt-2 ${!isUnlocked ? 'blur-sm select-none' : ''}">
                  ${isUnlocked ? plane.name : '??? Locked Plane'}
                </h4>
                <p class="text-[11px] text-slate-400 mt-1 line-clamp-2 ${!isUnlocked ? 'hidden' : ''}">
                  ${plane.description}
                </p>
              </div>

              <div class="mt-3 pt-2 border-t border-slate-700/60 flex justify-between items-center text-xs">
                <span class="text-slate-400 font-semibold">Income:</span>
                <span class="font-black text-emerald-400 ${!isUnlocked ? 'blur-sm' : ''}">
                  +$${plane.baseIncome.toLocaleString()}/s
                </span>
              </div>
            </div>
          `;
        });

        contentHtml = `
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            ${cards}
          </div>
        `;
      } else {
        // Merge Station Tab
        // Find planes that have duplicate copies in hangar
        const hangarCounts = {};
        gameState.hangarPlanes.forEach(p => {
          if (!p.golden) {
            hangarCounts[p.id] = (hangarCounts[p.id] || 0) + 1;
          }
        });

        let mergeCards = '';
        Object.entries(hangarCounts).forEach(([pId, count]) => {
          const planeDef = PLANES_DATABASE.find(p => p.id === pId);
          if (!planeDef) return;
          const canMerge = count >= 3;

          mergeCards += `
            <div class="p-4 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="text-3xl">✈️</div>
                <div>
                  <h4 class="font-black text-white text-base">${planeDef.name}</h4>
                  <div class="text-xs text-slate-300">Stationed in Hangar: <b class="text-amber-300">${count} copies</b></div>
                  <div class="text-xs text-purple-300 font-semibold mt-0.5">Golden Fusion grants <b>3x Income Multiplier</b>!</div>
                </div>
              </div>

              <div>
                <button 
                  data-merge-id="${pId}" 
                  class="btn-merge-plane px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider ${
                    canMerge 
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-lg hover:scale-105 active:scale-95 cursor-pointer'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  }"
                  ${!canMerge ? 'disabled' : ''}
                >
                  ${canMerge ? '🌟 FORGE GOLDEN' : `NEED 3 (${count}/3)`}
                </button>
              </div>
            </div>
          `;
        });

        if (mergeCards === '') {
          mergeCards = `
            <div class="p-8 text-center text-slate-400">
              <div class="text-4xl mb-2">🏭</div>
              <p class="font-bold text-white">No Merge Candidates in Hangar</p>
              <p class="text-xs mt-1">Collect 3 identical planes from the runway to fuse them into a Golden Edition with 3x income!</p>
            </div>
          `;
        }

        contentHtml = `
          <div class="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
            ${mergeCards}
          </div>
        `;
      }

      return `
        <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-700">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📖</span>
            <div>
              <h2 class="text-lg font-black text-white uppercase tracking-wide">Hangar Plane Codex</h2>
              <div class="text-xs text-slate-400">Collection: <b class="text-sky-400">${unlockedCount}/${totalPlanes} (${completionPct}%)</b></div>
            </div>
          </div>
          <button id="modal-close-btn" class="text-slate-400 hover:text-white text-xl p-1 font-mono">✕</button>
        </div>

        <!-- Sub Tabs -->
        <div class="flex gap-2 my-3">
          <button id="tab-codex" class="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${activeTab === 'codex' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}">
            ✈️ Plane Index
          </button>
          <button id="tab-merge" class="px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${activeTab === 'merge' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}">
            🌟 Golden Fusion Station
          </button>
        </div>

        <div class="modal-body py-2">
          ${contentHtml}
        </div>
      `;
    };

    const updateView = () => {
      document.getElementById('modal-content').innerHTML = renderCodex();
      bindEvents();
    };

    const bindEvents = () => {
      document.getElementById('modal-close-btn').addEventListener('click', () => this.closeModal());
      document.getElementById('tab-codex').addEventListener('click', () => {
        activeTab = 'codex';
        updateView();
      });
      document.getElementById('tab-merge').addEventListener('click', () => {
        activeTab = 'merge';
        updateView();
      });

      document.querySelectorAll('.btn-merge-plane').forEach(btn => {
        btn.addEventListener('click', () => {
          const planeId = btn.getAttribute('data-merge-id');
          if (gameState.mergePlanes(planeId)) {
            soundEngine.playUpgrade();
            confetti({ particleCount: 80, spread: 70 });
            this.showToast('🌟 Golden Fusion Complete! 3x Income Boosted!', 'success');
            updateView();
          }
        });
      });
    };

    this.openModal(renderCodex());
    bindEvents();
  }

  // 4. Lucky Airdrop Crates Modal
  openCratesModal() {
    const renderCrates = () => {
      let crateCards = '';
      AIRDROP_CRATES.forEach(crate => {
        const canAfford = gameState.money >= crate.cost;

        // Chances list
        let chancesList = [];
        for (const [r, c] of Object.entries(crate.rarityChances)) {
          if (c > 0) chancesList.push(`${r}: ${c}%`);
        }

        crateCards += `
          <div class="crate-card p-4 rounded-xl bg-slate-800/90 border border-slate-700 flex flex-col justify-between hover:border-slate-500 transition-all">
            <div class="flex items-center gap-3">
              <div class="text-4xl p-2 rounded-xl bg-slate-900 border border-slate-700">${crate.icon}</div>
              <div>
                <h4 class="font-black text-white text-base">${crate.name}</h4>
                <div class="text-xs text-amber-300 font-bold mt-0.5">$${crate.cost.toLocaleString()}</div>
              </div>
            </div>

            <div class="my-3 p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] text-slate-300">
              <div class="font-bold text-slate-400 uppercase tracking-wider mb-1">Rarity Drops:</div>
              <div class="flex flex-wrap gap-1">
                ${chancesList.map(item => `<span class="px-1.5 py-0.5 bg-slate-800 rounded font-semibold text-sky-300">${item}</span>`).join('')}
              </div>
            </div>

            <button 
              data-crate-id="${crate.id}" 
              class="btn-open-crate w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer ${
                canAfford
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }"
              ${!canAfford ? 'disabled' : ''}
            >
              ${canAfford ? '📦 UNLOCK CRATE' : 'CANNOT AFFORD'}
            </button>
          </div>
        `;
      });

      return `
        <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-700">
          <div class="flex items-center gap-2">
            <span class="text-2xl">📦</span>
            <h2 class="text-xl font-black text-white uppercase tracking-wide">Mystery Airdrop Crates</h2>
          </div>
          <button id="modal-close-btn" class="text-slate-400 hover:text-white text-xl p-1 font-mono">✕</button>
        </div>

        <div class="modal-body py-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            ${crateCards}
          </div>
        </div>

        <div class="modal-footer pt-3 border-t border-slate-700 flex justify-between items-center text-xs text-slate-400">
          <span>Available Cash: <b class="text-amber-400 text-sm">$${Math.floor(gameState.money).toLocaleString()}</b></span>
          <span>Tip: Quantum Star Capsules hold legendary hypersonic spacecraft!</span>
        </div>
      `;
    };

    const updateView = () => {
      document.getElementById('modal-content').innerHTML = renderCrates();
      bindEvents();
    };

    const bindEvents = () => {
      document.getElementById('modal-close-btn').addEventListener('click', () => this.closeModal());
      document.querySelectorAll('.btn-open-crate').forEach(btn => {
        btn.addEventListener('click', () => {
          const crateId = btn.getAttribute('data-crate-id');
          const crateDef = AIRDROP_CRATES.find(c => c.id === crateId);
          if (crateDef) {
            const pulledPlane = gameState.openCrate(crateDef);
            if (pulledPlane) {
              soundEngine.playCrateOpen();
              confetti({ particleCount: 100, spread: 80 });
              this.showToast(`🎁 Unboxed ${pulledPlane.name} (${pulledPlane.rarity.name})!`, 'success');
              updateView();
            }
          }
        });
      });
    };

    this.openModal(renderCrates());
    bindEvents();
  }

  // 5. Leaderboards Modal
  openLeaderboardModal() {
    const sorted = [...this.leaderboard];
    // Insert current player
    const playerEntry = {
      name: 'You (Ace Pilot)',
      rebirths: gameState.rebirths,
      money: gameState.stats.totalMoneyEarned,
      title: gameState.getRebirthTier().title,
      isSelf: true
    };
    sorted.push(playerEntry);
    sorted.sort((a, b) => b.rebirths - a.rebirths || b.money - a.money);

    let rows = '';
    sorted.forEach((pilot, rank) => {
      const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`;

      rows += `
        <div class="flex items-center justify-between p-3 rounded-xl border transition-all ${
          pilot.isSelf
            ? 'bg-purple-950/80 border-purple-500 shadow-lg'
            : 'bg-slate-800/80 border-slate-700'
        }">
          <div class="flex items-center gap-3">
            <span class="text-base font-black w-6 text-center text-amber-400">${medal}</span>
            <div>
              <div class="font-black text-sm text-white ${pilot.isSelf ? 'text-purple-300' : ''}">${pilot.name}</div>
              <div class="text-xs text-slate-400 font-semibold">${pilot.title}</div>
            </div>
          </div>

          <div class="text-right">
            <div class="text-xs font-bold text-purple-400">Rebirth ${pilot.rebirths}</div>
            <div class="text-xs font-mono font-bold text-amber-300">$${Math.floor(pilot.money).toLocaleString()}</div>
          </div>
        </div>
      `;
    });

    const html = `
      <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-700">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🏆</span>
          <h2 class="text-xl font-black text-white uppercase tracking-wide">Global Pilot Leaderboard</h2>
        </div>
        <button id="modal-close-btn" class="text-slate-400 hover:text-white text-xl p-1 font-mono">✕</button>
      </div>

      <div class="modal-body py-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
        ${rows}
      </div>

      <div class="modal-footer pt-3 border-t border-slate-700 text-center text-xs text-slate-400">
        Escape tsunamis, rescue legendary aircraft, and rebirth to climb the rankings!
      </div>
    `;

    this.openModal(html);
    document.getElementById('modal-close-btn').addEventListener('click', () => this.closeModal());
  }

  // 6. Admin Commands & Cheats Modal
  openAdminModal() {
    const isGodmode = gameState.admin && gameState.admin.godmode;
    const isSuperSpeed = gameState.admin && gameState.admin.superSpeed;

    const renderAdmin = () => `
      <div class="modal-header flex items-center justify-between pb-3 border-b border-red-800/80">
        <div class="flex items-center gap-2">
          <span class="text-2xl">⚡</span>
          <h2 class="text-xl font-black text-red-400 tracking-wide uppercase">Admin Developer Commands</h2>
        </div>
        <button id="modal-close-btn" class="text-slate-400 hover:text-white text-xl p-1 font-mono">✕</button>
      </div>

      <div class="modal-body py-4 flex flex-col gap-4 max-h-[68vh] overflow-y-auto pr-1">
        <!-- Section 1: Money & Economy Cheats -->
        <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-700 flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <h4 class="font-black text-xs uppercase tracking-wider text-amber-400">💵 Cash Generator Cheats</h4>
            <span class="text-xs text-slate-400">Current: <b class="text-white">$${Math.floor(gameState.money).toLocaleString()}</b></span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button data-add-cash="100000" class="btn-admin-cash px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer">+ $100K</button>
            <button data-add-cash="1000000" class="btn-admin-cash px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer">+ $1 Million</button>
            <button data-add-cash="50000000" class="btn-admin-cash px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer">+ $50 Million</button>
            <button data-add-cash="1000000000" class="btn-admin-cash px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer">+ $1 Billion</button>
          </div>
        </div>

        <!-- Section 2: Rebirth Rank Jump -->
        <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-700 flex flex-col gap-2">
          <h4 class="font-black text-xs uppercase tracking-wider text-purple-400">🔄 Instant Rebirth Ascension</h4>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            ${REBIRTH_TIERS.map(t => `
              <button data-set-rebirth="${t.rank}" class="btn-admin-rebirth px-2 py-1.5 rounded-lg border text-xs font-bold text-left transition-all cursor-pointer ${
                gameState.rebirths === t.rank 
                  ? 'bg-purple-900/80 border-purple-400 text-white shadow-md' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
              }">
                <div class="text-[10px] text-purple-300">Rank ${t.rank} (${t.multiplier}x)</div>
                <div class="truncate font-black text-xs">${t.title}</div>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Section 3: Tsunami Spawner & Control -->
        <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-700 flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <h4 class="font-black text-xs uppercase tracking-wider text-sky-400">🌊 Tsunami Wave Spawner</h4>
            <button id="btn-admin-stop-wave" class="px-2.5 py-1 rounded bg-red-800 hover:bg-red-700 text-white font-bold text-[11px] cursor-pointer">🛑 Stop Active Wave</button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            ${TSUNAMI_TYPES.map(w => `
              <button data-spawn-wave="${w.id}" class="btn-admin-wave px-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left cursor-pointer transition-all">
                <div class="font-bold text-xs" style="color: ${w.color}">${w.name}</div>
                <div class="text-[10px] text-slate-400">Speed: ${w.speed} m/s</div>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Section 4: Teleport Locations -->
        <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-700 flex flex-col gap-2">
          <h4 class="font-black text-xs uppercase tracking-wider text-emerald-400">📍 Runway Teleport Pads</h4>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button data-tp-z="0" class="btn-admin-tp px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-left cursor-pointer">
              🛬 Airport Base (0m)
            </button>
            <button data-tp-z="100" class="btn-admin-tp px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-left cursor-pointer">
              Zone 1: Propellers (100m)
            </button>
            <button data-tp-z="300" class="btn-admin-tp px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-left cursor-pointer">
              Zone 2: Airfield (300m)
            </button>
            <button data-tp-z="650" class="btn-admin-tp px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-left cursor-pointer">
              Zone 3: Jets (650m)
            </button>
            <button data-tp-z="1100" class="btn-admin-tp px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-left cursor-pointer">
              Zone 4: Stealth (1100m)
            </button>
            <button data-tp-z="1650" class="btn-admin-tp px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-left cursor-pointer">
              Zone 5: Rockets (1650m)
            </button>
            <button data-tp-z="2250" class="btn-admin-tp px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-left cursor-pointer">
              Zone 6: Cosmic (2250m)
            </button>
            <button data-tp-z="-72" class="btn-admin-tp px-2.5 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 border border-purple-700 text-xs font-bold text-left cursor-pointer">
              🌌 Rebirth Altar (-72m)
            </button>
          </div>
        </div>

        <!-- Section 5: Godmode & Powerups -->
        <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-700 flex flex-col gap-2">
          <h4 class="font-black text-xs uppercase tracking-wider text-pink-400">🛡️ Superpowers & Aircraft Cheats</h4>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button id="btn-toggle-godmode" class="px-3 py-2 rounded-lg font-bold text-xs cursor-pointer ${
              gameState.admin.godmode ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
            }">
              🛡️ Godmode: ${gameState.admin.godmode ? 'ENABLED (Immune)' : 'DISABLED'}
            </button>
            <button id="btn-toggle-superspeed" class="px-3 py-2 rounded-lg font-bold text-xs cursor-pointer ${
              gameState.admin.superSpeed ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
            }">
              ⚡ Super Speed (85m/s): ${gameState.admin.superSpeed ? 'ON' : 'OFF'}
            </button>
            <button id="btn-admin-max-upgrades" class="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer">
              🏢 Max Out Upgrades
            </button>
            <button id="btn-admin-unlock-planes" class="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer">
              📖 Unlock All 24 Planes
            </button>
            <button id="btn-admin-fill-hangar" class="px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-pink-500 text-slate-950 font-black text-xs cursor-pointer">
              🌟 Fill Hangar Mythics
            </button>
            <button id="btn-admin-cam-cycle" class="px-3 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs cursor-pointer">
              📹 Next Camera Mode
            </button>
          </div>
        </div>
      </div>
    `;

    const updateView = () => {
      document.getElementById('modal-content').innerHTML = renderAdmin();
      bindEvents();
    };

    const bindEvents = () => {
      document.getElementById('modal-close-btn').addEventListener('click', () => this.closeModal());

      // Cash buttons
      document.querySelectorAll('.btn-admin-cash').forEach(btn => {
        btn.addEventListener('click', () => {
          const amt = parseInt(btn.getAttribute('data-add-cash'), 10);
          gameState.adminAddCash(amt);
          soundEngine.playCash();
          this.showToast(`💵 Added $${amt.toLocaleString()} Admin Cash!`, 'success');
          updateView();
        });
      });

      // Rebirth buttons
      document.querySelectorAll('.btn-admin-rebirth').forEach(btn => {
        btn.addEventListener('click', () => {
          const rank = parseInt(btn.getAttribute('data-set-rebirth'), 10);
          gameState.adminSetRebirthRank(rank);
          soundEngine.playRebirth();
          confetti({ particleCount: 100, spread: 80 });
          this.showToast(`👑 Rebirth set to Rank ${rank}: ${REBIRTH_TIERS[rank].title}!`, 'success');
          updateView();
        });
      });

      // Tsunami spawns
      document.querySelectorAll('.btn-admin-wave').forEach(btn => {
        btn.addEventListener('click', () => {
          const waveId = btn.getAttribute('data-spawn-wave');
          this.engine.triggerSpecificTsunami(waveId);
          this.showToast(`🚨 Spawned ${waveId.toUpperCase()} Tsunami!`, 'danger');
          this.closeModal();
        });
      });

      // Stop wave
      const btnStopWave = document.getElementById('btn-admin-stop-wave');
      if (btnStopWave) {
        btnStopWave.addEventListener('click', () => {
          this.engine.clearActiveTsunami();
          this.showToast('🛑 Active Tsunami Cleared!', 'info');
        });
      }

      // Teleport
      document.querySelectorAll('.btn-admin-tp').forEach(btn => {
        btn.addEventListener('click', () => {
          const z = parseFloat(btn.getAttribute('data-tp-z'));
          this.engine.teleportPlayer(z, 0);
          this.showToast(`📍 Teleported to Z = ${z}m!`, 'info');
          this.closeModal();
        });
      });

      // Godmode
      const btnGod = document.getElementById('btn-toggle-godmode');
      if (btnGod) {
        btnGod.addEventListener('click', () => {
          const active = gameState.adminToggleGodmode();
          soundEngine.playClick();
          this.showToast(`🛡️ Godmode: ${active ? 'ENABLED' : 'DISABLED'}`, active ? 'success' : 'info');
          updateView();
        });
      }

      // Super speed
      const btnSpeed = document.getElementById('btn-toggle-superspeed');
      if (btnSpeed) {
        btnSpeed.addEventListener('click', () => {
          const active = gameState.adminToggleSuperSpeed();
          soundEngine.playClick();
          this.showToast(`⚡ Super Speed: ${active ? 'ENABLED (85m/s)' : 'DISABLED'}`, active ? 'success' : 'info');
          updateView();
        });
      }

      // Max upgrades
      const btnMaxUpg = document.getElementById('btn-admin-max-upgrades');
      if (btnMaxUpg) {
        btnMaxUpg.addEventListener('click', () => {
          gameState.adminMaxUpgrades();
          soundEngine.playUpgrade();
          confetti({ particleCount: 70 });
          this.showToast('🏢 All Upgrades Maxed Out!', 'success');
          updateView();
        });
      }

      // Unlock all planes
      const btnUnlockPlanes = document.getElementById('btn-admin-unlock-planes');
      if (btnUnlockPlanes) {
        btnUnlockPlanes.addEventListener('click', () => {
          gameState.adminUnlockAllPlanes();
          soundEngine.playUpgrade();
          this.showToast('📖 All 24 Planes Discovered in Codex!', 'success');
          updateView();
        });
      }

      // Fill hangar with mythics
      const btnFillHangar = document.getElementById('btn-admin-fill-hangar');
      if (btnFillHangar) {
        btnFillHangar.addEventListener('click', () => {
          gameState.adminFillHangarMythic();
          soundEngine.playRebirth();
          confetti({ particleCount: 120, spread: 90 });
          this.showToast('🌟 Filled Hangar with Golden Cosmic & Celestial Aircraft!', 'success');
          updateView();
        });
      }

      // Cycle camera
      const btnCamCycle = document.getElementById('btn-admin-cam-cycle');
      if (btnCamCycle) {
        btnCamCycle.addEventListener('click', () => {
          this.engine.cycleCameraMode();
          this.updateCameraLabel(this.engine.cameraMode);
          this.showToast(`📹 Camera View: ${this.engine.cameraMode.toUpperCase()}`, 'info');
        });
      }
    };

    this.openModal(renderAdmin());
    bindEvents();
  }

  // 7. Settings & Controls Guide Modal
  openSettingsModal() {
    const html = `
      <div class="modal-header flex items-center justify-between pb-3 border-b border-slate-700">
        <div class="flex items-center gap-2">
          <span class="text-2xl">⚙️</span>
          <h2 class="text-xl font-black text-white uppercase tracking-wide">Settings & Controls Guide</h2>
        </div>
        <button id="modal-close-btn" class="text-slate-400 hover:text-white text-xl p-1 font-mono">✕</button>
      </div>

      <div class="modal-body py-4 flex flex-col gap-4 max-h-[65vh] overflow-y-auto pr-1">
        <!-- Audio Toggles -->
        <div class="p-4 rounded-xl bg-slate-800 border border-slate-700 flex flex-col gap-3">
          <h3 class="font-bold text-sm text-white uppercase tracking-wide">Audio Controls</h3>
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-300 font-semibold">Sound Effects (SFX)</span>
            <button id="btn-toggle-sfx" class="px-4 py-1.5 rounded-lg text-xs font-bold ${soundEngine.sfxMuted ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}">
              ${soundEngine.sfxMuted ? 'MUTED' : 'ENABLED'}
            </button>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-300 font-semibold">Aviation Synth Music (BGM)</span>
            <button id="btn-toggle-bgm" class="px-4 py-1.5 rounded-lg text-xs font-bold ${soundEngine.bgmMuted ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}">
              ${soundEngine.bgmMuted ? 'MUTED' : 'PLAYING'}
            </button>
          </div>
        </div>

        <!-- Controls Guide -->
        <div class="p-4 rounded-xl bg-slate-800 border border-slate-700 flex flex-col gap-2">
          <h3 class="font-bold text-sm text-white uppercase tracking-wide">Controls Guide</h3>
          <div class="grid grid-cols-2 gap-2 text-xs text-slate-300">
            <div class="p-2 rounded bg-slate-900"><b class="text-sky-400">WASD / Arrows:</b> Move Pilot</div>
            <div class="p-2 rounded bg-slate-900"><b class="text-sky-400">Spacebar:</b> Jump / Climb</div>
            <div class="p-2 rounded bg-slate-900"><b class="text-sky-400">Shift / Q / E:</b> Turbo Jet Dash</div>
            <div class="p-2 rounded bg-slate-900"><b class="text-sky-400">Mouse Drag:</b> Orbit Camera</div>
            <div class="p-2 rounded bg-slate-900"><b class="text-sky-400">Mouse Scroll:</b> Zoom In / Out</div>
            <div class="p-2 rounded bg-slate-900"><b class="text-sky-400">Touch Controls:</b> Virtual Joystick</div>
          </div>
        </div>

        <!-- Reset Data -->
        <div class="p-4 rounded-xl bg-red-950/40 border border-red-900 flex items-center justify-between">
          <div>
            <h4 class="font-bold text-red-300 text-sm">Reset Game Data</h4>
            <p class="text-xs text-slate-400">Clear all cash, rebirths, and collected planes.</p>
          </div>
          <button id="btn-reset-data" class="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer">
            Reset All
          </button>
        </div>
      </div>
    `;

    this.openModal(html);

    document.getElementById('modal-close-btn').addEventListener('click', () => this.closeModal());

    const btnSfx = document.getElementById('btn-toggle-sfx');
    btnSfx.addEventListener('click', () => {
      const active = soundEngine.toggleSfx();
      btnSfx.textContent = active ? 'ENABLED' : 'MUTED';
      btnSfx.className = `px-4 py-1.5 rounded-lg text-xs font-bold ${active ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`;
    });

    const btnBgm = document.getElementById('btn-toggle-bgm');
    btnBgm.addEventListener('click', () => {
      const active = soundEngine.toggleBgm();
      btnBgm.textContent = active ? 'PLAYING' : 'MUTED';
      btnBgm.className = `px-4 py-1.5 rounded-lg text-xs font-bold ${active ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`;
    });

    const btnReset = document.getElementById('btn-reset-data');
    btnReset.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all game data? This cannot be undone!')) {
        gameState.resetProgress();
        this.showToast('Game progress has been reset!', 'info');
        this.closeModal();
      }
    });
  }
}
