import { Rock, VoronoiRegion } from './types';
import { GAME_CONSTANTS } from './constants';

export function generateVoronoiWorld(): { rocks: Rock[], regions: VoronoiRegion[] } {
  const rocks: Rock[] = [];
  const regions: VoronoiRegion[] = [];

  // Generate Voronoi regions - exactly half rock, half air
  const totalRegions = GAME_CONSTANTS.VORONOI_REGIONS;
  const rockRegions = Math.floor(totalRegions / 2);

  for (let i = 0; i < totalRegions; i++) {
    regions.push({
      x: Math.random() * GAME_CONSTANTS.WORLD_WIDTH,
      y: Math.random() * GAME_CONSTANTS.WORLD_HEIGHT,
      isRock: i < rockRegions // First half are rocks, second half are air
    });
  }

  // Shuffle regions to randomize distribution
  for (let i = regions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [regions[i], regions[j]] = [regions[j], regions[i]];
  }

  // Clear starting area - ensure player can spawn
  const startX = GAME_CONSTANTS.WORLD_START_X;
  const startY = GAME_CONSTANTS.WORLD_START_Y;

  regions.forEach(r => {
    const dist = Math.sqrt((r.x - startX) ** 2 + (r.y - startY) ** 2);
    if (dist < GAME_CONSTANTS.CLEAR_RADIUS) {
      r.isRock = false;
    }
  });

  // Generate rocks based on Voronoi regions
  const gridSize = GAME_CONSTANTS.VORONOI_GRID_SIZE;

  for (let x = 0; x < GAME_CONSTANTS.WORLD_WIDTH; x += gridSize) {
    for (let y = 0; y < GAME_CONSTANTS.WORLD_HEIGHT; y += gridSize) {
      let nearestRegion = regions[0];
      let minDist = Infinity;

      // Find nearest region to this grid point
      for (const region of regions) {
        const dist = Math.sqrt((x - region.x) ** 2 + (y - region.y) ** 2);
        if (dist < minDist) {
          minDist = dist;
          nearestRegion = region;
        }
      }

      // Create rock if this grid point belongs to a rock region
      if (nearestRegion.isRock) {
        rocks.push({
          x: x,
          y: y,
          width: gridSize,
          height: gridSize,
        });
      }
    }
  }

  // Remove rocks too close to starting position (safe spawn area)
  const filteredRocks = rocks.filter(rock => {
    const dist = Math.sqrt((rock.x - startX) ** 2 + (rock.y - startY) ** 2);
    return dist > GAME_CONSTANTS.CLEAR_RADIUS;
  });

  return { rocks: filteredRocks, regions };
}

// Helper function to check if a point is in a rock region
export function isInRock(x: number, y: number, rocks: Rock[]): boolean {
  for (const rock of rocks) {
    if (x >= rock.x && x < rock.x + rock.width &&
        y >= rock.y && y < rock.y + rock.height) {
      return true;
    }
  }
  return false;
}

// Find a safe spawn position (not in a rock)
export function findSafeSpawnPosition(rocks: Rock[]): { x: number, y: number } {
  const startX = GAME_CONSTANTS.WORLD_START_X;
  const startY = GAME_CONSTANTS.WORLD_START_Y;

  // Check if starting position is safe
  if (!isInRock(startX, startY, rocks)) {
    return { x: startX, y: startY };
  }

  // Try to find a safe position in a spiral pattern from the center
  const checkRadius = 50;
  const angleStep = Math.PI / 8; // 22.5 degrees

  for (let radius = checkRadius; radius < 1000; radius += checkRadius) {
    for (let angle = 0; angle < Math.PI * 2; angle += angleStep) {
      const x = startX + Math.cos(angle) * radius;
      const y = startY + Math.sin(angle) * radius;

      if (!isInRock(x, y, rocks)) {
        return { x, y };
      }
    }
  }

  // Fallback - should never happen with cleared spawn area
  return { x: startX, y: startY };
}
