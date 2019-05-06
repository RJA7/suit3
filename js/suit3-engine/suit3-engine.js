import Dispatcher from './dispatcher';
import async from 'async';
import Tile from './tile';
import Pattern from 'js/suit3-engine/patterns/pattern';
import TPattern from 'js/suit3-engine/patterns/t-pattern';
import LPattern from 'js/suit3-engine/patterns/l-pattern';
import ColorPattern from 'js/suit3-engine/patterns/color';

const wrap = cb => () => cb();

const patterns = [
  new TPattern(),
  new LPattern(),
  new ColorPattern(),
];

class Suit3 extends Dispatcher {
  constructor(level) {
    super();

    const {colors, grid} = level;
    const model = [];
    const items = [];
    const rows = grid.length;
    const cols = grid.reduce((acc, v) => Math.max(acc, v.length), 0);

    for (let i = 0, tile; i < rows; i++) {
      model[i] = [];

      for (let j = 0; j < cols; j++) {
        const color = grid[i][j].color;
        tile = color === null ? null : new Tile(i, j, color, grid[i][j].type);
        tile ? items.push(tile) : '';
        model[i][j] = tile;
      }
    }

    this._ready = true;
    this.colors = colors;
    this.rows = rows;
    this.cols = cols;
    this.model = model;
    this.items = items;
    this.patterns = patterns;
  }

  move(tileA, tileB) {
    if (!this._ready || !Suit3.isNeighbor(tileA, tileB)) return;
    this._ready = false;

    this.swap(tileA, tileB);

    const matches = this.match(tileA, tileB);
    const method = matches ? 'move' : 'fake';
    const event = matches ? this.MOVE : this.FAKE;
    const items = [tileA, tileB];
    const cb = matches ? () => this.kill(matches) : () => {
      this.swap(tileA, tileB);
      this._ready = true;
    };

    async.parallel([
      (parallelCb) => async.each(items, (tile, cb) => tile[method](wrap(cb)), parallelCb),
      (parallelCb) => this.post(event, items, parallelCb),
    ], cb);
  }

