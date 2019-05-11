import async from 'async';
import { Dispatcher } from './dispatcher';
import { Tile } from './tile';
import { Pattern } from './patterns/pattern';
import { TPattern } from './patterns/t-pattern';
import { LPattern } from './patterns/l-pattern';
import { ColorPattern } from './patterns/color';
import { Cell } from './cell';

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
    const cellsModel = [];
    const cells = [];
    const tilesModel = [];
    const tiles = [];
    const rows = grid.length;
    const cols = grid.reduce((acc, v) => Math.max(acc, v.length), 0);

    for (let i = 0; i < rows; i++) {
      tilesModel[i] = [];
      cellsModel[i] = [];

      for (let j = 0; j < cols; j++) {
        const tileDef = grid[i][j];

        if (tileDef) {
          const tile = new Tile(this, i, j, tileDef);
          tiles.push(tile);
          tilesModel[i][j] = tile;

          const cell = new Cell(i, j, tileDef.layer);
          cells.push(cell);
          cellsModel[i][j] = cell;
        } else {
          tiles.push(null);
          tilesModel[i][j] = null;
          cells.push(null);
          cellsModel[i][j] = null;
        }
      }
    }

    this._ready = true;
    this.colors = colors;
    this.rows = rows;
    this.cols = cols;
    this.tilesModel = tilesModel;
    this.tiles = tiles;
    this.cellsModel = cellsModel;
    this.cells = cells;
    this.patterns = patterns;
  }

  static canSwap(tileA, tileB) {
    return tileA.isMovable() && tileB.isMovable() &&
      Math.abs(tileA.row - tileB.row) + Math.abs(tileA.col - tileB.col) === 1;
  }

  move(tileA, tileB) {
    if (!this._ready || !Suit3.canSwap(tileA, tileB)) return;
    this._ready = false;

    this.swap(tileA, tileB);

    const matches = this.match(tileA, tileB);
    const method = matches ? 'move' : 'fake';
    const event = matches ? this.MOVE : this.FAKE;
    const tiles = [tileA, tileB];
    const cb = matches ? () => this.kill(matches) : () => {
      this.swap(tileA, tileB);
      this._ready = true;
    };

    async.parallel([
      (parallelCb) => async.each(tiles, (tile, cb) => tile[method](wrap(cb)), parallelCb),
      (parallelCb) => this.post(event, tiles, parallelCb),
    ], cb);
  }

  collectAfterDestroyers(tile, hash) {
    const {tilesModel} = this;
    let collectedTiles;

    if (tile.type === Tile.type.HORIZONTAL) {
      collectedTiles = [
        ...this.collectDirection(tile, 1, 0, hash),
        ...this.collectDirection(tile, -1, 0, hash),
      ];
    } else if (tile.type === Tile.type.VERTICAL) {
      collectedTiles = [
        ...this.collectDirection(tile, 0, 1, hash),
        ...this.collectDirection(tile, 0, -1, hash),
      ];
    } else if (tile.type === Tile.type.DIAGONAL) {
      collectedTiles = [
        ...this.collectDirection(tile, -1, -1, hash),
        ...this.collectDirection(tile, 1, -1, hash),
        ...this.collectDirection(tile, 1, 1, hash),
        ...this.collectDirection(tile, -1, 1, hash),
      ];
    } else if (tile.type === Tile.type.ROOK) {
      collectedTiles = [
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

      collectedTiles = [];

      for (let i = 0, l = poses.length, row, col; i < l; i += 2) {
        row = tile.row + poses[i + 1];
        col = tile.col + poses[i];
        tilesModel[row] && tilesModel[row][col] && collectedTiles.push(tilesModel[row][col]);
      }
    }

    if (collectedTiles) {
      collectedTiles = collectedTiles.filter((tile) => {
        if (hash[tile.id]) {
          return false;
        }

        hash[tile.id] = true;

        return true;
      });

      for (let i = 0, l = collectedTiles.length, tiles; i < l; i++) {
        tiles = this.collectAfterDestroyers(collectedTiles[i], hash);
        tiles && collectedTiles.push(...tiles);
      }
    }

    return collectedTiles;
  }

  collectDirection(tile, stepX, stepY, hash, stopOnMiss) {
    const tilesModel = this.tilesModel;
    const pos = {row: tile.row, col: tile.col};
    const result = [];
    let current = tile;

    while (true) {
      pos.row += stepY;
      pos.col += stepX;
      const next = tilesModel[pos.row] && tilesModel[pos.row][pos.col];

      if (!next) {
        return result;
      }

      if (stopOnMiss && (hash[next.id] || !this.areMatchable(current, next))) {
        return result;
      }

      result.push(next);
      current = next.type === Tile.type.CHARACTER_UP ? current : next;
    }
  }

  match(tileA, tileB) {
    const {patterns, tilesModel, rows, cols} = this;
    const matches = [];
    const hash = {};

    // Drops check. Add all to hash so they cannot be destroyed
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const tile = tilesModel[i][j];

        if (!tile || tile.type !== Tile.type.DROP) continue;

        hash[tile.id] = true;

        if (!tilesModel[tile.row + 1]) {
          matches.push({tiles: [tile]});
        }
      }
    }

    if (tileA && tileB) {

      // Destroy full grid
      if (tileA.type === Tile.type.BOMB && tileB.type === Tile.type.BOMB) {
        const tiles = this.tiles.slice();
        Pattern.markHash(tiles, hash);
        matches.push({tiles});
      }

      // QUEEN destroy
      if (
        tileA.type === Tile.type.HORIZONTAL && tileB.type === Tile.type.DIAGONAL ||
        tileA.type === Tile.type.DIAGONAL && tileB.type === Tile.type.HORIZONTAL
      ) {
        const tiles = [
          ...this.collectDirection(tileB, 0, -1, hash),
          ...this.collectDirection(tileB, 1, 0, hash),
          ...this.collectDirection(tileB, 0, 1, hash),
          ...this.collectDirection(tileB, -1, 0, hash),
          ...this.collectDirection(tileB, -1, -1, hash),
          ...this.collectDirection(tileB, 1, -1, hash),
          ...this.collectDirection(tileB, 1, 1, hash),
          ...this.collectDirection(tileB, -1, 1, hash),
        ];

        Pattern.markHash(tiles, hash);
        matches.push({tiles});
      }
    }

    // Patterns check
    for (let k = 0, l = patterns.length; k < l; k++) {
      const pattern = patterns[k];

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const tile = tilesModel[i][j];

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
      const collectedTiles = [];
      const tiles = [...match.tiles];
      match.target && tiles.push(match.target.tile);

      for (let j = 0, jLen = tiles.length; j < jLen; j++) {
        const collected = this.collectAfterDestroyers(tiles[j], hash);
        collected && collectedTiles.push(...collected);
      }

      if (collectedTiles.length) {
        matches.push({tiles: collectedTiles});
      }
    }

    // Collect neighbors (immovable)
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const tile = tilesModel[i][j];

        if (!tile || hash[tile.id] || tile.type !== Tile.type.IMMOVABLE) continue;

        const left = tilesModel[tile.row][tile.col - 1];
        const right = tilesModel[tile.row][tile.col + 1];
        const top = tilesModel[tile.row - 1] && tilesModel[tile.row - 1][tile.col];
        const bottom = tilesModel[tile.row + 1] && tilesModel[tile.row + 1][tile.col];

        if (
          (left && left.type !== Tile.type.IMMOVABLE && hash[left.id]) ||
          (right && right.type !== Tile.type.IMMOVABLE && hash[right.id]) ||
          (top && top.type !== Tile.type.IMMOVABLE && hash[top.id]) ||
          (bottom && bottom.type !== Tile.type.IMMOVABLE && hash[bottom.id])
        ) {
          matches.push({tiles: [tile]});
          hash[tile.id] = true;
        }
      }
    }

    return matches.length ? matches : null;
  }

  kill(matches) {
    const {cellsModel} = this;

    async.each(matches, (match, eachCb) => {
      async.waterfall([
        cb => this.post(this.BEFORE_KILL, match, cb),

        cb => async.parallel([
          parallelCb => {
            async.each(match.tiles, (tile, eachCb) => tile.kill(match, wrap(eachCb)), parallelCb);
          },

          parallelCb => {
            async.each(match.tiles, (tile, eachCb) => {
              cellsModel[tile.row][tile.col].kill(wrap(eachCb));
            }, parallelCb);
          },

          parallelCb => {
            if (!match.target) {
              return parallelCb();
            }

            match.target.tile.killTarget(match, wrap(parallelCb));
          },
          parallelCb => this.post(this.KILL, match, parallelCb),
        ], wrap(cb)),
      ], wrap(eachCb));
    }, () => this.fall(matches));
  }

  fall(matches) {
    const tiles = [];

    for (let i = 0, l = matches.length; i < l; i++) {
      tiles.push(...matches[i].tiles);
    }

    async.parallel([
      parallelCb => {
        async.each(this.hoist(tiles), (tile, eachCb) => tile.fall(wrap(eachCb)), parallelCb);
      },

      parallelCb => {
        this.post(this.FALL, tiles, parallelCb);
      },
    ], () => this.prepareToReady(() => this.moveCharactersUp()));
  }

  moveCharactersUp() {
    const {tilesModel, rows, cols} = this;
    const movedTiles = [];

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const tile = tilesModel[i][j];

        if (!tile || tile.type !== Tile.type.CHARACTER_UP) continue;

        const topTile = this.getTopTile(tile);

        if (!topTile) continue;

        this.swap(tile, topTile);
        movedTiles.push(tile, topTile);
      }
    }

    async.each(movedTiles, (tile, eachCb) => {
      tile.move(eachCb);
    }, () => this.prepareToReady(() => this.setReady()));
  }

  prepareToReady(cb) {
    const matches = this.match();

    if (matches) {
      return this.kill(matches);
    }

    if (this.normalize()) {
      return async.each(
        this.tiles,
        (tile, eachCb) => tile.afterShuffle(wrap(eachCb)),
        () => this.setReady(),
      );
    }

    cb();
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
    this.tilesModel[row1][col1] = tileB;
    this.tilesModel[row2][col2] = tileA;
  }

  areMatchable(tileA, tileB) {
    return tileA.type !== Tile.type.IMMOVABLE && tileB.type !== Tile.type.IMMOVABLE && (
      tileA.color === tileB.color ||
      tileB.type === Tile.type.CHARACTER_UP
    );
  }

  static sort(a, b) {
    return b.row - a.row;
  }

  static setFallDelay(tile, index) {
    tile.fallDelay = index;
  }

  shuffle() {
    const {tiles} = this;
    const length = tiles.length;

    for (let i = 0, newIndex; i < length; i++) {
      newIndex = Math.floor(Math.random() * length);
      newIndex !== i && this.swap(tiles[i], tiles[newIndex]);
    }
  }

  findMove() {
    const {tilesModel, rows, cols} = this;
    const randomRow = Math.random() * rows | 0;
    const randomCol = Math.random() * cols | 0;

    for (let i = randomRow, result; i !== (randomRow + rows - 1) % rows; i = (i + 1) % rows) {
      for (let j = randomCol; j !== (randomCol + cols - 1) % cols; j = (j + 1) % cols) {
        result = this.check(tilesModel[i][j], tilesModel[i][j + 1]);

        if (result) {
          return result;
        }

        result = this.check(tilesModel[i][j], tilesModel[i + 1] && tilesModel[i + 1][j]);

        if (result) {
          return result;
        }
      }
    }
  }

  check(tileA, tileB) {
    if (!tileA || !tileB) return;

    this.swap(tileA, tileB);
    const result = this.match();
    this.swap(tileA, tileB);

    return result ? [tileA, tileB] : null;
  }

  hoist(tiles) {
    const movedTiles = [];
    const colsMap = {};
    const hash = {};

    for (let i = 0, length = tiles.length, len2 = length * 2; i < len2; i++) {
      const tile = tiles[i] || tiles[i - length];

      if (!tile.isMovable()) continue;

      tile.fallDelay = 0;

      while (true) {
        const topTile = this.getTopTile(tile);

        if (!topTile || (i < length && topTile.col !== tile.col)) break;

        if (!hash[topTile.id]) {
          hash[topTile.id] = true;
          movedTiles.push(topTile);
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
        movedTiles.push(tile);
      }

      tile.fallPath.x.length = 0;
      tile.fallPath.y.length = 0;
      tile.fallPath.x.push(tile.col);
      tile.fallPath.y.push(tile.row);
      tile.revive();
      colsMap[tile.col] = colsMap[tile.col] || [];
      colsMap[tile.col].push(tile);
    }

    for (const key in colsMap) {
      colsMap[key]
        .sort(Suit3.sort)
        .forEach(Suit3.setFallDelay);
    }

    return movedTiles;
  }

  getTopTile(tile) {
    const topRow = this.tilesModel[tile.row - 1];

    if (!topRow) {
      return null;
    }

    return (
      (topRow[tile.col] && topRow[tile.col].isMovable() && topRow[tile.col]) ||
      (topRow[tile.col + 1] && topRow[tile.col + 1].isMovable() && topRow[tile.col + 1]) ||
      (topRow[tile.col - 1] && topRow[tile.col - 1].isMovable() && topRow[tile.col - 1]) ||
      null
    );
  }
}

export { Suit3 };
