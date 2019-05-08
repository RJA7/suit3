import { Sprite, TextField } from 'black-engine';
import { config } from './config';

const hOffset = config.hOffset;
const vOffset = config.vOffset;

export class CellView extends Sprite {
  constructor(parent, cell) {
    super(`cells/${(cell.row + cell.col) % 2}`);
    parent.add(this);

    const layerText = new TextField('', 'Arial', 0xffffff, 18);
    layerText.strokeThickness = 5;
    layerText.strokeColor = 0x000000;
    this.add(layerText);

    this.layerText = layerText;
    this.cell = cell;
    this.x = cell.col * hOffset;
    this.y = cell.row * vOffset;
    this.alignAnchor();

    cell.setView(this);
    this.refreshLayerText();
  }

  kill(cb) {
    this.refreshLayerText();
    cb();
  }

  refreshLayerText() {
    this.layerText.text = String(this.cell.layer || '');
  }
}
