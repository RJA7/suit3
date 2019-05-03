import Dispatcher from './dispatcher';
import async from 'async';
import Data from './data';
import Pattern from 'js/suit3-engine/patterns/pattern';

const wrap = cb => () => cb();

class Suit3 extends Dispatcher {
  constructor(config) {
    super();

    const {colors, rows, cols, grid, patterns} = config;
    const model = [];
    const items = [];
    const getColor = grid ? (i, j) => grid[i][j] : () => Math.random() * colors | 0;

    for (let i = 0, color, data; i < rows; i++) {
      model[i] = [];

      for (let j = 0; j < cols; j++) {
        color = getColor(i, j);
        data = color === null ? null : new Data(i, j, color);
        data ? items.push(data) : '';
        model[i][j] = data;
      }
    }

    this._ready = true;
    this.colors = colors;
    this.rows = rows;
    this.cols = cols;
    this.model = model;
    this.items = items;
    this.patterns = patterns;

    this.normalize(true);
  }

  move(data1, data2) {
    if (!this._ready || !Suit3.isNeighbor(data1, data2)) return;
    this._ready = false;

    this.swap(data1, data2);

    const matches = this.match(data1, data2);
    const method = matches ? 'move' : 'fake';
    const event = matches ? this.MOVE : this.FAKE;
    const items = [data1, data2];
    const cb = matches ? () => this.kill(matches) : () => {
      this.swap(data1, data2);
      this._ready = true;
    };

    async.parallel([
      (parallelCb) => async.each(items, (data, cb) => data[method](wrap(cb)), parallelCb),
      (parallelCb) => this.post(event, items, parallelCb),
    ], cb);
  }

