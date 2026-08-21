// Plane and Game Constants for Escape Tsunami for Planes

export const RARITIES = {
  COMMON: { name: 'Common', color: '#94a3b8', glow: '#64748b', multiplier: 1 },
  UNCOMMON: { name: 'Uncommon', color: '#22c55e', glow: '#16a34a', multiplier: 2.5 },
  RARE: { name: 'Rare', color: '#3b82f6', glow: '#2563eb', multiplier: 6 },
  EPIC: { name: 'Epic', color: '#a855f7', glow: '#9333ea', multiplier: 15 },
  LEGENDARY: { name: 'Legendary', color: '#f59e0b', glow: '#d97706', multiplier: 40 },
  MYTHIC: { name: 'Mythic', color: '#ec4899', glow: '#db2777', multiplier: 120 },
  CELESTIAL: { name: 'Celestial', color: '#06b6d4', glow: '#0891b2', multiplier: 400 },
  COSMIC: { name: 'Cosmic', color: '#e11d48', glow: '#be123c', multiplier: 1200 },
  GODLIKE: { name: 'Godlike', color: '#fbbf24', glow: '#f59e0b', multiplier: 5000 },
};

export const ZONES = [
  {
    id: 1,
    name: 'Propeller Plains',
    minDist: 0,
    maxDist: 200,
    color: '#10b981',
    groundColor: '#1e293b',
    tarmacColor: '#334155',
    fogColor: '#0f172a',
    planeIds: ['paper_plane', 'piper_cub', 'crop_duster', 'cessna_172']
  },
  {
    id: 2,
    name: 'Vintage Airfield',
    minDist: 200,
    maxDist: 500,
    color: '#3b82f6',
    groundColor: '#1e293b',
    tarmacColor: '#2d3748',
    fogColor: '#111827',
    planeIds: ['spitfire', 'red_baron', 'seaplane', 'p51_mustang']
  },
  {
    id: 3,
    name: 'Commercial Jetway',
    minDist: 500,
    maxDist: 900,
    color: '#8b5cf6',
    groundColor: '#18181b',
    tarmacColor: '#27272a',
    fogColor: '#09090b',
    planeIds: ['boeing_737', 'a380_superjumbo', 'concorde', 'beluga_cargo']
  },
  {
    id: 4,
    name: 'Military Stealth Base',
    minDist: 900,
    maxDist: 1400,
    color: '#ec4899',
    groundColor: '#0f172a',
    tarmacColor: '#1e293b',
    fogColor: '#020617',
    planeIds: ['f22_raptor', 'a10_warthog', 'b2_stealth', 'sr71_blackbird']
  },
  {
    id: 5,
    name: 'Rocketport & Spacebase',
    minDist: 1400,
    maxDist: 2000,
    color: '#f97316',
    groundColor: '#1c1917',
    tarmacColor: '#292524',
    fogColor: '#0c0a09',
    planeIds: ['x15_rocket', 'space_shuttle', 'darkstar_scramjet', 'an225_mriya']
  },
  {
    id: 6,
    name: 'Cosmic Warp Skyway',
    minDist: 2000,
    maxDist: 3000,
    color: '#06b6d4',
    groundColor: '#172554',
    tarmacColor: '#1e1b4b',
    fogColor: '#030712',
    planeIds: ['plasma_ufo', 'golden_concorde', 'quantum_fighter', 'galaxy_dreadnought']
  }
];

