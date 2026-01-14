// Game canvas and player setup
const gameCanvas = document.getElementById('gameCanvas');
const player = document.createElement('div');
player.className = 'player';
gameCanvas.appendChild(player);

// UI elements
const upgradeBtn = document.getElementById('upgradeBtn');
const upgradeModal = document.getElementById('upgradeModal');
const closeModal = document.getElementById('closeModal');
const elementCards = document.querySelectorAll('.element-card');
const healthBarFill = document.getElementById('healthBarFill');
const healthBarText = document.getElementById('healthBarText');
const killCounterEl = document.getElementById('killCounter');

// Player position
let playerPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
player.style.left = playerPos.x + 'px';
player.style.top = playerPos.y + 'px';

// Input state
let keysPressed = { w: false, a: false, s: false, d: false };
let mousePos = { x: 0, y: 0 };

// Game state arrays
let enemies = [];
let projectiles = [];
let waterWaves = [];
let earthquakes = [];
let steamCircles = [];
let freezeCircles = [];
let lifeTriangles = [];
let trees = [];
let lifeTrails = [];
let boilCircles = [];
let statusEffects = [];

// Game constants
const PLAYER_SPEED = 5;
const PROJECTILE_SPEED = 8;
const ENEMY_SPEED = 2;
const ENEMY_SPAWN_INTERVAL = 2000;
const RAMMING_ENEMY_SPAWN_INTERVAL = 5000;
const PROJECTILE_DAMAGE = 10;
const ENEMY_DAMAGE = 10;
const WATER_WAVE_DAMAGE = 5;
const EARTHQUAKE_DAMAGE = 8;
const SWORD_DAMAGE = 15;
const SHIELD_DAMAGE = 5;
const STEAM_DAMAGE = 12;
const FREEZE_DAMAGE = 8;
const LIFE_TRIANGLE_DAMAGE = 6;
const BLAZE_DAMAGE = 4;
const MUD_DAMAGE = 14;
const FLAME_DAMAGE = 18;
const BOIL_DAMAGE = 10;
const TSUNAMI_DAMAGE = 20;
const ENEMY_HEALTH = 30;
const RAMMING_ENEMY_HEALTH = 50;
const HEALTH_REGEN_INTERVAL = 3000;
const HEALTH_REGEN_AMOUNT = 5;
const INVINCIBILITY_DURATION = 1000;
const BOIL_CIRCLE_SPAWN_INTERVAL = 4000;
const BOSS_HEALTH = 2000;
const BOSS_SPAWN_KILL_COUNT = 50;

// Player stats
let playerHealth = 100;
let maxPlayerHealth = 100;
let enemySpawnTimer = 0;
let rammingEnemySpawnTimer = 0;
let lastHealthRegenTime = Date.now();
let isInvincible = false;
let invincibilityTimer = null;
let killCount = 0;
let boilCircleSpawnTimer = 0;
let bossActive = false;
let boss = null;

// Element system
let playerElements = [];
let rotatingShieldActive = false;
let rotatingShieldAngle = 0;
let swordActive = false;
let swordAngle = 0;
let tideAuraActive = false;
let tsunamiPlacedWave = null;
let lastTrailTime = 0;

// Ability configurations
const abilityConfigs = {
  fire: { mouseButton: 'left', cooldown: 200, lastUsed: 0 },
  earth: { mouseButton: 'left', cooldown: 500, lastUsed: 0 },
  water: { mouseButton: 'left', cooldown: 300, lastUsed: 0 },
  air: { mouseButton: 'left', cooldown: 100, lastUsed: 0 },
  blaze: { mouseButton: 'right', cooldown: 400, lastUsed: 0 },
  mud: { mouseButton: 'right', cooldown: 600, lastUsed: 0 },
  steam: { mouseButton: 'right', cooldown: 800, lastUsed: 0 },
  freeze: { mouseButton: 'right', cooldown: 700, lastUsed: 0 },
  flame: { mouseButton: 'right', cooldown: 0, lastUsed: 0, isCharging: false, chargeStartTime: 0 },
  life: { mouseButton: 'right', cooldown: 1000, lastUsed: 0 },
  boil: { mouseButton: 'right', cooldown: 500, lastUsed: 0 },
  tsunami: { mouseButton: 'right', cooldown: 10000, lastUsed: 0 }
};

// Event listeners
document.addEventListener('mousemove', (e) => {
  mousePos.x = e.clientX;
  mousePos.y = e.clientY;
});

document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
    keysPressed[key] = true;
  }
});

document.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
    keysPressed[key] = false;
  }
});

document.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    const ability = getAbilityForMouseButton('left');
    if (ability) {
      castAbility(ability);
    }
  } else if (e.button === 2) {
    e.preventDefault();
    const ability = getAbilityForMouseButton('right');
    if (ability) {
      castAbility(ability);
    }
  }
});

document.addEventListener('mouseup', (e) => {
  if (e.button === 2) {
    stopCharging();
  }
});

document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

upgradeBtn.addEventListener('click', () => {
  upgradeModal.classList.add('active');
});

closeModal.addEventListener('click', () => {
  upgradeModal.classList.remove('active');
});

elementCards.forEach((card) => {
  card.addEventListener('click', () => {
    const element = card.dataset.element;
    unlockElement(element);
    upgradeModal.classList.remove('active');
  });
});

// Element system functions
function unlockElement(element) {
  if (playerElements.includes(element)) return;

  playerElements.push(element);

  if (element === 'fire') {
    maxPlayerHealth += 20;
  }
  if (element === 'earth') {
    maxPlayerHealth += 30;
    activateRotatingShield();
  }
  if (element === 'water') {
    maxPlayerHealth += 25;
  }
  if (element === 'air') {
    maxPlayerHealth += 15;
    activateSword();
  }

  playerHealth = Math.min(playerHealth + 50, maxPlayerHealth);
  updateHealthBar();

  const combinations = ['blaze', 'mud', 'steam', 'freeze', 'flame', 'life', 'boil', 'tsunami'];
  for (let combo of combinations) {
    if (hasRequiredElements(combo) && !playerElements.includes(combo)) {
      playerElements.push(combo);
      if (combo === 'tsunami') {
        activateTideAura();
      }
    }
  }

  console.log('Unlocked:', element, '| Current elements:', playerElements);
}

function hasRequiredElements(combination) {
  const requirements = {
    blaze: ['fire', 'air'],
    mud: ['earth', 'water'],
    steam: ['fire', 'water'],
    freeze: ['water', 'air'],
    flame: ['fire', 'earth'],
    life: ['earth', 'air'],
    boil: ['fire', 'water', 'steam'],
    tsunami: ['water', 'air', 'freeze']
  };

  if (!requirements[combination]) return false;
  return requirements[combination].every((req) => playerElements.includes(req));
}

