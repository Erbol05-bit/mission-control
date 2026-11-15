# Texts for the project page (spaceappschallenge.org)

Copy each block into the matching field. Replace everything in [brackets].

## 1. High-level summary

Students learn space mission design in separate pieces and mostly in theory, so
the trade-offs between science, mass, power, budget and communications stay
abstract. Mission Control: Beyond Earth is a browser game in which the player
designs a complete mission: chooses a science goal, builds a spacecraft, picks
an orbit and a rocket, then flies the mission and reacts to failures. Every
choice immediately changes the budget, launch mass, power balance and data
return, both in numbers and on a 3D model of the spacecraft. After the flight
the game gives a score out of 100 and explains which decisions led to the
result, then compares the design with a real NASA mission. It needs no
installation and no prior knowledge, so it can be used in a classroom, a space
club or at home.

## 2. Project demo

[Public link to the slide deck or the 30-second video. A video needs English subtitles.]

## 3. Final project link

Code: https://github.com/Erbol05-bit/mission-control
Play in the browser: https://erbol05-bit.github.io/mission-control/

## 4. Project details

**What it does.** The game follows the way a mission is designed in practice:
start from the science need, then define the spacecraft, the orbit and the
launch.

1. Mission. Three scenarios with different difficulty: a lunar south pole
   survey, a Mars surface reconnaissance and an asteroid sample return. Each has
   a budget and measurements that must be made.
2. Spacecraft. The player selects a bus, solar arrays, an antenna and science
   instruments. Each part has mass, power use, cost, data volume and science
   value.
3. Orbit, lifetime and launch vehicle. A lower orbit gives better science but
   needs more fuel and offers less contact time. The rocket must lift the
   spacecraft together with its fuel.
4. Pre-launch review. The game checks mass, power, budget and payload capacity
   and explains every failed check.
5. Flight. Four phases with three random events out of five (solar storm,
   budget cut, safe mode before orbit insertion, antenna fault, instrument
   failure). The player chooses how to respond, and the outcome depends on the
   margins built into the design.
6. Mission report. A score out of 100 across mission goal, science value,
   budget efficiency, resource margins and reliability, a summary by mission
   segment (launch, space, ground, user), the log of in-flight decisions and a
   comparison with a real NASA mission.

**How the model works.** Launch mass is dry mass multiplied by a fuel factor
taken from real missions. Solar power is scaled by the inverse square of the
distance from the Sun. Data return is the antenna rate at that distance
multiplied by daily contact time. Science is reduced when data cannot be sent
home. The model is simplified, and the game says what it simplifies.

**Visual feedback.** A part glows on the 3D model when the player hovers it.
Solar arrays blink red when power is short, the antenna blinks when data is
being lost. In flight the camera moves to the spacecraft during an event; in
the science phase scan cones reach the surface and a beam links the antenna to
Earth.

**Benefits.** Mistakes are free: the player can fail, read why, change the
design and fly again. There is no single correct answer, and different designs
can reach the same goal.

**Tools.** JavaScript, React, Three.js, Vite, GitHub Pages.

**Next steps.** A team mode with four roles, more mission scenarios and
checked source data for every part.

## 5. Use of Artificial Intelligence

The game concept and the design decisions came from the team: the choice of
challenge and scenarios, the game loop, and the visual feedback system (part
highlighting, warning signals on the 3D model, reactions to in-flight events,
the science-phase animation). We used AI tools to carry out those ideas and we
reviewed, tested and directed all of their output.

- Claude (Anthropic): wrote most of the game code from the team's
  instructions (data file, rules engine, interface, 3D scene), the first draft
  of the game data, and drafts of the project texts.
- ChatGPT (OpenAI): used to discuss and structure the game concept.

The 3D spacecraft and planets are built in code from simple shapes. No
AI-generated images, video or audio are used, and no NASA logos, flags or
mission identifiers appear in AI-generated content.

## 6. NASA data and resources

- Design and Develop Science Missions (NASA): the game starts from the science
  goal and reports results by the four mission segments.
- Mission Design Lab (NASA GSFC) and Concept Maturity Levels (NASA JPL): the
  order of design stages and the pre-launch review.
- Build It Yourself: A Learning Game About Telescopes (NASA): comparing the
  player's design with a real mission.
- NASA Mission Viz and GMAT: references for the 3D mission view and orbit options.
- Mission data: fuel fractions and instrument mass and power are taken from
  the Lunar Reconnaissance Orbiter, Mars Reconnaissance Orbiter and OSIRIS-REx
  (see References). Costs, data volumes, science points and rocket capacities
  are game estimates.

## 7. References

NASA resources:

- Design and Develop Science Missions (NASA): https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf
- General Mission Analysis Tool, GMAT (NASA): https://software.nasa.gov/software/GSC-19468-1
- Concept Maturity Levels (NASA JPL): https://dataverse.jpl.nasa.gov/dataset.xhtml?persistentId=hdl:2014/44299
- Mission Design Lab (NASA GSFC): https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/
- NASA Mission Viz: https://nasa.github.io/mission-viz/
- Build It Yourself: A Learning Game About Telescopes (NASA): https://science.nasa.gov/mission/webb/game-build-it-yourself/
- Mars Reconnaissance Orbiter Launch Press Kit (NASA/JPL): https://www.jpl.nasa.gov/news/press_kits/mro-launch-Aug05.pdf
- MRO Science Instruments (NASA): https://science.nasa.gov/mission/mars-reconnaissance-orbiter/science-instruments
- OSIRIS-REx fact sheet (NASA): https://www.nasa.gov/wp-content/uploads/2016/06/osiris_rex_factsheet5-25.pdf

Other sources:

- LRO launch press kit data, as reproduced by Spaceflight Now: https://spaceflightnow.com/atlas/av020/090610lro.html
- MRO Project Overview, JPL 2005 (hosted by ESA): https://sci.esa.int/documents/33745/35957/1567254220760-09_Saunders_MRO.pdf

Software:

- React: https://react.dev
- Three.js: https://threejs.org
- Vite: https://vite.dev

AI tools:

- Claude (Anthropic)
- ChatGPT (OpenAI)
