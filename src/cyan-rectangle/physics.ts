import { Point, Rock } from './types';

/**
 * Check if a ray intersects with an axis-aligned rectangle (rock)
 * Returns the distance parameter t where the ray hits the rectangle, or null if no hit
 */
export function rayRectIntersection(
  rayStart: Point,
  rayDir: Point,
  rock: Rock
): number | null {
  // For axis-aligned rectangles, we can use a simpler AABB ray intersection test
  const halfW = rock.width / 2;
  const halfH = rock.height / 2;

  // Get the center of the rock
  const rockCenterX = rock.x + halfW;
  const rockCenterY = rock.y + halfH;

  // Calculate the distance from the ray start to the rock bounds
  const dx = rockCenterX - rayStart.x;
  const dy = rockCenterY - rayStart.y;

  let tMin = -Infinity;
  let tMax = Infinity;

  // Check X axis intersection
  if (Math.abs(rayDir.x) > 0.0001) {
    const t1 = (rockCenterX - halfW - rayStart.x) / rayDir.x;
    const t2 = (rockCenterX + halfW - rayStart.x) / rayDir.x;
    tMin = Math.max(tMin, Math.min(t1, t2));
    tMax = Math.min(tMax, Math.max(t1, t2));
  } else if (Math.abs(dx) > halfW) {
    return null; // Ray is parallel to X axis and outside bounds
  }

  // Check Y axis intersection
  if (Math.abs(rayDir.y) > 0.0001) {
    const t1 = (rockCenterY - halfH - rayStart.y) / rayDir.y;
    const t2 = (rockCenterY + halfH - rayStart.y) / rayDir.y;
    tMin = Math.max(tMin, Math.min(t1, t2));
    tMax = Math.min(tMax, Math.max(t1, t2));
  } else if (Math.abs(dy) > halfH) {
    return null; // Ray is parallel to Y axis and outside bounds
  }

  // Check if there's a valid intersection
  if (tMax < tMin || tMax < 0) {
    return null;
  }

  const t = tMin > 0 ? tMin : tMax;
  return t > 0 ? t : null;
}
