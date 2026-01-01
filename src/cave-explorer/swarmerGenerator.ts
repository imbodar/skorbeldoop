import { Swarmer, Rock, Point } from './types';
import { GAME_CONSTANTS } from './constants';
import { checkRockCollision, hasRocksNearby } from './physics';

export function spawnSwarmer(
  playerPos: Point,
  rocks: Rock[],
  nearPlayer: boolean = false
): Swarmer | null {
  const swarmerWidth = GAME_CONSTANTS.PLAYER_WIDTH * GAME_CONSTANTS.SWARMER_WIDTH_MULTIPLIER;
  const swarmerHeight = GAME_CONSTANTS.PLAYER_HEIGHT * GAME_CONSTANTS.SWARMER_HEIGHT_MULTIPLIER;

  for (let attempt = 0; attempt < 100; attempt++) {
    let x: number, y: number;

    if (nearPlayer) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 200 + Math.random() * 200;
      x = playerPos.x + Math.cos(angle) * distance;
      y = playerPos.y + Math.sin(angle) * distance;
    } else {
      x = Math.random() * GAME_CONSTANTS.WORLD_WIDTH;
      y = Math.random() * GAME_CONSTANTS.WORLD_HEIGHT;
    }

    const distToPlayer = Math.sqrt((x - playerPos.x) ** 2 + (y - playerPos.y) ** 2);

    if (!checkRockCollision(x, y, rocks, swarmerWidth, swarmerHeight) &&
        !hasRocksNearby(x, y, rocks, 400)) {
      if (nearPlayer || distToPlayer > 800) {
        // Pre-allocate trail array for circular buffer (performance optimization)
        const trail = new Array(GAME_CONSTANTS.SWARMER_TRAIL_LENGTH);
        for (let i = 0; i < GAME_CONSTANTS.SWARMER_TRAIL_LENGTH; i++) {
          trail[i] = { x: 0, y: 0 };
        }
        return {
          x,
          y,
          width: swarmerWidth,
          height: swarmerHeight,
          vx: (Math.random() - 0.5) * 1,
          vy: (Math.random() - 0.5) * 1,
          rotation: Math.random() * Math.PI * 2,
          trail,
          trailIndex: 0,
          lastShootTime: 0
        };
      }
    }
  }

  return null;
}

export function generateSwarmers(
  playerPos: Point,
  rocks: Rock[],
  count: number = GAME_CONSTANTS.SWARMER_COUNT
): Swarmer[] {
  const swarmers: Swarmer[] = [];

  for (let i = 0; i < count; i++) {
    const swarmer = spawnSwarmer(playerPos, rocks, false);
    if (swarmer) {
      swarmers.push(swarmer);
    }
  }

  return swarmers;
}