export const PLANES_DATABASE = [
  // Zone 1
  {
    id: 'paper_plane',
    name: 'Origami Flyer',
    rarity: RARITIES.COMMON,
    zoneId: 1,
    baseIncome: 8,
    modelType: 'paper',
    primaryColor: '#ffffff',
    secondaryColor: '#cbd5e1',
    description: 'Folded from ancient blueprint paper. Amazingly aerodynamic!'
  },
  {
    id: 'piper_cub',
    name: 'Piper J-3 Cub',
    rarity: RARITIES.COMMON,
    zoneId: 1,
    baseIncome: 20,
    modelType: 'prop_single',
    primaryColor: '#eab308',
    secondaryColor: '#1e293b',
    description: 'Classic yellow high-wing bush plane. Reliable and nostalgic.'
  },
  {
    id: 'crop_duster',
    name: 'Dusty Cropduster',
    rarity: RARITIES.COMMON,
    zoneId: 1,
    baseIncome: 45,
    modelType: 'crop_duster',
    primaryColor: '#22c55e',
    secondaryColor: '#f97316',
    description: 'Agricultural workhorse equipped with dual wing dusters.'
  },
  {
    id: 'cessna_172',
    name: 'Cessna Skyhawk',
    rarity: RARITIES.UNCOMMON,
    zoneId: 1,
    baseIncome: 95,
    modelType: 'prop_single',
    primaryColor: '#38bdf8',
    secondaryColor: '#ffffff',
    description: 'The world’s most popular flight training craft.'
  },

  // Zone 2
  {
    id: 'spitfire',
    name: 'Spitfire Mk IX',
    rarity: RARITIES.UNCOMMON,
    zoneId: 2,
    baseIncome: 180,
    modelType: 'warbird',
    primaryColor: '#4d7c0f',
    secondaryColor: '#ca8a04',
    description: 'Legendary WW2 interceptor with roaring Merlin engine.'
  },
  {
    id: 'red_baron',
    name: 'Fokker Dr.I Triplane',
    rarity: RARITIES.UNCOMMON,
    zoneId: 2,
    baseIncome: 320,
    modelType: 'triplane',
    primaryColor: '#dc2626',
    secondaryColor: '#ffffff',
    description: 'Triple-winged scarlet menace of the skies.'
  },
  {
    id: 'seaplane',
    name: 'Grumman Goose Seaplane',
    rarity: RARITIES.RARE,
    zoneId: 2,
    baseIncome: 580,
    modelType: 'seaplane',
    primaryColor: '#0284c7',
    secondaryColor: '#f8fafc',
    description: 'Amphibious twin-engine flyer ready for coastal escapes.'
  },
  {
    id: 'p51_mustang',
    name: 'P-51D Mustang',
    rarity: RARITIES.RARE,
    zoneId: 2,
    baseIncome: 950,
    modelType: 'warbird',
    primaryColor: '#94a3b8',
    secondaryColor: '#dc2626',
    description: 'Polished chrome fighter with iconic bubble canopy.'
  },

  // Zone 3
  {
    id: 'boeing_737',
    name: 'AeroJet 737',
    rarity: RARITIES.RARE,
    zoneId: 3,
    baseIncome: 1800,
    modelType: 'airliner',
    primaryColor: '#2563eb',
    secondaryColor: '#ffffff',
    description: 'Twin-engine commercial jet designed for rapid passenger transport.'
  },
  {
    id: 'a380_superjumbo',
    name: 'A380 Superjumbo',
    rarity: RARITIES.RARE,
    zoneId: 3,
    baseIncome: 3400,
    modelType: 'heavy_airliner',
    primaryColor: '#4f46e5',
    secondaryColor: '#e0e7ff',
    description: 'Double-decker quad-engine behemoth carrying hundreds in luxury.'
  },
  {
    id: 'concorde',
    name: 'Concorde Supersonic',
    rarity: RARITIES.EPIC,
    zoneId: 3,
    baseIncome: 7200,
    modelType: 'supersonic',
    primaryColor: '#f8fafc',
    secondaryColor: '#2563eb',
    description: 'Droop-nose delta jet flying faster than the speed of sound.'
  },
  {
    id: 'beluga_cargo',
    name: 'BelugaXL Mega Freighter',
    rarity: RARITIES.EPIC,
    zoneId: 3,
    baseIncome: 14000,
    modelType: 'beluga',
    primaryColor: '#3b82f6',
    secondaryColor: '#facc15',
    description: 'Whale-shaped cargo carrier transporting entire plane wings.'
  },

  // Zone 4
  {
    id: 'f22_raptor',
    name: 'F-22 Raptor',
    rarity: RARITIES.EPIC,
    zoneId: 4,
    baseIncome: 28000,
    modelType: 'stealth_fighter',
    primaryColor: '#334155',
    secondaryColor: '#0ea5e9',
    description: '5th gen air superiority stealth fighter with thrust vectoring.'
  },
  {
    id: 'a10_warthog',
    name: 'A-10 Warthog',
    rarity: RARITIES.EPIC,
    zoneId: 4,
    baseIncome: 52000,
    modelType: 'warthog',
    primaryColor: '#475569',
    secondaryColor: '#65a30d',
    description: 'Titanium-armored tank buster with 30mm rotary nose cannon!'
  },
  {
    id: 'b2_stealth',
    name: 'B-2 Spirit Bomber',
    rarity: RARITIES.LEGENDARY,
    zoneId: 4,
    baseIncome: 110000,
    modelType: 'flying_wing',
    primaryColor: '#0f172a',
    secondaryColor: '#38bdf8',
    description: 'Radar-invisible flying wing with immense strategic power.'
  },
  {
    id: 'sr71_blackbird',
    name: 'SR-71 Blackbird',
    rarity: RARITIES.LEGENDARY,
    zoneId: 4,
    baseIncome: 240000,
    modelType: 'blackbird',
    primaryColor: '#09090b',
    secondaryColor: '#f97316',
    description: 'Mach 3+ titanium reconnaissance bird grazing the edge of space.'
  },

  // Zone 5
  {
    id: 'x15_rocket',
    name: 'X-15 Hypersonic Rocket',
    rarity: RARITIES.LEGENDARY,
    zoneId: 5,
    baseIncome: 550000,
    modelType: 'rocket_plane',
    primaryColor: '#18181b',
    secondaryColor: '#ef4444',
    description: 'Rocket-powered speed demon reaching Mach 6.7 in upper atmosphere.'
  },
  {
    id: 'space_shuttle',
    name: 'Space Shuttle Endeavour',
    rarity: RARITIES.MYTHIC,
    zoneId: 5,
    baseIncome: 1200000,
    modelType: 'shuttle',
    primaryColor: '#ffffff',
    secondaryColor: '#18181b',
    description: 'Reusable orbital spaceplane with heat-shield belly.'
  },
  {
    id: 'darkstar_scramjet',
    name: 'Darkstar Hypersonic',
    rarity: RARITIES.MYTHIC,
    zoneId: 5,
    baseIncome: 2800000,
    modelType: 'darkstar',
    primaryColor: '#030712',
    secondaryColor: '#06b6d4',
    description: 'Experimental Mach 10 scramjet glowing with cyan plasma compression.'
  },
  {
    id: 'an225_mriya',
    name: 'An-225 Mriya Titan',
    rarity: RARITIES.MYTHIC,
    zoneId: 5,
    baseIncome: 6500000,
    modelType: 'mriya',
    primaryColor: '#ffffff',
    secondaryColor: '#2563eb',
    description: 'The heaviest 6-engine aircraft ever built, carrying entire space rockets.'
  },

  // Zone 6
  {
    id: 'plasma_ufo',
    name: 'Plasma UFO Interceptor',
    rarity: RARITIES.CELESTIAL,
    zoneId: 6,
    baseIncome: 15000000,
    modelType: 'ufo',
    primaryColor: '#a855f7',
    secondaryColor: '#06b6d4',
    description: 'Extraterrestrial anti-gravity craft spinning with pulsating tachyons.'
  },
  {
    id: 'golden_concorde',
    name: 'Royal Golden Concorde',
    rarity: RARITIES.CELESTIAL,
    zoneId: 6,
    baseIncome: 35000000,
    modelType: 'supersonic_gold',
    primaryColor: '#fbbf24',
    secondaryColor: '#ffffff',
    description: 'Gleaming 24-karat solid gold supersonic luxury flagship.'
  },
  {
    id: 'quantum_fighter',
    name: 'Quantum Starfighter',
    rarity: RARITIES.COSMIC,
    zoneId: 6,
    baseIncome: 90000000,
    modelType: 'starfighter',
    primaryColor: '#e11d48',
    secondaryColor: '#38bdf8',
    description: 'Warp-drive fighter capable of folding spacetime itself.'
  },
  {
    id: 'galaxy_dreadnought',
    name: 'Celestial Galaxy Carrier',
    rarity: RARITIES.GODLIKE,
    zoneId: 6,
    baseIncome: 250000000,
    modelType: 'dreadnought',
    primaryColor: '#f59e0b',
    secondaryColor: '#8b5cf6',
    description: 'Mythical cosmic capital ship harnessing the energy of exploding supernovas.'
  }
];

