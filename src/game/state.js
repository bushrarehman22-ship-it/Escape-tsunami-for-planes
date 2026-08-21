import { PLANES_DATABASE, REBIRTH_TIERS, UPGRADES } from './constants.js';

const STORAGE_KEY = 'ESCAPE_TSUNAMI_PLANES_SAVE_V1';

class GameState {
  constructor() {
    this.money = 0;
    this.rebirths = 0;
    this.rebirthTokens = 0;
    this.upgrades = {
      speed: 1,
      towCapacity: 1,
      hangarSlots: 1,
      planeMagnet: 1,
      dashBoost: 1,
      waveRadar: 1
    };
    this.hangarPlanes = []; // Array of { id, planeDef, level, golden }
    this.carriedPlanes = []; // Array of planeDef
    this.unlockedPlaneIds = new Set(['paper_plane']);
    this.stats = {
      totalMoneyEarned: 0,
      totalPlanesRescued: 0,
      tsunamisEscaped: 0,
      maxDistanceReached: 0,
      timesWipedOut: 0,
      rebirthCount: 0
    };
    this.settings = {
      sfxVolume: 0.7,
      bgmVolume: 0.35,
      sfxMuted: false,
      bgmMuted: false,
      highGraphics: true
    };
    this.admin = {
      godmode: false,
      infiniteSprint: false,
      superSpeed: false
    };

    this.listeners = new Set();
    this.load();

    // Starter plane if empty hangar
    if (this.hangarPlanes.length === 0) {
      const starter = PLANES_DATABASE.find(p => p.id === 'paper_plane');
      if (starter) {
        this.hangarPlanes.push({ ...starter, level: 1, golden: false });
      }
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb(this));
  }

  // Get effective values
  getRebirthTier() {
    const rank = Math.min(this.rebirths, REBIRTH_TIERS.length - 1);
    return REBIRTH_TIERS[rank];
  }

  getNextRebirthTier() {
    const nextRank = this.rebirths + 1;
    if (nextRank >= REBIRTH_TIERS.length) return null;
    return REBIRTH_TIERS[nextRank];
  }

  getIncomeMultiplier() {
    const tier = this.getRebirthTier();
    return tier.multiplier || 1.0;
  }

  getUpgradeValue(upgradeKey) {
    const def = UPGRADES[upgradeKey];
    if (!def) return 1;
    const lvl = this.upgrades[upgradeKey] || 1;
    return def.getValue(lvl);
  }

  getUpgradeCost(upgradeKey) {
    const def = UPGRADES[upgradeKey];
    if (!def) return Infinity;
    const lvl = this.upgrades[upgradeKey] || 1;
    if (lvl >= def.maxLevel) return Infinity;
    return Math.floor(def.baseCost * Math.pow(def.costMultiplier, lvl - 1));
  }

  buyUpgrade(upgradeKey) {
    const cost = this.getUpgradeCost(upgradeKey);
    const def = UPGRADES[upgradeKey];
    if (!def) return false;
    const currentLvl = this.upgrades[upgradeKey] || 1;
    if (currentLvl >= def.maxLevel) return false;

    if (this.money >= cost) {
      this.money -= cost;
      this.upgrades[upgradeKey] = currentLvl + 1;
      this.save();
      this.notify();
      return true;
    }
    return false;
  }

  getMaxHangarSlots() {
    return this.getUpgradeValue('hangarSlots');
  }

  getMaxTowCapacity() {
    return this.getUpgradeValue('towCapacity');
  }

  getPlayerSpeed() {
    if (this.admin.superSpeed) return 85.0;
    const baseSpeed = this.getUpgradeValue('speed');
    const rebirthBonus = this.getRebirthTier().bonusSpeed || 0;
    return baseSpeed + rebirthBonus;
  }

  // Admin Commands
  adminAddCash(amount) {
    this.addMoney(amount);
    this.save();
    this.notify();
  }

  adminSetRebirthRank(rank) {
    this.rebirths = Math.max(0, Math.min(rank, REBIRTH_TIERS.length - 1));
    this.stats.rebirthCount = this.rebirths;
    this.save();
    this.notify();
  }

  adminMaxUpgrades() {
    for (const key of Object.keys(this.upgrades)) {
      const def = UPGRADES[key];
      if (def) this.upgrades[key] = def.maxLevel;
    }
    this.save();
    this.notify();
  }

  adminUnlockAllPlanes() {
    PLANES_DATABASE.forEach(p => this.unlockedPlaneIds.add(p.id));
    this.save();
    this.notify();
  }

