import { useState, useEffect, useCallback } from 'react';
import { GameState, Choice, GameResult } from './types';
import { CHOICE_EMOJI, PLAYER_COLORS, CHOICE_HP } from './constants';

// Health Bar Component
const HealthBar = ({ currentHP, maxHP, color }: { currentHP: number; maxHP: number; color: string }) => {
  const percentage = Math.max(0, Math.min(100, (currentHP / maxHP) * 100));

  return (
    <div style={{
      marginTop: '10px',
      width: '100%',
    }}>
      <div style={{
        fontSize: '12px',
        fontWeight: 'bold',
        marginBottom: '4px',
        textAlign: 'center',
      }}>
        {currentHP} / {maxHP} HP
      </div>
      <div style={{
        width: '100%',
        height: '20px',
        backgroundColor: '#ddd',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '2px solid #333',
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: color,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  );
};

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
    player1HP: 0,
    player2HP: 0,
  });


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
      player1HP: 0,
      player2HP: 0,
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
          player1HP: CHOICE_HP[newState.player1Choice],
          player2HP: CHOICE_HP[newState.player2Choice],
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Player 1 controls: W, A, S (selection phase only)
      if (gameState.phase === 'selection') {
        if (key === 'w') {
          handleChoice('player1', 'rock');
        } else if (key === 'a') {
          handleChoice('player1', 'paper');
        } else if (key === 's') {
          handleChoice('player1', 'scissors');
        }
      }

      // Player 2 controls: Arrow keys (selection phase only)
      if (gameState.phase === 'selection') {
        if (key === 'arrowup') {
          handleChoice('player2', 'rock');
        } else if (key === 'arrowleft') {
          handleChoice('player2', 'paper');
        } else if (key === 'arrowdown') {
          handleChoice('player2', 'scissors');
        }
      }

      // Space to continue to next round (only in results phase)
      if (key === ' ' && gameState.phase === 'results') {
        e.preventDefault();
        resetRound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
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

  const renderArenaPhase = () => (
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
        ARENA MODE
      </div>

      <div style={{
        width: '100%',
        height: '400px',
        border: '4px solid #333',
        borderRadius: '15px',
        backgroundColor: '#f5f5f5',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          display: 'flex',
          gap: '100px',
          fontSize: '64px',
        }}>
          <div style={{
            textAlign: 'center',
            width: '200px',
          }}>
            <div>{CHOICE_EMOJI[gameState.player1Choice!]}</div>
            <div style={{
              fontSize: '14px',
              color: PLAYER_COLORS.player1,
              marginTop: '10px',
              fontWeight: 'bold',
            }}>
              Player 1
            </div>
            <div style={{
              fontSize: '12px',
              color: '#666',
              marginTop: '5px',
              textTransform: 'capitalize',
            }}>
              {gameState.player1Choice}
            </div>
            <HealthBar
              currentHP={gameState.player1HP}
              maxHP={CHOICE_HP[gameState.player1Choice!]}
              color={PLAYER_COLORS.player1}
            />
          </div>
          <div style={{
            textAlign: 'center',
            width: '200px',
          }}>
            <div>{CHOICE_EMOJI[gameState.player2Choice!]}</div>
            <div style={{
              fontSize: '14px',
              color: PLAYER_COLORS.player2,
              marginTop: '10px',
              fontWeight: 'bold',
            }}>
              Player 2
            </div>
            <div style={{
              fontSize: '12px',
              color: '#666',
              marginTop: '5px',
              textTransform: 'capitalize',
            }}>
              {gameState.player2Choice}
            </div>
            <HealthBar
              currentHP={gameState.player2HP}
              maxHP={CHOICE_HP[gameState.player2Choice!]}
              color={PLAYER_COLORS.player2}
            />
          </div>
        </div>
      </div>

      <div style={{
        textAlign: 'center',
        color: '#666',
        fontSize: '14px',
      }}>
        <p>Arena phase coming soon!</p>
        <p>Movement controls will be added in the next phase.</p>
      </div>

      {/* Temporary: Auto-transition to results for testing */}
      <button
        onClick={() => {
          const winner = determineWinner(gameState.player1Choice, gameState.player2Choice);
          endArena(winner);
        }}
        style={{
          padding: '15px 30px',
          fontSize: '18px',
          backgroundColor: '#4A90E2',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        Simulate Battle (Temporary)
      </button>
    </div>
  );

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