export const TSUNAMI_TYPES = [
  {
    id: 'mild',
    name: '🌊 Calm Tide Surge',
    speed: 16,
    color: '#0284c7',
    height: 9,
    warningText: 'MILD WAVE INCOMING',
    warningColor: '#38bdf8',
    intensity: 1.0,
  },
  {
    id: 'emerald',
    name: '🟢 Toxic Emerald Wave',
    speed: 24,
    color: '#059669',
    height: 11,
    warningText: 'FAST WAVE SURGING',
    warningColor: '#10b981',
    intensity: 1.3,
  },
  {
    id: 'crimson',
    name: '🔴 Crimson Mega Tsunami',
    speed: 34,
    color: '#dc2626',
    height: 13,
    warningText: '⚠️ EXTREME TSUNAMI INCOMING!',
    warningColor: '#ef4444',
    intensity: 1.8,
  },
  {
    id: 'hyper',
    name: '⚡ Hyper Plasma Vortex',
    speed: 46,
    color: '#7c3aed',
    height: 15,
    warningText: '⚡ HYPER TSUNAMI! TAKE COVER!',
    warningColor: '#a855f7',
    intensity: 2.3,
  },
  {
    id: 'cosmic',
    name: '💀 Cosmic Cataclysm Void',
    speed: 60,
    color: '#be123c',
    height: 18,
    warningText: '💀 COSMIC CATACLYSM WAVE! BRACE!',
    warningColor: '#fb7185',
    intensity: 3.0,
  }
];

