import { Rock } from './types';
import { GAME_CONSTANTS } from './constants';

interface VoronoiRegion {
  x: number;
  y: number;
  isRock: boolean;
}

export function generateRocks(): Rock[] {
  const rocks: Rock[] = [];
  const regions: VoronoiRegion[] = [];

  // Generate Voronoi regions
  for (let i = 0; i < GAME_CONSTANTS.VORONOI_REGIONS; i++) {
    regions.push({
      x: Math.random() * GAME_CONSTANTS.WORLD_WIDTH,
      y: Math.random() * GAME_CONSTANTS.WORLD_HEIGHT,
      isRock: Math.random() > (1 - GAME_CONSTANTS.VORONOI_ROCK_PROBABILITY)
    });
  }

  // Clear starting area
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

      for (const region of regions) {
        const dist = Math.sqrt((x - region.x) ** 2 + (y - region.y) ** 2);
        if (dist < minDist) {
          minDist = dist;
          nearestRegion = region;
        }
      }

      if (nearestRegion.isRock) {
        rocks.push({
          x: x,
          y: y,
          width: gridSize * GAME_CONSTANTS.VORONOI_ROCK_SIZE_MULTIPLIER,
          height: gridSize * GAME_CONSTANTS.VORONOI_ROCK_SIZE_MULTIPLIER,
          rotation: 0
        });
      }
    }
  }

  // Create tunnels between regions
  for (let i = 0; i < GAME_CONSTANTS.TUNNEL_COUNT; i++) {
    const region1 = regions[Math.floor(Math.random() * regions.length)];
    const region2 = regions[Math.floor(Math.random() * regions.length)];

    for (let t = 0; t <= GAME_CONSTANTS.TUNNEL_STEPS; t++) {
      const progress = t / GAME_CONSTANTS.TUNNEL_STEPS;
      const tunnelX = region1.x + (region2.x - region1.x) * progress;
      const tunnelY = region1.y + (region2.y - region1.y) * progress;

      for (let j = rocks.length - 1; j >= 0; j--) {
        const rock = rocks[j];
        const dist = Math.sqrt((rock.x - tunnelX) ** 2 + (rock.y - tunnelY) ** 2);
        if (dist < GAME_CONSTANTS.TUNNEL_WIDTH) {
          rocks.splice(j, 1);
        }
      }
    }
  }

  // Remove rocks too close to starting position
  return rocks.filter(rock => {
    const dist = Math.sqrt((rock.x - startX) ** 2 + (rock.y - startY) ** 2);
    return dist > GAME_CONSTANTS.PLAYER_SAFE_RADIUS;
  });
}
