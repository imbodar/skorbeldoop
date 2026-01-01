import { Rock, Point } from './types';

export function checkRockCollision(
  x: number,
  y: number,
  rocks: Rock[],
  width: number = 20,
  height: number = 20,
  margin: number = 20
): boolean {
  for (const rock of rocks) {
    const dx = x - rock.x;
    const dy = y - rock.y;

    // Pre-filter: quick distance check before expensive rotation calculation
    // Use approximate bounding circle radius (diagonal of rock + entity + margin)
    const maxDimension = Math.max(rock.width, rock.height);
    const boundingRadius = (maxDimension / 2 + Math.max(width, height) / 2 + margin) * 1.5; // 1.5 = sqrt(2) buffer
    const distSq = dx * dx + dy * dy;

    // Skip this rock if it's too far
    if (distSq > boundingRadius * boundingRadius) continue;

    // Close enough - do expensive rotation calculation
    const cos = Math.cos(-rock.rotation);
    const sin = Math.sin(-rock.rotation);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    if (Math.abs(localX) < (rock.width / 2 + width / 2 + margin) &&
        Math.abs(localY) < (rock.height / 2 + height / 2 + margin)) {
      return true;
    }
  }
  return false;
}

export function rayRectIntersection(
  rayStart: Point,
  rayDir: Point,
  rock: Rock
): number | null {
  const dx = rayStart.x - rock.x;
  const dy = rayStart.y - rock.y;
  const cos = Math.cos(-rock.rotation);
  const sin = Math.sin(-rock.rotation);
  const localRayX = dx * cos - dy * sin;
  const localRayY = dx * sin + dy * cos;
  const localDirX = rayDir.x * cos - rayDir.y * sin;
  const localDirY = rayDir.x * sin + rayDir.y * cos;

  const halfW = rock.width / 2;
  const halfH = rock.height / 2;

  let tMin = -Infinity;
  let tMax = Infinity;

  if (Math.abs(localDirX) > 0.0001) {
    const t1 = (-halfW - localRayX) / localDirX;
    const t2 = (halfW - localRayX) / localDirX;
    tMin = Math.max(tMin, Math.min(t1, t2));
    tMax = Math.min(tMax, Math.max(t1, t2));
  } else if (Math.abs(localRayX) > halfW) {
    return null;
  }

  if (Math.abs(localDirY) > 0.0001) {
    const t1 = (-halfH - localRayY) / localDirY;
    const t2 = (halfH - localRayY) / localDirY;
    tMin = Math.max(tMin, Math.min(t1, t2));
    tMax = Math.min(tMax, Math.max(t1, t2));
  } else if (Math.abs(localRayY) > halfH) {
    return null;
  }

  if (tMax < tMin || tMax < 0) return null;

  const t = tMin > 0 ? tMin : tMax;
  return t > 0 ? t : null;
}

export function hasRocksNearby(
  x: number,
  y: number,
  rocks: Rock[],
  clearanceRadius: number = 400
): boolean {
  for (const rock of rocks) {
    const dx = x - rock.x;
    const dy = y - rock.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < clearanceRadius) {
      return true;
    }
  }
  return false;
}
