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

  // Check if boid area overlaps with rocks
  const isSafeSpawn = (x: number, y: number): boolean => {
    const checkRadius = GAME_CONSTANTS.BOID_SIZE;
    // Check center and a few points around the boid
    const checkPoints = [
      { x, y },
      { x: x + checkRadius, y },
      { x: x - checkRadius, y },
      { x, y: y + checkRadius },
      { x, y: y - checkRadius }
    ];
    return checkPoints.every(point => !isInRock(point.x, point.y, rocks));
  };

  let attempts = 0;
  while (boids.length < GAME_CONSTANTS.BOID_COUNT && attempts < GAME_CONSTANTS.BOID_COUNT * 20) {
    const x = Math.random() * GAME_CONSTANTS.WORLD_WIDTH;
    const y = Math.random() * GAME_CONSTANTS.WORLD_HEIGHT;

    if (isSafeSpawn(x, y) && !isVisible(x, y)) {
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
  playerX: number,
  playerY: number,
  rocks: Rock[],
  maxAttempts: number = 20
): Boid | null {
  // Check if boid area overlaps with rocks
  const isSafeSpawn = (x: number, y: number): boolean => {
    const checkRadius = GAME_CONSTANTS.BOID_SIZE;
    // Check center and a few points around the boid
    const checkPoints = [
      { x, y },
      { x: x + checkRadius, y },
      { x: x - checkRadius, y },
      { x, y: y + checkRadius },
      { x, y: y - checkRadius }
    ];
    return checkPoints.every(point => !isInRock(point.x, point.y, rocks));
  };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = Math.random() * GAME_CONSTANTS.WORLD_WIDTH;
    const y = Math.random() * GAME_CONSTANTS.WORLD_HEIGHT;
    const distToPlayer = Math.sqrt((x - playerX) ** 2 + (y - playerY) ** 2);

    if (distToPlayer > GAME_CONSTANTS.BOID_VISIBILITY_RADIUS && isSafeSpawn(x, y)) {
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

  return null;
}