  match(tileA, tileB) {
    const {patterns, model, rows, cols} = this;
    const matches = [];
    const hash = {};

    // Drops check. Add all to hash so they cannot be destroyed
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const tile = model[i][j];

        if (!tile || tile.type !== Tile.type.DROP) continue;

        hash[tile.id] = true;

        if (!model[tile.row + 1]) {
          matches.push({items: [tile]});
        }
      }
    }

    if (tileA && tileB) {

      // Destroy full board
      if (tileA.type === Tile.type.BOMB && tileB.type === Tile.type.BOMB) {
        const items = this.items.slice();
        Pattern.markHash(items, hash);
        matches.push({items});
      }

      // QUEEN destroy
      if (
        tileA.type === Tile.type.HORIZONTAL && tileB.type === Tile.type.DIAGONAL ||
        tileA.type === Tile.type.DIAGONAL && tileB.type === Tile.type.HORIZONTAL
      ) {
        const items = [
          ...this.collectDirection(tileB, 0, -1, hash),
          ...this.collectDirection(tileB, 1, 0, hash),
          ...this.collectDirection(tileB, 0, 1, hash),
          ...this.collectDirection(tileB, -1, 0, hash),
          ...this.collectDirection(tileB, -1, -1, hash),
          ...this.collectDirection(tileB, 1, -1, hash),
          ...this.collectDirection(tileB, 1, 1, hash),
          ...this.collectDirection(tileB, -1, 1, hash),
        ];

        Pattern.markHash(items, hash);
        matches.push({items});
      }
    }

    // Patterns check
    for (let k = 0, l = patterns.length; k < l; k++) {
      const pattern = patterns[k];

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const tile = model[i][j];

          if (!tile || hash[tile.id]) continue;

          const match = pattern.check({
            tile,
            tileA,
            tileB,
            hash,

            directions: [
              this.collectDirection(tile, 0, -1, hash, true),
              this.collectDirection(tile, 1, 0, hash, true),
              this.collectDirection(tile, 0, 1, hash, true),
              this.collectDirection(tile, -1, 0, hash, true),
            ],
          });

          match && matches.push(match);
        }
      }
    }

    // Remove from explosion
    for (let i = 0, iLen = matches.length; i < iLen; i++) {
      const match = matches[i];
      const collectedItems = [];
      const items = [...match.items];
      match.target && items.push(match.target.tile);

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

  collectAfterDestroyers(tile, hash) {
    const {model} = this;
    let collectedItems;

    if (tile.type === Tile.type.HORIZONTAL) {
      collectedItems = [
        ...this.collectDirection(tile, 1, 0, hash),
        ...this.collectDirection(tile, -1, 0, hash),
      ];
    } else if (tile.type === Tile.type.VERTICAL) {
      collectedItems = [
        ...this.collectDirection(tile, 0, 1, hash),
        ...this.collectDirection(tile, 0, -1, hash),
      ];
    } else if (tile.type === Tile.type.DIAGONAL) {
      collectedItems = [
        ...this.collectDirection(tile, -1, -1, hash),
        ...this.collectDirection(tile, 1, -1, hash),
        ...this.collectDirection(tile, 1, 1, hash),
        ...this.collectDirection(tile, -1, 1, hash),
      ];
    } else if (tile.type === Tile.type.ROOK) {
      collectedItems = [
        ...this.collectDirection(tile, 0, -1, hash),
        ...this.collectDirection(tile, 1, 0, hash),
        ...this.collectDirection(tile, 0, 1, hash),
        ...this.collectDirection(tile, -1, 0, hash),
      ];
    } else if (tile.type === Tile.type.BOMB) {
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
        row = tile.row + poses[i + 1];
        col = tile.col + poses[i];
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

  collectDirection(tile, stepX, stepY, hash, stopOnMiss) {
    const model = this.model;
    const pos = {row: tile.row, col: tile.col};
    const res = [];

    while (true) {
      pos.row += stepY;
      pos.col += stepX;
      const next = model[pos.row] && model[pos.row][pos.col];

      if (!next) {
        return res;
      }

      if (stopOnMiss && (hash[next.id] || !this.areMatchable(tile, next))) {
        return res;
      }

      res.push(next);
    }
  }

  areMatchable(tileA, tileB) {
    return tileA.color === tileB.color;
  }

  kill(matches) {
    async.each(matches, (match, eachCb) => {
      async.waterfall([
        cb => this.post(this.BEFORE_KILL, match, cb),

        cb => async.parallel([
          parallelCb => async.each(match.items, (tile, eachCb) => tile.kill(match, wrap(eachCb)), parallelCb),
          parallelCb => {
            if (!match.target) {
              return parallelCb();
            }

            match.target.tile.type = match.target.type;
            match.target.tile.killTarget(match, wrap(parallelCb));
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
        async.each(this.hoist(items), (tile, eachCb) => tile.fall(wrap(eachCb)), parallelCb);
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
          (tile, eachCb) => tile.afterShuffle(wrap(eachCb)),
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

  normalize() {
    let wasNormalized = false;
    let n = 999;

    while (!this.findMove()) {
      if (n-- === 0) throw new Error('Try better config!');
      this.shuffle();
      wasNormalized = true;
    }

    return wasNormalized;
  }

  swap(tileA, tileB) {
    const {row: row1, col: col1} = tileA;
    const {row: row2, col: col2} = tileB;
    tileA.row = row2;
    tileA.col = col2;
    tileB.row = row1;
    tileB.col = col1;
    this.model[row1][col1] = tileB;
    this.model[row2][col2] = tileA;
  }

  hoist(items) {
    const {colors, model} = this;
    const movedItems = [];
    const colsMap = {};
    const hash = {};

    for (let i = 0, length = items.length, len2 = length * 2; i < len2; i++) {
      const tile = items[i] || items[i - length];
      tile.fallDelay = 0;

      while (true) {
        const topTile = model[tile.row - 1] && (
          model[tile.row - 1][tile.col] ||
          model[tile.row - 1][tile.col + 1] ||
          model[tile.row - 1][tile.col - 1]
        );

        if (!topTile || (i < length && topTile.col !== tile.col)) break;

        if (!hash[topTile.id]) {
          hash[topTile.id] = true;
          movedItems.push(topTile);
          topTile.fallPath.x.length = 0;
          topTile.fallPath.y.length = 0;
          topTile.fallDelay = 0;
        }

        topTile.fallPath.x.push(tile.col);
        topTile.fallPath.y.push(tile.row);
        this.swap(tile, topTile);
      }

      if (i < length) continue;

      if (!hash[tile.id]) {
        hash[tile.id] = true;
        movedItems.push(tile);
      }

      tile.fallPath.x.length = 0;
      tile.fallPath.y.length = 0;
      tile.fallPath.x.push(tile.col);
      tile.fallPath.y.push(tile.row);
      tile.color = Math.floor(Math.random() * colors);
      tile.type = Tile.type.DEFAULT;
      tile.revive();
      colsMap[tile.col] = colsMap[tile.col] || [];
      colsMap[tile.col].push(tile);
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

  static setFallDelay(tile, index) {
    tile.fallDelay = index;
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

  check(tileA, tileB) {
    if (!tileA || !tileB) return;

    this.swap(tileA, tileB);
    const res = this.match();
    this.swap(tileA, tileB);

    return res ? [tileA, tileB] : null;
  }

  static isNeighbor(tileA, tileB) {
    return Math.abs(tileA.row - tileB.row) + Math.abs(tileA.col - tileB.col) === 1;
  }
}

export {Suit3};
