let id = 0;

export class Tile {
  constructor(suit3, row, col, color, type = Tile.type.DEFAULT) {
    this.id = ++id;
    this.view = null;
    this.color = color;
    this.type = type;
    this.row = row;
    this.col = col;

    this.suit3 = suit3;
    this.fallPath = {x: [], y: []};
    this.fallDelay = 0;
  }

  setView(view) {
    this.view = view;
  }

  // after right user move, for swap animation.
  move(cb) {
    this.view.move(cb);
  }

  // after bad user move, for fake swap animation.
  fake(cb) {
    this.view.fake(cb);
  }

  // after match, for destroy animation.
  kill(matched, cb) {
    if (this.movable()) {
      this.color = Math.floor(Math.random() * this.suit3.colors);
      this.type = Tile.type.DEFAULT;

      this.view.kill(matched, cb);
    } else {
      this.color -= 1;
      this.type = this.color === 0 ? Tile.type.DEFAULT : this.type;

      this.view.kick(matched, cb);
    }
  }

  // after destroy, for fall animation.
  fall(cb) {
    this.view.fall(cb);
  }

  // after destroy, for reset position and type. Sync.
  revive() {
    this.view.revive();
  }

  // after match, for target reset type animation.
  killTarget(match, cb) { // matched = {pattern, tiles, target}
    this.view.killTarget(match, cb); // update color type here
  }

  // after shuffle, for change pos animation.
  afterShuffle(cb) {
    this.view.afterShuffle(cb); // update pos
  }

  movable() {
    return this.type !== Tile.type.IMMOVABLE;
  }
}

Tile.type = {
  DEFAULT: 0,
  VERTICAL: 1, // Spawn on matched column with 4 tiles. Destroy all in same column
  HORIZONTAL: 2, // Spawn on matched row with 4 tiles. Destroy all in same row
  DIAGONAL: 3, // Spawn on matched L pattern. Destroy all in same diagonals
  ROOK: 4, // Spawn on matched T or + pattern. Destroy all in same row and col
  BOMB: 5, // Spawn on matched 5 tiles. Destroy all around, king like
  DROP: 6, // Destroys itself on any bottom cell
  IMMOVABLE: 7, // Destroys if any neighbor explodes

  // Dynamic (not used as type for tile). No spawn, just destroy behaviour description
  QUEEN: 10, // on swap VERTICAL+HORIZONTAL. Destroy like queen
  ALL: 11, // on swap: BOMB+BOMB. Clear full grid
};
