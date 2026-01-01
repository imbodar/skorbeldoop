import { GameState } from './types';
import { GAME_CONSTANTS } from './constants';

export function renderGame(ctx: CanvasRenderingContext2D, game: GameState): void {
  const canvas = ctx.canvas;
  const player = game.player;
  const camera = game.camera;

  // Clear canvas
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Apply camera transform
  ctx.save();
  ctx.translate(canvas.width / 2 - camera.x, canvas.height / 2 - camera.y);

  // Draw grid for reference
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  const gridSize = 100;
  const startX = Math.floor((camera.x - canvas.width / 2) / gridSize) * gridSize;
  const startY = Math.floor((camera.y - canvas.height / 2) / gridSize) * gridSize;
  const endX = camera.x + canvas.width / 2;
  const endY = camera.y + canvas.height / 2;

  for (let x = startX; x < endX; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
  }
  for (let y = startY; y < endY; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
  }

  // Draw world bounds
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, game.world.width, game.world.height);

  // Draw fancy glowy trail
  if (player.trail && player.trail.length > 0) {
    for (let i = 0; i < player.trail.length; i++) {
      const trailPos = player.trail[i];
      if (trailPos.x === 0 && trailPos.y === 0) continue;

      const age = i / player.trail.length;
      const alpha = age * age * 0.5;
      const size = 5 + age * 25;

      // Glowy trail effect
      ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(trailPos.x, trailPos.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw cyan rectangle (player)
  ctx.save();
  ctx.translate(player.x, player.y);

  // Body glow effect
  const playerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 60);
  playerGlow.addColorStop(0, 'rgba(0, 255, 255, 0.6)');
  playerGlow.addColorStop(0.5, 'rgba(0, 255, 255, 0.3)');
  playerGlow.addColorStop(1, 'rgba(0, 255, 255, 0)');
  ctx.fillStyle = playerGlow;
  ctx.beginPath();
  ctx.arc(0, 0, 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(player.rotation);

  // Main rectangle body
  ctx.fillStyle = '#00ffff';
  ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);

  // Border for visibility
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(-player.width / 2, -player.height / 2, player.width, player.height);

  // Direction indicator (front edge)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-player.width / 4, -player.height / 2 - 5, player.width / 2, 5);

  ctx.restore();

  // Reset camera transform
  ctx.restore();

  // Draw HUD
  ctx.fillStyle = 'white';
  ctx.font = '16px monospace';
  ctx.fillText(`Position: (${Math.round(player.x)}, ${Math.round(player.y)})`, 10, 20);
  ctx.fillText(`Speed: ${player.speed.toFixed(2)}`, 10, 40);
  ctx.fillText(`Rotation: ${(player.rotation * 180 / Math.PI).toFixed(1)}°`, 10, 60);

  // Controls
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '14px monospace';
  ctx.fillText('Controls: W/S - Move, A/D - Rotate', 10, canvas.height - 10);
}
