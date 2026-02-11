import { GameState, Point } from './types';
import { GAME_CONSTANTS } from './constants';
import { rayRectIntersection } from './physics';

/**
 * Calculate line of sight by casting rays in all directions from the player
 * Returns an array of endpoints where each ray terminates (either hitting a rock or reaching max distance)
 */
export function calculateLineOfSight(game: GameState): Point[] {
  const rayEndpoints: Point[] = [];
  const maxDistance = GAME_CONSTANTS.LINE_OF_SIGHT_DISTANCE;

  for (let i = 0; i < GAME_CONSTANTS.LINE_OF_SIGHT_RAYS; i++) {
    const angle = (i / GAME_CONSTANTS.LINE_OF_SIGHT_RAYS) * Math.PI * 2;
    const rayDir = {
      x: Math.cos(angle),
      y: Math.sin(angle)
    };

    let closestT = maxDistance;

    // Check intersection with all rocks
    for (const rock of game.rocks) {
      const t = rayRectIntersection(game.player, rayDir, rock);
      if (t !== null && t < closestT) {
        closestT = t;
      }
    }

    // Calculate the endpoint of this ray
    const endpoint = {
      x: game.player.x + rayDir.x * closestT,
      y: game.player.y + rayDir.y * closestT
    };

    // Apply smooth interpolation with previous frame for smooth shadows
    if (game.previousRayEndpoints[i]) {
      const smoothFactor = 0.5;
      endpoint.x = game.previousRayEndpoints[i].x + (endpoint.x - game.previousRayEndpoints[i].x) * smoothFactor;
      endpoint.y = game.previousRayEndpoints[i].y + (endpoint.y - game.previousRayEndpoints[i].y) * smoothFactor;
    }

    rayEndpoints.push(endpoint);
  }

  // Store endpoints for next frame's smoothing
  game.previousRayEndpoints = rayEndpoints.map(ep => ({ x: ep.x, y: ep.y }));

  return rayEndpoints;
}

/**
 * Draw shadows with a radial gradient revealing the visible area
 * Uses destination-out composite mode to cut visibility polygon through shadow layer
 */
export function drawShadows(
  ctx: CanvasRenderingContext2D,
  game: GameState,
  rayEndpoints: Point[]
): void {
  ctx.save();

  // Draw dark overlay covering the entire world
  ctx.fillStyle = `rgba(5, 5, 10, ${GAME_CONSTANTS.SHADOW_OPACITY})`;
  ctx.fillRect(0, 0, game.world.width, game.world.height);

  // Use destination-out to cut out the visible area
  ctx.globalCompositeOperation = 'destination-out';

  // Create radial gradient for smooth fade effect
  const maxDistance = GAME_CONSTANTS.LINE_OF_SIGHT_DISTANCE;
  const gradient = ctx.createRadialGradient(
    game.player.x, game.player.y, 0,
    game.player.x, game.player.y, maxDistance
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');     // Full visibility at center
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.9)'); // Smooth fade
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');     // No visibility at edge

  ctx.fillStyle = gradient;

  // Draw the visibility polygon using ray endpoints
  if (rayEndpoints.length > 0) {
    ctx.beginPath();
    ctx.moveTo(rayEndpoints[0].x, rayEndpoints[0].y);
    for (let i = 1; i < rayEndpoints.length; i++) {
      ctx.lineTo(rayEndpoints[i].x, rayEndpoints[i].y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Reset composite operation
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}
