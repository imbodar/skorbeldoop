export interface Player {
  x: number;
  y: number;
  rotation: number;
  speed: number;
  width: number;
  height: number;
}

export interface TrailPoint {
  x: number;
  y: number;
  rotation: number;
  alpha: number;
}

export interface World {
  width: number;
  height: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface Rock {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VoronoiRegion {
  x: number;
  y: number;
  isRock: boolean;
}

export interface BoidTrailPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
}

export interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  trail: BoidTrailPoint[];
}

export interface GameState {
  player: Player;
  world: World;
  camera: Camera;
  keys: Record<string, boolean>;
  trail: TrailPoint[];
  rocks: Rock[];
  regions: VoronoiRegion[];
  boids: Boid[];
}
