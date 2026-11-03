'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// Distancia teniendo en cuenta el envolvimiento toroidal
const wrappedDist = (a, b) => {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return Math.hypot(Math.min(dx, W - dx), Math.min(dy, H - dy));
};

// ── Power-up ──────────────────────────────────────────────────────────────────
const SPEED_DURATION = 5;    // segundos
const SPEED_MULT     = 2;    // multiplicador de propulsión y velocidad punta
const SPEED_BAR_W    = 150;  // ancho máximo de la barra del HUD
const SPEED_BAR_H    = 8;    // alto de la barra del HUD
const MAX_SPEED      = 330;  // velocidad punta base (px/s)
const POWERUP_RADIUS = 13;
const POWERUP_TTL    = 12;   // segundos antes de desaparecer
const DROP_CHANCE    = 0.2;  // probabilidad al destruir un asteroide grande/mediano
const MAX_POWERUPS   = 3;

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

// ── Estrella fugaz ────────────────────────────────────────────────────────────
const STAR_TTL   = 8;     // segundos que vive la estrella
const STAR_SPEED = 2.6;   // multiplicador sobre SPEEDS[size]
const STAR_FIRST = 12;    // primera aparición desde el inicio del nivel
const STAR_MIN   = 14;    // espera mínima entre apariciones
const STAR_MAX   = 22;    // espera máxima
const STAR_WARN  = 2.5;   // duración del aviso previo
const STAR_SAFE  = 180;   // distancia mínima de aparición respecto a la nave
const STAR_COLOR = '255,209,102';

