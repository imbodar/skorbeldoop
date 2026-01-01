export const CHOICES = ['rock', 'paper', 'scissors'] as const;

export const CHOICE_COLORS = {
  rock: '#000000',
  paper: '#FFFFFF',
  scissors: '#888888',
} as const;

export const CHOICE_EMOJI = {
  rock: '🪨',
  paper: '📄',
  scissors: '✂️',
} as const;

export const PLAYER_COLORS = {
  player1: '#4A90E2',
  player2: '#E24A90',
} as const;

// Arena configuration
export const ARENA_WIDTH = 800;
export const ARENA_HEIGHT = 500;
export const PLAYER_SIZE = 60;
export const MOVE_SPEED = 5; // pixels per frame
export const COLLISION_DISTANCE = 50; // pixels - distance for collision detection

// Initial spawn positions (20% from edges)
export const PLAYER1_SPAWN_X = ARENA_WIDTH * 0.2;
export const PLAYER1_SPAWN_Y = ARENA_HEIGHT / 2;

export const PLAYER2_SPAWN_X = ARENA_WIDTH * 0.8;
export const PLAYER2_SPAWN_Y = ARENA_HEIGHT / 2;
