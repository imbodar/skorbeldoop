export type Choice = 'rock' | 'paper' | 'scissors' | null;

export type GameResult = 'player1' | 'player2' | 'tie' | null;

export type GamePhase = 'selection' | 'arena' | 'results';

export interface GameState {
  player1Choice: Choice;
  player2Choice: Choice;
  result: GameResult;
  player1Score: number;
  player2Score: number;
  roundNumber: number;
  showResult: boolean;
  phase: GamePhase;
}