  adminFillHangarMythic() {
    const maxSlots = this.getMaxHangarSlots();
    const mythicPlanes = PLANES_DATABASE.filter(p => 
      p.rarity.name === 'Celestial' || p.rarity.name === 'Cosmic' || p.rarity.name === 'Godlike' || p.rarity.name === 'Mythic'
    );
    this.hangarPlanes = [];
    for (let i = 0; i < maxSlots; i++) {
      const planeDef = mythicPlanes[i % mythicPlanes.length];
      this.hangarPlanes.push({ ...planeDef, level: 1, golden: true });
      this.unlockedPlaneIds.add(planeDef.id);
    }
    this.save();
    this.notify();
  }

  adminToggleGodmode() {
    this.admin.godmode = !this.admin.godmode;
    this.notify();
    return this.admin.godmode;
  }

  adminToggleSuperSpeed() {
    this.admin.superSpeed = !this.admin.superSpeed;
    this.notify();
    return this.admin.superSpeed;
  }

  getTotalIncomePerSecond() {
    const baseSum = this.hangarPlanes.reduce((acc, plane) => {
      const planeDef = PLANES_DATABASE.find(p => p.id === plane.id) || plane;
      let inc = planeDef.baseIncome || 10;
      if (plane.golden) inc *= 3;
      if (plane.level && plane.level > 1) inc *= Math.pow(1.2, plane.level - 1);
      return acc + inc;
    }, 0);

    return Math.floor(baseSum * this.getIncomeMultiplier());
  }

  addMoney(amount) {
    if (amount <= 0) return;
    this.money += amount;
    this.stats.totalMoneyEarned += amount;
    this.notify();
  }

  // Ticking income
  tickIncome(dt) {
    const perSec = this.getTotalIncomePerSecond();
    if (perSec > 0) {
      const earned = perSec * dt;
      this.money += earned;
      this.stats.totalMoneyEarned += earned;
    }
  }

  // Towing a plane
  canPickupPlane() {
    return this.carriedPlanes.length < this.getMaxTowCapacity();
  }

  pickupPlane(planeDef) {
    if (!this.canPickupPlane()) return false;
    this.carriedPlanes.push(planeDef);
    this.unlockedPlaneIds.add(planeDef.id);
    this.notify();
    return true;
  }

  // Deposit planes in base
  depositCarriedPlanes() {
    if (this.carriedPlanes.length === 0) return { deposited: 0, sold: 0, cashEarned: 0 };
    const maxSlots = this.getMaxHangarSlots();
    let deposited = 0;
    let sold = 0;
    let cashEarned = 0;

    const planesToProcess = [...this.carriedPlanes];
    this.carriedPlanes = [];

    planesToProcess.forEach(plane => {
      this.stats.totalPlanesRescued++;
      this.unlockedPlaneIds.add(plane.id);

      if (this.hangarPlanes.length < maxSlots) {
        // Add to active hangar slot
        this.hangarPlanes.push({ ...plane, level: 1, golden: false });
        deposited++;
      } else {
        // Hangar full: check if we should auto-replace a lower tier plane OR sell for instant reward!
        // Find weakest plane in hangar
        let weakestIdx = -1;
        let weakestIncome = Infinity;
        this.hangarPlanes.forEach((p, idx) => {
          const inc = (p.baseIncome || 10) * (p.golden ? 3 : 1);
          if (inc < weakestIncome) {
            weakestIncome = inc;
            weakestIdx = idx;
          }
        });

        const thisIncome = plane.baseIncome || 10;
        if (weakestIdx !== -1 && thisIncome > weakestIncome) {
          // Replace weaker plane with better one!
          const oldPlane = this.hangarPlanes[weakestIdx];
          const sellValue = (oldPlane.baseIncome || 10) * 15 * this.getIncomeMultiplier();
          this.addMoney(sellValue);
          cashEarned += sellValue;
          this.hangarPlanes[weakestIdx] = { ...plane, level: 1, golden: false };
          deposited++;
        } else {
          // Sell carried plane for bonus cash!
          const sellValue = (plane.baseIncome || 10) * 20 * this.getIncomeMultiplier();
          this.addMoney(sellValue);
          cashEarned += sellValue;
          sold++;
        }
      }
    });

    this.save();
    this.notify();
    return { deposited, sold, cashEarned };
  }

  // Wipeout: lost carried planes
  wipeout() {
    const lostCount = this.carriedPlanes.length;
    this.carriedPlanes = [];
    this.stats.timesWipedOut++;
    this.save();
    this.notify();
    return lostCount;
  }

  // Rebirth
  canRebirth() {
    const nextTier = this.getNextRebirthTier();
    if (!nextTier) return false;
    return this.money >= nextTier.cost;
  }

