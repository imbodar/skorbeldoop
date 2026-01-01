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
        vx: 0,
        vy: 0,
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
      // Update player movement
      const acceleration = GAME_CONSTANTS.PLAYER_ACCELERATION;

      if (game.keys['arrowup'] || game.keys['w']) {
        game.player.vy -= acceleration;
      }
      if (game.keys['arrowdown'] || game.keys['s']) {
        game.player.vy += acceleration;
      }
      if (game.keys['arrowleft'] || game.keys['a']) {
        game.player.vx -= acceleration;
      }
      if (game.keys['arrowright'] || game.keys['d']) {
        game.player.vx += acceleration;
      }

      // Apply friction
      game.player.vx *= GAME_CONSTANTS.PLAYER_FRICTION;
      game.player.vy *= GAME_CONSTANTS.PLAYER_FRICTION;

      // Limit max speed
      const speed = Math.sqrt(game.player.vx ** 2 + game.player.vy ** 2);
      if (speed > GAME_CONSTANTS.PLAYER_MAX_SPEED) {
        game.player.vx = (game.player.vx / speed) * GAME_CONSTANTS.PLAYER_MAX_SPEED;
        game.player.vy = (game.player.vy / speed) * GAME_CONSTANTS.PLAYER_MAX_SPEED;
      }

      // Update position
      game.player.x += game.player.vx;
      game.player.y += game.player.vy;

      // Keep player in bounds
      game.player.x = Math.max(game.player.width / 2, Math.min(game.world.width - game.player.width / 2, game.player.x));
      game.player.y = Math.max(game.player.height / 2, Math.min(game.world.height - game.player.height / 2, game.player.y));

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

      // Draw player as pure cyan rectangle
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(
        game.player.x - game.player.width / 2,
        game.player.y - game.player.height / 2,
        game.player.width,
        game.player.height
      );

      // Restore context
      ctx.restore();

      // Draw UI
      ctx.fillStyle = '#00ffff';
      ctx.font = '16px monospace';
      ctx.fillText(`Position: (${Math.round(game.player.x)}, ${Math.round(game.player.y)})`, 10, 25);
      ctx.fillText(`Speed: ${Math.round(speed * 10) / 10}`, 10, 50);

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
        Use WASD or Arrow Keys to move the cyan rectangle
      </div>
    </div>
  );
}
