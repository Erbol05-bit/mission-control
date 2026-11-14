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

## Numbers to verify (src/data/gameData.js)

Each value is an approximation based on the real hardware named in `basedOn`.
Find the NASA page, correct the value if needed, and paste the link here.

| Item | Based on | NASA source link | Checked |
|---|---|---|---|
| Moon fuel factor 1.9 | LRO launch mass / dry mass | | no |
| Mars fuel factor 2.1 | MRO launch mass / dry mass | | no |
| Asteroid fuel factor 2.4 | OSIRIS-REx launch mass / dry mass | | no |
| High-resolution camera | HiRISE (MRO) | | no |
| Context camera | CTX (MRO) | | no |
| Imaging spectrometer | CRISM (MRO) | | no |
| Radar sounder | SHARAD (MRO) | | no |
| Laser altimeter | LOLA (LRO) | | no |
| Thermal radiometer | Diviner (LRO) | | no |
| Neutron detector | LEND (LRO) | | no |
| Sample collection arm | TAGSAM (OSIRIS-REx) | | no |
| Launchers | Minotaur V, Falcon 9, Atlas V 401, Falcon Heavy | | no |
| Solar factor at Mars 0.43 | Inverse square of 1.52 AU | | no |

## Tools and libraries

- React, Vite
- Three.js (3D spacecraft and mission view, built from simple shapes in code)

## Use of AI

- Claude (Anthropic): generated the initial game code (data file, rules engine,
  interface) and the first draft of the game data from prompts by the team.
- ChatGPT (OpenAI): brainstorming of the game concept and stages.
- All AI output was reviewed, tested and edited by the team.
