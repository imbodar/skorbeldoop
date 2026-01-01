export interface Player {
  x: number;
  y: number;
  rotation: number;
  speed: number;
  width: number;
  height: number;
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

export interface GameState {
  player: Player;
  world: World;
  camera: Camera;
  keys: Record<string, boolean>;
}
