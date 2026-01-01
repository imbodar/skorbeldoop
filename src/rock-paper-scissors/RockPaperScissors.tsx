import { useState, useEffect, useCallback } from 'react';
import { GameState, Choice, GameResult } from './types';
import { CHOICE_EMOJI, PLAYER_COLORS } from './constants';

const RockPaperScissors = () => {
  const [gameState, setGameState] = useState<GameState>({
    player1Choice: null,
    player2Choice: null,
    result: null,
    player1Score: 0,
    player2Score: 0,
    roundNumber: 1,
    showResult: false,
  });

  const [player1Highlight, setPlayer1Highlight] = useState<Choice>(null);
  const [player2Highlight, setPlayer2Highlight] = useState<Choice>(null);

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
    }));
  }, []);

  const handleChoice = useCallback((player: 'player1' | 'player2', choice: Choice) => {
    setGameState((prev) => {
      if (prev.showResult) return prev;

      const newState = {
        ...prev,
        [player === 'player1' ? 'player1Choice' : 'player2Choice']: choice,
      };

      // Check if both players have made their choice
      if (newState.player1Choice && newState.player2Choice) {
        const result = determineWinner(newState.player1Choice, newState.player2Choice);
        return {
          ...newState,
          result,
          showResult: true,
          player1Score: prev.player1Score + (result === 'player1' ? 1 : 0),
          player2Score: prev.player2Score + (result === 'player2' ? 1 : 0),
          roundNumber: prev.roundNumber + 1,
        };
      }

      return newState;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Player 1 controls: W, A, S
      if (key === 'w') {
        setPlayer1Highlight('rock');
        handleChoice('player1', 'rock');
      } else if (key === 'a') {
        setPlayer1Highlight('paper');
        handleChoice('player1', 'paper');
      } else if (key === 's') {
        setPlayer1Highlight('scissors');
        handleChoice('player1', 'scissors');
      }

      // Player 2 controls: Arrow keys
      if (key === 'arrowup') {
        setPlayer2Highlight('rock');
        handleChoice('player2', 'rock');
      } else if (key === 'arrowleft') {
        setPlayer2Highlight('paper');
        handleChoice('player2', 'paper');
      } else if (key === 'arrowdown') {
        setPlayer2Highlight('scissors');
        handleChoice('player2', 'scissors');
      }

      // Space to continue to next round
      if (key === ' ' && gameState.showResult) {
        e.preventDefault();
        resetRound();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (['w', 'a', 's'].includes(key)) {
        setPlayer1Highlight(null);
      }
      if (['arrowup', 'arrowleft', 'arrowdown'].includes(key)) {
        setPlayer2Highlight(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleChoice, gameState.showResult, resetRound]);

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

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Rock Paper Scissors</h1>

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

      {/* Result Display */}
      {gameState.showResult && (
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
      )}

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
              const isHighlighted = player1Highlight === choice;
              const hasChosen = gameState.player1Choice !== null;
              const showingResult = gameState.showResult;

              // If player has chosen but result not shown yet, highlight all yellow
              const hideChoice = hasChosen && !showingResult;

              return (
                <div
                  key={choice}
                  style={{
                    padding: '25px',
                    border: (showingResult && isSelected) ? '4px solid #FFD700' : '2px solid #ddd',
                    borderRadius: '10px',
                    textAlign: 'center',
                    fontSize: '48px',
                    backgroundColor: isHighlighted ? '#e6f3ff' : (hideChoice ? '#ffffcc' : (showingResult && isSelected ? '#ffffcc' : '#fff')),
                    transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.1s ease',
                    boxShadow: (showingResult && isSelected) ? '0 4px 8px rgba(255, 215, 0, 0.5)' : 'none',
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

          {gameState.player1Choice && !gameState.showResult && (
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
          {gameState.player1Choice && gameState.showResult && (
            <div style={{
              marginTop: '20px',
              textAlign: 'center',
              fontSize: '18px',
              color: PLAYER_COLORS.player1,
              fontWeight: 'bold',
            }}>
              You picked: {CHOICE_EMOJI[gameState.player1Choice]}
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
              const isHighlighted = player2Highlight === choice;
              const hasChosen = gameState.player2Choice !== null;
              const showingResult = gameState.showResult;

              // If player has chosen but result not shown yet, highlight all yellow
              const hideChoice = hasChosen && !showingResult;

              return (
                <div
                  key={choice}
                  style={{
                    padding: '25px',
                    border: (showingResult && isSelected) ? '4px solid #FFD700' : '2px solid #ddd',
                    borderRadius: '10px',
                    textAlign: 'center',
                    fontSize: '48px',
                    backgroundColor: isHighlighted ? '#ffe6f0' : (hideChoice ? '#ffffcc' : (showingResult && isSelected ? '#ffffcc' : '#fff')),
                    transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.1s ease',
                    boxShadow: (showingResult && isSelected) ? '0 4px 8px rgba(255, 215, 0, 0.5)' : 'none',
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

          {gameState.player2Choice && !gameState.showResult && (
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
          {gameState.player2Choice && gameState.showResult && (
            <div style={{
              marginTop: '20px',
              textAlign: 'center',
              fontSize: '18px',
              color: PLAYER_COLORS.player2,
              fontWeight: 'bold',
            }}>
              You picked: {CHOICE_EMOJI[gameState.player2Choice]}
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
        <p>Both players make their choice, then press SPACE for the next round!</p>
      </div>
    </div>
  );
};

export default RockPaperScissors;
