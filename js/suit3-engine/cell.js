export class Cell {
  constructor(row, col, layer = 0) {
    this.row = row;
    this.col = col;
    this.layer = layer;
    this.view = null;
  }

  setView(view) {
    this.view = view;
  }

  kill(cb) {
    if (this.layer === 0) return;

    this.layer -= 1;
    this.view.kill(cb);
  }
}
