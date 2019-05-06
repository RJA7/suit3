import {Suit3} from '../suit3-engine/suit3-engine';
import {DisplayObject} from 'black-engine';
import Piece from './piece';
import config from 'js/board-screen/config';

import level from '../levels/0';

export class Board extends DisplayObject {
  constructor(parent) {
    super(parent);
    parent.add(this);

    const suit3 = new Suit3(level);
    const {items} = suit3;

    for (let i = 0, length = items.length; i < length; i++) {
      new Piece(this, items[i]);
    }

    this.data = null;
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

  getDataByPos(globalPos) {
    const local = this.globalToLocal(globalPos);
    const row = Math.floor(local.y / config.vOffset + 0.5);
    const col = Math.floor(local.x / config.hOffset + 0.5);

    return this.suit3.model[row] && this.suit3.model[row][col];
  }

  handlePointerDown(msg, pointer) {
    this.data = this.getDataByPos(pointer) || null;
  }

  handlePointerUp() {
    this.data = null;
  }

  handlePointerMove(msg, pointer) {
    if (!this.data) return;

    const data = this.getDataByPos(pointer);

    if (this.data === data) return;

    this.suit3.move(this.data, data);
    this.data = null;
  }
}
