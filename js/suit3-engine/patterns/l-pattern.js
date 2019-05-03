import Pattern from './pattern';
import Data from '../data';

export default class LPattern extends Pattern {
  check({directions, data, dataA, dataB, hash}) {
    for (let i = 0; i < 4; i++) {
      const dir = directions[i];
      const right = directions[i + 1] || directions[0];
      let res;

      if (dir.length > 1 && right.length > 1) {
        res = {
          items: [...dir, ...right],
          target: {
            data,
            type: Data.type.DIAGONAL,
          },
        };

        Pattern.markHash(res.items, hash);
        hash[data.id] = true;

        return res;
      }
    }
  }
}
