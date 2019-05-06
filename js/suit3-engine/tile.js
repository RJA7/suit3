import {MessageDispatcher} from 'black-engine';

let id = 0;

export default class Tile extends MessageDispatcher {
  constructor(row, col, color, type) {
    super();

    this.id = ++id;
    this.sprite = null;
    this.color = color;
    this.type = type;
    this.row = row;
    this.col = col;

    this.fallPath = {x: [], y: []};
    this.fallDelay = 0;
  }

  setSprite(sprite) {
    this.sprite = sprite;
  }

  // after right user move, for swap animation.
  move(cb) {
    this.sprite.move(cb);
  }

  // after bad user move, for fake swap animation.
  fake(cb) {
    this.sprite.fake(cb);
  }

  // after match, for destroy animation.
  kill(matched, cb) {
    this.sprite.kill(matched, cb);
  }

  // after destroy, for fall animation.
  fall(cb) {
    this.sprite.fall(cb);
  }

  // after destroy, for reset position and type. Sync.
  revive() {
    // sync reset sprite here
    this.sprite.revive();
  }

  // after match, for target reset type animation.
  killTarget(match, cb) { // matched = {pattern, items, target}
    this.sprite.killTarget(match, cb); // update color type here
  }

  // after shuffle, for change pos animation.
  afterShuffle(cb) {
    this.sprite.afterShuffle(cb); // update pos
  }
}

Tile.type = {
  DEFAULT: 0,
  VERTICAL: 1, // Spawn on matched column with 4 items. Destroy all in same column
  HORIZONTAL: 2, // Spawn on matched row with 4 items. Destroy all in same row
  DIAGONAL: 3, // Spawn on matched L pattern. Destroy all in same diagonals
  ROOK: 4, // Spawn on matched T or + pattern. Destroy all in same row and col
  BOMB: 5, // Spawn on matched 5 items. Destroy all around, king like
  DROP: 6, // Destroys itself on any bottom cell.

  // Dynamic (not used as type for tile). No spawn, just destroy behaviour description
  QUEEN: 10, // on swap VERTICAL+HORIZONTAL. Destroy like queen
  ALL: 11, // on swap: BOMB+BOMB. Clear full board
};
