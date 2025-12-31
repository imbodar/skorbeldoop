import React, { useEffect, useRef } from 'react';
import { GameState } from './types';
import { GAME_CONSTANTS } from './constants';
import { generateRocks } from './worldGenerator';
import { generateBoids } from './boidGenerator';
import { generateLeviathans, spawnLeviathan } from './leviathanGenerator';
import { initializePlayer, updateGame } from './gameState';
import { renderGame } from './renderer';

export default function CaveExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize game state
    const game: GameState = {
      player: initializePlayer(),
      world: {
        width: GAME_CONSTANTS.WORLD_WIDTH,
        height: GAME_CONSTANTS.WORLD_HEIGHT,
        rocks: []
      },
      camera: {
        x: GAME_CONSTANTS.WORLD_START_X,
        y: GAME_CONSTANTS.WORLD_START_Y,
        zoom: GAME_CONSTANTS.CAMERA_ZOOM
      },
      keys: {},
      previousRayEndpoints: [],
      boids: [],
      leviathans: []
    };

    // Store game reference
    gameRef.current = game;

    // Generate world
    console.log('Generating rocks...');
    game.world.rocks = generateRocks();
    console.log(`Generated ${game.world.rocks.length} rocks`);

    // Generate entities
    game.boids = generateBoids(
      { x: game.player.x, y: game.player.y },
      game.world.rocks
    );
    console.log(`Generated ${game.boids.length} boids`);

    game.leviathans = generateLeviathans(
      { x: game.player.x, y: game.player.y },
      game.world.rocks
    );
    console.log(`Generated ${game.leviathans.length} leviathans`);

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
      updateGame(game);
      renderGame(ctx, canvas, game);
      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const handleSpawnLeviathan = () => {
    if (gameRef.current) {
      const spawned = spawnLeviathan(
        { x: gameRef.current.player.x, y: gameRef.current.player.y },
        gameRef.current.world.rocks,
        true
      );

      if (spawned) {
        gameRef.current.leviathans.push(spawned);
        console.log('Giant fish spawned nearby!');
      } else {
        console.log('Could not find valid spawn location');
      }
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0f0f1e',
      fontFamily: 'monospace'
    }}>
      <h1 style={{ color: '#00d9ff', marginBottom: '20px' }}>Cave Explorer</h1>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          border: '2px solid #00d9ff',
          borderRadius: '4px',
          boxShadow: '0 0 20px rgba(0, 217, 255, 0.3)'
        }}
      />
      <button
        onClick={handleSpawnLeviathan}
        style={{
          marginTop: '15px',
          padding: '12px 24px',
          fontSize: '16px',
          fontFamily: 'monospace',
          background: '#ff69b4',
          color: '#0f0f1e',
          border: '2px solid #ff1493',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 0 15px rgba(255, 105, 180, 0.3)',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = '#ff8dc7';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 105, 180, 0.5)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = '#ff69b4';
          e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 105, 180, 0.3)';
        }}
      >
        Spawn Giant Fish
      </button>
      <div style={{
        marginTop: '20px',
        color: '#aaaaaa',
        textAlign: 'center'
      }}>
        <p>Navigate through massive cave systems!</p>
        <p>Hunt glowing fish to survive - watch your hunger!</p>
        <p>Watch out for massive pink fish!</p>
      </div>
    </div>
  );
}