function getAbilityForMouseButton(button) {
  if (button === 'right') {
    if (playerElements.includes('tsunami')) return 'tsunami';
    if (playerElements.includes('boil')) return 'boil';
    if (playerElements.includes('life')) return 'life';
    if (playerElements.includes('flame')) return 'flame';
    if (playerElements.includes('freeze')) return 'freeze';
    if (playerElements.includes('steam')) return 'steam';
    if (playerElements.includes('mud')) return 'mud';
    if (playerElements.includes('blaze')) return 'blaze';
  }

  if (button === 'left') {
    if (playerElements.includes('fire')) return 'fire';
    if (playerElements.includes('earth')) return 'earth';
    if (playerElements.includes('water')) return 'water';
    if (playerElements.includes('air')) return 'air';
  }
  return null;
}

function castAbility(ability) {
  if (!abilityConfigs[ability]) return;

  const config = abilityConfigs[ability];
  const now = Date.now();
  if (now - config.lastUsed < config.cooldown) return;

  if (ability === 'flame') {
    startCharging();
    return;
  }

  if (ability === 'earth') {
    castEarthAbility();
  } else if (ability === 'water') {
    castWaterAbility();
  } else if (ability === 'air') {
    // Air uses sword, no projectile
  } else if (ability === 'blaze') {
    castBlazeAbility();
  } else if (ability === 'mud') {
    castMudAbility();
  } else if (ability === 'steam') {
    castSteamAbility();
  } else if (ability === 'freeze') {
    castFreezeAbility();
  } else if (ability === 'life') {
    castLifeAbility();
  } else if (ability === 'boil') {
    castBoilAbility();
  } else if (ability === 'tsunami') {
    castTsunamiAbility();
  } else {
    shootProjectile(ability);
  }

  config.lastUsed = now;
}

function shootProjectile(type) {
  const angle = Math.atan2(mousePos.y - playerPos.y, mousePos.x - playerPos.x);

  let damage = PROJECTILE_DAMAGE;
  let speed = PROJECTILE_SPEED;
  let size = 16;
  let lifetime = 3000;
  let cssClass = 'projectile ' + type + '-projectile';

  if (type === 'blaze') {
    damage = BLAZE_DAMAGE;
    size = 20;
  } else if (type === 'mud') {
    damage = MUD_DAMAGE;
    size = 24;
  } else if (type === 'boil') {
    damage = BOIL_DAMAGE;
    size = 20;
  } else if (type === 'tsunami') {
    damage = TSUNAMI_DAMAGE;
    size = 28;
    speed = 10;
  }

  const proj = {
    x: playerPos.x,
    y: playerPos.y,
    direction: angle,
    speed: speed,
    damage: damage,
    size: size,
    lifetime: lifetime,
    elementType: type,
    isEnemyProjectile: false,
    createdAt: Date.now()
  };
  projectiles.push(proj);

  const projEl = document.createElement('div');
  projEl.className = cssClass;
  projEl.style.width = size + 'px';
  projEl.style.height = size + 'px';
  projEl.style.left = proj.x + 'px';
  projEl.style.top = proj.y + 'px';
  proj.domElement = projEl;
  gameCanvas.appendChild(projEl);
}

// Flame ability (charged)
function startCharging() {
  const config = abilityConfigs['flame'];
  if (config.isCharging) return;

  config.isCharging = true;
  config.chargeStartTime = Date.now();
}

function stopCharging() {
  const config = abilityConfigs['flame'];
  if (!config.isCharging) return;

  config.isCharging = false;

  const now = Date.now();
  const chargeDuration = now - config.chargeStartTime;
  const maxCharge = 2000;

  let chargeRatio = Math.min(chargeDuration / maxCharge, 1);
  let damage = FLAME_DAMAGE * (1 + chargeRatio * 2);
  let explosionRadius = 40 + chargeRatio * 80;

  castFlameAbility(damage, explosionRadius);
  config.lastUsed = now;
}

function castFlameAbility(damage, explosionRadius) {
  const angle = Math.atan2(mousePos.y - playerPos.y, mousePos.x - playerPos.x);

  const proj = {
    x: playerPos.x,
    y: playerPos.y,
    direction: angle,
    speed: PROJECTILE_SPEED,
    damage: damage,
    size: 20,
    lifetime: 3000,
    elementType: 'flame',
    isEnemyProjectile: false,
    createdAt: Date.now(),
    isFlameCharged: true,
    flameExplosionRadius: explosionRadius,
    flameExplosionDamage: damage
  };
  projectiles.push(proj);

  const projEl = document.createElement('div');
  projEl.className = 'projectile flame-projectile';
  projEl.style.width = '20px';
  projEl.style.height = '20px';
  projEl.style.left = proj.x + 'px';
  projEl.style.top = proj.y + 'px';
  proj.domElement = projEl;
  gameCanvas.appendChild(projEl);
}

function spawnFlameExplosion(x, y, radius, damage) {
  enemies.forEach((enemy) => {
    if (enemy.dying) return;

    const distance = Math.sqrt((enemy.x - x) ** 2 + (enemy.y - y) ** 2);
    if (distance <= radius) {
      damageEnemy(enemy, damage, null);
    }
  });

  if (boss && !boss.dying) {
    const distance = Math.sqrt((boss.x - x) ** 2 + (boss.y - y) ** 2);
    if (distance <= radius) {
      damageBoss(damage);
    }
  }
}

// Earth ability
function castEarthAbility() {
  const angle = Math.atan2(mousePos.y - playerPos.y, mousePos.x - playerPos.x);
  const earthquakeRadius = 150;

  const earthquake = {
    x: playerPos.x + Math.cos(angle) * 50,
    y: playerPos.y + Math.sin(angle) * 50,
    radius: earthquakeRadius,
    damage: EARTHQUAKE_DAMAGE,
    createdAt: Date.now()
  };
  earthquakes.push(earthquake);

  const earthquakeEl = document.createElement('div');
  earthquakeEl.className = 'earthquake-circle';
  earthquakeEl.style.width = earthquakeRadius * 2 + 'px';
  earthquakeEl.style.height = earthquakeRadius * 2 + 'px';
  earthquakeEl.style.left = earthquake.x + 'px';
  earthquakeEl.style.top = earthquake.y + 'px';
  gameCanvas.appendChild(earthquakeEl);

  enemies.forEach((enemy) => {
    if (enemy.dying) return;

    const distance = Math.sqrt((enemy.x - earthquake.x) ** 2 + (enemy.y - earthquake.y) ** 2);
    if (distance <= earthquakeRadius) {
      damageEnemy(enemy, earthquake.damage, null);
    }
  });

  if (boss && !boss.dying) {
    const distance = Math.sqrt((boss.x - earthquake.x) ** 2 + (boss.y - earthquake.y) ** 2);
    if (distance <= earthquakeRadius) {
      damageBoss(earthquake.damage);
    }
  }

  setTimeout(() => {
    earthquakeEl.remove();
    earthquakes = earthquakes.filter((e) => e !== earthquake);
  }, 1500);
}

