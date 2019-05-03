import Pattern from './pattern';
import Data from '../data';

export default class Color extends Pattern {
  check({directions, data, dataA, dataB, hash}) {
    for (let i = 1; i < 3; i++) { // for right and bottom
      const dir = directions[i];
      let res;

      if (dir.length === 2) {
        dir.push(data);
        res = {items: dir};
      } else if (dir.length > 2) {
        const indexA = dir.indexOf(dataA);
        const indexB = dir.indexOf(dataB);
        const targetIndex = indexA !== -1 ? indexA : indexB !== -1 ? indexB : Math.floor(Math.random() * dir.length);

        res = {
          items: dir,
          target: {
            data: dir[targetIndex],
            type: dir.length === 3 ?
              i === 1 ? Data.type.HORIZONTAL : Data.type.VERTICAL :
              Data.type.BOMB,
          },
        };

        hash[dir[targetIndex].id] = true;
        dir.splice(targetIndex, 1);
        dir.push(data);
      }

      if (res) {
        Pattern.markHash(res.items, hash);

        return res;
      }
    }
  }
}
