import { Pattern } from './pattern';
import { Tile } from '../tile';

export class ColorPattern extends Pattern {
  check({directions, tile, tileA, tileB, hash}) {
    for (let i = 1; i < 3; i++) { // for right and bottom
      const dir = directions[i];
      let result;

      if (dir.length === 2) {
        dir.push(tile);
        result = {tiles: dir};
      } else if (dir.length > 2) {
        const indexA = dir.indexOf(tileA);
        const indexB = dir.indexOf(tileB);
        const targetIndex = indexA !== -1 ? indexA : indexB !== -1 ? indexB : Math.floor(Math.random() * dir.length);

        result = {
          tiles: dir,
          target: {
            tile: dir[targetIndex],
            type: dir.length === 3 ?
              i === 1 ? Tile.type.HORIZONTAL : Tile.type.VERTICAL :
              Tile.type.BOMB,
          },
        };

        hash[dir[targetIndex].id] = true;
        dir.splice(targetIndex, 1);
        dir.push(tile);
      }

      if (result) {
        Pattern.markHash(result.tiles, hash);

        return result;
      }
    }
  }
}
