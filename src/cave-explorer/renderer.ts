import { GameState, Point } from './types';
import { GAME_CONSTANTS } from './constants';
import { rayRectIntersection } from './physics';

export function renderGame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  game: GameState
): void {
  // Clear canvas with water background
  ctx.fillStyle = '#2a3a4a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1.0;

  ctx.save();

  // Camera transform
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(game.camera.zoom, game.camera.zoom);
  ctx.translate(-game.camera.x, -game.camera.y);

  // Draw grid
  drawGrid(ctx, canvas, game);

  // Draw world boundary
  ctx.strokeStyle = '#ff0044';
  ctx.lineWidth = 5 / game.camera.zoom;
  ctx.strokeRect(0, 0, game.world.width, game.world.height);

  // Calculate line of sight
  const rayEndpoints = calculateLineOfSight(game);

  // Draw rocks
  drawRocks(ctx, game);

  // Draw shadow overlay
  drawShadows(ctx, game, rayEndpoints);

  // Draw entities
  drawBoids(ctx, game, rayEndpoints);
  drawFoodOrbs(ctx, game, rayEndpoints);
  drawLeviathans(ctx, game, rayEndpoints);
  drawPlayer(ctx, game);

  ctx.restore();

  // Reset compositing
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1.0;

  // Draw HUD
  drawHUD(ctx, canvas, game);
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  game: GameState
): void {
  const gridSize = GAME_CONSTANTS.GRID_SIZE;
  const startX = Math.floor(game.camera.x - canvas.width / (2 * game.camera.zoom) / gridSize) * gridSize;
  const endX = Math.ceil(game.camera.x + canvas.width / (2 * game.camera.zoom) / gridSize) * gridSize;
  const startY = Math.floor(game.camera.y - canvas.height / (2 * game.camera.zoom) / gridSize) * gridSize;
  const endY = Math.ceil(game.camera.y + canvas.height / (2 * game.camera.zoom) / gridSize) * gridSize;

  ctx.strokeStyle = '#1a2a3a';
  ctx.lineWidth = 1 / game.camera.zoom;

  for (let x = startX; x <= endX; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, game.world.height);
    ctx.stroke();
  }

  for (let y = startY; y <= endY; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(game.world.width, y);
    ctx.stroke();
  }
}

function calculateLineOfSight(game: GameState): Point[] {
  const rayEndpoints: Point[] = [];
  const maxDistance = GAME_CONSTANTS.LINE_OF_SIGHT_DISTANCE;

  for (let i = 0; i < GAME_CONSTANTS.LINE_OF_SIGHT_RAYS; i++) {
    const angle = (i / GAME_CONSTANTS.LINE_OF_SIGHT_RAYS) * Math.PI * 2;
    const rayDir = {
      x: Math.cos(angle),
      y: Math.sin(angle)
    };

    let closestT = maxDistance;

    for (const rock of game.world.rocks) {
      const t = rayRectIntersection(game.player, rayDir, rock);
      if (t !== null && t < closestT) {
        closestT = t;
      }
    }

    const endpoint = {
      x: game.player.x + rayDir.x * closestT,
      y: game.player.y + rayDir.y * closestT
    };

    if (game.previousRayEndpoints[i]) {
      const smoothFactor = 0.5;
      endpoint.x = game.previousRayEndpoints[i].x + (endpoint.x - game.previousRayEndpoints[i].x) * smoothFactor;
      endpoint.y = game.previousRayEndpoints[i].y + (endpoint.y - game.previousRayEndpoints[i].y) * smoothFactor;
    }

    rayEndpoints.push(endpoint);
  }

  game.previousRayEndpoints = rayEndpoints.map(ep => ({ x: ep.x, y: ep.y }));

  return rayEndpoints;
}

