import { GameState, Player } from './types';
import { GAME_CONSTANTS } from './constants';

export function initializePlayer(): Player {
  // Pre-allocate trail array for circular buffer
  const trail = new Array(GAME_CONSTANTS.PLAYER_TRAIL_LENGTH);
  for (let i = 0; i < GAME_CONSTANTS.PLAYER_TRAIL_LENGTH; i++) {
    trail[i] = { x: 0, y: 0, rotation: 0 };
  }

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
    trail,
    trailIndex: 0,
  };
}

export function updatePlayer(game: GameState): void {
  const player = game.player;

  // Rotation - exact same as cave-explorer
  if (game.keys['a']) {
    player.rotation -= player.rotationSpeed;
  }
  if (game.keys['d']) {
    player.rotation += player.rotationSpeed;
  }

  // Movement - exact same as cave-explorer
  if (game.keys['w']) {
    player.speed = Math.min(player.speed + player.acceleration, player.maxSpeed);
  } else if (game.keys['s']) {
    player.speed = Math.max(player.speed - player.acceleration, -player.maxSpeed / 2);
  } else {
    player.speed *= player.friction;
  }

  // Update position - exact same as cave-explorer
  const moveX = Math.sin(player.rotation) * player.speed;
  const moveY = -Math.cos(player.rotation) * player.speed;

  player.x += moveX;
  player.y += moveY;

  // Update trail (circular buffer)
  if (Math.abs(player.speed) > 0.1) {
    player.trail[player.trailIndex].x = player.x;
    player.trail[player.trailIndex].y = player.y;
    player.trail[player.trailIndex].rotation = player.rotation;
    player.trailIndex = (player.trailIndex + 1) % GAME_CONSTANTS.PLAYER_TRAIL_LENGTH;
  }

  // Keep in bounds
  player.x = Math.max(player.width, Math.min(game.world.width - player.width, player.x));
  player.y = Math.max(player.height, Math.min(game.world.height - player.height, player.y));

  // Update camera - exact same as cave-explorer
  game.camera.x += (player.x - game.camera.x) * GAME_CONSTANTS.CAMERA_FOLLOW_SPEED;
  game.camera.y += (player.y - game.camera.y) * GAME_CONSTANTS.CAMERA_FOLLOW_SPEED;
}

export function updateGame(game: GameState): void {
  updatePlayer(game);
}
