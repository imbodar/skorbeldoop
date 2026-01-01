export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  speed: number;
  maxSpeed: number;
  acceleration: number;
  friction: number;
  rotationSpeed: number;
  hunger: number;
  maxHunger: number;
  trail: Array<{ x: number; y: number }>;
  trailIndex: number; // Circular buffer write index
  isDead: boolean;
  invincible: boolean;
  invincibilityTimer: number;
  shellFragments: number;
  hasShield: boolean;
  shieldRechargeTimer: number;
}

export interface Rock {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  trail: Array<{ x: number; y: number }>;
  trailIndex: number; // Circular buffer write index
}

export interface FoodOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  lifetime: number;
}

export interface ShellFragment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

export interface Leviathan {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  rotation: number;
  trail: Array<{ x: number; y: number }>;
  trailIndex: number; // Circular buffer write index
  isCharging: boolean;
  chargeTimer: number;
  chargeDirection: { x: number; y: number };
  chargeCooldown: number;
  isStunned: boolean;
  stunTimer: number;
  isGolden: boolean;
  health: number;
  maxHealth: number;
  dashCount: number;
}

export interface World {
  width: number;
  height: number;
  rocks: Rock[];
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface GameState {
  player: Player;
  world: World;
  camera: Camera;
  keys: Record<string, boolean>;
  previousRayEndpoints: Array<{ x: number; y: number }>;
  boids: Boid[];
  leviathans: Leviathan[];
  foodOrbs: FoodOrb[];
  shellFragments: ShellFragment[];
  frameCount: number;
}

export interface Point {
  x: number;
  y: number;
}