  performRebirth() {
    if (!this.canRebirth()) return false;
    const nextTier = this.getNextRebirthTier();
    if (!nextTier) return false;

    this.money -= nextTier.cost;
    this.rebirths += 1;
    this.rebirthTokens += (this.rebirths * 5);
    this.stats.rebirthCount = this.rebirths;

    // Soft reset upgrades: reset speed to 1, tow capacity to 1, magnet to 1
    // Keep 1/2 of hangar slot levels or boost starter income!
    this.upgrades.speed = 1;
    this.upgrades.towCapacity = 1;
    this.upgrades.planeMagnet = 1;
    this.upgrades.dashBoost = 1;
    this.upgrades.hangarSlots = Math.max(1, Math.floor(this.upgrades.hangarSlots / 2));

    this.save();
    this.notify();
    return true;
  }

  // Merge identical planes (3 identical -> 1 Golden with 3x income)
  canMergePlane(planeId) {
    const matches = this.hangarPlanes.filter(p => p.id === planeId && !p.golden);
    return matches.length >= 3;
  }

  mergePlanes(planeId) {
    if (!this.canMergePlane(planeId)) return false;
    let removed = 0;
    const newHangar = [];
    for (const p of this.hangarPlanes) {
      if (p.id === planeId && !p.golden && removed < 3) {
        removed++;
      } else {
        newHangar.push(p);
      }
    }
    const planeDef = PLANES_DATABASE.find(p => p.id === planeId);
    if (planeDef) {
      newHangar.push({ ...planeDef, level: 1, golden: true });
    }
    this.hangarPlanes = newHangar;
    this.save();
    this.notify();
    return true;
  }

  // Open Airdrop Crate
  openCrate(crateDef) {
    if (this.money < crateDef.cost) return null;
    this.money -= crateDef.cost;

    // Roll rarity
    const rand = Math.random() * 100;
    let accumulated = 0;
    let chosenRarityName = 'COMMON';

    for (const [rarityName, chance] of Object.entries(crateDef.rarityChances)) {
      accumulated += chance;
      if (rand <= accumulated) {
        chosenRarityName = rarityName;
        break;
      }
    }

    // Filter planes with this rarity
    const matchingPlanes = PLANES_DATABASE.filter(p => p.rarity.name.toUpperCase() === chosenRarityName);
    const chosenPlane = matchingPlanes.length > 0
      ? matchingPlanes[Math.floor(Math.random() * matchingPlanes.length)]
      : PLANES_DATABASE[0];

    // Try to deposit directly or give bonus cash if hangar is totally full
    if (this.hangarPlanes.length < this.getMaxHangarSlots()) {
      this.hangarPlanes.push({ ...chosenPlane, level: 1, golden: false });
    } else {
      // Find weakest and replace if better, or award cash
      const sellVal = (chosenPlane.baseIncome || 10) * 25 * this.getIncomeMultiplier();
      this.addMoney(sellVal);
    }

    this.unlockedPlaneIds.add(chosenPlane.id);
    this.save();
    this.notify();
    return chosenPlane;
  }

  save() {
    try {
      const data = {
        money: this.money,
        rebirths: this.rebirths,
        rebirthTokens: this.rebirthTokens,
        upgrades: this.upgrades,
        hangarPlanes: this.hangarPlanes,
        unlockedPlaneIds: Array.from(this.unlockedPlaneIds),
        stats: this.stats,
        settings: this.settings
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save game state to localStorage', e);
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.money !== undefined) this.money = data.money;
      if (data.rebirths !== undefined) this.rebirths = data.rebirths;
      if (data.rebirthTokens !== undefined) this.rebirthTokens = data.rebirthTokens;
      if (data.upgrades) this.upgrades = { ...this.upgrades, ...data.upgrades };
      if (Array.isArray(data.hangarPlanes)) this.hangarPlanes = data.hangarPlanes;
      if (Array.isArray(data.unlockedPlaneIds)) this.unlockedPlaneIds = new Set(data.unlockedPlaneIds);
      if (data.stats) this.stats = { ...this.stats, ...data.stats };
      if (data.settings) this.settings = { ...this.settings, ...data.settings };
    } catch (e) {
      console.warn('Could not load game state from localStorage', e);
    }
  }

  resetProgress() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    this.money = 0;
    this.rebirths = 0;
    this.rebirthTokens = 0;
    this.upgrades = {
      speed: 1,
      towCapacity: 1,
      hangarSlots: 1,
      planeMagnet: 1,
      dashBoost: 1,
      waveRadar: 1
    };
    this.hangarPlanes = [];
    this.carriedPlanes = [];
    this.unlockedPlaneIds = new Set(['paper_plane']);
    const starter = PLANES_DATABASE.find(p => p.id === 'paper_plane');
    if (starter) {
      this.hangarPlanes.push({ ...starter, level: 1, golden: false });
    }
    this.save();
    this.notify();
  }
}

export const gameState = new GameState();