// Water ability
function castWaterAbility() {
  const angle = Math.atan2(mousePos.y - playerPos.y, mousePos.x - playerPos.x);
  const waveRadius = 100;

  const wave = {
    x: playerPos.x + Math.cos(angle) * 30,
    y: playerPos.y + Math.sin(angle) * 30,
    radius: waveRadius,
    damage: WATER_WAVE_DAMAGE,
    createdAt: Date.now()
  };
  waterWaves.push(wave);

  const waveEl = document.createElement('div');
  waveEl.className = 'water-wave';
  waveEl.style.width = waveRadius * 2 + 'px';
  waveEl.style.height = waveRadius * 2 + 'px';
  waveEl.style.left = wave.x + 'px';
  waveEl.style.top = wave.y + 'px';
  gameCanvas.appendChild(waveEl);

  enemies.forEach((enemy) => {
    if (enemy.dying) return;

    const dx = enemy.x - wave.x;
    const dy = enemy.y - wave.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= waveRadius) {
      const pushStrength = 20;
      const pushAngle = Math.atan2(dy, dx);
      enemy.x += Math.cos(pushAngle) * pushStrength;
      enemy.y += Math.sin(pushAngle) * pushStrength;
      damageEnemy(enemy, wave.damage, null);
    }
  });

  if (boss && !boss.dying) {
    const dx = boss.x - wave.x;
    const dy = boss.y - wave.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= waveRadius) {
      const pushStrength = 10;
      const pushAngle = Math.atan2(dy, dx);
      boss.x += Math.cos(pushAngle) * pushStrength;
      boss.y += Math.sin(pushAngle) * pushStrength;
      damageBoss(wave.damage);
    }
  }

  setTimeout(() => {
    waveEl.remove();
    waterWaves = waterWaves.filter((w) => w !== wave);
  }, 1000);
}

// Blaze ability
function castBlazeAbility() {
  const angle = Math.atan2(mousePos.y - playerPos.y, mousePos.x - playerPos.x);
  shootProjectile('blaze');
}

function spawnBlazeExplosion(x, y, radius, damage) {
  const numExplosions = 8;
  for (let i = 0; i < numExplosions; i++) {
    const explosionAngle = (Math.PI * 2 / numExplosions) * i;
    const explosionX = x + Math.cos(explosionAngle) * 20;
    const explosionY = y + Math.sin(explosionAngle) * 20;

    const proj = {
      x: explosionX,
      y: explosionY,
      direction: explosionAngle,
      speed: PROJECTILE_SPEED * 0.7,
      damage: damage,
      size: 14,
      lifetime: 1500,
      elementType: 'fire',
      isEnemyProjectile: false,
      createdAt: Date.now()
    };
    projectiles.push(proj);

    const projEl = document.createElement('div');
    projEl.className = 'projectile fire-projectile';
    projEl.style.width = '14px';
    projEl.style.height = '14px';
    projEl.style.left = proj.x + 'px';
    projEl.style.top = proj.y + 'px';
    proj.domElement = projEl;
    gameCanvas.appendChild(projEl);
  }
}

// Mud ability
function castMudAbility() {
  const angle = Math.atan2(mousePos.y - playerPos.y, mousePos.x - playerPos.x);
  shootProjectile('mud');
}

// Steam ability
function castSteamAbility() {
  const steamRadius = 120;

  const steam = {
    x: playerPos.x,
    y: playerPos.y,
    radius: steamRadius,
    damage: STEAM_DAMAGE,
    createdAt: Date.now()
  };
  steamCircles.push(steam);

  const steamEl = document.createElement('div');
  steamEl.className = 'steam-circle';
  steamEl.style.width = steamRadius * 2 + 'px';
  steamEl.style.height = steamRadius * 2 + 'px';
  steamEl.style.left = steam.x + 'px';
  steamEl.style.top = steam.y + 'px';
  gameCanvas.appendChild(steamEl);

  enemies.forEach((enemy) => {
    if (enemy.dying) return;

    const distance = Math.sqrt((enemy.x - steam.x) ** 2 + (enemy.y - steam.y) ** 2);
    if (distance <= steamRadius) {
      damageEnemy(enemy, steam.damage, null);
    }
  });

  if (boss && !boss.dying) {
    const distance = Math.sqrt((boss.x - steam.x) ** 2 + (boss.y - steam.y) ** 2);
    if (distance <= steamRadius) {
      damageBoss(steam.damage);
    }
  }

  setTimeout(() => {
    steamEl.remove();
    steamCircles = steamCircles.filter((s) => s !== steam);
  }, 3000);
}

// Freeze ability
function castFreezeAbility() {
  const freezeRadius = 100;

  const freeze = {
    x: playerPos.x,
    y: playerPos.y,
    radius: freezeRadius,
    damage: FREEZE_DAMAGE,
    createdAt: Date.now()
  };
  freezeCircles.push(freeze);

  const freezeEl = document.createElement('div');
  freezeEl.className = 'freeze-circle';
  freezeEl.style.width = freezeRadius * 2 + 'px';
  freezeEl.style.height = freezeRadius * 2 + 'px';
  freezeEl.style.left = freeze.x + 'px';
  freezeEl.style.top = freeze.y + 'px';
  gameCanvas.appendChild(freezeEl);

  enemies.forEach((enemy) => {
    if (enemy.dying) return;

    const distance = Math.sqrt((enemy.x - freeze.x) ** 2 + (enemy.y - freeze.y) ** 2);
    if (distance <= freezeRadius) {
      applyFreeze(enemy);
      damageEnemy(enemy, freeze.damage, null);
    }
  });

  setTimeout(() => {
    freezeEl.remove();
    freezeCircles = freezeCircles.filter((f) => f !== freeze);
  }, 2000);
}

function applyFreeze(enemy) {
  if (!enemy.freezeStacks) enemy.freezeStacks = 0;
  enemy.freezeStacks++;

  if (enemy.domElement) {
    enemy.domElement.classList.add('frozen');
  }

  const freezeDuration = 2000;
  const freezeEffect = {
    type: 'freeze',
    target: enemy,
    startTime: Date.now(),
    duration: freezeDuration
  };
  statusEffects.push(freezeEffect);
}

function getEnemySpeedMultiplier(enemy) {
  if (enemy.freezeStacks) {
    return Math.max(0.1, 1 - enemy.freezeStacks * 0.3);
  }
  return 1;
}

// Life ability
function castLifeAbility() {
  const triangleCount = 3;

  for (let i = 0; i < triangleCount; i++) {
    const angle = (Math.PI * 2 / triangleCount) * i + rotatingShieldAngle;
    const distance = 80;
    const triangleX = playerPos.x + Math.cos(angle) * distance;
    const triangleY = playerPos.y + Math.sin(angle) * distance;

    const triangle = {
      x: triangleX,
      y: triangleY,
      angle: angle,
      health: 50,
      maxHealth: 50,
      createdAt: Date.now(),
      dying: false
    };
    lifeTriangles.push(triangle);

    const triangleEl = document.createElement('div');
    triangleEl.className = 'life-triangle';
    triangleEl.style.left = triangle.x + 'px';
    triangleEl.style.top = triangle.y + 'px';
    triangle.domElement = triangleEl;
    gameCanvas.appendChild(triangleEl);
  }
}

