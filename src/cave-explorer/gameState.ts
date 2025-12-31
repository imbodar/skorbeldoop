import { GameState, Player, Boid, Leviathan, Point, FoodOrb, ShellFragment, Projectile } from './types';
import { GAME_CONSTANTS } from './constants';
import { checkRockCollision } from './physics';
import { spawnBoid } from './boidGenerator';
import { updateBoids } from './boidBehavior';
import { updateLeviathans } from './leviathanBehavior';
import { updateSwarmers } from './swarmerBehavior';

export function initializePlayer(): Player {
  return {
    x: GAME_CONSTANTS.WORLD_START_X,
    y: GAME_CONSTANTS.WORLD_START_Y,
    width: GAME_CONSTANTS.PLAYER_WIDTH,
    height: GAME_CONSTANTS.PLAYER_HEIGHT,
    rotation: 0,
    speed: 0,
    maxSpeed: GAME_CONSTANTS.PLAYER_MAX_SPEED,
    acceleration: GAME_CONSTANTS.PLAYER_ACCELERATION,
    friction: GAME_CONSTANTS.PLAYER_FRICTION,
    rotationSpeed: GAME_CONSTANTS.PLAYER_ROTATION_SPEED,
    hunger: GAME_CONSTANTS.PLAYER_MAX_HUNGER,
    maxHunger: GAME_CONSTANTS.PLAYER_MAX_HUNGER,
    trail: [],
    isDead: false,
    invincible: false,
    invincibilityTimer: 0,
    shellFragments: 0,
    hasShield: false,
    shieldRechargeTimer: 0
  };
}

export function updatePlayer(game: GameState): void {
  const player = game.player;

  if (!player.isDead) {
    // Rotation
    if (game.keys['a']) {
      player.rotation -= player.rotationSpeed;
    }
    if (game.keys['d']) {
      player.rotation += player.rotationSpeed;
    }

    // Movement
    if (game.keys['w']) {
      player.speed = Math.min(player.speed + player.acceleration, player.maxSpeed);
    } else if (game.keys['s']) {
      player.speed = Math.max(player.speed - player.acceleration, -player.maxSpeed / 2);
    } else {
      player.speed *= player.friction;
    }

    // Update position
    const moveX = Math.sin(player.rotation) * player.speed;
    const moveY = -Math.cos(player.rotation) * player.speed;

    const newX = player.x + moveX;
    if (!checkRockCollision(newX, player.y, game.world.rocks, player.width, player.height, 0)) {
      player.x = newX;
    }

    const newY = player.y + moveY;
    if (!checkRockCollision(player.x, newY, game.world.rocks, player.width, player.height, 0)) {
      player.y = newY;
    }

    // Update trail
    if (Math.abs(player.speed) > 0.1) {
      player.trail.push({ x: player.x, y: player.y });
      if (player.trail.length > GAME_CONSTANTS.PLAYER_TRAIL_LENGTH) {
        player.trail.shift();
      }
    }

    // Keep in bounds
    player.x = Math.max(player.width, Math.min(game.world.width - player.width, player.x));
    player.y = Math.max(player.height, Math.min(game.world.height - player.height, player.y));
  }

  // Update camera
  game.camera.x += (player.x - game.camera.x) * GAME_CONSTANTS.CAMERA_FOLLOW_SPEED;
  game.camera.y += (player.y - game.camera.y) * GAME_CONSTANTS.CAMERA_FOLLOW_SPEED;

  // Decrease hunger
  player.hunger = Math.max(0, player.hunger - GAME_CONSTANTS.PLAYER_HUNGER_DRAIN);

  // Update invincibility
  if (player.invincible) {
    player.invincibilityTimer--;
    if (player.invincibilityTimer <= 0) {
      player.invincible = false;
    }
  }

  // Update shield status
  if (player.shellFragments >= 3) {
    if (!player.hasShield && player.shieldRechargeTimer === 0) {
      // Activate shield if player has 3 fragments and no active shield
      player.hasShield = true;
    } else if (!player.hasShield && player.shieldRechargeTimer > 0) {
      // Recharge shield (30 seconds = 1800 frames at 60fps)
      player.shieldRechargeTimer--;
      if (player.shieldRechargeTimer === 0) {
        player.hasShield = true;
      }
    }
  }

  // Check collision with leviathans
  if (!player.isDead && !player.invincible) {
    for (const levi of game.leviathans) {
      // Skip collision if leviathan is stunned
      if (levi.isStunned) {
        continue;
      }

      const dx = levi.x - player.x;
      const dy = levi.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const collisionDist = Math.max(levi.width, levi.height) / 2 + Math.max(player.width, player.height) / 2;

      if (dist < collisionDist) {
        // Check if player has shield
        if (player.hasShield && player.shellFragments >= 3) {
          // Consume shield and start recharge
          player.hasShield = false;
          player.shieldRechargeTimer = 1800; // 30 seconds at 60fps
          // Grant brief invincibility to avoid instant re-hit
          player.invincible = true;
          player.invincibilityTimer = 120; // 2 seconds
        } else {
          player.isDead = true;
        }
        break;
      }
    }
  }
}