export const REBIRTH_TIERS = [
  {
    rank: 0,
    title: 'Rookie Ground Crew',
    cost: 0,
    multiplier: 1.0,
    wings: null,
    bonusSpeed: 0,
    color: '#94a3b8'
  },
  {
    rank: 1,
    title: 'Propeller Pilot',
    cost: 15000,
    multiplier: 2.0,
    wings: 'bronze',
    bonusSpeed: 2,
    color: '#22c55e'
  },
  {
    rank: 2,
    title: 'Jet Aviator',
    cost: 85000,
    multiplier: 4.5,
    wings: 'silver',
    bonusSpeed: 4,
    color: '#3b82f6'
  },
  {
    rank: 3,
    title: 'Supersonic Ace',
    cost: 450000,
    multiplier: 10.0,
    wings: 'gold',
    bonusSpeed: 6,
    color: '#a855f7'
  },
  {
    rank: 4,
    title: 'Stealth Phantom',
    cost: 2500000,
    multiplier: 25.0,
    wings: 'plasma',
    bonusSpeed: 8,
    color: '#f97316'
  },
  {
    rank: 5,
    title: 'Orbital Commander',
    cost: 15000000,
    multiplier: 65.0,
    wings: 'ruby',
    bonusSpeed: 11,
    color: '#ec4899'
  },
  {
    rank: 6,
    title: 'Celestial Sky God',
    cost: 95000000,
    multiplier: 180.0,
    wings: 'cosmic',
    bonusSpeed: 15,
    color: '#06b6d4'
  },
  {
    rank: 7,
    title: 'Galactic Sovereign',
    cost: 650000000,
    multiplier: 500.0,
    wings: 'godly',
    bonusSpeed: 20,
    color: '#fbbf24'
  }
];

