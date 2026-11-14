# Mission Control: Beyond Earth

An interactive space mission design game for the NASA Space Apps Challenge 2026.

The player picks a science goal, builds a spacecraft, chooses an orbit and a
rocket within limits on budget, mass, power and data, then flies the mission,
reacts to in-flight events and gets a report explaining the result.

## Run

Requires Node.js 20 or newer.

    npm install
    npm run dev

## Where things are

- `src/data/gameData.js`: all numbers (missions, instruments, rockets, orbits)
- `src/game/engine.js`: rules (resources, pre-launch checks, score)
- `src/game/events.js`: in-flight events and their choices
- `src/App.jsx`: design screens and the mission report
- `src/Simulation.jsx`: the flight
- `src/MissionScene.jsx`: the 3D view (Three.js)
- `SOURCES.md`: NASA resources, references and use of AI