function updateLifeTriangles() {
  for (let i = lifeTriangles.length - 1; i >= 0; i--) {
    const triangle = lifeTriangles[i];

    if (triangle.health <= 0 && !triangle.dying) {
      triangle.dying = true;
      if (triangle.domElement) {
        triangle.domElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        triangle.domElement.style.opacity = '0';
        triangle.domElement.style.transform = 'scale(0)';
        setTimeout(() => {
          if (triangle.domElement && triangle.domElement.parentNode) {
            triangle.domElement.remove();
          }
          lifeTriangles.splice(i, 1);
        }, 300);
      }
      continue;
    }

    if (triangle.dying) continue;

    triangle.angle += 0.02;
    const distance = 80;
    triangle.x = playerPos.x + Math.cos(triangle.angle) * distance;
    triangle.y = playerPos.y + Math.sin(triangle.angle) * distance;

    if (triangle.domElement) {
      triangle.domElement.style.left = triangle.x + 'px';
      triangle.domElement.style.top = triangle.y + 'px';
    }

    for (let enemy of enemies) {
      if (enemy.dying) continue;

      const distance = Math.sqrt((enemy.x - triangle.x) ** 2 + (enemy.y - triangle.y) ** 2);
      if (distance < 15 + 15) {
        damageEnemy(enemy, LIFE_TRIANGLE_DAMAGE, null);
      }
    }

    if (boss && !boss.dying) {
      const distance = Math.sqrt((boss.x - triangle.x) ** 2 + (boss.y - triangle.y) ** 2);
      if (distance < 15 + 60) {
        damageBoss(LIFE_TRIANGLE_DAMAGE);
      }
    }
  }
}

function spawnLifeTrail(x, y) {
  const trail = { x: x, y: y, createdAt: Date.now() };
  lifeTrails.push(trail);

  const trailEl = document.createElement('div');
  trailEl.className = 'life-trail';
  trailEl.style.left = x + 'px';
  trailEl.style.top = y + 'px';
  gameCanvas.appendChild(trailEl);

  setTimeout(() => {
    trailEl.remove();
    lifeTrails = lifeTrails.filter((t) => t !== trail);
  }, 800);
}

function updateLifeTrails() {}

// Boil ability
function castBoilAbility() {
  const angle = Math.atan2(mousePos.y - playerPos.y, mousePos.x - playerPos.x);
  shootProjectile('boil');
}

function spawnBoilCircle() {
  const boilRadius = 100;

  const boil = {
    x: playerPos.x,
    y: playerPos.y,
    radius: boilRadius,
    damage: BOIL_DAMAGE,
    createdAt: Date.now()
  };
  boilCircles.push(boil);

  const boilEl = document.createElement('div');
  boilEl.className = 'boil-circle';
  boilEl.style.width = boilRadius * 2 + 'px';
  boilEl.style.height = boilRadius * 2 + 'px';
  boilEl.style.left = boil.x + 'px';
  boilEl.style.top = boil.y + 'px';
  gameCanvas.appendChild(boilEl);

  enemies.forEach((enemy) => {
    if (enemy.dying) return;

    const distance = Math.sqrt((enemy.x - boil.x) ** 2 + (enemy.y - boil.y) ** 2);
    if (distance <= boilRadius) {
      damageEnemy(enemy, boil.damage, null);
    }
  });

  if (boss && !boss.dying) {
    const distance = Math.sqrt((boss.x - boil.x) ** 2 + (boss.y - boil.y) ** 2);
    if (distance <= boilRadius) {
      damageBoss(boil.damage);
    }
  }

  setTimeout(() => {
    boilEl.remove();
    boilCircles = boilCircles.filter((b) => b !== boil);
  }, 3000);
}

function updateBoilCircles() {}

// Tsunami ability
function castTsunamiAbility() {
  const angle = Math.atan2(mousePos.y - playerPos.y, mousePos.x - playerPos.x);
  const distance = 150;
  const waveX = playerPos.x + Math.cos(angle) * distance;
  const waveY = playerPos.y + Math.sin(angle) * distance;

  if (tsunamiPlacedWave) {
    if (tsunamiPlacedWave.domElement) {
      tsunamiPlacedWave.domElement.remove();
    }
    tsunamiPlacedWave = null;
  }

  const waveRadius = 200;
  tsunamiPlacedWave = {
    x: waveX,
    y: waveY,
    radius: waveRadius,
    damage: TSUNAMI_DAMAGE,
    createdAt: Date.now()
  };

  const waveEl = document.createElement('div');
  waveEl.className = 'tsunami-placed-wave';
  waveEl.style.width = waveRadius * 2 + 'px';
  waveEl.style.height = waveRadius * 2 + 'px';
  waveEl.style.left = waveX + 'px';
  waveEl.style.top = waveY + 'px';
  tsunamiPlacedWave.domElement = waveEl;
  gameCanvas.appendChild(waveEl);
}

function updateTsunamiPlacedWave() {
  if (!tsunamiPlacedWave) return;

  enemies.forEach((enemy) => {
    if (enemy.dying) return;

    const distance = Math.sqrt(
      (enemy.x - tsunamiPlacedWave.x) ** 2 + (enemy.y - tsunamiPlacedWave.y) ** 2
    );
    if (distance <= tsunamiPlacedWave.radius) {
      const dx = enemy.x - tsunamiPlacedWave.x;
      const dy = enemy.y - tsunamiPlacedWave.y;
      const pushStrength = 3;
      const pushAngle = Math.atan2(dy, dx);
      enemy.x += Math.cos(pushAngle) * pushStrength;
      enemy.y += Math.sin(pushAngle) * pushStrength;
      damageEnemy(enemy, tsunamiPlacedWave.damage / 60, null);
    }
  });

  if (boss && !boss.dying) {
    const distance = Math.sqrt(
      (boss.x - tsunamiPlacedWave.x) ** 2 + (boss.y - tsunamiPlacedWave.y) ** 2
    );
    if (distance <= tsunamiPlacedWave.radius) {
      const dx = boss.x - tsunamiPlacedWave.x;
      const dy = boss.y - tsunamiPlacedWave.y;
      const pushStrength = 1.5;
      const pushAngle = Math.atan2(dy, dx);
      boss.x += Math.cos(pushAngle) * pushStrength;
      boss.y += Math.sin(pushAngle) * pushStrength;
      damageBoss(tsunamiPlacedWave.damage / 60);
    }
  }
}

function getTideSlowMultiplier(x, y) {
  if (!tideAuraActive) return 1;

  const distance = Math.sqrt((x - playerPos.x) ** 2 + (y - playerPos.y) ** 2);
  const auraRadius = 150;

  if (distance <= auraRadius) {
    const slowAmount = 0.5;
    return slowAmount;
  }
  return 1;
}

function activateTideAura() {
  tideAuraActive = true;

  const auraEl = document.createElement('div');
  auraEl.className = 'tide-aura';
  auraEl.id = 'tideAura';
  gameCanvas.appendChild(auraEl);

  updateTideAuraPosition();
}