export const UPGRADES = {
  speed: {
    id: 'speed',
    name: 'Sprint Jet Thrusters',
    icon: '⚡',
    baseCost: 100,
    costMultiplier: 1.45,
    maxLevel: 40,
    description: 'Increases your running & sprint speed to outpace tsunamis.',
    getValue: (lvl) => 14 + (lvl - 1) * 1.6,
    formatValue: (val) => `${val.toFixed(1)} m/s`
  },
  towCapacity: {
    id: 'towCapacity',
    name: 'Cargo Tow Cables',
    icon: '🧲',
    baseCost: 250,
    costMultiplier: 2.2,
    maxLevel: 10,
    description: 'Carry more planes at once to haul mega riches back to base.',
    getValue: (lvl) => 1 + (lvl - 1) * 1, // 1 to 10
    formatValue: (val) => `${val} Planes`
  },
  hangarSlots: {
    id: 'hangarSlots',
    name: 'Hangar Parking Pads',
    icon: '🏢',
    baseCost: 500,
    costMultiplier: 2.6,
    maxLevel: 16,
    description: 'Expand base slots to station more planes generating passive $/s.',
    getValue: (lvl) => 4 + (lvl - 1) * 2, // 4 to 34
    formatValue: (val) => `${val} Slots`
  },
  planeMagnet: {
    id: 'planeMagnet',
    name: 'Tractor Beam Magnet',
    icon: '✨',
    baseCost: 750,
    costMultiplier: 1.8,
    maxLevel: 10,
    description: 'Auto-grabs planes from a wider pickup radius when running past.',
    getValue: (lvl) => 3.5 + (lvl - 1) * 1.5,
    formatValue: (val) => `${val.toFixed(1)}m Radius`
  },
  dashBoost: {
    id: 'dashBoost',
    name: 'Rocket Boost Dash',
    icon: '🚀',
    baseCost: 1500,
    costMultiplier: 2.5,
    maxLevel: 8,
    description: 'Reduce cooldown and boost dash distance when pressing SHIFT / Boost button.',
    getValue: (lvl) => Math.max(1.2, 5.0 - (lvl - 1) * 0.45),
    formatValue: (val) => `${val.toFixed(1)}s CD`
  },
  waveRadar: {
    id: 'waveRadar',
    name: 'Tsunami Warning Radar',
    icon: '📡',
    baseCost: 2000,
    costMultiplier: 3.0,
    maxLevel: 5,
    description: 'Detects tsunami waves earlier and marks high-value planes on your radar.',
    getValue: (lvl) => lvl,
    formatValue: (val) => `Tier ${val}`
  }
};

export const AIRDROP_CRATES = [
  {
    id: 'wooden',
    name: 'Wooden Air Cargo',
    cost: 500,
    icon: '📦',
    rarityChances: { COMMON: 70, UNCOMMON: 25, RARE: 5, EPIC: 0, LEGENDARY: 0, MYTHIC: 0 }
  },
  {
    id: 'steel',
    name: 'Steel Jet Case',
    cost: 4500,
    icon: '🧰',
    rarityChances: { COMMON: 20, UNCOMMON: 45, RARE: 25, EPIC: 9, LEGENDARY: 1, MYTHIC: 0 }
  },
  {
    id: 'military',
    name: 'Military Stealth Crate',
    cost: 35000,
    icon: '🔒',
    rarityChances: { COMMON: 0, UNCOMMON: 15, RARE: 45, EPIC: 30, LEGENDARY: 9, MYTHIC: 1 }
  },
  {
    id: 'quantum',
    name: 'Quantum Star Capsule',
    cost: 300000,
    icon: '🌌',
    rarityChances: { COMMON: 0, UNCOMMON: 0, RARE: 10, EPIC: 35, LEGENDARY: 40, MYTHIC: 12, CELESTIAL: 3 }
  }
];
