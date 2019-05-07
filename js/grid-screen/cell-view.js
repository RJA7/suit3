import { Sprite, Tween, Interpolation, Ease, TextField } from 'black-engine';
import { config } from './config';

const hOffset = config.hOffset;
const vOffset = config.vOffset;

export class CellView extends Sprite {
  constructor(parent, cell) {
    super(`cells/${(cell.row + cell.col) % 2}`);
    parent.add(this);

    // const infoText = new TextField('', 'Arial', 0xffffff, 36);
    // infoText.strokeThickness = 5;
    // infoText.strokeColor = 0x000000;
    // infoText.x = config.hOffset / 2;
    // infoText.y = config.vOffset / 2 + 7;
    // infoText.alignAnchor();
    // this.add(infoText);
    //
    // this.infoText = infoText;
    this.x = cell.col * hOffset;
    this.y = cell.row * vOffset;
    this.alignAnchor();

    cell.setView(this);
  }

  kill(cb) {
    cb();
  }
}
