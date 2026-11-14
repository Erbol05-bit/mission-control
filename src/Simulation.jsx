// The flight: four phases, with events that ask the player to decide.

import { useState } from 'react'
import MissionScene from './MissionScene.jsx'
import { PHASES, pickEvents } from './game/events.js'

function phaseText(phase, r) {
  switch (phase) {
    case 'Launch':
      return `${r.launcher.name} lifts ${r.launchMass} kg off the pad. The limit for ${r.target.name} was ${r.massLimit} kg.`
    case 'Cruise':
      return `The spacecraft is coasting to ${r.target.name}. Solar arrays give ${r.powerGen} W, systems use ${r.powerUse} W.`
    case 'Arrival':
      return `Engine burn to enter a ${r.orbit.name.toLowerCase()} around the target.`
    default:
      return `Instruments collect ${r.dataGen.toFixed(1)} Gb of data per day. The antenna can send ${r.downlink.toFixed(1)} Gb per day to Earth.`
  }
}

export default function Simulation({ result, onFinish }) {
  // Events are chosen once, when the flight starts.
  const [events] = useState(() => pickEvents())
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [log, setLog] = useState([]) // { title, choice, outcome }

  // Events see only the instruments that still work.
  const lost = log.map((entry) => entry.outcome.lostInstrumentId)
  const current = {
    ...result,
    instruments: result.instruments.filter((i) => !lost.includes(i.id)),
  }

  const phase = PHASES[phaseIndex]
  const pending = events.filter(
    (e) =>
      e.phase === phase &&
      !log.some((entry) => entry.id === e.id) &&
      (!e.available || e.available(current)),
  )
  const event = pending[0]
  const lastEntry = log[log.length - 1]

  const choose = (choice) => {
    const outcome = choice.resolve(current, Math.random)
    setLog([...log, { id: event.id, title: event.title, phase, choice: choice.label, outcome }])
  }
  const next = () => {
    if (phaseIndex < PHASES.length - 1) setPhaseIndex(phaseIndex + 1)
    else onFinish(log)
  }

  return (
    <div className="app">
      <header>
        <h1>{result.mission.title}</h1>
        <nav>
          {PHASES.map((name, i) => (
            <span key={name} className={i === phaseIndex ? 'phase active' : i < phaseIndex ? 'phase done' : 'phase'}>
              {i + 1}. {name}
            </span>
          ))}
        </nav>
      </header>

      <MissionScene result={result} mode={phaseIndex < 2 ? 'cruise' : 'orbit'} height={340} />

      <main>
        <p>{phaseText(phase, result)}</p>

        {lastEntry && lastEntry.phase === phase && (
          <div className="outcome">
            <strong>{lastEntry.title}:</strong> {lastEntry.outcome.text}
          </div>
        )}

        {event ? (
          <div className="alert">
            <div className="alert-tag">Mission alert</div>
            <h2>{event.title}</h2>
            <p>{event.describe(current)}</p>
            <div className="choices">
              {event.choices.map((choice) => (
                <button key={choice.label} onClick={() => choose(choice)}>
                  {choice.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button className="primary big" onClick={next}>
            {phaseIndex < PHASES.length - 1 ? `Continue to ${PHASES[phaseIndex + 1]}` : 'See the mission report'}
          </button>
        )}
      </main>
    </div>
  )
}
