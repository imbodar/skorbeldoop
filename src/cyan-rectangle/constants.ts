export const GAME_CONSTANTS = {
  // World - same as Cave Explorer
  WORLD_WIDTH: 5000,
  WORLD_HEIGHT: 5000,
  WORLD_START_X: 2500,
  WORLD_START_Y: 2500,

  // Player - cyan rectangle 4 times longer than wide
  PLAYER_WIDTH: 20,
  PLAYER_HEIGHT: 80, // 4 times the width
  PLAYER_MAX_SPEED: 8,
  PLAYER_ACCELERATION: 0.5,
  PLAYER_FRICTION: 0.92,
  PLAYER_ROTATION_SPEED: 0.05,

  // Camera
  CAMERA_ZOOM: 1,
  CAMERA_FOLLOW_SPEED: 0.1,

  // Trail effect
  MAX_TRAIL_LENGTH: 50,
  TRAIL_MIN_SPEED: 0.1,

  // Voronoi world generation
  VORONOI_REGIONS: 100, // Total regions (50 will be rock, 50 will be air)
  VORONOI_GRID_SIZE: 80, // Size of each rock tile
  CLEAR_RADIUS: 400, // Radius around spawn that's guaranteed to be clear

  // Line of sight and shadows
  LINE_OF_SIGHT_RAYS: 180,
  LINE_OF_SIGHT_DISTANCE: 800,
  SHADOW_OPACITY: 0.88,
};
