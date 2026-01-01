import React, { useEffect, useRef } from 'react';
import { GameState, Rock } from './types';
import { GAME_CONSTANTS } from './constants';
import { generateVoronoiWorld, findSafeSpawnPosition } from './worldGenerator';

export default function CyanRectangle() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate voronoi world
    const { rocks, regions } = generateVoronoiWorld();
    const spawnPos = findSafeSpawnPosition(rocks);

    // Initialize game state
    const game: GameState = {
      player: {
        x: spawnPos.x,
        y: spawnPos.y,
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
        x: spawnPos.x,
        y: spawnPos.y,
        zoom: GAME_CONSTANTS.CAMERA_ZOOM,
      },
      keys: {},
      trail: [],
      rocks,
      regions,
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

    // Collision detection helper
    const checkCollision = (x: number, y: number, width: number, height: number, rotation: number, rocks: Rock[]): boolean => {
      // Get the four corners of the rotated rectangle
      const halfWidth = width / 2;
      const halfHeight = height / 2;

      const corners = [
        { x: -halfWidth, y: -halfHeight },
        { x: halfWidth, y: -halfHeight },
        { x: halfWidth, y: halfHeight },
        { x: -halfWidth, y: halfHeight },
      ];

      // Rotate corners and translate to player position
      const rotatedCorners = corners.map(corner => ({
        x: x + corner.x * Math.cos(rotation) - corner.y * Math.sin(rotation),
        y: y + corner.x * Math.sin(rotation) + corner.y * Math.cos(rotation),
      }));

      // Check if any corner is inside a rock
      for (const corner of rotatedCorners) {
        for (const rock of rocks) {
          if (corner.x >= rock.x && corner.x < rock.x + rock.width &&
              corner.y >= rock.y && corner.y < rock.y + rock.height) {
            return true;
          }
        }
      }

      // Also check center point
      for (const rock of rocks) {
        if (x >= rock.x && x < rock.x + rock.width &&
            y >= rock.y && y < rock.y + rock.height) {
          return true;
        }
      }

      return false;
    };

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

      const newX = game.player.x + moveX;
      const newY = game.player.y + moveY;

      // Keep player in bounds (use half dimensions since player is drawn from center)
      const halfWidth = game.player.width / 2;
      const halfHeight = game.player.height / 2;
      const boundedX = Math.max(halfWidth, Math.min(game.world.width - halfWidth, newX));
      const boundedY = Math.max(halfHeight, Math.min(game.world.height - halfHeight, newY));

      // Check collision before moving
      if (!checkCollision(boundedX, boundedY, game.player.width, game.player.height, game.player.rotation, game.rocks)) {
        game.player.x = boundedX;
        game.player.y = boundedY;
      } else {
        // If collision, stop the player
        game.player.speed = 0;
      }

      // Trail tracking
      const currentSpeed = Math.abs(game.player.speed);
      if (currentSpeed > GAME_CONSTANTS.TRAIL_MIN_SPEED) {
        game.trail.push({
          x: game.player.x,
          y: game.player.y,
          rotation: game.player.rotation,
          alpha: 1
        });

        // Remove old trail points
        if (game.trail.length > GAME_CONSTANTS.MAX_TRAIL_LENGTH) {
          game.trail.shift();
        }
      }

      // Fade trail over time
      game.trail.forEach((point, i) => {
        point.alpha = i / game.trail.length;
      });

      // Update camera to follow player
      game.camera.x += (game.player.x - game.camera.x) * GAME_CONSTANTS.CAMERA_FOLLOW_SPEED;
      game.camera.y += (game.player.y - game.camera.y) * GAME_CONSTANTS.CAMERA_FOLLOW_SPEED;

      // Render
      ctx.fillStyle = '#0a0a18';
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

      // Draw rocks
      ctx.fillStyle = '#4a4a4a';
      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 2;
      game.rocks.forEach(rock => {
        ctx.fillRect(rock.x, rock.y, rock.width, rock.height);
        ctx.strokeRect(rock.x, rock.y, rock.width, rock.height);
      });

      // Draw trail
      game.trail.forEach((point) => {
        const trailWidth = game.player.width * 0.7;
        const trailHeight = game.player.height * 0.7;

        ctx.save();
        ctx.translate(point.x, point.y);
        ctx.rotate(point.rotation);

        // Draw rounded rectangle trail segment
        const cornerRadius = 6;
        const x = -trailWidth / 2;
        const y = -trailHeight / 2;

        ctx.beginPath();
        ctx.moveTo(x + cornerRadius, y);
        ctx.lineTo(x + trailWidth - cornerRadius, y);
        ctx.arcTo(x + trailWidth, y, x + trailWidth, y + cornerRadius, cornerRadius);
        ctx.lineTo(x + trailWidth, y + trailHeight - cornerRadius);
        ctx.arcTo(x + trailWidth, y + trailHeight, x + trailWidth - cornerRadius, y + trailHeight, cornerRadius);
        ctx.lineTo(x + cornerRadius, y + trailHeight);
        ctx.arcTo(x, y + trailHeight, x, y + trailHeight - cornerRadius, cornerRadius);
        ctx.lineTo(x, y + cornerRadius);
        ctx.arcTo(x, y, x + cornerRadius, y, cornerRadius);
        ctx.closePath();

        ctx.fillStyle = `rgba(0, 255, 255, ${point.alpha * 0.4})`;
        ctx.fill();

        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(0, 255, 255, ${point.alpha * 0.5})`;
        ctx.strokeStyle = `rgba(0, 255, 255, ${point.alpha * 0.3})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
      });

      // Reset shadow for other drawing operations
      ctx.shadowBlur = 0;

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

      // Add dark blue outline
      ctx.strokeStyle = '#001540';
      ctx.lineWidth = 2;
      ctx.stroke();

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