class Asteroid {
  constructor(x, y, size = 3, fugaz = false) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.fugaz = fugaz;
    this.ttl  = fugaz ? STAR_TTL : Infinity;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] * (fugaz ? STAR_SPEED : 1) + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = fugaz ? rand(-2.4, 2.4) : rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;

    if (this.fugaz) {
      this.ttl -= dt;
      if (this.ttl <= 0) {
        this.dead = true;
        explode(this.x, this.y, 6, STAR_COLOR);
      }
    }
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    // Cola de la estrella fugaz, en coordenadas de mundo
    if (this.fugaz) {
      const speed = Math.hypot(this.vx, this.vy) || 1;
      ctx.strokeStyle = `rgba(${STAR_COLOR},0.35)`;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(this.x - (this.vx / speed) * 26, this.y - (this.vy / speed) * 26);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
    }

    if (this.fugaz && this.ttl < 1.5 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    if (this.fugaz) ctx.globalAlpha = Math.min(1, Math.max(0, this.ttl / 2));
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = this.fugaz ? '#ffd166' : '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Skins de la nave ─────────────────────────────────────────────────────────
// Formas en coordenadas locales: nariz en +X, simétricas respecto a Y.
// Todas caben en un área similar para no alterar el hitbox de la nave.
const SKIN_KEY = 'asteroids.skin';

const SKINS = [
  {
    nombre: 'CLÁSICA',
    color: '#ffffff',
    boost: '#00e5ff',
    llama: '255,130,0',
    llamaBoost: '0,229,255',
    forma: [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
    detalles: [],
    llamas: [[-8, 0]],
    glow: 0,
    alpha: 1,
    linea: 1.5,
  },
  {
    nombre: 'NEÓN',
    color: '#00e5ff',
    boost: '#aef8ff',
    llama: '0,229,255',
    llamaBoost: '174,248,255',
    forma: [[22, 0], [2, -8], [-12, -11], [-7, 0], [-12, 11], [2, 8]],
    detalles: [[[10, 0], [0, -4], [-6, 0], [0, 4], [10, 0]]],
    llamas: [[-8, 0]],
    glow: 14,
    alpha: 1,
    linea: 1.4,
  },
  {
    nombre: 'CAZA',
    color: '#7cff6b',
    boost: '#d4ffca',
    llama: '124,255,107',
    llamaBoost: '212,255,202',
    forma: [[20, 0], [6, -4], [4, -12], [-2, -12], [-4, -4], [-12, -9], [-10, -2],
            [-16, 0], [-10, 2], [-12, 9], [-4, 4], [-2, 12], [4, 12], [6, 4]],
    detalles: [[[10, 0], [2, 0]], [[4, -10], [0, -4]], [[4, 10], [0, 4]]],
    llamas: [[-7, -6], [-7, 6]],
    glow: 0,
    alpha: 1,
    linea: 1.4,
  },
  {
    nombre: 'FANTASMA',
    color: '#c792ff',
    boost: '#f0e0ff',
    llama: '199,146,255',
    llamaBoost: '240,224,255',
    forma: [[18, 0], [13, -5], [6, -9], [-4, -9], [-12, -5], [-9, 0], [-12, 5], [-4, 9], [6, 9], [13, 5]],
    detalles: [],
    llamas: [[-8, 0]],
    glow: 10,
    alpha: 0.6,
    linea: 1.4,
  },
  {
    nombre: 'HALCÓN',
    color: '#ffd166',
    boost: '#fff0c2',
    llama: '255,160,60',
    llamaBoost: '255,240,194',
    forma: [[22, 0], [7, -3], [-1, -11], [-12, -12], [-8, -4], [-14, 0], [-8, 4], [-12, 12], [-1, 11], [7, 3]],
    detalles: [[[8, 0], [-4, 0]], [[2, -6], [-6, -9]], [[2, 6], [-6, 9]]],
    llamas: [[-9, 0]],
    glow: 0,
    alpha: 1,
    linea: 1.5,
  },
  {
    nombre: 'TRIDENTE',
    color: '#ff6bd6',
    boost: '#ffd6f5',
    llama: '255,107,214',
    llamaBoost: '255,214,245',
    forma: [[24, 0], [10, -4], [12, -11], [4, -11], [2, -4], [-6, -8], [-12, -7],
            [-10, -2], [-16, 0], [-10, 2], [-12, 7], [-6, 8], [2, 4], [4, 11],
            [12, 11], [10, 4]],
    detalles: [[[12, 0], [4, 0]]],
    llamas: [[-9, 0]],
    glow: 8,
    alpha: 1,
    linea: 1.4,
  },
];

function cargarSkin() {
  try {
    const saved = parseInt(localStorage.getItem(SKIN_KEY), 10);
    return Number.isInteger(saved) && saved >= 0 && saved < SKINS.length ? saved : 0;
  } catch (e) {
    return 0;   // almacenamiento no disponible (p. ej. file:// en algunos navegadores)
  }
}

function guardarSkin() {
  try {
    localStorage.setItem(SKIN_KEY, String(skinIndex));
  } catch (e) {
    // sin persistencia: la skin sigue funcionando en memoria
  }
}

let skinIndex = cargarSkin();
let skinTimer = 0;

const currentSkin = () => SKINS[skinIndex];

function cambiarSkin(dir = 1) {
  skinIndex = (skinIndex + dir + SKINS.length) % SKINS.length;
  skinTimer = 2.2;
  guardarSkin();
}

// Dibuja la silueta y los detalles de una skin. El contexto ya debe estar
// trasladado/rotado; la escala se aplica a los vértices para no deformar el trazo.
function dibujarSilueta(skin, escala, color, opciones = {}) {
  const glow  = opciones.glow  ?? false;
  const alpha = opciones.alpha ?? skin.alpha;
  const grosor = opciones.grosor ?? skin.linea;

  ctx.strokeStyle = color;
  ctx.lineWidth   = grosor;
  ctx.lineJoin    = 'round';
  ctx.lineCap     = 'round';
  ctx.globalAlpha = alpha;

  if (glow && skin.glow > 0) {
    ctx.shadowBlur  = skin.glow;
    ctx.shadowColor = color;
  }

  const traza = (puntos) => {
    ctx.beginPath();
    ctx.moveTo(puntos[0][0] * escala, puntos[0][1] * escala);
    for (let i = 1; i < puntos.length; i++)
      ctx.lineTo(puntos[i][0] * escala, puntos[i][1] * escala);
    ctx.closePath();
    ctx.stroke();
  };

  traza(skin.forma);

  for (const linea of skin.detalles) {
    ctx.beginPath();
    ctx.moveTo(linea[0][0] * escala, linea[0][1] * escala);
    for (let i = 1; i < linea.length; i++)
      ctx.lineTo(linea[i][0] * escala, linea[i][1] * escala);
    ctx.stroke();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedTimer    = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedTimer    > 0) this.speedTimer    -= dt;

    const boost  = this.speedTimer > 0 ? SPEED_MULT : 1;
    const ROT    = 3.5;          // rad/s
    const THRUST = 260 * boost;  // px/s²
    const MAX    = MAX_SPEED * boost;
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;

    // Limitar la velocidad para evitar atravesar asteroides con el boost
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > MAX) {
      this.vx *= MAX / speed;
      this.vy *= MAX / speed;
    }

    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin  = currentSkin();
    const boost = this.speedTimer > 0;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    dibujarSilueta(skin, 1, boost ? skin.boost : skin.color, { glow: true });

    // Llama del propulsor (una o varias según la skin)
    if (this.thrusting && Math.random() > 0.35) {
      const llama = boost ? skin.llamaBoost : skin.llama;
      ctx.strokeStyle = `rgba(${llama}, 0.85)`;
      ctx.lineWidth   = 1.5;
      ctx.shadowBlur  = 0;
      ctx.globalAlpha = skin.alpha;
      ctx.beginPath();
      for (const [fx, fy] of skin.llamas) {
        const largo = boost ? rand(10, 20) : rand(6, 14);
        ctx.moveTo(fx, fy - 4);
        ctx.lineTo(fx - largo, fy);
        ctx.lineTo(fx, fy + 4);
      }
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color = '255,255,255') {
    this.x     = x;
    this.y     = y;
    this.color = color;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(${this.color},${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-up (Velocidad) ──────────────────────────────────────────────────────
class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = POWERUP_RADIUS;
    this.ttl    = POWERUP_TTL;
    this.pulse  = 0;
    this.dead   = false;
    this.vx = rand(-22, 22);
    this.vy = rand(-22, 22);
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.pulse += dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo en los últimos segundos
    if (this.ttl < 3 && Math.floor(this.ttl * 8) % 2 === 0) return;

    const s = 1 + Math.sin(this.pulse * 6) * 0.12;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.pulse * 1.5);
    ctx.scale(s, s);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';

    // Rombo exterior
    ctx.beginPath();
    ctx.moveTo(  0, -14);
    ctx.lineTo( 10,   0);
    ctx.lineTo(  0,  14);
    ctx.lineTo(-10,   0);
    ctx.closePath();
    ctx.stroke();

    // Rayo
    ctx.beginPath();
    ctx.moveTo(  2, -8);
    ctx.lineTo( -4,  1);
    ctx.lineTo(  1,  1);
    ctx.lineTo( -2,  8);
    ctx.stroke();

    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerUps;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let starTimer;  // cuenta atrás hasta el siguiente aviso
let starWarn;   // { x, y, t } durante el aviso, o null

function randomSpawnPoint() {
  const SAFE_DIST = 130;
  let x, y;
  do {
    x = rand(0, W);
    y = rand(0, H);
  } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
  return { x, y };
}

function randomStarSpawn() {
  let p;
  do {
    p = randomSpawnPoint();
  } while (wrappedDist(p, ship) < STAR_SAFE);
  return p;
}

function spawnAsteroids(count) {
  for (let i = 0; i < count; i++) {
    const p = randomSpawnPoint();
    asteroids.push(new Asteroid(p.x, p.y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerUps  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  starTimer = STAR_FIRST;
  starWarn  = null;
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerUps  = [];
  ship.reset();
  starTimer = rand(STAR_MIN, STAR_MAX);
  starWarn  = null;
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8, color = '255,255,255') {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
}

function updateStar(dt) {
  // Solo una estrella fugaz a la vez
  if (asteroids.some(a => a.fugaz)) return;

  if (starWarn) {
    starWarn.t -= dt;
    if (starWarn.t <= 0) {
      asteroids.push(new Asteroid(starWarn.x, starWarn.y, 3, true));
      starWarn  = null;
      starTimer = rand(STAR_MIN, STAR_MAX);
    }
    return;
  }

  starTimer -= dt;
  if (starTimer <= 0) {
    const p = randomStarSpawn();
    starWarn = { x: p.x, y: p.y, t: STAR_WARN };
  }
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  ship.speedTimer = 0;
  lives--;
  if (lives <= 0) {
    powerUps = [];
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (skinTimer > 0) skinTimer -= dt;
  if (pressed('KeyS')) cambiarSkin(1);

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    asteroids = asteroids.filter(a => !a.dead);
    powerUps.forEach(p => p.update(dt));
    powerUps = powerUps.filter(p => !p.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  updateStar(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerUps.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerUps  = powerUps.filter(p => !p.dead);

  // Nave vs power-up
  for (const p of powerUps) {
    if (wrappedDist(ship, p) < ship.radius + p.radius) {
      ship.speedTimer = SPEED_DURATION;
      p.dead = true;
      explode(p.x, p.y, 10, '0,229,255');
    }
  }
  powerUps = powerUps.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);

        // Solo los asteroides grandes y medianos pueden soltar el power-up
        if (a.size >= 2 && powerUps.length < MAX_POWERUPS && Math.random() < DROP_CHANCE) {
          const px = Math.max(20, Math.min(W - 20, a.x + rand(-10, 10)));
          const py = Math.max(20, Math.min(H - 20, a.y + rand(-10, 10)));
          powerUps.push(new PowerUp(px, py));
        }

        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Nivel completado (la estrella fugaz no retrasa el avance)
  if (!asteroids.some(a => !a.fugaz)) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin = currentSkin();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  dibujarSilueta(skin, 0.45, skin.color, {
    alpha: Math.max(0.8, skin.alpha),
    grosor: 1.2,
  });
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  if (ship.speedTimer > 0) {
    const x = 14, y = 53;
    const ratio = Math.max(0, Math.min(1, ship.speedTimer / SPEED_DURATION));

    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText('VELOCIDAD x2', 14, 48);

    // Pista de fondo + relleno que decrece
    ctx.fillStyle = 'rgba(0, 229, 255, 0.18)';
    ctx.fillRect(x, y, SPEED_BAR_W, SPEED_BAR_H);
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(x, y, SPEED_BAR_W * ratio, SPEED_BAR_H);
  }

  if (starWarn) {
    ctx.fillStyle = '#ffd166';
    ctx.textAlign = 'center';
    ctx.fillText('¡ESTRELLA FUGAZ!', W / 2, 48);
  }

  // Indicador de skin (se resalta durante unos segundos al cambiarla)
  const skin  = currentSkin();
  const activo = skinTimer > 0;
  ctx.font      = activo ? 'bold 13px monospace' : '12px monospace';
  ctx.fillStyle = activo ? skin.color : 'rgba(255,255,255,0.4)';
  ctx.textAlign = 'left';
  ctx.fillText(`SKIN ${skinIndex + 1}/${SKINS.length}: ${skin.nombre}  [S]`, 14, H - 15);
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function drawStarWarning() {
  if (!starWarn) return;
  if (Math.floor(starWarn.t * 6) % 2 === 0) return;

  const pulse = 18 + Math.sin(starWarn.t * 8) * 5;

  ctx.save();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.arc(starWarn.x, starWarn.y, pulse, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(starWarn.x, starWarn.y, pulse + 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  drawStarWarning();
  asteroids.forEach(a => a.draw());
  powerUps.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
