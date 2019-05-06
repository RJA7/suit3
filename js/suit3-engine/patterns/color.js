import Pattern from './pattern';
import Tile from '../tile';

export default class Color extends Pattern {
  check({directions, tile, tileA, tileB, hash}) {
    for (let i = 1; i < 3; i++) { // for right and bottom
      const dir = directions[i];
      let res;

      if (dir.length === 2) {
        dir.push(tile);
        res = {items: dir};
      } else if (dir.length > 2) {
        const indexA = dir.indexOf(tileA);
        const indexB = dir.indexOf(tileB);
        const targetIndex = indexA !== -1 ? indexA : indexB !== -1 ? indexB : Math.floor(Math.random() * dir.length);

        res = {
          items: dir,
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

      if (res) {
        Pattern.markHash(res.items, hash);

        return res;
      }
    }
  }
}
