import { Boid, Rock, Point } from './types';
import { GAME_CONSTANTS } from './constants';
import { checkRockCollision } from './physics';

export function generateBoids(
  playerPos: Point,
  rocks: Rock[]
): Boid[] {
  const boids: Boid[] = [];

  const isVisible = (x: number, y: number): boolean => {
    const dist = Math.sqrt((x - playerPos.x) ** 2 + (y - playerPos.y) ** 2);
    return dist < GAME_CONSTANTS.BOID_VISIBILITY_RADIUS;
  };

  let attempts = 0;
  while (boids.length < GAME_CONSTANTS.BOID_COUNT && attempts < GAME_CONSTANTS.BOID_COUNT * 20) {
    const x = Math.random() * GAME_CONSTANTS.WORLD_WIDTH;
    const y = Math.random() * GAME_CONSTANTS.WORLD_HEIGHT;

    if (!checkRockCollision(x, y, rocks) && !isVisible(x, y)) {
      boids.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: GAME_CONSTANTS.BOID_SIZE,
        trail: []
      });
    }
    attempts++;
  }

  return boids;
}

export function spawnBoid(
  playerPos: Point,
  rocks: Rock[],
  maxAttempts: number = 20
): Boid | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = Math.random() * GAME_CONSTANTS.WORLD_WIDTH;
    const y = Math.random() * GAME_CONSTANTS.WORLD_HEIGHT;
    const distToPlayer = Math.sqrt((x - playerPos.x) ** 2 + (y - playerPos.y) ** 2);

    if (distToPlayer > GAME_CONSTANTS.BOID_VISIBILITY_RADIUS) {
      if (!checkRockCollision(x, y, rocks)) {
        return {
          x,
          y,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: GAME_CONSTANTS.BOID_SIZE,
          trail: []
        };
      }
    }
  }

  return null;
}
