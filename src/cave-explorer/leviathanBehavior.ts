import { Leviathan, Boid, Rock, Point } from './types';
import { GAME_CONSTANTS } from './constants';
import { checkRockCollision } from './physics';

export function updateLeviathans(
  leviathans: Leviathan[],
  playerPos: Point,
  boids: Boid[],
  rocks: Rock[]
): void {
  leviathans.forEach(levi => {
    const distToPlayer = Math.sqrt(
      (levi.x - playerPos.x) ** 2 + (levi.y - playerPos.y) ** 2
    );

    // Simplified update for far leviathans
    if (distToPlayer > GAME_CONSTANTS.LEVIATHAN_UPDATE_RADIUS) {
      levi.x += levi.vx * 0.3;
      levi.y += levi.vy * 0.3;
      return;
    }

    // Handle stun state
    if (levi.isStunned) {
      levi.stunTimer--;
      levi.vx = 0;
      levi.vy = 0;

      if (levi.stunTimer <= 0) {
        levi.isStunned = false;
      }
      return;
    }

    // Update cooldown
    if (levi.chargeCooldown > 0) {
      levi.chargeCooldown--;
    }

    // Determine target
    let targetX: number | null = null;
    let targetY: number | null = null;

    if (distToPlayer < GAME_CONSTANTS.LEVIATHAN_PLAYER_SWITCH_RADIUS) {
      targetX = playerPos.x;
      targetY = playerPos.y;
    } else {
      // Find nearest boid
      let nearestBoid: Boid | null = null;
      let nearestBoidDist = Infinity;

      for (const boid of boids) {
        const boidDx = boid.x - levi.x;
        const boidDy = boid.y - levi.y;
        const boidDist = Math.sqrt(boidDx * boidDx + boidDy * boidDy);

        if (boidDist < nearestBoidDist) {
          nearestBoidDist = boidDist;
          nearestBoid = boid;
        }
      }

      if (nearestBoid) {
        targetX = nearestBoid.x;
        targetY = nearestBoid.y;
      }
    }

    // Check if should start charging (only at player)
    if (!levi.isCharging &&
        levi.chargeCooldown === 0 &&
        distToPlayer < GAME_CONSTANTS.LEVIATHAN_CHARGE_DETECTION_RADIUS &&
        distToPlayer < GAME_CONSTANTS.LEVIATHAN_PLAYER_SWITCH_RADIUS) {
      levi.isCharging = true;
      levi.chargeTimer = GAME_CONSTANTS.LEVIATHAN_CHARGE_WINDUP;

      const dx = playerPos.x - levi.x;
      const dy = playerPos.y - levi.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      levi.chargeDirection = { x: dx / dist, y: dy / dist };
      levi.rotation = Math.atan2(levi.chargeDirection.y, levi.chargeDirection.x);
    }

    // Handle charging state
    if (levi.isCharging) {
      if (levi.chargeTimer > 0) {
        levi.chargeTimer--;
        levi.vx = 0;
        levi.vy = 0;
      } else if (levi.chargeTimer > -GAME_CONSTANTS.LEVIATHAN_CHARGE_DURATION) {
        levi.chargeTimer--;
        levi.vx = levi.chargeDirection.x * GAME_CONSTANTS.LEVIATHAN_CHARGE_SPEED;
        levi.vy = levi.chargeDirection.y * GAME_CONSTANTS.LEVIATHAN_CHARGE_SPEED;
      } else {
        levi.isCharging = false;
        levi.chargeCooldown = GAME_CONSTANTS.LEVIATHAN_CHARGE_COOLDOWN;
        levi.vx = levi.chargeDirection.x * 2;
        levi.vy = levi.chargeDirection.y * 2;
      }
    } else if (targetX !== null && targetY !== null) {
      // Pursue target
      const dx = targetX - levi.x;
      const dy = targetY - levi.y;
      const pursueDist = Math.sqrt(dx * dx + dy * dy);

      if (pursueDist > 0) {
        const pursueStrength = 0.3;
        levi.vx += (dx / pursueDist) * pursueStrength;
        levi.vy += (dy / pursueDist) * pursueStrength;
      }

      // Random variation
      levi.vx += (Math.random() - 0.5) * 0.05;
      levi.vy += (Math.random() - 0.5) * 0.05;

      // Wall avoidance
      let wallAvoidX = 0;
      let wallAvoidY = 0;
      const wallAvoidanceRadius = 100;

      for (const rock of rocks) {
        const rockDx = levi.x - rock.x;
        const rockDy = levi.y - rock.y;
        const rockDist = Math.sqrt(rockDx * rockDx + rockDy * rockDy);

        if (rockDist < wallAvoidanceRadius + rock.width / 2) {
          const effectiveDist = rockDist - rock.width / 2;
          if (effectiveDist < wallAvoidanceRadius && effectiveDist > 0) {
            const strength = (wallAvoidanceRadius - effectiveDist) / wallAvoidanceRadius;
            wallAvoidX += (rockDx / rockDist) * strength * 1.2;
            wallAvoidY += (rockDy / rockDist) * strength * 1.2;
          }
        }
      }

      levi.vx += wallAvoidX;
      levi.vy += wallAvoidY;
    } else {
      // Random wandering
      if (Math.random() < 0.02) {
        levi.vx += (Math.random() - 0.5) * 0.5;
        levi.vy += (Math.random() - 0.5) * 0.5;
      }

      levi.vx += (Math.random() - 0.5) * 0.1;
      levi.vy += (Math.random() - 0.5) * 0.1;
    }

    // Limit speed
    const currentMaxSpeed = (levi.isCharging &&
                             levi.chargeTimer <= 0 &&
                             levi.chargeTimer > -GAME_CONSTANTS.LEVIATHAN_CHARGE_DURATION)
      ? GAME_CONSTANTS.LEVIATHAN_CHARGE_SPEED
      : GAME_CONSTANTS.LEVIATHAN_MAX_SPEED;

    const speed = Math.sqrt(levi.vx * levi.vx + levi.vy * levi.vy);
    if (speed > currentMaxSpeed) {
      levi.vx = (levi.vx / speed) * currentMaxSpeed;
      levi.vy = (levi.vy / speed) * currentMaxSpeed;
    }

    // Update rotation
    if (!levi.isCharging && speed > 0.1) {
      levi.rotation = Math.atan2(levi.vy, levi.vx);
    }

    // Update position
    const newX = levi.x + levi.vx;
    const newY = levi.y + levi.vy;

    if (!checkRockCollision(newX, newY, rocks, levi.width, levi.height)) {
      levi.trail.push({ x: levi.x, y: levi.y });
      if (levi.trail.length > GAME_CONSTANTS.LEVIATHAN_TRAIL_LENGTH) {
        levi.trail.shift();
      }
      levi.x = newX;
      levi.y = newY;
    } else {
      // Hit wall
      if (levi.isCharging &&
          levi.chargeTimer <= 0 &&
          levi.chargeTimer > -GAME_CONSTANTS.LEVIATHAN_CHARGE_DURATION) {
        // Hit wall while dashing - become stunned
        levi.isCharging = false;
        levi.isStunned = true;
        levi.stunTimer = GAME_CONSTANTS.LEVIATHAN_STUN_DURATION;
        levi.chargeCooldown = GAME_CONSTANTS.LEVIATHAN_CHARGE_COOLDOWN;
        levi.vx = 0;
        levi.vy = 0;
      } else {
        // Normal wall bounce
        levi.vx *= -0.9;
        levi.vy *= -0.9;
      }
    }

    // Wrap around world
    if (levi.x < 0) levi.x = GAME_CONSTANTS.WORLD_WIDTH;
    if (levi.x > GAME_CONSTANTS.WORLD_WIDTH) levi.x = 0;
    if (levi.y < 0) levi.y = GAME_CONSTANTS.WORLD_HEIGHT;
    if (levi.y > GAME_CONSTANTS.WORLD_HEIGHT) levi.y = 0;
  });
}
