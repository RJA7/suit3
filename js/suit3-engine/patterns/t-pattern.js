import { Pattern } from './pattern';
import { Tile } from '../tile';

export class TPattern extends Pattern {
  check({directions, tile, tileA, tileB, hash}) {
    for (let i = 0; i < 4; i++) {
      const dir = directions[i];
      const left = directions[i - 1] || directions[3];
      const right = directions[i + 1] || directions[0];
      const opposite = directions[(i + 2) % 4];
      let result;

      if (dir.length > 1 && left.length > 0 && right.length > 0) {
        result = {
          tiles: [...dir, ...left, ...right, ...opposite],
          target: {
            tile,
            type: Tile.type.ROOK,
          },
        };

        Pattern.markHash(result.tiles, hash);
        hash[tile.id] = true;

        return result;
      }
    }
  }
}
