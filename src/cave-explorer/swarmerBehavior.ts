import { Swarmer, Rock, Point, Projectile } from './types';
import { GAME_CONSTANTS } from './constants';
import { checkRockCollision } from './physics';

export function updateSwarmers(
  swarmers: Swarmer[],
  playerPos: Point,
  rocks: Rock[],
  projectiles: Projectile[],
  frameCount: number
): void {
  swarmers.forEach(swarmer => {
    // Cache direction and distance to player (calculated once and reused)
    const dx = playerPos.x - swarmer.x;
    const dy = playerPos.y - swarmer.y;
    const distToPlayer = Math.sqrt(dx * dx + dy * dy);

    // Simplified update for far swarmers
    if (distToPlayer > GAME_CONSTANTS.SWARMER_UPDATE_RADIUS) {
      swarmer.x += swarmer.vx * 0.3;
      swarmer.y += swarmer.vy * 0.3;
      return;
    }

    // Shoot projectiles at player (with max count check for performance)
    const timeSinceLastShot = frameCount - swarmer.lastShootTime;
    if (timeSinceLastShot >= GAME_CONSTANTS.PROJECTILE_SHOOT_INTERVAL &&
        projectiles.length < GAME_CONSTANTS.PROJECTILE_MAX_COUNT) {

      if (distToPlayer > 0) {
        // Create projectile using cached distance
        const projectile: Projectile = {
          x: swarmer.x,
          y: swarmer.y,
          vx: (dx / distToPlayer) * GAME_CONSTANTS.PROJECTILE_SPEED,
          vy: (dy / distToPlayer) * GAME_CONSTANTS.PROJECTILE_SPEED,
          radius: GAME_CONSTANTS.PROJECTILE_RADIUS
        };
        projectiles.push(projectile);
        swarmer.lastShootTime = frameCount;
      }
    }

    // Gentle attraction to player using cached distance
    if (distToPlayer > 0) {
      const pursueStrength = 0.15;
      swarmer.vx += (dx / distToPlayer) * pursueStrength;
      swarmer.vy += (dy / distToPlayer) * pursueStrength;
    }

    // Random variation for natural movement
    swarmer.vx += (Math.random() - 0.5) * 0.1;
    swarmer.vy += (Math.random() - 0.5) * 0.1;

    // Optimized wall avoidance - only check nearby rocks
    let wallAvoidX = 0;
    let wallAvoidY = 0;
    const wallAvoidanceRadius = 100;
    const maxCheckRadius = 200; // Pre-filter rocks by distance
    let rocksChecked = 0;
    const maxRocksToCheck = 10; // Limit number of rocks to check

    for (const rock of rocks) {
      // Quick distance check without sqrt
      const rockDx = swarmer.x - rock.x;
      const rockDy = swarmer.y - rock.y;
      const distSq = rockDx * rockDx + rockDy * rockDy;

      // Skip if too far
      if (distSq > maxCheckRadius * maxCheckRadius) continue;

      // Limit number of rocks checked for performance
      if (++rocksChecked > maxRocksToCheck) break;

      const rockDist = Math.sqrt(distSq);
      if (rockDist < wallAvoidanceRadius + rock.width / 2) {
        const effectiveDist = rockDist - rock.width / 2;
        if (effectiveDist < wallAvoidanceRadius && effectiveDist > 0) {
          const strength = (wallAvoidanceRadius - effectiveDist) / wallAvoidanceRadius;
          wallAvoidX += (rockDx / rockDist) * strength * 1.2;
          wallAvoidY += (rockDy / rockDist) * strength * 1.2;
        }
      }
    }

    swarmer.vx += wallAvoidX;
    swarmer.vy += wallAvoidY;

    // Limit speed
    const speed = Math.sqrt(swarmer.vx * swarmer.vx + swarmer.vy * swarmer.vy);
    if (speed > GAME_CONSTANTS.SWARMER_MAX_SPEED) {
      swarmer.vx = (swarmer.vx / speed) * GAME_CONSTANTS.SWARMER_MAX_SPEED;
      swarmer.vy = (swarmer.vy / speed) * GAME_CONSTANTS.SWARMER_MAX_SPEED;
    }

    // Update rotation to face movement direction
    if (speed > 0.1) {
      swarmer.rotation = Math.atan2(swarmer.vy, swarmer.vx);
    }

    // Update position
    const newX = swarmer.x + swarmer.vx;
    const newY = swarmer.y + swarmer.vy;

    if (!checkRockCollision(newX, newY, rocks, swarmer.width, swarmer.height)) {
      // Circular buffer: write to current index and advance (no shift needed!)
      swarmer.trail[swarmer.trailIndex].x = swarmer.x;
      swarmer.trail[swarmer.trailIndex].y = swarmer.y;
      swarmer.trailIndex = (swarmer.trailIndex + 1) % GAME_CONSTANTS.SWARMER_TRAIL_LENGTH;
      swarmer.x = newX;
      swarmer.y = newY;
    } else {
      // Bounce off walls
      swarmer.vx *= -0.9;
      swarmer.vy *= -0.9;
    }

    // Wrap around world
    if (swarmer.x < 0) swarmer.x = GAME_CONSTANTS.WORLD_WIDTH;
    if (swarmer.x > GAME_CONSTANTS.WORLD_WIDTH) swarmer.x = 0;
    if (swarmer.y < 0) swarmer.y = GAME_CONSTANTS.WORLD_HEIGHT;
    if (swarmer.y > GAME_CONSTANTS.WORLD_HEIGHT) swarmer.y = 0;
  });
}
