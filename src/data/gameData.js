// All game data lives here, so it can be edited without touching the game code.
//
// The numbers are based on real NASA missions (LRO, MRO, OSIRIS-REx). Every
// entry has a `basedOn` field naming the real hardware. SOURCES.md lists which
// values were checked against published mission data and which are game
// estimates (cost, data volume, science points, rocket capacity).

// Where the mission goes. These factors turn one design into different results.
export const TARGETS = {
  moon: {
    name: 'Moon',
    // Sunlight relative to Earth orbit (1.0 = same as at Earth).
    solarFactor: 1.0,
    // Launch mass = dry mass x this factor (fuel needed to get there and brake).
    // LRO: 1916 kg at launch / 1018 kg dry.
    fuelFactor: 1.9,
  },
  mars: {
    name: 'Mars',
    // Mars is 1.52x farther from the Sun, light falls with distance squared.
    solarFactor: 0.43,
    // MRO: 2180 kg at launch / about 1030 kg dry.
    fuelFactor: 2.1,
  },
  asteroid: {
    name: 'Near-Earth asteroid',
    solarFactor: 0.75,
    // OSIRIS-REx: 2110 kg at launch / 880 kg dry (needs fuel to come back).
    fuelFactor: 2.4,
  },
}

export const MISSIONS = [
  {
    id: 'moon',
    target: 'moon',
    title: 'Lunar South Pole Survey',
    brief:
      'Map the terrain and search for water ice near the lunar south pole to prepare future landings.',
    difficulty: 'Easy',
    budget: 360, // $M
    minScience: 30,
    requiredCategories: ['topography', 'volatiles'],
    realMission: {
      name: 'Lunar Reconnaissance Orbiter (LRO)',
      fact: 'LRO has been mapping the Moon since 2009 and found evidence of water ice in polar craters.',
    },
  },
  {
    id: 'mars',
    target: 'mars',
    title: 'Mars Surface Reconnaissance',
    brief:
      'Photograph the surface in detail and identify minerals that formed in water.',
    difficulty: 'Medium',
    budget: 560,
    minScience: 50,
    requiredCategories: ['imaging', 'composition'],
    realMission: {
      name: 'Mars Reconnaissance Orbiter (MRO)',
      fact: 'MRO has returned more data than all other Mars missions combined.',
    },
  },
  {
    id: 'asteroid',
    target: 'asteroid',
    title: 'Asteroid Sample Return',
    brief:
      'Map a near-Earth asteroid, pick a safe site, collect a sample and bring it home.',
    difficulty: 'Hard',
    budget: 620,
    minScience: 55,
    requiredCategories: ['imaging', 'sample'],
    realMission: {
      name: 'OSIRIS-REx',
      fact: 'OSIRIS-REx returned a sample of asteroid Bennu to Earth in 2023.',
    },
  },
]

// The spacecraft body: structure, computer, attitude control, thermal.
export const BUSES = [
  {
    id: 'small',
    name: 'Small bus',
    dryMass: 250, // kg
    basePower: 150, // W used by the bus itself
    cost: 90, // $M
    payloadLimit: 40, // kg of instruments it can carry
    reliability: 0.9,
    note: 'Cheap and light, but carries few instruments and has little redundancy.',
  },
  {
    id: 'medium',
    name: 'Medium bus',
    dryMass: 600,
    basePower: 300,
    cost: 200,
    payloadLimit: 120,
    reliability: 0.94,
    note: 'A balanced platform, similar in class to LRO and MRO.',
  },
  {
    id: 'large',
    name: 'Large bus',
    dryMass: 1000,
    basePower: 450,
    cost: 350,
    payloadLimit: 250,
    reliability: 0.97,
    note: 'Carries a full instrument suite with backup systems, but is heavy and expensive.',
  },
]

// Power output is given at Earth distance and scaled by the target's solarFactor.
export const POWER_SYSTEMS = [
  { id: 'solarS', name: 'Small solar arrays', power: 800, mass: 35, cost: 12 },
  { id: 'solarL', name: 'Large solar arrays', power: 2500, mass: 100, cost: 40 },
  { id: 'solarXL', name: 'Extra-large solar arrays', power: 5000, mass: 190, cost: 75 },
]

// Data rate depends on distance: the same antenna is far slower from Mars.
export const ANTENNAS = [
  {
    id: 'lga',
    name: 'Low-gain antenna',
    mass: 2,
    power: 10,
    cost: 2,
    rate: { moon: 0.5, mars: 0.002, asteroid: 0.005 }, // Mbps
  },
  {
    id: 'mga',
    name: 'Medium-gain antenna (1 m)',
    mass: 15,
    power: 40,
    cost: 12,
    rate: { moon: 10, mars: 0.1, asteroid: 0.3 },
  },
  {
    id: 'hga',
    name: 'High-gain antenna (3 m)',
    mass: 45,
    power: 100,
    cost: 35,
    rate: { moon: 100, mars: 3, asteroid: 6 },
  },
]