export function checkBoidCollisions(game: GameState): void {
  const player = game.player;
  const playerCollisionRadius = Math.max(player.width, player.height) / 2;

  for (let i = game.boids.length - 1; i >= 0; i--) {
    const boid = game.boids[i];
    const dx = boid.x - player.x;
    const dy = boid.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let caught = false;

    // Check body collision
    if (dist < playerCollisionRadius + boid.size) {
      caught = true;
    }

    // Check spike collision
    if (!caught) {
      const cos = Math.cos(-player.rotation);
      const sin = Math.sin(-player.rotation);
      const localX = dx * cos - dy * sin;
      const localY = dx * sin + dy * cos;

      const frontY = -player.height / 2;
      const spikeEndY = frontY - GAME_CONSTANTS.PLAYER_SPIKE_LENGTH;

      if (localY < frontY && localY > spikeEndY &&
          Math.abs(localX) < GAME_CONSTANTS.PLAYER_SPIKE_WIDTH + boid.size) {
        caught = true;
      }
    }

    if (caught) {
      player.hunger = Math.min(player.maxHunger, player.hunger + GAME_CONSTANTS.BOID_HUNGER_VALUE);

      // Respawn boid
      const newBoid = spawnBoid({ x: player.x, y: player.y }, game.world.rocks);
      if (newBoid) {
        game.boids[i] = newBoid;
      } else {
        // Fallback: random position
        boid.x = Math.random() * game.world.width;
        boid.y = Math.random() * game.world.height;
        boid.vx = (Math.random() - 0.5) * 2;
        boid.vy = (Math.random() - 0.5) * 2;
        boid.trail = [];
      }
    }
  }
}

function spawnFoodOrbs(x: number, y: number, count: number): FoodOrb[] {
  const orbs: FoodOrb[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
    const speed = GAME_CONSTANTS.FOOD_ORB_SPREAD_SPEED;
    orbs.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: GAME_CONSTANTS.FOOD_ORB_SIZE,
      lifetime: GAME_CONSTANTS.FOOD_ORB_LIFETIME
    });
  }
  return orbs;
}

function spawnShellFragment(x: number, y: number): ShellFragment {
  const angle = Math.random() * Math.PI * 2;
  const speed = 3;
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: 15,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.1
  };
}

export function checkLeviathanStabs(game: GameState): void {
  const player = game.player;

  for (let i = game.leviathans.length - 1; i >= 0; i--) {
    const levi = game.leviathans[i];

    // Check if player spike hits the leviathan
    const dx = levi.x - player.x;
    const dy = levi.y - player.y;

    const cos = Math.cos(-player.rotation);
    const sin = Math.sin(-player.rotation);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    const frontY = -player.height / 2;
    const spikeEndY = frontY - GAME_CONSTANTS.PLAYER_SPIKE_LENGTH;

    const leviRadius = Math.max(levi.width, levi.height) / 2;
    const spikeHit = localY < frontY &&
        localY > spikeEndY - leviRadius &&
        Math.abs(localX) < GAME_CONSTANTS.PLAYER_SPIKE_WIDTH + leviRadius;

    if (spikeHit) {
      if (!levi.isGolden && levi.isStunned) {
        // Turn stunned non-golden leviathan into golden
        levi.isGolden = true;
        levi.isStunned = false;
        levi.stunTimer = 0;

        player.invincible = true;
        player.invincibilityTimer = GAME_CONSTANTS.INVINCIBILITY_DURATION;
      } else if (levi.isGolden && levi.isStunned) {
        // Damage golden leviathan only when stunned
        levi.health -= GAME_CONSTANTS.LEVIATHAN_DAMAGE_PER_HIT;

        // Grant invincibility when stabbing stunned golden leviathan
        player.invincible = true;
        player.invincibilityTimer = GAME_CONSTANTS.INVINCIBILITY_DURATION;

        if (levi.health <= 0) {
          // Spawn food orbs at leviathan position
          const newOrbs = spawnFoodOrbs(levi.x, levi.y, GAME_CONSTANTS.FOOD_ORB_COUNT);
          game.foodOrbs.push(...newOrbs);

          // Spawn shell fragment
          const shellFragment = spawnShellFragment(levi.x, levi.y);
          game.shellFragments.push(shellFragment);

          // Remove the leviathan
          game.leviathans.splice(i, 1);
        }
      }
    }
  }
}

