# Sources and AI use

Keep this file up to date during the hackathon. On Sunday copy it into the
"References" and "AI and NASA data" fields of the project page.

## NASA resources used (from the challenge Resources tab)

| Resource | How the game uses it |
|---|---|
| Design and Develop Science Missions (NASA) | Start from the science goal; launch / space / ground / user segments |
| Mission Design Lab (NASA GSFC) | Stage names, pre-launch review, equipment list in the report |
| Concept Maturity Levels (NASA JPL) | Progression from concept to point design |
| Build It Yourself: A Learning Game About Telescopes (NASA Webb) | Comparing the player's design with a real NASA mission |
| NASA Mission Viz | Reference for the 3D mission view |
| General Mission Analysis Tool, GMAT (NASA) | Reference for orbit options |
| CubeSat 101 (NASA CSLI) | TODO: small spacecraft figures |

## Numbers checked against published mission data

| Game value | Real value | Source |
|---|---|---|
| Moon fuel factor 1.9 | LRO: 1,916 kg at launch, 1,018 kg dry (ratio 1.88) | LRO launch press kit, as reproduced by Spaceflight Now: https://spaceflightnow.com/atlas/av020/090610lro.html |
| Mars fuel factor 2.1 | MRO: 2,180 kg at launch, 1,031 kg dry (ratio 2.11) | NASA MRO launch press kit: https://www.jpl.nasa.gov/news/press_kits/mro-launch-Aug05.pdf |
| Asteroid fuel factor 2.4 | OSIRIS-REx: 2,110 kg fueled, 880 kg dry (ratio 2.40) | NASA OSIRIS-REx fact sheet: https://www.nasa.gov/wp-content/uploads/2016/06/osiris_rex_factsheet5-25.pdf |
| High-resolution camera 65 kg, 60 W | HiRISE: about 65 kg, 60 W | NASA MRO science instruments: https://science.nasa.gov/mission/mars-reconnaissance-orbiter/science-instruments |
| Imaging spectrometer 33 kg, 45 W | CRISM: 32.92 kg, 44.4 to 47.3 W | Same NASA MRO instruments page |
| Radar sounder 15 kg | SHARAD: 15 kg | MRO project overview (JPL, 2005): https://sci.esa.int/documents/33745/35957/1567254220760-09_Saunders_MRO.pdf |
| Laser altimeter 11 kg, 33 W | LOLA: 11.3 kg, 33.4 W | LRO launch press kit (Spaceflight Now link above) |
| Thermal radiometer 11 kg, 25 W | Diviner: 11.0 kg, 24.7 W | LRO launch press kit |
| Neutron detector 26 kg, 12 W | LEND: 25.8 kg, 11.6 W | LRO launch press kit |
| Medium-plus launcher "Atlas V 401 class" | LRO and MRO both launched on Atlas V 401 | LRO and MRO press kits |
| High-gain antenna 100 Mbps at the Moon | LRO Ka-band downlink: 100 Mbps | LRO project overview (NASA GSFC) |
| Solar factor at Mars 0.43 | Inverse square of Mars distance, 1.52 AU | Physics: 1 / 1.52^2 |

## Game estimates (not taken from a source)

These values are simplified for gameplay and should be described as estimates:

- Cost of every part and launcher, and the mission budgets
- Data volume per instrument and science points
- Launcher capacity to each target
- Bus mass, bus power and payload limits
- Antenna data rates at Mars and the asteroid
- Context camera (CTX), radar power, sample arm (TAGSAM) mass and power
- Solar array output and the asteroid solar factor

## Tools and libraries

- React, Vite
- Three.js (3D spacecraft and mission view, built from simple shapes in code)

## Use of AI

The game concept and the design decisions came from the team, including the
visual feedback system. AI tools carried out those ideas under the team's
direction, and all output was reviewed and tested by the team.

- Claude (Anthropic): wrote most of the game code from the team's instructions
  (data file, rules engine, interface, 3D scene) and the first draft of the
  game data and project texts.
- ChatGPT (OpenAI): used to discuss and structure the game concept.
