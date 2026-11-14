// In-flight events. Each event describes a problem and offers choices.
// The result of a choice depends on the design the player made before launch,
// so good margins and redundancy pay off here.
//
// Events receive the result with only the instruments that still work.
// resolve(result, random) returns an outcome:
//   { text, scienceMult?, costAdd?, budgetAdd?, lostInstrumentId? }

export const PHASES = ['Launch', 'Cruise', 'Arrival', 'Science operations']

const STORM_LOSS = 0.3
const LINK_LOSS = 0.4

// The instrument that produces the most data works hardest and fails first.
const busiest = (r) => [...r.instruments].sort((a, b) => b.data - a.data)[0]

export const EVENTS = [
  {
    id: 'storm',
    phase: 'Cruise',
    title: 'Solar storm',
    describe: (r) =>
      `A solar storm damaged the solar arrays. Power generation dropped by ${STORM_LOSS * 100}%, ` +
      `from ${r.powerGen} W to ${Math.round(r.powerGen * (1 - STORM_LOSS))} W. ` +
      `Your spacecraft needs ${r.powerUse} W.`,
    choices: [
      {
        label: 'Switch off the most power-hungry instrument',
        resolve: (r) => {
          const worst = [...r.instruments].sort((a, b) => b.power - a.power)[0]
          const needed = r.powerGen * (1 - STORM_LOSS) < r.powerUse
          return {
            lostInstrumentId: worst.id,
            text: needed
              ? `${worst.name} was switched off for the rest of the mission. The spacecraft is safe, but that instrument's science is lost.`
              : `${worst.name} was switched off for the rest of the mission, and its science is lost. This was not necessary: your power margin already covered the loss.`,
          }
        },
      },
      {
        label: 'Enter power-saving mode',
        resolve: (r) =>
          r.powerGen * (1 - STORM_LOSS) >= r.powerUse
            ? {
                scienceMult: 0.97,
                text: 'Your power margin was large enough. After a short pause all instruments returned to work.',
              }
            : {
                scienceMult: 0.75,
                text: 'There is not enough power for everything, so instruments now take turns. A quarter of the science is lost.',
              },
      },
      {
        label: 'Keep all systems running',
        resolve: (r, random) => {
          if (r.powerGen * (1 - STORM_LOSS) >= r.powerUse) {
            return {
              text: 'Your power margin absorbed the loss completely. Nothing had to be switched off.',
            }
          }
          return random() < 0.5
            ? {
                scienceMult: 0.4,
                text: 'The batteries drained and the spacecraft shut down for weeks. Most of the observation time is gone.',
              }
            : {
                scienceMult: 0.9,
                text: 'The batteries barely held. You were lucky: only a few observations were skipped.',
              }
        },
      },
    ],
  },
  {
    id: 'budget',
    phase: 'Cruise',
    title: 'Budget cut',
    describe: () =>
      'The agency reduced your funding by $25M while the spacecraft is on its way.',
    choices: [
      {
        label: 'Shorten science operations to save money',
        resolve: () => ({
          budgetAdd: -25,
          costAdd: -15,
          scienceMult: 0.85,
          text: 'You saved $15M on operations, but the instruments work for less time.',
        }),
      },
      {
        label: 'Keep the plan and absorb the cut',
        resolve: (r) => ({
          budgetAdd: -25,
          text:
            r.cost <= r.mission.budget - 25
              ? 'Your unspent reserve covered the cut. The plan is unchanged.'
              : 'You had no reserve left, so the mission is now over budget.',
        }),
      },
    ],
  },
  {
    id: 'safemode',
    phase: 'Arrival',
    title: 'Safe mode before orbit insertion',
    describe: (r) =>
      `The onboard computer rebooted into safe mode a few hours before the engine burn at ${r.target.name}.`,
    choices: [
      {
        label: 'Quick restart and burn on schedule',
        resolve: (r, random) =>
          random() < r.bus.reliability - 0.2
            ? { text: 'The restart worked and the burn went as planned.' }
            : {
                scienceMult: 0.7,
                text: 'The burn started late and the orbit is wrong. Fixing it used fuel that was meant for science operations.',
              },
      },
      {
        label: 'Full diagnosis, burn on the backup window',
        resolve: () => ({
          costAdd: 8,
          text: 'The team found the fault and used the backup window. The delay cost $8M in extra operations.',
        }),
      },
    ],
  },
  {
    id: 'antenna',
    phase: 'Science operations',
    title: 'Antenna pointing fault',
    describe: (r) =>
      `The antenna can no longer track Earth precisely. The data rate fell by ${LINK_LOSS * 100}%. ` +
      `Instruments produce ${r.dataGen.toFixed(1)} Gb/day, the link now carries ${(r.downlink * (1 - LINK_LOSS)).toFixed(1)} Gb/day.`,
    choices: [
      {
        label: 'Buy extra ground station time ($12M)',
        resolve: () => ({
          costAdd: 12,
          text: 'Longer contact sessions make up for the slower link. No data is lost.',
        }),
      },
      {
        label: 'Send less data',
        resolve: (r) => {
          const before = r.dataReturned
          const after = r.dataGen > 0 ? Math.min(1, (r.downlink * (1 - LINK_LOSS)) / r.dataGen) : 1
          return after >= before
            ? { text: 'Your link had spare capacity, so all data still reaches Earth.' }
            : {
                scienceMult: after / before,
                text: `Only ${Math.round(after * 100)}% of the data reaches Earth now. The rest is overwritten on board.`,
              }
        },
      },
    ],
  },
  {
    id: 'instrument',
    phase: 'Science operations',
    title: 'Instrument failure',
    available: (r) => r.instruments.length > 0,
    describe: (r) => `${busiest(r).name} stopped responding to commands.`,
    choices: [
      {
        label: 'Try a recovery using the backup electronics',
        resolve: (r, random) =>
          random() < r.bus.reliability - 0.25
            ? {
                scienceMult: 0.95,
                text: `The backup electronics of the ${r.bus.name.toLowerCase()} brought ${busiest(r).name} back. A few weeks of observations were lost.`,
              }
            : {
                scienceMult: 0.95,
                lostInstrumentId: busiest(r).id,
                text: `The recovery failed. ${busiest(r).name} is lost, and the attempt cost a few weeks of observations.`,
              },
      },
      {
        label: 'Continue without it',
        resolve: (r) => ({
          lostInstrumentId: busiest(r).id,
          text: `${busiest(r).name} is switched off. The other instruments continue without interruption.`,
        }),
      },
    ],
  },
]

// Picks which events happen in this flight, in the order of the phases.
export function pickEvents(count = 3, random = Math.random) {
  const pool = [...EVENTS]
  const picked = []
  while (picked.length < count && pool.length) {
    picked.push(pool.splice(Math.floor(random() * pool.length), 1)[0])
  }
  return picked.sort((a, b) => PHASES.indexOf(a.phase) - PHASES.indexOf(b.phase))
}