function updateTideAuraPosition() {
  const auraEl = document.getElementById('tideAura');
  if (!auraEl) return;
  auraEl.style.left = playerPos.x + 'px';
  auraEl.style.top = playerPos.y + 'px';
}

// Rotating shield
function activateRotatingShield() {
  rotatingShieldActive = true;

  for (let i = 0; i < 4; i++) {
    const shield = document.createElement('div');
    shield.className = 'rotating-shield';
    shield.dataset.index = i;
    gameCanvas.appendChild(shield);
  }

  updateRotatingShieldPosition();
}

function updateRotatingShieldPosition() {
  if (!rotatingShieldActive) return;

  rotatingShieldAngle += 0.05;

  const shields = document.querySelectorAll('.rotating-shield');
  shields.forEach((shield, index) => {
    const angle = rotatingShieldAngle + (Math.PI * 2 / 4) * index;
    const distance = 50;
    const x = playerPos.x + Math.cos(angle) * distance;
    const y = playerPos.y + Math.sin(angle) * distance;
    shield.style.left = x + 'px';
    shield.style.top = y + 'px';
  });
}

function checkShieldCollisions() {
  if (!rotatingShieldActive) return;

  const shields = document.querySelectorAll('.rotating-shield');
  shields.forEach((shield) => {
    const shieldX = parseFloat(shield.style.left);
    const shieldY = parseFloat(shield.style.top);

    enemies.forEach((enemy) => {
      if (enemy.dying) return;

      const enemyRadius = enemy.isRamming ? 17.5 : 15;
      if (checkCircleCollision(shieldX, shieldY, 6, enemy.x, enemy.y, enemyRadius)) {
        damageEnemy(enemy, SHIELD_DAMAGE, null);
      }
    });

    projectiles.forEach((proj, index) => {
      if (!proj.isEnemyProjectile) return;

      if (checkCircleCollision(shieldX, shieldY, 6, proj.x, proj.y, proj.size / 2)) {
        if (proj.domElement && proj.domElement.parentNode) {
          proj.domElement.remove();
        }
        projectiles.splice(index, 1);
      }
    });
  });
}

// Sword
function activateSword() {
  swordActive = true;

  const sword = document.createElement('div');
  sword.className = 'sword';
  sword.id = 'playerSword';
  gameCanvas.appendChild(sword);

  updateSwordPosition();
}

function updateSwordPosition() {
  if (!swordActive) return;

  const sword = document.getElementById('playerSword');
  if (!sword) return;

  const angle = Math.atan2(mousePos.y - playerPos.y, mousePos.x - playerPos.x);
  sword.style.left = playerPos.x + 'px';
  sword.style.top = playerPos.y + 'px';
  sword.style.transform = 'rotate(' + angle + 'rad)';
}

function checkSwordCollisions() {
  if (!swordActive) return;

  const sword = document.getElementById('playerSword');
  if (!sword) return;

  const swordRect = sword.getBoundingClientRect();
  const swordCenterX = swordRect.left + swordRect.width / 2;
  const swordCenterY = swordRect.top + swordRect.height / 2;
  const swordLength = 40;

  enemies.forEach((enemy) => {
    if (enemy.dying) return;

    const enemyRect = enemy.domElement.getBoundingClientRect();
    const enemyCenterX = enemyRect.left + enemyRect.width / 2;
    const enemyCenterY = enemyRect.top + enemyRect.height / 2;

    const dx = enemyCenterX - swordCenterX;
    const dy = enemyCenterY - swordCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < swordLength + 15) {
      damageEnemy(enemy, SWORD_DAMAGE, null);
    }
  });

  if (boss && !boss.dying) {
    const bossRect = boss.domElement.getBoundingClientRect();
    const bossCenterX = bossRect.left + bossRect.width / 2;
    const bossCenterY = bossRect.top + bossRect.height / 2;

    const dx = bossCenterX - swordCenterX;
    const dy = bossCenterY - swordCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < swordLength + 60) {
      damageBoss(SWORD_DAMAGE);
    }
  }
}

// Enemy spawning
function spawnEnemy() {
  const side = Math.floor(Math.random() * 4);
  let x, y;

  if (side === 0) {
    x = Math.random() * window.innerWidth;
    y = -30;
  } else if (side === 1) {
    x = window.innerWidth + 30;
    y = Math.random() * window.innerHeight;
  } else if (side === 2) {
    x = Math.random() * window.innerWidth;
    y = window.innerHeight + 30;
  } else {
    x = -30;
    y = Math.random() * window.innerHeight;
  }

  const enemy = {
    x: x,
    y: y,
    health: ENEMY_HEALTH,
    maxHealth: ENEMY_HEALTH,
    dying: false,
    isRamming: false,
    hasDealtContactDamage: false,
    readyToRemove: false,
    freezeStacks: 0
  };
  enemies.push(enemy);

  const enemyEl = document.createElement('div');
  enemyEl.className = 'enemy';
  enemyEl.style.left = x + 'px';
  enemyEl.style.top = y + 'px';
  enemy.domElement = enemyEl;
  gameCanvas.appendChild(enemyEl);
}

function spawnRammingEnemy() {
  const side = Math.floor(Math.random() * 4);
  let x, y;

  if (side === 0) {
    x = Math.random() * window.innerWidth;
    y = -35;
  } else if (side === 1) {
    x = window.innerWidth + 35;
    y = Math.random() * window.innerHeight;
  } else if (side === 2) {
    x = Math.random() * window.innerWidth;
    y = window.innerHeight + 35;
  } else {
    x = -35;
    y = Math.random() * window.innerHeight;
  }

  const enemy = {
    x: x,
    y: y,
    health: RAMMING_ENEMY_HEALTH,
    maxHealth: RAMMING_ENEMY_HEALTH,
    dying: false,
    isRamming: true,
    hasDealtContactDamage: false,
    readyToRemove: false,
    freezeStacks: 0
  };
  enemies.push(enemy);

  const enemyEl = document.createElement('div');
  enemyEl.className = 'enemy ramming';
  enemyEl.style.left = x + 'px';
  enemyEl.style.top = y + 'px';
  enemy.domElement = enemyEl;
  gameCanvas.appendChild(enemyEl);
}