  match(dataA, dataB) {
    const {patterns, model, rows, cols} = this;
    const matches = [];
    const hash = {};

    if (dataA && dataB) {

      // Destroy full board
      if (dataA.type === Data.type.BOMB && dataB.type === Data.type.BOMB) {
        const items = this.items.slice();
        Pattern.markHash(items, hash);
        matches.push({items});
      }

      // QUEEN destroy
      if (
        dataA.type === Data.type.HORIZONTAL && dataB.type === Data.type.DIAGONAL ||
        dataA.type === Data.type.DIAGONAL && dataB.type === Data.type.HORIZONTAL
      ) {
        const items = [
          ...this.collectDirection(data, 0, -1, hash),
          ...this.collectDirection(data, 1, 0, hash),
          ...this.collectDirection(data, 0, 1, hash),
          ...this.collectDirection(data, -1, 0, hash),
          ...this.collectDirection(data, -1, -1, hash),
          ...this.collectDirection(data, 1, -1, hash),
          ...this.collectDirection(data, 1, 1, hash),
          ...this.collectDirection(data, -1, 1, hash),
        ];

        Pattern.markHash(items, hash);
        matches.push({items});
      }
    }

    for (let k = 0, l = patterns.length; k < l; k++) {
      const pattern = patterns[k];

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const data = model[i][j];

          if (!data || hash[data.id]) continue;

          const match = pattern.check({
            data,
            dataA,
            dataB,
            hash,

            directions: [
              this.collectDirection(data, 0, -1, hash, true),
              this.collectDirection(data, 1, 0, hash, true),
              this.collectDirection(data, 0, 1, hash, true),
              this.collectDirection(data, -1, 0, hash, true),
            ],
          });

          match && matches.push(match);
        }
      }
    }

    for (let i = 0, iLen = matches.length; i < iLen; i++) {
      const match = matches[i];
      const items = match.items;
      const collectedItems = [];

      for (let j = 0, jLen = items.length; j < jLen; j++) {
        const collected = this.collectAfterDestroyers(items[j], hash);
        collected && collectedItems.push(...collected);
      }

      if (collectedItems.length) {
        matches.push({items: collectedItems});
      }
    }

    return matches.length ? matches : null;
  }

  collectAfterDestroyers(data, hash) {
    const {model} = this;
    let collectedItems;

    if (data.type === Data.type.HORIZONTAL) {
      collectedItems = [
        ...this.collectDirection(data, 1, 0, hash),
        ...this.collectDirection(data, -1, 0, hash),
      ];
    } else if (data.type === Data.type.VERTICAL) {
      collectedItems = [
        ...this.collectDirection(data, 0, 1, hash),
        ...this.collectDirection(data, 0, -1, hash),
      ];
    } else if (data.type === Data.type.DIAGONAL) {
      collectedItems = [
        ...this.collectDirection(data, -1, -1, hash),
        ...this.collectDirection(data, 1, -1, hash),
        ...this.collectDirection(data, 1, 1, hash),
        ...this.collectDirection(data, -1, 1, hash),
      ];
    } else if (data.type === Data.type.ROOK) {
      collectedItems = [
        ...this.collectDirection(data, 0, -1, hash),
        ...this.collectDirection(data, 1, 0, hash),
        ...this.collectDirection(data, 0, 1, hash),
        ...this.collectDirection(data, -1, 0, hash),
      ];
    } else if (data.type === Data.type.BOMB) {
      const poses = [
        0, -1,
        1, 0,
        0, 1,
        -1, 0,
        -1, -1,
        1, -1,
        1, 1,
        -1, 1,
      ];

      collectedItems = [];

      for (let i = 0, l = poses.length, row, col; i < l; i += 2) {
        row = data.row + poses[i + 1];
        col = data.col + poses[i];
        model[row] && model[row][col] && collectedItems.push(model[row][col]);
      }
    }

    if (collectedItems) {
      collectedItems = collectedItems.filter((item) => {
        if (hash[item.id]) {
          return false;
        }

        hash[item.id] = true;

        return true;
      });

      for (let i = 0, l = collectedItems.length, items; i < l; i++) {
        items = this.collectAfterDestroyers(collectedItems[i], hash);
        items && collectedItems.push(...items);
      }
    }

    return collectedItems;
  }

  collectDirection(data, stepX, stepY, hash, stopOnMiss) {
    const model = this.model;
    const pos = {row: data.row, col: data.col};
    const res = [];

    while (true) {
      pos.row += stepY;
      pos.col += stepX;
      const next = model[pos.row] && model[pos.row][pos.col];

      if (!next) {
        return res;
      }

      if (stopOnMiss && (hash[next.id] || !this.areMatchable(data, next))) {
        return res;
      }

      res.push(next);
    }
  }

  areMatchable(dataA, dataB) {
    return dataA.color === dataB.color;
  }

  kill(matches) {
    async.each(matches, (match, eachCb) => {
      async.waterfall([
        cb => this.post(this.BEFORE_KILL, match, cb),

        cb => async.parallel([
          parallelCb => async.each(match.items, (data, eachCb) => data.kill(match, wrap(eachCb)), parallelCb),
          parallelCb => {
            if (!match.target) {
              return parallelCb();
            }

            match.target.data.type = match.target.type;
            match.target.data.killTarget(match, wrap(parallelCb));
          },
          parallelCb => this.post(this.KILL, match, parallelCb),
        ], wrap(cb)),
      ], wrap(eachCb));
    }, () => this.fall(matches));
  }

  fall(matches) {
    const items = [];

    for (let i = 0, l = matches.length; i < l; i++) {
      items.push(...matches[i].items);
    }

    async.parallel([
      parallelCb => {
        async.each(this.hoist(items), (data, eachCb) => data.fall(wrap(eachCb)), parallelCb);
      },

      parallelCb => {
        this.post(this.FALL, items, parallelCb);
      },
    ], () => {
      const matches = this.match();

      if (matches) {
        return this.kill(matches);
      }

      if (this.normalize()) {
        return async.each(
          this.items,
          (data, eachCb) => data.afterShuffle(wrap(eachCb)),
          () => this.setReady(),
        );
      }

      this.setReady();
    });
  }

  setReady() {
    this.post(this.READY);
    this._ready = true;
  }

  normalize(checkMatches = false) {
    let wasNormalized = false;
    let n = 9999;

    while (!this.findMove() || (checkMatches && this.match())) {
      if (n-- === 0) throw new Error('Try better config!');
      this.shuffle();
      wasNormalized = true;
      checkMatches = true;
    }

    return wasNormalized;
  }

  swap(data1, data2) {
    const {row: row1, col: col1} = data1;
    const {row: row2, col: col2} = data2;
    data1.row = row2;
    data1.col = col2;
    data2.row = row1;
    data2.col = col1;
    this.model[row1][col1] = data2;
    this.model[row2][col2] = data1;
  }

  hoist(items) {
    const {colors, model} = this;
    const movedItems = [];
    const colsMap = {};
    const hash = {};

    for (let i = 0, length = items.length, len2 = length * 2; i < len2; i++) {
      const data = items[i] || items[i - length];
      data.fallDelay = 0;

      while (true) {
        const topData = model[data.row - 1] && (
          model[data.row - 1][data.col] ||
          model[data.row - 1][data.col + 1] ||
          model[data.row - 1][data.col - 1]
        );

        if (!topData || (i < length && topData.col !== data.col)) break;

        if (!hash[topData.id]) {
          hash[topData.id] = true;
          movedItems.push(topData);
          topData.fallPath.x.length = 0;
          topData.fallPath.y.length = 0;
          topData.fallDelay = 0;
        }

        topData.fallPath.x.push(data.col);
        topData.fallPath.y.push(data.row);
        this.swap(data, topData);
      }

      if (i < length) continue;

      if (!hash[data.id]) {
        hash[data.id] = true;
        movedItems.push(data);
      }

      data.fallPath.x.length = 0;
      data.fallPath.y.length = 0;
      data.fallPath.x.push(data.col);
      data.fallPath.y.push(data.row);
      data.color = Math.floor(Math.random() * colors);
      data.type = Data.type.DEFAULT;
      data.revive();
      colsMap[data.col] = colsMap[data.col] || [];
      colsMap[data.col].push(data);
    }

    for (const key in colsMap) {
      colsMap[key]
        .sort(Suit3.sort)
        .forEach(Suit3.setFallDelay);
    }

    return movedItems;
  }

  static sort(a, b) {
    return b.row - a.row;
  }

  static setFallDelay(data, index) {
    data.fallDelay = index;
  }

  shuffle() {
    const {items} = this;
    const length = items.length;

    for (let i = 0, newIndex; i < length; i++) {
      newIndex = Math.floor(Math.random() * length);
      newIndex !== i && this.swap(items[i], items[newIndex]);
    }
  }

  findMove() {
    const {model, rows, cols} = this;
    const randomRow = Math.random() * rows | 0;
    const randomCol = Math.random() * cols | 0;

    for (let i = randomRow, res; i !== (randomRow + rows - 1) % rows; i = (i + 1) % rows) {
      for (let j = randomCol; j !== (randomCol + cols - 1) % cols; j = (j + 1) % cols) {
        res = this.check(model[i][j], model[i][j + 1]);

        if (res) {
          return res;
        }

        res = this.check(model[i][j], model[i + 1] && model[i + 1][j]);

        if (res) {
          return res;
        }
      }
    }
  }

  check(data1, data2) {
    if (!data1 || !data2) return;

    this.swap(data1, data2);
    const res = this.match();
    this.swap(data1, data2);

    return res ? [data1, data2] : null;
  }

  static isNeighbor(data1, data2) {
    return Math.abs(data1.row - data2.row) + Math.abs(data1.col - data2.col) === 1;
  }
}

export {Suit3};
