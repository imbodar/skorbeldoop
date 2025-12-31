import { GameState, Player, Boid, Leviathan, Point } from './types';
import { GAME_CONSTANTS } from './constants';
import { checkRockCollision } from './physics';
import { spawnBoid } from './boidGenerator';
import { updateBoids } from './boidBehavior';
import { updateLeviathans } from './leviathanBehavior';

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
    invincibilityTimer: 0
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

  // Check collision with leviathans
  if (!player.isDead && !player.invincible) {
    for (const levi of game.leviathans) {
      const dx = levi.x - player.x;
      const dy = levi.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const collisionDist = Math.max(levi.width, levi.height) / 2 + Math.max(player.width, player.height) / 2;

      if (dist < collisionDist) {
        player.isDead = true;
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

export function checkLeviathanStabs(game: GameState): void {
  const player = game.player;

  for (let i = game.leviathans.length - 1; i >= 0; i--) {
    const levi = game.leviathans[i];
    if (!levi.isStunned) continue;

    const dx = levi.x - player.x;
    const dy = levi.y - player.y;

    const cos = Math.cos(-player.rotation);
    const sin = Math.sin(-player.rotation);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    const frontY = -player.height / 2;
    const spikeEndY = frontY - GAME_CONSTANTS.PLAYER_SPIKE_LENGTH;

    const leviRadius = Math.max(levi.width, levi.height) / 2;
    if (localY < frontY &&
        localY > spikeEndY - leviRadius &&
        Math.abs(localX) < GAME_CONSTANTS.PLAYER_SPIKE_WIDTH + leviRadius) {
      if (levi.isGolden) {
        // Golden fish dies and disappears
        game.leviathans.splice(i, 1);
      } else {
        // Normal leviathan becomes golden
        levi.isGolden = true;
        levi.isStunned = false;
        levi.stunTimer = 0;
      }

      player.invincible = true;
      player.invincibilityTimer = GAME_CONSTANTS.INVINCIBILITY_DURATION;

      break;
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
  updateBoids(game.boids, { x: game.player.x, y: game.player.y }, game.world.rocks);
  updateLeviathans(
    game.leviathans,
    { x: game.player.x, y: game.player.y },
    game.boids,
    game.world.rocks
  );
  checkBoidCollisions(game);
  checkLeviathanStabs(game);
  trySpawnBoid(game);
}
