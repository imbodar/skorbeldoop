import { Leviathan, Rock, Point, Player } from './types';
import { GAME_CONSTANTS } from './constants';
import { checkRockCollision, hasRocksNearby } from './physics';

export function spawnLeviathan(
  playerPos: Point,
  rocks: Rock[],
  nearPlayer: boolean = false
): Leviathan | null {
  const leviathanWidth = GAME_CONSTANTS.PLAYER_WIDTH * GAME_CONSTANTS.LEVIATHAN_WIDTH_MULTIPLIER;
  const leviathanHeight = GAME_CONSTANTS.PLAYER_HEIGHT * GAME_CONSTANTS.LEVIATHAN_HEIGHT_MULTIPLIER;

  for (let attempt = 0; attempt < 100; attempt++) {
    let x: number, y: number;

    if (nearPlayer) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 200 + Math.random() * 200;
      x = playerPos.x + Math.cos(angle) * distance;
      y = playerPos.y + Math.sin(angle) * distance;
    } else {
      x = Math.random() * GAME_CONSTANTS.WORLD_WIDTH;
      y = Math.random() * GAME_CONSTANTS.WORLD_HEIGHT;
    }

    const distToPlayer = Math.sqrt((x - playerPos.x) ** 2 + (y - playerPos.y) ** 2);

    if (!checkRockCollision(x, y, rocks, leviathanWidth, leviathanHeight) &&
        !hasRocksNearby(x, y, rocks, 400)) {
      if (nearPlayer || distToPlayer > 800) {
        return {
          x,
          y,
          width: leviathanWidth,
          height: leviathanHeight,
          vx: (Math.random() - 0.5) * 1,
          vy: (Math.random() - 0.5) * 1,
          rotation: Math.random() * Math.PI * 2,
          trail: [],
          isCharging: false,
          chargeTimer: 0,
          chargeDirection: { x: 0, y: 0 },
          chargeCooldown: 0,
          isStunned: false,
          stunTimer: 0,
          isGolden: false,
          health: GAME_CONSTANTS.LEVIATHAN_MAX_HEALTH,
          maxHealth: GAME_CONSTANTS.LEVIATHAN_MAX_HEALTH
        };
      }
    }
  }

  return null;
}

export function generateLeviathans(
  playerPos: Point,
  rocks: Rock[],
  count: number = GAME_CONSTANTS.LEVIATHAN_COUNT
): Leviathan[] {
  const leviathans: Leviathan[] = [];

  for (let i = 0; i < count; i++) {
    const levi = spawnLeviathan(playerPos, rocks, false);
    if (levi) {
      leviathans.push(levi);
    }
  }

  return leviathans;
}
