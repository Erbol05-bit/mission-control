// Game rules: turns the player's choices into resources, checks and a score.
// No React or Three.js here, so the rules can be tested on their own.

import {
  TARGETS, MISSIONS, BUSES, POWER_SYSTEMS, ANTENNAS, INSTRUMENTS,
  LAUNCHERS, ORBITS, LIFETIMES, OPS_COST_PER_YEAR,
} from '../data/gameData.js'

const byId = (list, id) => list.find((x) => x.id === id)
const sum = (list, key) => list.reduce((total, x) => total + x[key], 0)
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x))

export const emptyDesign = () => ({
  missionId: null,
  busId: null,
  powerId: null,
  antennaId: null,
  instrumentIds: [],
  launcherId: null,
  orbitId: 'standard',
  years: 2,
})

// Everything the screen needs to show for the current design.
export function evaluate(design) {
  const mission = byId(MISSIONS, design.missionId)
  if (!mission) return null
  const target = TARGETS[mission.target]

  const bus = byId(BUSES, design.busId)
  const powerSys = byId(POWER_SYSTEMS, design.powerId)
  const antenna = byId(ANTENNAS, design.antennaId)
  const launcher = byId(LAUNCHERS, design.launcherId)
  const orbit = byId(ORBITS, design.orbitId)
  const life = LIFETIMES.find((l) => l.years === design.years)
  const instruments = design.instrumentIds.map((id) => byId(INSTRUMENTS, id))

  // Mass: the rocket lifts the dry spacecraft plus the fuel to reach the target.
  const payloadMass = sum(instruments, 'mass')
  const dryMass =
    (bus?.dryMass ?? 0) + (powerSys?.mass ?? 0) + (antenna?.mass ?? 0) + payloadMass
  const launchMass = Math.round(dryMass * (target.fuelFactor + orbit.fuelExtra))
  const massLimit = launcher ? launcher.capacity[mission.target] : 0

  // Power: solar arrays give less the farther the target is from the Sun.
  const powerGen = Math.round((powerSys?.power ?? 0) * target.solarFactor)
  const powerUse =
    (bus?.basePower ?? 0) + (antenna?.power ?? 0) + sum(instruments, 'power')

  // Budget.
  const cost =
    (bus?.cost ?? 0) + (powerSys?.cost ?? 0) + (antenna?.cost ?? 0) +
    sum(instruments, 'cost') + (launcher?.cost ?? 0) +
    OPS_COST_PER_YEAR * design.years

  // Data: what the instruments produce vs what the antenna can send home.
  const dataGen = sum(instruments, 'data') // Gb per day
  const rate = antenna ? antenna.rate[mission.target] : 0 // Mbps
  const downlink = (rate * 3600 * orbit.contactHours) / 1000 // Gb per day
  const dataReturned = dataGen > 0 ? Math.min(1, downlink / dataGen) : 1

  // Science: data that never reaches Earth is worth nothing.
  const rawScience = sum(instruments, 'science')
  const science = Math.round(
    rawScience * orbit.scienceMult * life.scienceMult * dataReturned,
  )
  const covered = mission.requiredCategories.filter((c) =>
    instruments.some((i) => i.category === c),
  )

  // Margins: spare capacity protects the mission when something goes wrong.
  const massMargin = massLimit > 0 ? (massLimit - launchMass) / massLimit : -1
  const powerMargin = powerGen > 0 ? (powerGen - powerUse) / powerGen : -1
  const reliability =
    (bus?.reliability ?? 0) *
    life.reliabilityMult *
    (powerMargin < 0.1 ? 0.92 : 1) *
    (massMargin < 0.05 ? 0.95 : 1)

  const checks = [
    {
      id: 'parts',
      ok: Boolean(bus && powerSys && antenna && launcher && instruments.length),
      label: 'All systems selected',
      why: 'A spacecraft needs a bus, power, an antenna, at least one instrument and a rocket.',
    },
    {
      id: 'payload',
      ok: !bus || payloadMass <= bus.payloadLimit,
      label: `Instruments fit the bus (${payloadMass} / ${bus?.payloadLimit ?? 0} kg)`,
      why: 'Each bus can carry a limited mass of instruments. Remove an instrument or choose a bigger bus.',
    },
    {
      id: 'mass',
      ok: !launcher || launchMass <= massLimit,
      label: `Rocket can lift the spacecraft (${launchMass} / ${massLimit} kg)`,
      why: `Reaching ${target.name} takes fuel, so launch mass is about ${(target.fuelFactor + orbit.fuelExtra).toFixed(2)}x the dry mass. Lighten the spacecraft, pick a higher orbit or a bigger rocket.`,
    },
    {
      id: 'power',
      ok: !powerSys || powerGen >= powerUse,
      label: `Enough power (${powerUse} / ${powerGen} W)`,
      why: `At ${target.name} solar arrays produce ${Math.round(target.solarFactor * 100)}% of their output near Earth. Add larger arrays or remove power-hungry instruments.`,
    },
    {
      id: 'budget',
      ok: cost <= mission.budget,
      label: `Within budget ($${cost}M / $${mission.budget}M)`,
      why: 'The total includes the spacecraft, the rocket and yearly operations.',
    },
  ]

  const warnings = []
  if (antenna && dataReturned < 1) {
    warnings.push(
      `Only ${Math.round(dataReturned * 100)}% of the data reaches Earth: instruments produce ${dataGen.toFixed(1)} Gb/day, the antenna sends ${downlink.toFixed(1)} Gb/day. Science is reduced.`,
    )
  }
  if (covered.length < mission.requiredCategories.length) {
    const missing = mission.requiredCategories.filter((c) => !covered.includes(c))
    warnings.push(`Mission goal needs instruments for: ${missing.join(', ')}.`)
  }
  if (powerSys && powerGen >= powerUse && powerMargin < 0.1) {
    warnings.push('Power margin is under 10%: any fault could shut instruments down.')
  }
  if (launcher && launchMass <= massLimit && massMargin < 0.05) {
    warnings.push('Mass margin is under 5%: no room for design growth.')
  }

  return {
    mission, target, design,
    bus, powerSys, antenna, launcher, orbit, instruments,
    payloadMass, dryMass, launchMass, massLimit,
    powerGen, powerUse, cost,
    dataGen, downlink, dataReturned,
    science, covered, reliability, massMargin, powerMargin,
    checks, warnings,
    canLaunch: checks.every((c) => c.ok),
  }
}

