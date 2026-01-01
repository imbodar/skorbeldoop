export interface Point {
  x: number;
  y: number;
}

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
  trail: Point[];
  trailIndex: number;
}

export interface Camera {
  x: number;
  y: number;
}

export interface World {
  width: number;
  height: number;
}

export interface GameState {
  player: Player;
  camera: Camera;
  world: World;
  keys: { [key: string]: boolean };
}
