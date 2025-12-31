import { Boid, Rock, Point } from './types';
import { GAME_CONSTANTS } from './constants';
import { checkRockCollision } from './physics';

export function updateBoids(
  boids: Boid[],
  playerPos: Point,
  rocks: Rock[]
): void {
  const updateRadius = 1200;

  boids.forEach(boid => {
    const distToPlayer = Math.sqrt(
      (boid.x - playerPos.x) ** 2 + (boid.y - playerPos.y) ** 2
    );

    // Simplified update for far boids
    if (distToPlayer > updateRadius) {
      boid.x += boid.vx * 0.5;
      boid.y += boid.vy * 0.5;
      return;
    }

    // Calculate max speed (flee faster when near player)
    let maxSpeed = GAME_CONSTANTS.BOID_BASE_MAX_SPEED;
    const playerAvoidanceRadius = 150;

    if (distToPlayer < playerAvoidanceRadius) {
      const fleeSpeedMultiplier = 1 + (playerAvoidanceRadius - distToPlayer) / playerAvoidanceRadius;
      maxSpeed = GAME_CONSTANTS.BOID_BASE_MAX_SPEED * fleeSpeedMultiplier;
    }

    // Flocking forces
    let separationForceX = 0;
    let separationForceY = 0;
    let alignmentForceX = 0;
    let alignmentForceY = 0;
    let cohesionForceX = 0;
    let cohesionForceY = 0;
    let neighborsCount = 0;

    boids.forEach(other => {
      if (boid === other) return;

      const dx = other.x - boid.x;
      const dy = other.y - boid.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < GAME_CONSTANTS.BOID_PERCEPTION_RADIUS && dist > 0) {
        neighborsCount++;

        if (dist < GAME_CONSTANTS.BOID_SEPARATION_DISTANCE) {
          separationForceX -= dx / dist;
          separationForceY -= dy / dist;
        }

        alignmentForceX += other.vx;
        alignmentForceY += other.vy;
        cohesionForceX += dx;
        cohesionForceY += dy;
      }
    });

    if (neighborsCount > 0) {
      alignmentForceX /= neighborsCount;
      alignmentForceY /= neighborsCount;
      cohesionForceX /= neighborsCount;
      cohesionForceY /= neighborsCount;
    }

    // Player avoidance
    let playerAvoidX = 0;
    let playerAvoidY = 0;
    if (distToPlayer < playerAvoidanceRadius) {
      const dx = boid.x - playerPos.x;
      const dy = boid.y - playerPos.y;
      const strength = (playerAvoidanceRadius - distToPlayer) / playerAvoidanceRadius;
      playerAvoidX = (dx / distToPlayer) * strength * 3;
      playerAvoidY = (dy / distToPlayer) * strength * 3;
    }

    // Wall avoidance
    let wallAvoidX = 0;
    let wallAvoidY = 0;
    const wallAvoidanceRadius = 80;

    for (const rock of rocks) {
      const dx = boid.x - rock.x;
      const dy = boid.y - rock.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < wallAvoidanceRadius + rock.width / 2) {
        const effectiveDist = dist - rock.width / 2;
        if (effectiveDist < wallAvoidanceRadius && effectiveDist > 0) {
          const strength = (wallAvoidanceRadius - effectiveDist) / wallAvoidanceRadius;
          wallAvoidX += (dx / dist) * strength * 0.8;
          wallAvoidY += (dy / dist) * strength * 0.8;
        }
      }
    }

    // Apply forces
    boid.vx += separationForceX * 0.35;
    boid.vy += separationForceY * 0.35;
    boid.vx += alignmentForceX * 0.05;
    boid.vy += alignmentForceY * 0.05;
    boid.vx += cohesionForceX * 0.02;
    boid.vy += cohesionForceY * 0.02;
    boid.vx += playerAvoidX;
    boid.vy += playerAvoidY;
    boid.vx += wallAvoidX;
    boid.vy += wallAvoidY;

    // Limit speed
    const speed = Math.sqrt(boid.vx * boid.vx + boid.vy * boid.vy);
    if (speed > maxSpeed) {
      boid.vx = (boid.vx / speed) * maxSpeed;
      boid.vy = (boid.vy / speed) * maxSpeed;
    }

    // Update position
    const newX = boid.x + boid.vx;
    const newY = boid.y + boid.vy;

    if (!checkRockCollision(newX, newY, rocks)) {
      boid.trail.push({ x: boid.x, y: boid.y });
      if (boid.trail.length > GAME_CONSTANTS.BOID_TRAIL_LENGTH) {
        boid.trail.shift();
      }

      boid.x = newX;
      boid.y = newY;
    } else {
      boid.vx *= -0.8;
      boid.vy *= -0.8;
    }

    // Wrap around world
    if (boid.x < 0) boid.x = GAME_CONSTANTS.WORLD_WIDTH;
    if (boid.x > GAME_CONSTANTS.WORLD_WIDTH) boid.x = 0;
    if (boid.y < 0) boid.y = GAME_CONSTANTS.WORLD_HEIGHT;
    if (boid.y > GAME_CONSTANTS.WORLD_HEIGHT) boid.y = 0;
  });
}