function updateEnemy(enemy) {
  if (enemy.dying) return;

  let targetX = playerPos.x;
  let targetY = playerPos.y;
  const angle = Math.atan2(targetY - enemy.y, targetX - enemy.x);

  let speed = enemy.isRamming ? ENEMY_SPEED * 1.5 : ENEMY_SPEED;
  speed *= getEnemySpeedMultiplier(enemy);

  if (tsunamiPlacedWave) {
    const distanceToWave = Math.sqrt(
      (enemy.x - tsunamiPlacedWave.x) ** 2 + (enemy.y - tsunamiPlacedWave.y) ** 2
    );
    if (distanceToWave <= tsunamiPlacedWave.radius) {
      speed *= 0.3;
    }
  }

  enemy.x += Math.cos(angle) * speed;
  enemy.y += Math.sin(angle) * speed;

  if (enemy.domElement) {
    enemy.domElement.style.left = enemy.x + 'px';
    enemy.domElement.style.top = enemy.y + 'px';
  }

  const now = Date.now();
  if (playerElements.includes('fire') && now % 500 < 20) {
    if (Math.random() < 0.05) {
      applyBurn(enemy);
    }
  }

  if (now % 1000 < 20) {
    if (Math.random() < 0.1) {
      const projAngle = Math.atan2(playerPos.y - enemy.y, playerPos.x - enemy.x);

      const enemyProj = {
        x: enemy.x,
        y: enemy.y,
        direction: projAngle,
        speed: PROJECTILE_SPEED * 0.8,
        damage: 5,
        size: 12,
        lifetime: 3000,
        isEnemyProjectile: true,
        createdAt: Date.now(),
        frozenByIce: false
      };
      projectiles.push(enemyProj);

      const projEl = document.createElement('div');
      projEl.className = 'projectile enemy-projectile';
      projEl.style.width = '12px';
      projEl.style.height = '12px';
      projEl.style.left = enemyProj.x + 'px';
      projEl.style.top = enemyProj.y + 'px';
      enemyProj.domElement = projEl;
      gameCanvas.appendChild(projEl);
    }
  }
}

function applyBurn(enemy) {
  const burnDuration = 3000;
  const burnTickInterval = 500;
  const burnDamagePerTick = 2;

  const burnEffect = {
    type: 'burn',
    target: enemy,
    startTime: Date.now(),
    duration: burnDuration,
    tickInterval: burnTickInterval,
    damagePerTick: burnDamagePerTick,
    lastTickTime: Date.now()
  };
  statusEffects.push(burnEffect);

  if (enemy.domElement) {
    enemy.domElement.classList.add('burning');
  }
}

function damageEnemy(enemy, damage, projectile) {
  enemy.health -= damage;
  if (enemy.health <= 0) {
    killEnemy(enemy);
    return true;
  }
  return false;
}

function killEnemy(enemy) {
  if (enemy.dying) return;
  enemy.dying = true;

  killCount++;
  killCounterEl.textContent = killCount;

  if (killCount >= BOSS_SPAWN_KILL_COUNT && !bossActive) {
    spawnBoss();
  }

  if (enemy.domElement) {
    enemy.domElement.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    enemy.domElement.style.opacity = '0';
    enemy.domElement.style.transform = 'scale(0)';
    setTimeout(() => {
      if (enemy.domElement && enemy.domElement.parentNode) {
        enemy.domElement.remove();
      }
      enemy.readyToRemove = true;
    }, 200);
  }
}

// Boss
function spawnBoss() {
  bossActive = true;

  const bossX = window.innerWidth / 2;
  const bossY = -150;

  boss = {
    x: bossX,
    y: bossY,
    health: BOSS_HEALTH,
    maxHealth: BOSS_HEALTH,
    dying: false,
    phase: 1,
    lastAttackTime: Date.now(),
    attackCooldown: 2000
  };

  const bossEl = document.createElement('div');
  bossEl.className = 'boss';
  bossEl.style.left = boss.x + 'px';
  bossEl.style.top = boss.y + 'px';
  boss.domElement = bossEl;
  gameCanvas.appendChild(bossEl);

  const bossHealthBarContainer = document.createElement('div');
  bossHealthBarContainer.className = 'boss-health-bar';
  bossHealthBarContainer.id = 'bossHealthBar';

  const bossHealthFill = document.createElement('div');
  bossHealthFill.className = 'boss-health-fill';
  bossHealthFill.id = 'bossHealthFill';

  const bossHealthText = document.createElement('div');
  bossHealthText.className = 'boss-health-text';
  bossHealthText.id = 'bossHealthText';
  bossHealthText.textContent = boss.health + ' / ' + boss.maxHealth;

  bossHealthBarContainer.appendChild(bossHealthFill);
  bossHealthBarContainer.appendChild(bossHealthText);
  document.body.appendChild(bossHealthBarContainer);

  const bossNameEl = document.createElement('div');
  bossNameEl.className = 'boss-name';
  bossNameEl.textContent = 'VOID TYRANT';
  document.body.appendChild(bossNameEl);

  updateBossHealthBar();
}

function updateBoss() {
  if (!boss || boss.dying) return;

  if (boss.y < window.innerHeight / 3) {
    boss.y += 2;
  }

  const now = Date.now();
  if (now - boss.lastAttackTime >= boss.attackCooldown) {
    boss.lastAttackTime = now;

    const attackType = Math.floor(Math.random() * 3);
    if (attackType === 0) {
      bossCircularAttack();
    } else if (attackType === 1) {
      bossSpiralAttack();
    } else {
      bossDirectionalAttack();
    }
  }

  if (boss.domElement) {
    boss.domElement.style.left = boss.x + 'px';
    boss.domElement.style.top = boss.y + 'px';
  }
}

function bossCircularAttack() {
  const numProj = 16;

  for (let i = 0; i < numProj; i++) {
    const angle = (Math.PI * 2 / numProj) * i;

    const proj = {
      x: boss.x,
      y: boss.y,
      direction: angle,
      speed: PROJECTILE_SPEED * 0.6,
      damage: 10,
      size: 18,
      lifetime: 5000,
      isEnemyProjectile: true,
      createdAt: Date.now(),
      frozenByIce: false
    };
    projectiles.push(proj);

    const projEl = document.createElement('div');
    projEl.className = 'projectile enemy-projectile';
    projEl.style.width = '18px';
    projEl.style.height = '18px';
    projEl.style.left = proj.x + 'px';
    projEl.style.top = proj.y + 'px';
    proj.domElement = projEl;
    gameCanvas.appendChild(projEl);
  }
}

function bossSpiralAttack() {
  const numWaves = 3;
  const projPerWave = 8;

  for (let wave = 0; wave < numWaves; wave++) {
    setTimeout(() => {
      for (let i = 0; i < projPerWave; i++) {
        const angle = (Math.PI * 2 / projPerWave) * i + (wave * Math.PI) / 6;

        const proj = {
          x: boss.x,
          y: boss.y,
          direction: angle,
          speed: PROJECTILE_SPEED * 0.5,
          damage: 10,
          size: 16,
          lifetime: 5000,
          isEnemyProjectile: true,
          createdAt: Date.now(),
          frozenByIce: false
        };
        projectiles.push(proj);

        const projEl = document.createElement('div');
        projEl.className = 'projectile enemy-projectile';
        projEl.style.width = '16px';
        projEl.style.height = '16px';
        projEl.style.left = proj.x + 'px';
        projEl.style.top = proj.y + 'px';
        proj.domElement = projEl;
        gameCanvas.appendChild(projEl);
      }
    }, wave * 200);
  }
}

