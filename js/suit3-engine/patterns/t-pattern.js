import Pattern from './pattern';
import Data from '../data';

export default class TPattern extends Pattern {
  check({directions, data, dataA, dataB, hash}) {
    for (let i = 0; i < 4; i++) {
      const dir = directions[i];
      const left = directions[i - 1] || directions[3];
      const right = directions[i + 1] || directions[0];
      const opposite = directions[(i + 2) % 4];
      let res;

      if (dir.length > 1 && left.length > 0 && right.length > 0) {
        res = {
          items: [...dir, ...left, ...right, ...opposite],
          target: {
            data,
            type: Data.type.ROOK,
          },
        };

        Pattern.markHash(res.items, hash);
        hash[data.id] = true;

        return res;
      }
    }
  }
}
