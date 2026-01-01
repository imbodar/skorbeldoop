import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Choice, GameResult } from './types';
import {
  CHOICE_EMOJI,
  PLAYER_COLORS,
  ARENA_WIDTH,
  ARENA_HEIGHT,
  PLAYER_SIZE,
  PLAYER1_SPAWN_X,
  PLAYER1_SPAWN_Y,
  PLAYER2_SPAWN_X,
  PLAYER2_SPAWN_Y,
  MOVE_SPEED
} from './constants';

const RockPaperScissors = () => {
  const [gameState, setGameState] = useState<GameState>({
    player1Choice: null,
    player2Choice: null,
    result: null,
    player1Score: 0,
    player2Score: 0,
    roundNumber: 1,
    showResult: false,
    phase: 'selection',
    player1Entity: null,
    player2Entity: null,
  });

  // Track pressed keys for smooth movement
  const keysPressed = useRef<Set<string>>(new Set());

  const determineWinner = (p1: Choice, p2: Choice): GameResult => {
    if (!p1 || !p2) return null;
    if (p1 === p2) return 'tie';

    if (
      (p1 === 'rock' && p2 === 'scissors') ||
      (p1 === 'paper' && p2 === 'rock') ||
      (p1 === 'scissors' && p2 === 'paper')
    ) {
      return 'player1';
    }
    return 'player2';
  };

  const resetRound = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      player1Choice: null,
      player2Choice: null,
      result: null,
      showResult: false,
      phase: 'selection',
      player1Entity: null,
      player2Entity: null,
    }));
  }, []);

  const handleChoice = useCallback((player: 'player1' | 'player2', choice: Choice) => {
    setGameState((prev) => {
      if (prev.phase !== 'selection') return prev;

      const newState = {
        ...prev,
        [player === 'player1' ? 'player1Choice' : 'player2Choice']: choice,
      };

      // Check if both players have made their choice - transition to arena
      if (newState.player1Choice && newState.player2Choice) {
        return {
          ...newState,
          phase: 'arena' as const,
          player1Entity: {
            position: { x: PLAYER1_SPAWN_X, y: PLAYER1_SPAWN_Y },
            choice: newState.player1Choice,
          },
          player2Entity: {
            position: { x: PLAYER2_SPAWN_X, y: PLAYER2_SPAWN_Y },
            choice: newState.player2Choice,
          },
        };
      }

      return newState;
    });
  }, []);

  const endArena = useCallback((winner: GameResult) => {
    setGameState((prev) => {
      if (prev.phase !== 'arena') return prev;

      return {
        ...prev,
        result: winner,
        showResult: true,
        phase: 'results',
        player1Score: prev.player1Score + (winner === 'player1' ? 1 : 0),
        player2Score: prev.player2Score + (winner === 'player2' ? 1 : 0),
        roundNumber: prev.roundNumber + 1,
      };
    });
  }, []);

  // Update player positions based on pressed keys
  const updatePositions = useCallback(() => {
    setGameState((prev) => {
      if (prev.phase !== 'arena' || !prev.player1Entity || !prev.player2Entity) {
        return prev;
      }

      let p1NewX = prev.player1Entity.position.x;
      let p1NewY = prev.player1Entity.position.y;
      let p2NewX = prev.player2Entity.position.x;
      let p2NewY = prev.player2Entity.position.y;

      // Player 1 movement (WASD)
      if (keysPressed.current.has('w')) p1NewY -= MOVE_SPEED;
      if (keysPressed.current.has('s')) p1NewY += MOVE_SPEED;
      if (keysPressed.current.has('a')) p1NewX -= MOVE_SPEED;
      if (keysPressed.current.has('d')) p1NewX += MOVE_SPEED;

      // Player 2 movement (Arrow keys)
      if (keysPressed.current.has('arrowup')) p2NewY -= MOVE_SPEED;
      if (keysPressed.current.has('arrowdown')) p2NewY += MOVE_SPEED;
      if (keysPressed.current.has('arrowleft')) p2NewX -= MOVE_SPEED;
      if (keysPressed.current.has('arrowright')) p2NewX += MOVE_SPEED;

      // Clamp positions within arena bounds
      const halfSize = PLAYER_SIZE / 2;
      p1NewX = Math.max(halfSize, Math.min(ARENA_WIDTH - halfSize, p1NewX));
      p1NewY = Math.max(halfSize, Math.min(ARENA_HEIGHT - halfSize, p1NewY));
      p2NewX = Math.max(halfSize, Math.min(ARENA_WIDTH - halfSize, p2NewX));
      p2NewY = Math.max(halfSize, Math.min(ARENA_HEIGHT - halfSize, p2NewY));

      // Only update if positions changed
      if (
        p1NewX !== prev.player1Entity.position.x ||
        p1NewY !== prev.player1Entity.position.y ||
        p2NewX !== prev.player2Entity.position.x ||
        p2NewY !== prev.player2Entity.position.y
      ) {
        return {
          ...prev,
          player1Entity: {
            ...prev.player1Entity,
            position: { x: p1NewX, y: p1NewY },
          },
          player2Entity: {
            ...prev.player2Entity,
            position: { x: p2NewX, y: p2NewY },
          },
        };
      }

      return prev;
    });
  }, []);

  // Game loop for arena movement
  useEffect(() => {
    if (gameState.phase !== 'arena') return;

    let animationFrameId: number;

    const gameLoop = () => {
      updatePositions();
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState.phase, updatePositions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Selection phase - Player 1 controls: W, A, S
      if (gameState.phase === 'selection') {
        if (key === 'w') {
          handleChoice('player1', 'rock');
        } else if (key === 'a') {
          handleChoice('player1', 'paper');
        } else if (key === 's') {
          handleChoice('player1', 'scissors');
        }
      }

      // Selection phase - Player 2 controls: Arrow keys
      if (gameState.phase === 'selection') {
        if (key === 'arrowup') {
          handleChoice('player2', 'rock');
        } else if (key === 'arrowleft') {
          handleChoice('player2', 'paper');
        } else if (key === 'arrowdown') {
          handleChoice('player2', 'scissors');
        }
      }

      // Arena phase - Track movement keys
      if (gameState.phase === 'arena') {
        const movementKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
        if (movementKeys.includes(key)) {
          e.preventDefault();
          keysPressed.current.add(key);
        }
      }

      // Results phase - Space to continue
      if (key === ' ' && gameState.phase === 'results') {
        e.preventDefault();
        resetRound();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.delete(key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleChoice, gameState.phase, resetRound]);

  const getResultMessage = (): string => {
    if (!gameState.result) return '';
    if (gameState.result === 'tie') return "It's a Tie!";
    if (gameState.result === 'player1') return 'Player 1 Wins!';
    return 'Player 2 Wins!';
  };

  const getResultColor = (): string => {
    if (!gameState.result) return '#333';
    if (gameState.result === 'tie') return '#666';
    return gameState.result === 'player1' ? PLAYER_COLORS.player1 : PLAYER_COLORS.player2;
  };

  const renderSelectionPhase = () => (
    <>
      {/* Game Board */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '40px',
        marginTop: '30px',
      }}>
        {/* Player 1 Side */}
        <div style={{
          flex: 1,
          border: `3px solid ${PLAYER_COLORS.player1}`,
          borderRadius: '15px',
          padding: '30px',
          backgroundColor: gameState.player1Choice ? '#f0f8ff' : '#fff',
        }}>
          <h2 style={{
            textAlign: 'center',
            color: PLAYER_COLORS.player1,
            marginBottom: '20px',
          }}>
            Player 1
          </h2>

          <div style={{
            fontSize: '14px',
            textAlign: 'center',
            marginBottom: '20px',
            color: '#666',
          }}>
            Use W-A-S keys
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
          }}>
            {(['rock', 'paper', 'scissors'] as const).map((choice, index) => {
              const keys = ['W', 'A', 'S'];
              const isSelected = gameState.player1Choice === choice;
              const hasChosen = gameState.player1Choice !== null;

              return (
                <div
                  key={choice}
                  style={{
                    padding: '25px',
                    border: isSelected ? '4px solid #FFD700' : '2px solid #ddd',
                    borderRadius: '10px',
                    textAlign: 'center',
                    fontSize: '48px',
                    backgroundColor: hasChosen ? '#ffffcc' : '#fff',
                    transition: 'background-color 0.1s ease',
                    boxShadow: isSelected ? '0 4px 8px rgba(255, 215, 0, 0.5)' : 'none',
                  }}
                >
                  <div>{CHOICE_EMOJI[choice]}</div>
                  <div style={{ fontSize: '18px', marginTop: '10px', textTransform: 'capitalize' }}>
                    {choice}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    [{keys[index]}]
                  </div>
                </div>
              );
            })}
          </div>

          {gameState.player1Choice && (
            <div style={{
              marginTop: '20px',
              textAlign: 'center',
              fontSize: '18px',
              color: PLAYER_COLORS.player1,
              fontWeight: 'bold',
            }}>
              Choice locked!
            </div>
          )}
        </div>

        {/* VS Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#ddd',
        }}>
          VS
        </div>

        {/* Player 2 Side */}
        <div style={{
          flex: 1,
          border: `3px solid ${PLAYER_COLORS.player2}`,
          borderRadius: '15px',
          padding: '30px',
          backgroundColor: gameState.player2Choice ? '#fff0f5' : '#fff',
        }}>
          <h2 style={{
            textAlign: 'center',
            color: PLAYER_COLORS.player2,
            marginBottom: '20px',
          }}>
            Player 2
          </h2>

          <div style={{
            fontSize: '14px',
            textAlign: 'center',
            marginBottom: '20px',
            color: '#666',
          }}>
            Use Arrow keys
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
          }}>
            {(['rock', 'paper', 'scissors'] as const).map((choice, index) => {
              const keys = ['↑', '←', '↓'];
              const isSelected = gameState.player2Choice === choice;
              const hasChosen = gameState.player2Choice !== null;

              return (
                <div
                  key={choice}
                  style={{
                    padding: '25px',
                    border: isSelected ? '4px solid #FFD700' : '2px solid #ddd',
                    borderRadius: '10px',
                    textAlign: 'center',
                    fontSize: '48px',
                    backgroundColor: hasChosen ? '#ffffcc' : '#fff',
                    transition: 'background-color 0.1s ease',
                    boxShadow: isSelected ? '0 4px 8px rgba(255, 215, 0, 0.5)' : 'none',
                  }}
                >
                  <div>{CHOICE_EMOJI[choice]}</div>
                  <div style={{ fontSize: '18px', marginTop: '10px', textTransform: 'capitalize' }}>
                    {choice}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    [{keys[index]}]
                  </div>
                </div>
              );
            })}
          </div>

          {gameState.player2Choice && (
            <div style={{
              marginTop: '20px',
              textAlign: 'center',
              fontSize: '18px',
              color: PLAYER_COLORS.player2,
              fontWeight: 'bold',
            }}>
              Choice locked!
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '30px',
        textAlign: 'center',
        color: '#666',
        fontSize: '14px',
      }}>
        <p>Player 1: Press W (Rock), A (Paper), or S (Scissors)</p>
        <p>Player 2: Press ↑ (Rock), ← (Paper), or ↓ (Scissors)</p>
        <p>Both players make their choice to enter the arena!</p>
      </div>
    </>
  );

  const renderArenaPhase = () => {
    if (!gameState.player1Entity || !gameState.player2Entity) return null;

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '30px',
        marginTop: '30px',
      }}>
        <div style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#333',
        }}>
          BATTLE ARENA
        </div>

        {/* The Arena Battlefield */}
        <div style={{
          width: `${ARENA_WIDTH}px`,
          height: `${ARENA_HEIGHT}px`,
          border: '4px solid #333',
          borderRadius: '15px',
          backgroundColor: '#e8f4f8',
          backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent)',
          backgroundSize: '50px 50px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Center line */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            transform: 'translateX(-50%)',
          }} />

          {/* Player 1 Entity */}
          <div style={{
            position: 'absolute',
            left: `${gameState.player1Entity.position.x}px`,
            top: `${gameState.player1Entity.position.y}px`,
            transform: 'translate(-50%, -50%)',
            fontSize: `${PLAYER_SIZE}px`,
            lineHeight: '1',
            textShadow: `0 0 10px ${PLAYER_COLORS.player1}`,
            transition: 'all 0.05s linear',
          }}>
            {CHOICE_EMOJI[gameState.player1Entity.choice]}
          </div>

          {/* Player 1 Label */}
          <div style={{
            position: 'absolute',
            left: `${gameState.player1Entity.position.x}px`,
            top: `${gameState.player1Entity.position.y + PLAYER_SIZE / 2 + 10}px`,
            transform: 'translate(-50%, 0)',
            fontSize: '12px',
            fontWeight: 'bold',
            color: PLAYER_COLORS.player1,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: '2px 6px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
          }}>
            P1
          </div>

          {/* Player 2 Entity */}
          <div style={{
            position: 'absolute',
            left: `${gameState.player2Entity.position.x}px`,
            top: `${gameState.player2Entity.position.y}px`,
            transform: 'translate(-50%, -50%)',
            fontSize: `${PLAYER_SIZE}px`,
            lineHeight: '1',
            textShadow: `0 0 10px ${PLAYER_COLORS.player2}`,
            transition: 'all 0.05s linear',
          }}>
            {CHOICE_EMOJI[gameState.player2Entity.choice]}
          </div>

          {/* Player 2 Label */}
          <div style={{
            position: 'absolute',
            left: `${gameState.player2Entity.position.x}px`,
            top: `${gameState.player2Entity.position.y + PLAYER_SIZE / 2 + 10}px`,
            transform: 'translate(-50%, 0)',
            fontSize: '12px',
            fontWeight: 'bold',
            color: PLAYER_COLORS.player2,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: '2px 6px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
          }}>
            P2
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          color: '#666',
          fontSize: '14px',
        }}>
          <p><strong>Player 1 (Blue):</strong> WASD to move</p>
          <p><strong>Player 2 (Pink):</strong> Arrow keys to move</p>
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
            Collide with opponent to battle!
          </p>
        </div>

        {/* Temporary: Auto-transition to results for testing */}
        <button
          onClick={() => {
            const winner = determineWinner(gameState.player1Choice, gameState.player2Choice);
            endArena(winner);
          }}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            backgroundColor: '#999',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            opacity: 0.7,
          }}
        >
          Skip to Results (Dev)
        </button>
      </div>
    );
  };

  const renderResultsPhase = () => (
    <>
      {/* Result Display */}
      <div style={{
        textAlign: 'center',
        fontSize: '36px',
        fontWeight: 'bold',
        color: getResultColor(),
        marginBottom: '20px',
        padding: '20px',
        backgroundColor: '#f0f0f0',
        borderRadius: '10px',
      }}>
        {getResultMessage()}
        <div style={{ fontSize: '18px', marginTop: '10px', color: '#666' }}>
          Press SPACE to continue
        </div>
      </div>

      {/* Show what each player picked */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '60px',
        marginTop: '20px',
      }}>
        <div style={{
          textAlign: 'center',
          padding: '20px',
          border: `3px solid ${PLAYER_COLORS.player1}`,
          borderRadius: '10px',
          backgroundColor: '#f0f8ff',
        }}>
          <div style={{ fontSize: '64px' }}>{CHOICE_EMOJI[gameState.player1Choice!]}</div>
          <div style={{
            fontSize: '18px',
            color: PLAYER_COLORS.player1,
            marginTop: '10px',
            fontWeight: 'bold',
          }}>
            Player 1
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#ddd',
        }}>
          VS
        </div>

        <div style={{
          textAlign: 'center',
          padding: '20px',
          border: `3px solid ${PLAYER_COLORS.player2}`,
          borderRadius: '10px',
          backgroundColor: '#fff0f5',
        }}>
          <div style={{ fontSize: '64px' }}>{CHOICE_EMOJI[gameState.player2Choice!]}</div>
          <div style={{
            fontSize: '18px',
            color: PLAYER_COLORS.player2,
            marginTop: '10px',
            fontWeight: 'bold',
          }}>
            Player 2
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Rock Paper Scissors Arena</h1>

      {/* Score Display */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '40px',
        marginBottom: '20px',
        fontSize: '24px',
        fontWeight: 'bold',
      }}>
        <div style={{ color: PLAYER_COLORS.player1 }}>
          Player 1: {gameState.player1Score}
        </div>
        <div style={{ color: '#666' }}>
          Round {gameState.roundNumber}
        </div>
        <div style={{ color: PLAYER_COLORS.player2 }}>
          Player 2: {gameState.player2Score}
        </div>
      </div>

      {/* Phase indicator */}
      <div style={{
        textAlign: 'center',
        fontSize: '14px',
        color: '#999',
        marginBottom: '10px',
        textTransform: 'uppercase',
        letterSpacing: '2px',
      }}>
        Phase: {gameState.phase}
      </div>

      {/* Render different content based on phase */}
      {gameState.phase === 'selection' && renderSelectionPhase()}
      {gameState.phase === 'arena' && renderArenaPhase()}
      {gameState.phase === 'results' && renderResultsPhase()}
    </div>
  );
};

export default RockPaperScissors;
