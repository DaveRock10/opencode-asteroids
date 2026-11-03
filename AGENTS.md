# AGENTS.md

## What this is

Vanilla ES6 Asteroids clone: three static files, no build, no dependencies, no test/lint/typecheck tooling, no `package.json`.

- `index.html` — page shell, canvas `800x600`, inline CSS, loads `game.js` with a classic `<script>` tag
- `game.js` — the entire game (~700 lines): input, entities, state machine, update/draw, `requestAnimationFrame` loop
- `favicon.svg` — static icon

## Running and verifying

- Open `index.html` directly, or serve it: `npx serve .` (README) then visit `http://localhost:3000`.
- `python3 -m http.server 3000` also works. `node` is not reliably on PATH in this environment.
- No automated verification exists. After changes, manually check: ship rotates/thrusts/shoots, asteroids split and score (large 20 → medium 50 → small 100), ship death costs a life and respawns, clearing all asteroids advances the level, and Game Over + Space restart works. Also check that large/medium asteroids can drop the Velocidad power-up (doubles thrust/top speed for 5 seconds) and the Triple Disparo power-up (3-bullet fan for 5 seconds), that both can be active at once, and that each HUD countdown expires correctly.
- Avoid refactoring into modules/bundler unless asked; the no-toolchain setup is intentional.

## Code conventions and gotchas

- Language is Spanish: comments, HUD text, overlays, and README are Spanish. Keep new user-facing strings Spanish.
- `game.js` is a plain global script (no imports/exports). Entry point is the bottom: `initGame(); requestAnimationFrame(loop);`.
- Canvas size is duplicated: `<canvas width height>` in `index.html` and `W = 800` / `H = 600` in `game.js`. Change both together.
- Space is toroidal. Entity positions must pass through `wrap(value, max)` each frame. Note `dist()` does **not** account for wrapping, so collision checks near an edge use non-shortest distances.
- Input: `keys[e.code]` for held keys; `pressed(code)` is edge-triggered and consumes the `justPressed` flag, so call it at most once per frame for a given key.
- Game state machine values: `'playing' | 'dead' | 'gameover'`. `update()` branches on `state`; `'dead'` freezes the ship but keeps asteroids/particles moving.
- Asteroid size indices are `3` = large, `2` = medium, `1` = small; index `0` is an unused placeholder in `RADII`, `SPEEDS`, `POINTS`. Split stops at size 1.
- Timestep `dt` is in seconds and clamped to `0.05` in `loop()`; all velocities/cooldowns use per-second units.
- README documents the implemented features; trust `game.js` for behavior details.
- Power-ups (`PowerUp`) drop only from large/medium asteroids and are collected with `wrappedDist()`, which accounts for toroidal wrapping; use it for edge-safe pickup checks. `PowerUp.type` is `'speed'` or `'triple'`, each with its own independent drop roll and timer on the ship (`speedTimer` / `tripleTimer`).

## Git

- Single-branch (`main`) tiny repo; no CI, hooks, formatter, or pre-commit config. Commit messages are short and lowercase (e.g. `first commit`).