export const INSTRUMENTS = [
  {
    id: 'hires',
    name: 'High-resolution camera',
    basedOn: 'HiRISE (MRO)',
    info:
      'Takes very sharp images that show details smaller than a metre. Used to study geology and to check landing sites for hazards.',
    category: 'imaging',
    mass: 65, power: 60, cost: 40, data: 30, science: 30,
  },
  {
    id: 'context',
    name: 'Context camera',
    basedOn: 'CTX (MRO)',
    info:
      'Takes wide images of the area around a detailed picture, so scientists can see where it fits in the landscape.',
    category: 'imaging',
    mass: 4, power: 7, cost: 8, data: 8, science: 12,
  },
  {
    id: 'spectrometer',
    name: 'Imaging spectrometer',
    basedOn: 'CRISM (MRO)',
    info:
      'Splits reflected sunlight into hundreds of colours to identify minerals, including those that formed in water.',
    category: 'composition',
    mass: 33, power: 45, cost: 30, data: 15, science: 25,
  },
  {
    id: 'radar',
    name: 'Radar sounder',
    basedOn: 'SHARAD (MRO)',
    info:
      'Sends radio waves into the ground and listens for echoes from buried layers. Reveals ice and rock under the surface.',
    category: 'subsurface',
    mass: 15, power: 60, cost: 25, data: 10, science: 20,
  },
  {
    id: 'altimeter',
    name: 'Laser altimeter',
    basedOn: 'LOLA (LRO)',
    info:
      'Fires laser pulses at the surface and times their return to build a 3D map of the terrain. Needed to find flat, safe landing sites.',
    category: 'topography',
    mass: 11, power: 33, cost: 20, data: 2, science: 18,
  },
  {
    id: 'thermal',
    name: 'Thermal radiometer',
    basedOn: 'Diviner (LRO)',
    info:
      'Measures surface temperature by day and night. Finds cold places where ice can survive and tells solid rock from dust.',
    category: 'thermal',
    mass: 11, power: 25, cost: 15, data: 1, science: 12,
  },
  {
    id: 'neutron',
    name: 'Neutron detector',
    basedOn: 'LEND (LRO)',
    info:
      'Counts neutrons coming from the surface. A drop in their number points to hydrogen, a sign of water ice in the soil.',
    category: 'volatiles',
    mass: 26, power: 12, cost: 18, data: 0.2, science: 14,
  },
  {
    id: 'sampler',
    name: 'Sample collection arm',
    basedOn: 'TAGSAM (OSIRIS-REx)',
    info:
      'Touches the surface for a few seconds and collects loose material, which is returned to Earth for study in laboratories.',
    category: 'sample',
    onlyFor: ['asteroid'],
    mass: 30, power: 20, cost: 60, data: 0.1, science: 35,
  },
]

// Capacity is how many kg the rocket can send to each target.
export const LAUNCHERS = [
  {
    id: 'small',
    name: 'Small launcher',
    basedOn: 'Minotaur V class (launched LADEE to the Moon)',
    cost: 50,
    capacity: { moon: 450, mars: 0, asteroid: 0 },
  },
  {
    id: 'medium',
    name: 'Medium launcher',
    basedOn: 'Falcon 9 class',
    cost: 70,
    capacity: { moon: 3300, mars: 2400, asteroid: 2000 },
  },
  {
    id: 'mediumPlus',
    name: 'Medium-plus launcher',
    basedOn: 'Atlas V 401 class (launched LRO and MRO)',
    cost: 110,
    capacity: { moon: 3500, mars: 2700, asteroid: 2300 },
  },
  {
    id: 'heavy',
    name: 'Heavy launcher',
    basedOn: 'Falcon Heavy class',
    cost: 150,
    capacity: { moon: 15000, mars: 12000, asteroid: 9000 },
  },
]

export const ORBITS = [
  {
    id: 'low',
    name: 'Low orbit',
    scienceMult: 1.25,
    fuelExtra: 0.15,
    contactHours: 6,
    note: 'Closer to the surface: sharper data, but more fuel to get there and less time in view of Earth.',
  },
  {
    id: 'standard',
    name: 'Standard orbit',
    scienceMult: 1.0,
    fuelExtra: 0,
    contactHours: 8,
    note: 'A balanced choice.',
  },
  {
    id: 'high',
    name: 'High orbit',
    scienceMult: 0.8,
    fuelExtra: -0.1,
    contactHours: 10,
    note: 'Less fuel and longer contact with Earth, but the instruments see less detail.',
  },
]

export const LIFETIMES = [
  { years: 1, scienceMult: 0.8, reliabilityMult: 1.0 },
  { years: 2, scienceMult: 1.0, reliabilityMult: 0.97 },
  { years: 4, scienceMult: 1.15, reliabilityMult: 0.9 },
]

// Cost of the operations team and ground stations, $M per year.
export const OPS_COST_PER_YEAR = 15