export function updateFoodOrbs(game: GameState): void {
  for (let i = game.foodOrbs.length - 1; i >= 0; i--) {
    const orb = game.foodOrbs[i];

    // Update position
    orb.x += orb.vx;
    orb.y += orb.vy;

    // Apply friction
    orb.vx *= 0.98;
    orb.vy *= 0.98;

    // Decrease lifetime
    orb.lifetime--;

    // Remove if expired
    if (orb.lifetime <= 0) {
      game.foodOrbs.splice(i, 1);
    }
  }
}

export function checkFoodOrbCollisions(game: GameState): void {
  const player = game.player;
  const playerCollisionRadius = Math.max(player.width, player.height) / 2;

  for (let i = game.foodOrbs.length - 1; i >= 0; i--) {
    const orb = game.foodOrbs[i];
    const dx = orb.x - player.x;
    const dy = orb.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < playerCollisionRadius + orb.size) {
      // Restore hunger
      player.hunger = Math.min(player.maxHunger, player.hunger + GAME_CONSTANTS.FOOD_ORB_HUNGER_VALUE);

      // Remove the orb
      game.foodOrbs.splice(i, 1);
    }
  }
}

export function updateShellFragments(game: GameState): void {
  for (const fragment of game.shellFragments) {
    // Update position
    fragment.x += fragment.vx;
    fragment.y += fragment.vy;

    // Apply friction
    fragment.vx *= 0.98;
    fragment.vy *= 0.98;

    // Update rotation
    fragment.rotation += fragment.rotationSpeed;
  }
}

export function checkShellFragmentCollisions(game: GameState): void {
  const player = game.player;
  const playerCollisionRadius = Math.max(player.width, player.height) / 2;

  for (let i = game.shellFragments.length - 1; i >= 0; i--) {
    const fragment = game.shellFragments[i];
    const dx = fragment.x - player.x;
    const dy = fragment.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < playerCollisionRadius + fragment.size) {
      // Increment shell fragment count
      player.shellFragments++;

      // Remove the fragment
      game.shellFragments.splice(i, 1);
    }
  }
}

export function updateProjectiles(game: GameState): void {
  for (let i = game.projectiles.length - 1; i >= 0; i--) {
    const projectile = game.projectiles[i];

    // Update position
    projectile.x += projectile.vx;
    projectile.y += projectile.vy;

    // Remove if out of bounds
    if (projectile.x < 0 || projectile.x > game.world.width ||
        projectile.y < 0 || projectile.y > game.world.height) {
      game.projectiles.splice(i, 1);
      continue;
    }

    // Check collision with rocks
    if (checkRockCollision(projectile.x, projectile.y, game.world.rocks, projectile.radius * 2, projectile.radius * 2)) {
      game.projectiles.splice(i, 1);
    }
  }
}

export function checkProjectileCollisions(game: GameState): void {
  const player = game.player;

  if (player.isDead || player.invincible) {
    return;
  }

  const playerCollisionRadius = Math.max(player.width, player.height) / 2;

  for (let i = game.projectiles.length - 1; i >= 0; i--) {
    const projectile = game.projectiles[i];
    const dx = projectile.x - player.x;
    const dy = projectile.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < playerCollisionRadius + projectile.radius) {
      // Check if player has shield
      if (player.hasShield && player.shellFragments >= 3) {
        // Consume shield and start recharge
        player.hasShield = false;
        player.shieldRechargeTimer = 1800; // 30 seconds at 60fps
        // Grant brief invincibility to avoid instant re-hit
        player.invincible = true;
        player.invincibilityTimer = 120; // 2 seconds
      } else {
        player.isDead = true;
      }

      // Remove the projectile
      game.projectiles.splice(i, 1);
    }
  }
}

export function trySpawnBoid(game: GameState): void {
  if (Math.random() < 0.02) {
    const maxBoids = GAME_CONSTANTS.BOID_COUNT;
    if (game.boids.length < maxBoids) {
      const newBoid = spawnBoid({ x: game.player.x, y: game.player.y }, game.world.rocks);
      if (newBoid) {
        game.boids.push(newBoid);
      }
    }
  }
}

export function updateGame(game: GameState): void {
  updatePlayer(game);
  updateBoids(game.boids, { x: game.player.x, y: game.player.y }, game.world.rocks, game.swarmers);
  updateLeviathans(
    game.leviathans,
    { x: game.player.x, y: game.player.y },
    game.boids,
    game.world.rocks
  );
  updateSwarmers(
    game.swarmers,
    { x: game.player.x, y: game.player.y },
    game.world.rocks,
    game.projectiles,
    game.frameCount
  );
  updateProjectiles(game);
  updateFoodOrbs(game);
  updateShellFragments(game);
  checkBoidCollisions(game);
  checkFoodOrbCollisions(game);
  checkShellFragmentCollisions(game);
  checkProjectileCollisions(game);
  checkLeviathanStabs(game);
  trySpawnBoid(game);
  game.frameCount++;
}
