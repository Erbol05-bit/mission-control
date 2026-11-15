import { useState } from 'react'
import './App.css'
import {
  MISSIONS, BUSES, POWER_SYSTEMS, ANTENNAS, INSTRUMENTS, LAUNCHERS, ORBITS, LIFETIMES,
} from './data/gameData.js'
import { emptyDesign, evaluate, score, applyOutcomes } from './game/engine.js'
import MissionScene from './MissionScene.jsx'
import Simulation from './Simulation.jsx'

const STEPS = ['Mission', 'Spacecraft', 'Launch & Orbit', 'Review']

export default function App() {
  const [design, setDesign] = useState(emptyDesign())
  const [step, setStep] = useState(0)
  const [started, setStarted] = useState(false)
  const [flying, setFlying] = useState(false)
  const [report, setReport] = useState(null) // event log of the finished flight

  const result = evaluate(design)
  const set = (patch) => setDesign({ ...design, ...patch })
  const restart = () => {
    setDesign(emptyDesign())
    setStep(0)
    setReport(null)
  }

  if (!started) return <StartScreen onStart={() => setStarted(true)} />
  if (flying) {
    return (
      <Simulation
        result={result}
        onFinish={(log) => {
          setFlying(false)
          setReport(log)
        }}
      />
    )
  }
  if (report) {
    return (
      <Report result={result} log={report} onRetry={() => setReport(null)} onRestart={restart} />
    )
  }

  return (
    <div className="app">
      <header>
        <h1>Mission Control: Beyond Earth</h1>
        <nav>
          {STEPS.map((name, i) => (
            <button
              key={name}
              className={i === step ? 'tab active' : 'tab'}
              disabled={i > 0 && !result}
              onClick={() => setStep(i)}
            >
              {i + 1}. {name}
            </button>
          ))}
        </nav>
      </header>

      {result && <ResourcePanel result={result} />}

      <main>
        {step === 0 && (
          <MissionStep
            design={design}
            onPick={(id) => {
              setDesign({ ...emptyDesign(), missionId: id })
              setStep(1)
            }}
          />
        )}
        {step === 1 && result && <SpacecraftStep design={design} result={result} set={set} />}
        {step === 2 && result && <LaunchStep design={design} result={result} set={set} />}
        {step === 3 && result && (
          <ReviewStep result={result} onLaunch={() => setFlying(true)} />
        )}
      </main>

      {result && (
        <footer>
          <button disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
          {step < 3 && <button className="primary" onClick={() => setStep(step + 1)}>Next</button>}
        </footer>
      )}
    </div>
  )
}

function StartScreen({ onStart }) {
  return (
    <div className="app start">
      <h1>Mission Control: Beyond Earth</h1>
      <p className="lead">
        Design a space mission the way NASA teams do: start from a science goal, then balance
        budget, mass, power and data to make it fly.
      </p>
      <ol className="steps">
        <li>
          <strong>Choose a mission.</strong> The science goal decides which instruments you need.
        </li>
        <li>
          <strong>Build the spacecraft.</strong> Every part adds capability, and also mass, power
          use and cost.
        </li>
        <li>
          <strong>Pick an orbit and a rocket.</strong> The rocket must lift the spacecraft and its
          fuel.
        </li>
        <li>
          <strong>Fly it.</strong> Things go wrong in space. The margins you designed in decide
          what you can survive.
        </li>
        <li>
          <strong>Read the report.</strong> See why the mission succeeded or failed, then improve
          the design and fly again.
        </li>
      </ol>
      <p className="hint">There is no single right answer. Different designs can reach the same goal.</p>
      <button className="primary big" onClick={onStart}>Start mission design</button>
    </div>
  )
}

