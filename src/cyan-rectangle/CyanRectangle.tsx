import React, { useEffect, useRef } from 'react';
import { GameState } from './types';
import { GAME_CONSTANTS } from './constants';

export default function CyanRectangle() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize game state
    const game: GameState = {
      player: {
        x: GAME_CONSTANTS.WORLD_START_X,
        y: GAME_CONSTANTS.WORLD_START_Y,
        rotation: 0,
        speed: 0,
        width: GAME_CONSTANTS.PLAYER_WIDTH,
        height: GAME_CONSTANTS.PLAYER_HEIGHT,
      },
      world: {
        width: GAME_CONSTANTS.WORLD_WIDTH,
        height: GAME_CONSTANTS.WORLD_HEIGHT,
      },
      camera: {
        x: GAME_CONSTANTS.WORLD_START_X,
        y: GAME_CONSTANTS.WORLD_START_Y,
        zoom: GAME_CONSTANTS.CAMERA_ZOOM,
      },
      keys: {},
    };

    gameRef.current = game;

    // Input handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      game.keys[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      game.keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Game loop
    let animationId: number;

    const gameLoop = () => {
      // Rotation
      if (game.keys['a'] || game.keys['arrowleft']) {
        game.player.rotation -= GAME_CONSTANTS.PLAYER_ROTATION_SPEED;
      }
      if (game.keys['d'] || game.keys['arrowright']) {
        game.player.rotation += GAME_CONSTANTS.PLAYER_ROTATION_SPEED;
      }

      // Movement
      if (game.keys['w'] || game.keys['arrowup']) {
        game.player.speed = Math.min(game.player.speed + GAME_CONSTANTS.PLAYER_ACCELERATION, GAME_CONSTANTS.PLAYER_MAX_SPEED);
      } else if (game.keys['s'] || game.keys['arrowdown']) {
        game.player.speed = Math.max(game.player.speed - GAME_CONSTANTS.PLAYER_ACCELERATION, -GAME_CONSTANTS.PLAYER_MAX_SPEED / 2);
      } else {
        game.player.speed *= GAME_CONSTANTS.PLAYER_FRICTION;
      }

      // Update position based on rotation and speed
      const moveX = Math.sin(game.player.rotation) * game.player.speed;
      const moveY = -Math.cos(game.player.rotation) * game.player.speed;

      game.player.x += moveX;
      game.player.y += moveY;

      // Keep player in bounds
      game.player.x = Math.max(game.player.width, Math.min(game.world.width - game.player.width, game.player.x));
      game.player.y = Math.max(game.player.height, Math.min(game.world.height - game.player.height, game.player.y));

      // Update camera to follow player
      game.camera.x += (game.player.x - game.camera.x) * GAME_CONSTANTS.CAMERA_FOLLOW_SPEED;
      game.camera.y += (game.player.y - game.camera.y) * GAME_CONSTANTS.CAMERA_FOLLOW_SPEED;

      // Render
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Save context for camera transformation
      ctx.save();

      // Apply camera transformation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(game.camera.zoom, game.camera.zoom);
      ctx.translate(-game.camera.x, -game.camera.y);

      // Draw world grid
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      const gridSize = 100;
      for (let x = 0; x <= game.world.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, game.world.height);
        ctx.stroke();
      }
      for (let y = 0; y <= game.world.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(game.world.width, y);
        ctx.stroke();
      }

      // Draw world border
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, game.world.width, game.world.height);

      // Draw player as rotated rounded cyan rectangle
      ctx.save();
      ctx.translate(game.player.x, game.player.y);
      ctx.rotate(game.player.rotation);
      ctx.fillStyle = '#00ffff';

      // Draw rounded rectangle
      const cornerRadius = 8;
      const x = -game.player.width / 2;
      const y = -game.player.height / 2;
      const width = game.player.width;
      const height = game.player.height;

      ctx.beginPath();
      ctx.moveTo(x + cornerRadius, y);
      ctx.lineTo(x + width - cornerRadius, y);
      ctx.arcTo(x + width, y, x + width, y + cornerRadius, cornerRadius);
      ctx.lineTo(x + width, y + height - cornerRadius);
      ctx.arcTo(x + width, y + height, x + width - cornerRadius, y + height, cornerRadius);
      ctx.lineTo(x + cornerRadius, y + height);
      ctx.arcTo(x, y + height, x, y + height - cornerRadius, cornerRadius);
      ctx.lineTo(x, y + cornerRadius);
      ctx.arcTo(x, y, x + cornerRadius, y, cornerRadius);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Restore context
      ctx.restore();

      // Draw UI
      ctx.fillStyle = '#00ffff';
      ctx.font = '16px monospace';
      ctx.fillText(`Position: (${Math.round(game.player.x)}, ${Math.round(game.player.y)})`, 10, 25);
      ctx.fillText(`Speed: ${Math.round(Math.abs(game.player.speed) * 10) / 10}`, 10, 50);
      ctx.fillText(`Rotation: ${Math.round((game.player.rotation * 180 / Math.PI) % 360)}°`, 10, 75);

      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      width: '100vw',
      height: '100vh',
      background: '#0a0a0a',
      fontFamily: 'monospace',
      boxSizing: 'border-box',
      overflow: 'hidden',
      padding: '20px',
      gap: '15px'
    }}>
      <h1 style={{ color: '#00ffff', margin: '0', fontSize: '32px' }}>Cyan Rectangle</h1>
      <canvas
        ref={canvasRef}
        width={Math.min(window.innerWidth - 40, 1600)}
        height={Math.min(window.innerHeight - 180, 900)}
        style={{
          border: '2px solid #00ffff',
          borderRadius: '4px',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
          flexGrow: 1,
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 180px)'
        }}
      />
      <div style={{
        color: '#aaaaaa',
        textAlign: 'center',
        fontSize: '14px'
      }}>
        W/↑: Forward • S/↓: Backward • A/←: Rotate Left • D/→: Rotate Right
      </div>
    </div>
  );
}