function bossDirectionalAttack() {
  const angle = Math.atan2(playerPos.y - boss.y, playerPos.x - boss.x);
  const spreadAngles = [-0.2, -0.1, 0, 0.1, 0.2];

  for (let spread of spreadAngles) {
    const projAngle = angle + spread;

    const proj = {
      x: boss.x,
      y: boss.y,
      direction: projAngle,
      speed: PROJECTILE_SPEED * 0.7,
      damage: 12,
      size: 20,
      lifetime: 5000,
      isEnemyProjectile: true,
      createdAt: Date.now(),
      frozenByIce: false
    };
    projectiles.push(proj);

    const projEl = document.createElement('div');
    projEl.className = 'projectile enemy-projectile';
    projEl.style.width = '20px';
    projEl.style.height = '20px';
    projEl.style.left = proj.x + 'px';
    projEl.style.top = proj.y + 'px';
    proj.domElement = projEl;
    gameCanvas.appendChild(projEl);
  }
}

function damageBoss(damage) {
  if (!boss || boss.dying) return;
  boss.health -= damage;
  if (boss.health <= 0) {
    boss.health = 0;
    killBoss();
  }
  updateBossHealthBar();
}

function killBoss() {
  if (!boss || boss.dying) return;
  boss.dying = true;

  if (boss.domElement) {
    boss.domElement.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    boss.domElement.style.opacity = '0';
    boss.domElement.style.transform = 'scale(0)';
    setTimeout(() => {
      if (boss.domElement && boss.domElement.parentNode) {
        boss.domElement.remove();
      }
      boss = null;
      bossActive = false;

      const bossHealthBar = document.getElementById('bossHealthBar');
      if (bossHealthBar) bossHealthBar.remove();

      const bossName = document.querySelector('.boss-name');
      if (bossName) bossName.remove();
    }, 500);
  }
}

function updateBossHealthBar() {
  if (!boss) return;

  const bossHealthFill = document.getElementById('bossHealthFill');
  const bossHealthText = document.getElementById('bossHealthText');
  if (!bossHealthFill || !bossHealthText) return;

  const percentage = (boss.health / boss.maxHealth) * 100;
  bossHealthFill.style.width = percentage + '%';
  bossHealthText.textContent = Math.floor(boss.health) + ' / ' + boss.maxHealth;
}

// Player damage and health
function damagePlayer(damage) {
  if (isInvincible) return;

  playerHealth -= damage;
  if (playerHealth < 0) playerHealth = 0;
  updateHealthBar();

  if (playerHealth === 0) {
    gameOver();
  }

  isInvincible = true;
  player.classList.add('invincible');

  if (invincibilityTimer) clearTimeout(invincibilityTimer);
  invincibilityTimer = setTimeout(() => {
    isInvincible = false;
    player.classList.remove('invincible');
    invincibilityTimer = null;
  }, INVINCIBILITY_DURATION);
}

function gameOver() {
  alert('Game Over! Final Score: ' + killCount + ' kills');
  location.reload();
}

function updateWaterWaves() {}
function updateEarthquakes() {}
function updateSteamCircles() {}
function updateFreezeCircles() {}
function updateTrees() {}

function updateHealthBar() {
  const percentage = (playerHealth / maxPlayerHealth) * 100;
  healthBarFill.style.width = percentage + '%';
  healthBarText.textContent = Math.floor(playerHealth) + ' / ' + maxPlayerHealth;

  if (percentage <= 25) {
    healthBarFill.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
    healthBarFill.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.8)';
  } else if (percentage <= 50) {
    healthBarFill.style.background = 'linear-gradient(90deg, #ffaa00, #ffcc44)';
    healthBarFill.style.boxShadow = '0 0 10px rgba(255, 170, 0, 0.6)';
  } else {
    healthBarFill.style.background = 'linear-gradient(90deg, #00b4ff, #00ffa3)';
    healthBarFill.style.boxShadow = '0 0 10px rgba(0, 180, 255, 0.6)';
  }
}

function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < r1 + r2;
}

// Projectiles
function updateProjectiles() {
  const now = Date.now();
  projectiles = projectiles.filter((proj) => {
    if (now - proj.createdAt > proj.lifetime) {
      if (proj.domElement && proj.domElement.parentNode) {
        proj.domElement.remove();
      }
      return false;
    }

    if (proj.x < -100 || proj.x > window.innerWidth + 100 || proj.y < -100 || proj.y > window.innerHeight + 100) {
      if (proj.domElement && proj.domElement.parentNode) {
        proj.domElement.remove();
      }
      return false;
    }

    let effectiveSpeed = proj.speed;
    if (proj.isEnemyProjectile && !proj.frozenByIce) {
      const tideSlow = getTideSlowMultiplier(proj.x, proj.y);
      effectiveSpeed *= tideSlow;
    }

    proj.x += Math.cos(proj.direction) * effectiveSpeed;
    proj.y += Math.sin(proj.direction) * effectiveSpeed;

    if (proj.domElement) {
      proj.domElement.style.left = proj.x + 'px';
      proj.domElement.style.top = proj.y + 'px';
    }

    return true;
  });
}

function checkProjectileCollisions() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];

    if (proj.isEnemyProjectile) {
      if (checkCircleCollision(proj.x, proj.y, proj.size / 2, playerPos.x, playerPos.y, 12)) {
        damagePlayer(proj.damage);
        if (proj.domElement && proj.domElement.parentNode) {
          proj.domElement.remove();
        }
        projectiles.splice(i, 1);
        continue;
      }

      let hitTriangle = false;
      for (let t = 0; t < lifeTriangles.length; t++) {
        const triangle = lifeTriangles[t];
        if (triangle.dying) continue;

        if (checkCircleCollision(proj.x, proj.y, proj.size / 2, triangle.x, triangle.y, 15)) {
          triangle.health -= proj.damage;
          if (proj.domElement && proj.domElement.parentNode) {
            proj.domElement.remove();
          }
          projectiles.splice(i, 1);
          hitTriangle = true;
          break;
        }
      }
      if (hitTriangle) continue;
    } else {
      let hitSomething = false;

      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        if (enemy.dying) continue;

        const enemyRadius = enemy.isRamming ? 17.5 : 15;
        if (checkCircleCollision(proj.x, proj.y, proj.size / 2, enemy.x, enemy.y, enemyRadius)) {
          if (proj.elementType === 'blaze') {
            spawnBlazeExplosion(proj.x, proj.y, 30, 4);
          }

          if (proj.isFlameCharged) {
            spawnFlameExplosion(proj.x, proj.y, proj.flameExplosionRadius, proj.flameExplosionDamage);
          }

          const enemyDied = damageEnemy(enemy, proj.damage, proj);

          if (proj.domElement && proj.domElement.parentNode) {
            proj.domElement.remove();
          }
          projectiles.splice(i, 1);
          hitSomething = true;
          break;
        }
      }

      if (!hitSomething && boss && !boss.dying) {
        const bossRadius = 60;
        if (checkCircleCollision(proj.x, proj.y, proj.size / 2, boss.x, boss.y, bossRadius)) {
          if (proj.elementType === 'blaze') {
            spawnBlazeExplosion(proj.x, proj.y, 30, 4);
          }

          if (proj.isFlameCharged) {
            spawnFlameExplosion(proj.x, proj.y, proj.flameExplosionRadius, proj.flameExplosionDamage);
          }

          damageBoss(proj.damage);

          if (proj.domElement && proj.domElement.parentNode) {
            proj.domElement.remove();
          }
          projectiles.splice(i, 1);
        }
      }
    }
  }
}

