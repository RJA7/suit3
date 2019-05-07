import { DisplayObject } from 'black-engine';
import { Suit3 } from '../suit3-engine/suit3-engine';
import { TileView } from './tile-view';
import { CellView } from './cell-view';
import { config } from './config';

import level from '../levels/0';

export class Grid extends DisplayObject {
  constructor(parent) {
    super(parent);
    parent.add(this);

    const suit3 = new Suit3(level);
    const {tiles} = suit3;

    for (let i = 0, length = tiles.length; i < length; i++) {
      new TileView(this, tiles[i]);
    }

    this.tile = null;
    this.suit3 = suit3;
    this.touchable = true;
  }

  onAdded() {
    this.x = this.stage.width / 2;
    this.y = this.stage.height / 2;

    setTimeout(() => {
      this.pivotOffsetX = this.width / 2 - config.hOffset / 2;
      this.pivotOffsetY = this.height / 2 - config.vOffset / 2;
    }, 1);

    this.stage.on('pointerMove', this.handlePointerMove, this);
    this.stage.on('pointerDown', this.handlePointerDown, this);
    this.stage.on('pointerUp', this.handlePointerUp, this);
  }

  getTileByPos(globalPos) {
    const local = this.globalToLocal(globalPos);
    const row = Math.floor(local.y / config.vOffset + 0.5);
    const col = Math.floor(local.x / config.hOffset + 0.5);

    return this.suit3.tilesModel[row] && this.suit3.tilesModel[row][col];
  }

  handlePointerDown(msg, pointer) {
    this.tile = this.getTileByPos(pointer) || null;
  }

  handlePointerUp() {
    this.tile = null;
  }

  handlePointerMove(msg, pointer) {
    if (!this.tile) return;

    const tile = this.getTileByPos(pointer);

    if (this.tile === tile) return;

    this.suit3.move(this.tile, tile);
    this.tile = null;
  }
}