function drawRocks(ctx: CanvasRenderingContext2D, game: GameState): void {
  ctx.fillStyle = '#ffffff';
  game.world.rocks.forEach(rock => {
    ctx.save();
    ctx.translate(rock.x, rock.y);
    ctx.rotate(rock.rotation);
    ctx.fillRect(-rock.width / 2, -rock.height / 2, rock.width, rock.height);
    ctx.restore();
  });
}

function drawShadows(
  ctx: CanvasRenderingContext2D,
  game: GameState,
  rayEndpoints: Point[]
): void {
  ctx.save();
  ctx.fillStyle = 'rgba(5, 5, 10, 0.88)';
  ctx.fillRect(0, 0, game.world.width, game.world.height);

  ctx.globalCompositeOperation = 'destination-out';

  const maxDistance = GAME_CONSTANTS.LINE_OF_SIGHT_DISTANCE;
  const gradient = ctx.createRadialGradient(
    game.player.x, game.player.y, 0,
    game.player.x, game.player.y, maxDistance
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  if (rayEndpoints.length > 0) {
    ctx.beginPath();
    ctx.moveTo(rayEndpoints[0].x, rayEndpoints[0].y);
    for (let i = 1; i < rayEndpoints.length; i++) {
      ctx.lineTo(rayEndpoints[i].x, rayEndpoints[i].y);
    }
    ctx.closePath();
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

function drawBoids(
  ctx: CanvasRenderingContext2D,
  game: GameState,
  rayEndpoints: Point[]
): void {
  const maxDistance = GAME_CONSTANTS.LINE_OF_SIGHT_DISTANCE;

  game.boids.forEach(boid => {
    const dx = boid.x - game.player.x;
    const dy = boid.y - game.player.y;
    const distToBoid = Math.sqrt(dx * dx + dy * dy);

    if (distToBoid > maxDistance) return;

    // Check line of sight
    let blocked = false;
    if (distToBoid > 100) {
      const rayDir = { x: dx / distToBoid, y: dy / distToBoid };

      for (const rock of game.world.rocks) {
        const rockDx = rock.x - game.player.x;
        const rockDy = rock.y - game.player.y;
        const rockDist = Math.sqrt(rockDx * rockDx + rockDy * rockDy);

        if (rockDist > distToBoid + 100) continue;

        const t = rayRectIntersection(game.player, rayDir, rock);
        if (t !== null && t < distToBoid - 10) {
          blocked = true;
          break;
        }
      }
    }

    if (blocked) return;

    // Draw trail
    if (boid.trail && boid.trail.length > 0) {
      for (let i = 0; i < boid.trail.length; i++) {
        const trailPos = boid.trail[i];
        const age = i / boid.trail.length;
        const alpha = age * age * 0.4;
        const size = 2 + age * 6;

        ctx.fillStyle = `rgba(255, 105, 180, ${alpha})`;
        ctx.beginPath();
        ctx.arc(trailPos.x, trailPos.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw boid
    ctx.save();
    ctx.translate(boid.x, boid.y);

    const boidGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
    boidGradient.addColorStop(0, 'rgba(255, 105, 180, 0.4)');
    boidGradient.addColorStop(0.5, 'rgba(255, 105, 180, 0.2)');
    boidGradient.addColorStop(1, 'rgba(255, 105, 180, 0)');
    ctx.fillStyle = boidGradient;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();

    const angle = Math.atan2(boid.vy, boid.vx);
    ctx.rotate(angle);

    ctx.fillStyle = '#ff69b4';
    ctx.beginPath();
    const height = boid.size * Math.sqrt(3);
    ctx.moveTo(height, 0);
    ctx.lineTo(0, boid.size);
    ctx.lineTo(0, -boid.size);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  });
}

function drawFoodOrbs(
  ctx: CanvasRenderingContext2D,
  game: GameState,
  rayEndpoints: Point[]
): void {
  const maxDistance = GAME_CONSTANTS.LINE_OF_SIGHT_DISTANCE;

  game.foodOrbs.forEach(orb => {
    const dx = orb.x - game.player.x;
    const dy = orb.y - game.player.y;
    const distToOrb = Math.sqrt(dx * dx + dy * dy);

    if (distToOrb > maxDistance) return;

    // Check line of sight
    let blocked = false;
    if (distToOrb > 100) {
      const rayDir = { x: dx / distToOrb, y: dy / distToOrb };

      for (const rock of game.world.rocks) {
        const rockDx = rock.x - game.player.x;
        const rockDy = rock.y - game.player.y;
        const rockDist = Math.sqrt(rockDx * rockDx + rockDy * rockDy);

        if (rockDist > distToOrb + 100) continue;

        const t = rayRectIntersection(game.player, rayDir, rock);
        if (t !== null && t < distToOrb - 10) {
          blocked = true;
          break;
        }
      }
    }

    if (blocked) return;

    // Draw glow effect
    ctx.save();
    ctx.translate(orb.x, orb.y);

    // Outer glow
    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, orb.size * 3);
    glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
    glowGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
    glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, orb.size * 3, 0, Math.PI * 2);
    ctx.fill();

    // Inner orb
    const orbGradient = ctx.createRadialGradient(-orb.size / 3, -orb.size / 3, 0, 0, 0, orb.size);
    orbGradient.addColorStop(0, '#fffacd');
    orbGradient.addColorStop(0.5, '#ffd700');
    orbGradient.addColorStop(1, '#daa520');
    ctx.fillStyle = orbGradient;
    ctx.beginPath();
    ctx.arc(0, 0, orb.size, 0, Math.PI * 2);
    ctx.fill();

    // Shimmer effect
    const shimmerAlpha = (Math.sin(Date.now() / 200) + 1) / 2 * 0.3;
    ctx.fillStyle = `rgba(255, 255, 255, ${shimmerAlpha})`;
    ctx.beginPath();
    ctx.arc(-orb.size / 3, -orb.size / 3, orb.size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
}

function drawLeviathans(
  ctx: CanvasRenderingContext2D,
  game: GameState,
  rayEndpoints: Point[]
): void {
  const maxDistance = GAME_CONSTANTS.LINE_OF_SIGHT_DISTANCE;

  game.leviathans.forEach(levi => {
    const dx = levi.x - game.player.x;
    const dy = levi.y - game.player.y;
    const distToLevi = Math.sqrt(dx * dx + dy * dy);

    if (distToLevi > maxDistance) return;

    // Check line of sight
    let blocked = false;
    if (distToLevi > 150) {
      const rayDir = { x: dx / distToLevi, y: dy / distToLevi };

      for (const rock of game.world.rocks) {
        const rockDx = rock.x - game.player.x;
        const rockDy = rock.y - game.player.y;
        const rockDist = Math.sqrt(rockDx * rockDx + rockDy * rockDy);

        if (rockDist > distToLevi + 100) continue;

        const t = rayRectIntersection(game.player, rayDir, rock);
        if (t !== null && t < distToLevi - 20) {
          blocked = true;
          break;
        }
      }
    }

    if (blocked) return;

    // Draw trail
    if (levi.trail && levi.trail.length > 0) {
      for (let i = 0; i < levi.trail.length; i++) {
        const trailPos = levi.trail[i];
        const age = i / levi.trail.length;
        const alpha = age * age * 0.4;
        const size = 6 + age * 18;

        const color = levi.isGolden
          ? `rgba(255, 0, 0, ${alpha})`
          : `rgba(255, 0, 0, ${alpha})`;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(trailPos.x, trailPos.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.save();
    ctx.translate(levi.x, levi.y);

    // Glow effect
    const leviGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 60);
    if (levi.isGolden) {
      leviGradient.addColorStop(0, 'rgba(255, 0, 0, 0.4)');
      leviGradient.addColorStop(0.5, 'rgba(255, 0, 0, 0.2)');
      leviGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    } else {
      leviGradient.addColorStop(0, 'rgba(255, 0, 0, 0.4)');
      leviGradient.addColorStop(0.5, 'rgba(255, 0, 0, 0.2)');
      leviGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    }
    ctx.fillStyle = leviGradient;
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.fill();

    // Draw charge warning
    if (levi.isCharging && levi.chargeTimer > 0) {
      const lineLength = 300;
      const endX = levi.chargeDirection.x * lineLength;
      const endY = levi.chargeDirection.y * lineLength;

      const pulseAlpha = 0.3 + Math.sin(levi.chargeTimer * 0.2) * 0.3;

      ctx.strokeStyle = `rgba(255, 0, 0, ${pulseAlpha})`;
      ctx.lineWidth = 4 / game.camera.zoom;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Arrowhead
      const arrowSize = 15;
      const angle = Math.atan2(levi.chargeDirection.y, levi.chargeDirection.x);
      ctx.fillStyle = `rgba(255, 0, 0, ${pulseAlpha})`;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowSize * Math.cos(angle - Math.PI / 6),
        endY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        endX - arrowSize * Math.cos(angle + Math.PI / 6),
        endY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }

    ctx.rotate(levi.rotation);

    // Draw body
    const leviSize = levi.height / 2;
    const leviHeight = leviSize * Math.sqrt(3);

    ctx.fillStyle = levi.isGolden ? '#ff0000' : '#ff0000';
    ctx.beginPath();
    ctx.moveTo(leviHeight, 0);
    ctx.lineTo(0, leviSize);
    ctx.lineTo(0, -leviSize);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Draw stun stars
    if (levi.isStunned) {
      ctx.save();
      ctx.translate(levi.x, levi.y);

      const numStars = 3;
      const starRadius = 50;
      const spinSpeed = levi.stunTimer * 0.1;

      for (let i = 0; i < numStars; i++) {
        const angle = (i / numStars) * Math.PI * 2 + spinSpeed;
        const starX = Math.cos(angle) * starRadius;
        const starY = Math.sin(angle) * starRadius - 60;

        ctx.fillStyle = '#ffff00';
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 2;

        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
          const starAngle = (j / 5) * Math.PI * 2 - Math.PI / 2;
          const radius = j % 2 === 0 ? 8 : 4;
          const x = starX + Math.cos(starAngle) * radius;
          const y = starY + Math.sin(starAngle) * radius;
          if (j === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }
  });
}

function drawPlayer(ctx: CanvasRenderingContext2D, game: GameState): void {
  const player = game.player;

  // Draw trail
  if (player.trail && player.trail.length > 0) {
    for (let i = 0; i < player.trail.length; i++) {
      const trailPos = player.trail[i];
      const age = i / player.trail.length;
      const alpha = age * age * 0.5;
      const size = 5 + age * 25;

      ctx.fillStyle = `rgba(0, 100, 150, ${alpha})`;
      ctx.beginPath();
      ctx.arc(trailPos.x, trailPos.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.save();
  ctx.translate(player.x, player.y);

  // Invincibility glow
  if (player.invincible) {
    const invincGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 80);
    const pulse = Math.sin(player.invincibilityTimer * 0.3) * 0.3 + 0.5;
    invincGlow.addColorStop(0, `rgba(255, 215, 0, ${pulse * 0.6})`);
    invincGlow.addColorStop(0.5, `rgba(255, 215, 0, ${pulse * 0.3})`);
    invincGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = invincGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 80, 0, Math.PI * 2);
    ctx.fill();
  }

  // Body glow
  const playerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 60);
  playerGlow.addColorStop(0, 'rgba(0, 100, 150, 0.5)');
  playerGlow.addColorStop(0.5, 'rgba(0, 100, 150, 0.3)');
  playerGlow.addColorStop(1, 'rgba(0, 100, 150, 0)');
  ctx.fillStyle = playerGlow;
  ctx.beginPath();
  ctx.arc(0, 0, 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(player.rotation);

  // Draw rounded rectangle body
  ctx.fillStyle = '#00d9ff';
  const radius = 8;
  const x = -player.width / 2;
  const y = -player.height / 2;
  const w = player.width;
  const h = player.height;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();

  // Draw spike
  const spikeLength = GAME_CONSTANTS.PLAYER_SPIKE_LENGTH;
  const spikeWidth = GAME_CONSTANTS.PLAYER_SPIKE_WIDTH;
  const frontY = -player.height / 2;

  const spikeGradient = ctx.createLinearGradient(0, frontY, 0, frontY - spikeLength);
  spikeGradient.addColorStop(0, '#00d9ff');
  spikeGradient.addColorStop(0.3, '#33e0ff');
  spikeGradient.addColorStop(1, '#66e7ff');

  ctx.fillStyle = spikeGradient;
  ctx.beginPath();
  ctx.moveTo(0, frontY - spikeLength);
  ctx.lineTo(spikeWidth, frontY);
  ctx.lineTo(-spikeWidth, frontY);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  game: GameState
): void {
  // Position info
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px monospace';
  ctx.fillText(`Position: (${Math.round(game.player.x)}, ${Math.round(game.player.y)})`, 10, 25);
  ctx.fillText(`Speed: ${Math.abs(game.player.speed).toFixed(2)}`, 10, 50);
  ctx.fillText(`Rotation: ${(game.player.rotation * 180 / Math.PI).toFixed(1)}°`, 10, 75);

  // Shell fragments counter
  ctx.save();
  const fragmentY = 100;

  // Draw red triangle symbol
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.moveTo(10, fragmentY - 5);
  ctx.lineTo(20, fragmentY - 5);
  ctx.lineTo(15, fragmentY - 15);
  ctx.closePath();
  ctx.fill();

  // Draw fragment count
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px monospace';
  ctx.fillText('0/3', 25, fragmentY);
  ctx.restore();

  // Hunger bar
  const hungerBarX = canvas.width - 210;
  const hungerBarY = 10;
  const hungerBarWidth = 200;
  const hungerBarHeight = 30;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(hungerBarX, hungerBarY, hungerBarWidth, hungerBarHeight);

  const hungerPercent = game.player.hunger / game.player.maxHunger;
  if (hungerPercent > 0.5) {
    ctx.fillStyle = '#00ff88';
  } else if (hungerPercent > 0.25) {
    ctx.fillStyle = '#ffaa00';
  } else {
    ctx.fillStyle = '#ff3333';
  }
  ctx.fillRect(
    hungerBarX + 2,
    hungerBarY + 2,
    (hungerBarWidth - 4) * hungerPercent,
    hungerBarHeight - 4
  );

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(hungerBarX, hungerBarY, hungerBarWidth, hungerBarHeight);

  ctx.fillStyle = '#ffffff';
  ctx.font = '14px monospace';
  ctx.fillText(`Hunger: ${Math.round(game.player.hunger)}%`, hungerBarX + 10, hungerBarY + 20);

  // Controls
  ctx.font = '14px monospace';
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText(
    'W - Forward | S - Backward | A/D - Rotate | Eat pink fish!',
    10,
    canvas.height - 10
  );

  // Death screen
  if (game.player.isDead) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff3366';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU DIED', canvas.width / 2, canvas.height / 2 - 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px monospace';
    ctx.fillText('Touched by a giant fish!', canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText('Reload to restart', canvas.width / 2, canvas.height / 2 + 60);

    ctx.textAlign = 'left';
  }

  // Invincibility indicator
  if (game.player.invincible && !game.player.isDead) {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    const timeLeft = (game.player.invincibilityTimer / 60).toFixed(1);
    ctx.fillText(`⭐ INVINCIBLE: ${timeLeft}s ⭐`, canvas.width / 2, 30);
    ctx.textAlign = 'left';
  }
}