// Collision detection
function resolveEnemyCollisions() {
  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      const enemy1 = enemies[i];
      const enemy2 = enemies[j];
      if (enemy1.dying || enemy2.dying) continue;

      const enemy1Radius = enemy1.isRamming ? 17.5 : 15;
      const enemy2Radius = enemy2.isRamming ? 17.5 : 15;
      const minDistance = enemy1Radius + enemy2Radius;

      const dx = enemy2.x - enemy1.x;
      const dy = enemy2.y - enemy1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance && distance > 0) {
        const overlap = minDistance - distance;
        const pushX = (dx / distance) * (overlap / 2);
        const pushY = (dy / distance) * (overlap / 2);

        enemy1.x -= pushX;
        enemy1.y -= pushY;
        enemy2.x += pushX;
        enemy2.y += pushY;
      }
    }
  }
}

function checkEnemyPlayerCollisions() {
  for (let enemy of enemies) {
    if (enemy.dying) continue;
    if (enemy.hasDealtContactDamage) continue;

    const enemyRadius = enemy.isRamming ? 17.5 : 15;
    if (checkCircleCollision(enemy.x, enemy.y, enemyRadius, playerPos.x, playerPos.y, 12)) {
      const contactDamage = enemy.isRamming ? 10 : ENEMY_DAMAGE;
      damagePlayer(contactDamage);
      enemy.hasDealtContactDamage = true;
      setTimeout(() => {
        enemy.hasDealtContactDamage = false;
      }, 1000);
    }
  }

  for (let triangle of lifeTriangles) {
    if (triangle.dying) continue;

    for (let enemy of enemies) {
      if (enemy.dying) continue;

      const enemyRadius = enemy.isRamming ? 17.5 : 15;
      if (checkCircleCollision(enemy.x, enemy.y, enemyRadius, triangle.x, triangle.y, 15)) {
        triangle.health -= enemy.isRamming ? 3 : 1;
        if (triangle.health <= 0) {
          triangle.health = 0;
        }
      }
    }
  }
}

// Status effects
function updateStatusEffects() {
  const now = Date.now();
  statusEffects = statusEffects.filter((effect) => {
    if (now - effect.startTime > effect.duration) {
      if (effect.type === 'burn' && effect.target && effect.target.domElement) {
        effect.target.domElement.classList.remove('burning');
      }
      if (effect.type === 'freeze' && effect.target) {
        if (effect.target.freezeStacks) {
          effect.target.freezeStacks = Math.max(0, effect.target.freezeStacks - 1);
        }
        if (effect.target.freezeStacks === 0 && effect.target.domElement) {
          effect.target.domElement.classList.remove('frozen');
        }
      }
      return false;
    }

    if (effect.type === 'burn') {
      if (now - effect.lastTickTime >= effect.tickInterval) {
        effect.lastTickTime = now;
        if (effect.target && !effect.target.dying) {
          effect.target.health -= effect.damagePerTick;
          if (effect.target.health <= 0) {
            killEnemy(effect.target);
          }
        }
      }
    }

    return true;
  });
}

// Health regeneration
function regenerateHealth() {
  const now = Date.now();
  if (now - lastHealthRegenTime >= HEALTH_REGEN_INTERVAL) {
    lastHealthRegenTime = now;

    let regenAmount = HEALTH_REGEN_AMOUNT;
    if (playerElements.includes('water')) {
      regenAmount += 1;
    }

    if (playerHealth < maxPlayerHealth) {
      playerHealth = Math.min(maxPlayerHealth, playerHealth + regenAmount);
      updateHealthBar();
    }
  }
}

// Player movement
function updatePlayerMovement() {
  let moveX = 0;
  let moveY = 0;

  if (keysPressed.w) moveY -= PLAYER_SPEED;
  if (keysPressed.s) moveY += PLAYER_SPEED;
  if (keysPressed.a) moveX -= PLAYER_SPEED;
  if (keysPressed.d) moveX += PLAYER_SPEED;

  if (moveX !== 0 || moveY !== 0) {
    const magnitude = Math.sqrt(moveX * moveX + moveY * moveY);
    moveX = (moveX / magnitude) * PLAYER_SPEED;
    moveY = (moveY / magnitude) * PLAYER_SPEED;

    playerPos.x += moveX;
    playerPos.y += moveY;

    playerPos.x = Math.max(12, Math.min(window.innerWidth - 12, playerPos.x));
    playerPos.y = Math.max(12, Math.min(window.innerHeight - 12, playerPos.y));

    player.style.left = playerPos.x + 'px';
    player.style.top = playerPos.y + 'px';

    if (playerElements.includes('life')) {
      const now = Date.now();
      if (now - lastTrailTime >= 100) {
        spawnLifeTrail(playerPos.x, playerPos.y);
        lastTrailTime = now;
      }
    }
  }
}

// Main game loop
function gameLoop() {
  updatePlayerMovement();
  enemies.forEach(updateEnemy);
  resolveEnemyCollisions();
  checkEnemyPlayerCollisions();
  updateProjectiles();
  checkProjectileCollisions();
  checkShieldCollisions();
  checkSwordCollisions();
  updateWaterWaves();
  updateEarthquakes();
  updateSteamCircles();
  updateFreezeCircles();
  updateLifeTriangles();
  updateTrees();
  updateLifeTrails();
  updateStatusEffects();
  updateBoilCircles();
  updateTsunamiPlacedWave();
  regenerateHealth();

  if (rotatingShieldActive) {
    updateRotatingShieldPosition();
  }
  if (swordActive) {
    updateSwordPosition();
  }
  if (tideAuraActive) {
    updateTideAuraPosition();
  }
  if (bossActive && boss) {
    updateBoss();
  }

  const now = Date.now();

  if (playerElements.includes('boil')) {
    boilCircleSpawnTimer += 16;
    if (boilCircleSpawnTimer >= BOIL_CIRCLE_SPAWN_INTERVAL) {
      boilCircleSpawnTimer = 0;
      spawnBoilCircle();
    }
  }

  if (!bossActive) {
    enemySpawnTimer += 16;
    if (enemySpawnTimer >= ENEMY_SPAWN_INTERVAL) {
      enemySpawnTimer = 0;
      spawnEnemy();
    }

    rammingEnemySpawnTimer += 16;
    if (rammingEnemySpawnTimer >= RAMMING_ENEMY_SPAWN_INTERVAL) {
      rammingEnemySpawnTimer = 0;
      spawnRammingEnemy();
    }
  }

  enemies = enemies.filter((e) => !e.readyToRemove);

  requestAnimationFrame(gameLoop);
}

gameLoop();