function Bar({ label, value, limit, unit, lowerIsBetter = true, pending }) {
  // "pending" means the limit is not known yet, e.g. no rocket chosen.
  if (pending) {
    return (
      <div className="bar">
        <div className="bar-label">{label}</div>
        <div className="bar-value">
          {value} {unit} <span className="pending">({pending})</span>
        </div>
        <div className="bar-track" />
      </div>
    )
  }
  const over = lowerIsBetter ? value > limit : value < limit
  const fill = limit > 0 ? Math.min(100, (value / limit) * 100) : 0
  return (
    <div className={over ? 'bar over' : 'bar'}>
      <div className="bar-label">{label}</div>
      <div className="bar-value">
        {value} / {limit} {unit}
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${fill}%` }} />
      </div>
    </div>
  )
}

function ResourcePanel({ result }) {
  const r = result
  return (
    <section className="resources">
      <Bar label="Budget" value={r.cost} limit={r.mission.budget} unit="$M" />
      <Bar
        label="Launch mass"
        value={r.launchMass}
        limit={r.massLimit}
        unit="kg"
        pending={r.launcher ? null : 'no rocket yet'}
      />
      <Bar
        label="Power use"
        value={r.powerUse}
        limit={r.powerGen}
        unit="W"
        pending={r.powerSys ? null : 'no power yet'}
      />
      <Bar
        label="Data sent home"
        value={Number(Math.min(r.downlink, r.dataGen).toFixed(1))}
        limit={Number(r.dataGen.toFixed(1))}
        unit="Gb/day"
        lowerIsBetter={false}
      />
      <Bar
        label="Science"
        value={r.science}
        limit={r.mission.minScience}
        unit="pts"
        lowerIsBetter={false}
      />
    </section>
  )
}

function Card({ selected, disabled, onClick, onHover, title, lines, note }) {
  return (
    <button
      className={selected ? 'card selected' : 'card'}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      onFocus={() => onHover?.(true)}
      onBlur={() => onHover?.(false)}
    >
      <strong>{title}</strong>
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
      {note && <em>{note}</em>}
    </button>
  )
}

function MissionStep({ design, onPick }) {
  return (
    <>
      <h2>Choose your mission</h2>
      <p className="hint">
        Start from the science goal: it decides which instruments you must carry.
      </p>
      <div className="grid">
        {MISSIONS.map((m) => (
          <Card
            key={m.id}
            selected={design.missionId === m.id}
            onClick={() => onPick(m.id)}
            title={m.title}
            lines={[
              `Difficulty: ${m.difficulty}`,
              m.brief,
              `Budget: $${m.budget}M`,
              `Must measure: ${m.requiredCategories.join(', ')}`,
            ]}
          />
        ))}
      </div>
    </>
  )
}

function SpacecraftStep({ design, result, set }) {
  const target = result.mission.target
  const toggle = (id) =>
    set({
      instrumentIds: design.instrumentIds.includes(id)
        ? design.instrumentIds.filter((x) => x !== id)
        : [...design.instrumentIds, id],
    })
  // Hovering a card makes its part glow on the 3D model.
  const [highlight, setHighlight] = useState(null)
  const hover = (part) => (inside) => setHighlight(inside ? part : null)
  const problems = result.checks.filter((c) => !c.ok && c.id !== 'parts')
  return (
    <div className="builder">
      <aside className="builder-view">
        <MissionScene result={result} mode="preview" height={340} highlight={highlight} />
        <p className="hint">
          Hover a part to find it on the model. A part that blinks red or orange has a problem.
        </p>
        {problems.map((c) => (
          <p key={c.id} className="problem">Failed check: {c.label}</p>
        ))}
        {result.warnings.map((w) => (
          <p key={w} className="problem soft">{w}</p>
        ))}
      </aside>
      <div className="builder-list">
      <h2>Spacecraft bus</h2>
      <div className="grid">
        {BUSES.map((b) => (
          <Card
            key={b.id}
            selected={design.busId === b.id}
            onClick={() => set({ busId: b.id })}
            onHover={hover('bus')}
            title={b.name}
            lines={[
              `${b.dryMass} kg · ${b.basePower} W · $${b.cost}M`,
              `Carries up to ${b.payloadLimit} kg of instruments`,
            ]}
            note={b.note}
          />
        ))}
      </div>

      <h2>Power</h2>
      <p className="hint">
        At {result.target.name} solar arrays give {Math.round(result.target.solarFactor * 100)}% of
        their output near Earth.
      </p>
      <div className="grid">
        {POWER_SYSTEMS.map((p) => (
          <Card
            key={p.id}
            selected={design.powerId === p.id}
            onClick={() => set({ powerId: p.id })}
            onHover={hover('power')}
            title={p.name}
            lines={[
              `${Math.round(p.power * result.target.solarFactor)} W here`,
              `${p.mass} kg · $${p.cost}M`,
            ]}
          />
        ))}
      </div>

      <h2>Communications</h2>
      <div className="grid">
        {ANTENNAS.map((a) => (
          <Card
            key={a.id}
            selected={design.antennaId === a.id}
            onClick={() => set({ antennaId: a.id })}
            onHover={hover('antenna')}
            title={a.name}
            lines={[`${a.rate[target]} Mbps from here`, `${a.mass} kg · ${a.power} W · $${a.cost}M`]}
          />
        ))}
      </div>

      <h2>Science instruments</h2>
      <p className="hint">
        Every instrument adds science, but also mass, power, cost and data to send home.
      </p>
      <div className="grid">
        {INSTRUMENTS.filter((i) => !i.onlyFor || i.onlyFor.includes(target)).map((i) => (
          <Card
            key={i.id}
            selected={design.instrumentIds.includes(i.id)}
            onClick={() => toggle(i.id)}
            onHover={hover(`inst:${i.id}`)}
            title={i.name}
            lines={[
              `Measures: ${i.category}`,
              `${i.mass} kg · ${i.power} W · $${i.cost}M`,
              `${i.data} Gb/day · +${i.science} science`,
            ]}
            note={`Based on ${i.basedOn}`}
          />
        ))}
      </div>
      </div>
    </div>
  )
}

function LaunchStep({ design, result, set }) {
  const target = result.mission.target
  return (
    <>
      <h2>Orbit</h2>
      <div className="grid">
        {ORBITS.map((o) => (
          <Card
            key={o.id}
            selected={design.orbitId === o.id}
            onClick={() => set({ orbitId: o.id })}
            title={o.name}
            lines={[`Science x${o.scienceMult}`, `${o.contactHours} h of contact per day`]}
            note={o.note}
          />
        ))}
      </div>

      <h2>Mission lifetime</h2>
      <div className="grid">
        {LIFETIMES.map((l) => (
          <Card
            key={l.years}
            selected={design.years === l.years}
            onClick={() => set({ years: l.years })}
            title={`${l.years} year${l.years > 1 ? 's' : ''}`}
            lines={[`Science x${l.scienceMult}`, `Reliability x${l.reliabilityMult}`]}
            note="Longer missions return more science but cost more to operate and wear out."
          />
        ))}
      </div>

      <h2>Launch vehicle</h2>
      <p className="hint">Your spacecraft weighs {result.launchMass} kg with fuel.</p>
      <div className="grid">
        {LAUNCHERS.map((l) => (
          <Card
            key={l.id}
            selected={design.launcherId === l.id}
            disabled={l.capacity[target] === 0}
            onClick={() => set({ launcherId: l.id })}
            title={l.name}
            lines={[
              l.capacity[target] > 0
                ? `Lifts ${l.capacity[target]} kg to ${result.target.name}`
                : `Cannot reach ${result.target.name}`,
              `$${l.cost}M`,
            ]}
            note={l.basedOn}
          />
        ))}
      </div>
    </>
  )
}

function ReviewStep({ result, onLaunch }) {
  return (
    <>
      <MissionScene result={result} mode="preview" />
      <h2>Pre-launch review</h2>
      <ul className="checks">
        {result.checks.map((c) => (
          <li key={c.id} className={c.ok ? 'ok' : 'fail'}>
            <strong>{c.ok ? 'PASS' : 'FAIL'}</strong> {c.label}
            {!c.ok && <p>{c.why}</p>}
          </li>
        ))}
      </ul>
      {result.warnings.map((w) => (
        <p key={w} className="warning">Warning: {w}</p>
      ))}
      <button className="primary big" disabled={!result.canLaunch} onClick={onLaunch}>
        {result.canLaunch ? 'Launch mission' : 'Fix the failed checks to launch'}
      </button>
    </>
  )
}

function Report({ result, log, onRetry, onRestart }) {
  const planned = result
  result = applyOutcomes(planned, log.map((entry) => entry.outcome))
  const s = score(result)
  return (
    <div className="app">
      <header>
        <h1>Mission Report</h1>
      </header>
      <main>
        <h2>
          {result.mission.title}: {s.total} / 100
        </h2>
        <p className={s.goalMet ? 'ok' : 'fail'}>
          {s.goalMet ? 'Mission goal achieved.' : 'Mission goal not achieved.'}
        </p>
        <table>
          <tbody>
            {s.parts.map((p) => (
              <tr key={p.name}>
                <td>{p.name}</td>
                <td>
                  {p.points} / {p.max}
                </td>
                <td>{p.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="hint">
          Planned science before launch: {planned.science} points. After the flight: {result.science}.
        </p>

        <h2>Mission segments</h2>
        <table>
          <tbody>
            <tr>
              <td>Launch</td>
              <td>
                {planned.launcher.name} lifted {planned.launchMass} kg of a possible{' '}
                {planned.massLimit} kg.
              </td>
            </tr>
            <tr>
              <td>Space</td>
              <td>
                {planned.bus.name} with {planned.instruments.map((i) => i.name).join(', ')} in a{' '}
                {planned.orbit.name.toLowerCase()} for {planned.design.years} year
                {planned.design.years > 1 ? 's' : ''}.
              </td>
            </tr>
            <tr>
              <td>Ground</td>
              <td>
                {planned.antenna.name}: {planned.orbit.contactHours} h of contact per day. The link
                can carry {planned.downlink.toFixed(1)} Gb/day; the instruments produce{' '}
                {planned.dataGen.toFixed(1)} Gb/day.
              </td>
            </tr>
            <tr>
              <td>User</td>
              <td>
                Scientists received {result.science} science points; the goal was{' '}
                {result.mission.minScience}.
              </td>
            </tr>
          </tbody>
        </table>

        <h2>What happened in flight</h2>
        {log.map((entry) => (
          <div key={entry.id} className="outcome">
            <strong>
              {entry.phase}: {entry.title}
            </strong>
            <br />
            You chose: {entry.choice}.
            <br />
            {entry.outcome.text}
          </div>
        ))}

        <h2>Design notes</h2>
        {planned.warnings.length === 0 && <p className="hint">No design warnings before launch.</p>}
        {planned.warnings.map((w) => (
          <p key={w} className="warning">{w}</p>
        ))}

        <h2>The real mission</h2>
        <p>
          Your design is in the same family as <strong>{result.mission.realMission.name}</strong>.{' '}
          {result.mission.realMission.fact}
        </p>
      </main>
      <footer>
        <button onClick={onRetry}>Change the design</button>
        <button className="primary" onClick={onRestart}>New mission</button>
      </footer>
    </div>
  )
}