// Final score out of 100, with the reason for each part.
export function score(result) {
  const { mission } = result
  const coverage = result.covered.length / mission.requiredCategories.length
  const scienceRatio = result.science / mission.minScience
  const goalMet = coverage === 1 && scienceRatio >= 1

  const parts = [
    {
      name: 'Mission goal',
      max: 40,
      points: goalMet ? 40 : Math.round(25 * coverage * Math.min(1, scienceRatio)),
      note: goalMet
        ? 'All required measurements were made.'
        : 'The required measurements were not all made, or too little data came back.',
    },
    {
      name: 'Science value',
      max: 25,
      points: Math.round(25 * clamp(scienceRatio / 1.5, 0, 1)),
      note: `${result.science} science points (goal: ${mission.minScience}).`,
    },
    {
      name: 'Budget efficiency',
      max: 15,
      points: Math.round(
        15 * clamp((mission.budget - result.cost) / mission.budget / 0.25, 0, 1),
      ),
      note: `Spent $${result.cost}M of $${mission.budget}M.`,
    },
    {
      name: 'Resource margins',
      max: 10,
      points: (result.massMargin >= 0.1 ? 5 : 0) + (result.powerMargin >= 0.1 ? 5 : 0),
      note: `Mass margin ${Math.round(result.massMargin * 100)}%, power margin ${Math.round(result.powerMargin * 100)}%.`,
    },
    {
      name: 'Reliability',
      max: 10,
      points: Math.round(10 * clamp((result.reliability - 0.7) / 0.3, 0, 1)),
      note: `Estimated chance of full success: ${Math.round(result.reliability * 100)}%.`,
    },
  ]
  return { parts, total: sum(parts, 'points'), goalMet }
}

// Applies what happened during the flight to the pre-launch result.
// Each outcome may contain: lostInstrumentId, scienceMult, costAdd, budgetAdd.
export function applyOutcomes(result, outcomes) {
  const lost = outcomes.map((o) => o.lostInstrumentId).filter(Boolean)
  const working = result.instruments.filter((i) => !lost.includes(i.id))
  const totalScience = sum(result.instruments, 'science')
  const workingShare = totalScience > 0 ? sum(working, 'science') / totalScience : 0
  const mult = outcomes.reduce((m, o) => m * (o.scienceMult ?? 1), 1)
  const budgetAdd = outcomes.reduce((b, o) => b + (o.budgetAdd ?? 0), 0)
  const costAdd = outcomes.reduce((c, o) => c + (o.costAdd ?? 0), 0)
  return {
    ...result,
    mission: { ...result.mission, budget: result.mission.budget + budgetAdd },
    cost: result.cost + costAdd,
    science: Math.round(result.science * workingShare * mult),
    covered: result.mission.requiredCategories.filter((c) =>
      working.some((i) => i.category === c),
    ),
  }
}
