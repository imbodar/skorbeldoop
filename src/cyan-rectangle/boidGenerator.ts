import { Boid, Rock } from './types';
import { GAME_CONSTANTS } from './constants';
import { isInRock } from './worldGenerator';

export function generateBoids(
  playerX: number,
  playerY: number,
  rocks: Rock[]
): Boid[] {
  const boids: Boid[] = [];

  const isVisible = (x: number, y: number): boolean => {
    const dist = Math.sqrt((x - playerX) ** 2 + (y - playerY) ** 2);
    return dist < GAME_CONSTANTS.BOID_VISIBILITY_RADIUS;
  };

  let attempts = 0;
  while (boids.length < GAME_CONSTANTS.BOID_COUNT && attempts < GAME_CONSTANTS.BOID_COUNT * 20) {
    const x = Math.random() * GAME_CONSTANTS.WORLD_WIDTH;
    const y = Math.random() * GAME_CONSTANTS.WORLD_HEIGHT;

    if (!isInRock(x, y, rocks) && !isVisible(x, y)) {
      // Pre-allocate trail array for circular buffer
      const trail = new Array(GAME_CONSTANTS.BOID_TRAIL_LENGTH);
      for (let i = 0; i < GAME_CONSTANTS.BOID_TRAIL_LENGTH; i++) {
        trail[i] = { x: 0, y: 0 };
      }
      boids.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: GAME_CONSTANTS.BOID_SIZE,
        trail,
        trailIndex: 0
      });
    }
    attempts++;
  }

  return boids;
}

export function spawnBoid(
  playerX: number,
  playerY: number,
  rocks: Rock[],
  maxAttempts: number = 20
): Boid | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = Math.random() * GAME_CONSTANTS.WORLD_WIDTH;
    const y = Math.random() * GAME_CONSTANTS.WORLD_HEIGHT;
    const distToPlayer = Math.sqrt((x - playerX) ** 2 + (y - playerY) ** 2);

    if (distToPlayer > GAME_CONSTANTS.BOID_VISIBILITY_RADIUS) {
      if (!isInRock(x, y, rocks)) {
        // Pre-allocate trail array for circular buffer
        const trail = new Array(GAME_CONSTANTS.BOID_TRAIL_LENGTH);
        for (let i = 0; i < GAME_CONSTANTS.BOID_TRAIL_LENGTH; i++) {
          trail[i] = { x: 0, y: 0 };
        }
        return {
          x,
          y,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: GAME_CONSTANTS.BOID_SIZE,
          trail,
          trailIndex: 0
        };
      }
    }
  }

  return null;
}
