import { useEffect, useRef } from 'react';
import { GameState } from './types';
import { GAME_CONSTANTS } from './constants';
import { initializePlayer, updateGame } from './gameState';
import { renderGame } from './renderer';

export function CyanRectangle() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize game state
    const game: GameState = {
      player: initializePlayer(),
      camera: {
        x: GAME_CONSTANTS.WORLD_START_X,
        y: GAME_CONSTANTS.WORLD_START_Y,
      },
      world: {
        width: GAME_CONSTANTS.WORLD_WIDTH,
        height: GAME_CONSTANTS.WORLD_HEIGHT,
      },
      keys: {},
    };

    // Input handling
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
      updateGame(game);
      renderGame(ctx, game);
      animationId = requestAnimationFrame(gameLoop);
    };
    gameLoop();

    // Cleanup
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
      justifyContent: 'center',
      width: '100vw',
      height: '100vh',
      background: '#0f0f1e',
      overflow: 'hidden'
    }}>
      <canvas
        ref={canvasRef}
        width={GAME_CONSTANTS.CANVAS_WIDTH}
        height={GAME_CONSTANTS.CANVAS_HEIGHT}
        style={{
          border: '2px solid #00ffff',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
          maxWidth: '95vw',
          maxHeight: '95vh',
        }}
      />
    </div>
  );
}
