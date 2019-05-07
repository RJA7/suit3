import { Pattern } from './pattern';
import { Tile } from '../tile';

export class LPattern extends Pattern {
  check({directions, tile, tileA, tileB, hash}) {
    for (let i = 0; i < 4; i++) {
      const dir = directions[i];
      const right = directions[i + 1] || directions[0];
      let result;

      if (dir.length > 1 && right.length > 1) {
        result = {
          tiles: [...dir, ...right],
          target: {
            tile,
            type: Tile.type.DIAGONAL,
          },
        };

        Pattern.markHash(result.tiles, hash);
        hash[tile.id] = true;

        return result;
      }
    }
  }
}
