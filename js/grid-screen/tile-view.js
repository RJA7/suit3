import {Sprite, Tween, Interpolation, Ease, TextField} from 'black-engine';
import { Tile } from '../suit3-engine/tile';
import { config } from './config';

const hOffset = config.hOffset;
const vOffset = config.vOffset;

export class TileView extends Sprite {
  constructor(parent, tile) {
    super(`tiles/${tile.color}`);
    parent.add(this);

    const infoText = new TextField('', 'Arial', 0xffffff, 36);
    infoText.strokeThickness = 5;
    infoText.strokeColor = 0x000000;
    infoText.x = config.hOffset / 2;
    infoText.y = config.vOffset / 2 + 7;
    infoText.alignAnchor();
    this.add(infoText);

    this.infoText = infoText;
    this.tile = tile;
    this.x = tile.col * hOffset;
    this.y = tile.row * vOffset;
    this.alignAnchor();

    tile.setView(this);
    this.refreshText();
  }

  move(cb) {
    const tile = this.tile;

    const tween = new Tween(this)
      .to({x: tile.col * hOffset, y: tile.row * vOffset}, 0.2);

    tween.on('complete', cb);
    this.addComponent(tween);
  }

  fake(cb) {
    const tile = this.tile;

    const tween = new Tween(this)
      .to({x: tile.col * hOffset, y: tile.row * vOffset}, 0.2);
    tween.yoyo = true;
    tween.repeats = 1;
    tween.on('complete', cb);
    this.addComponent(tween);
  }

  hide(cb) {
    const tween = new Tween(this).to({alpha: 0}, 0.2);
    tween.on('complete', cb);
    this.addComponent(tween);
  }

  kill(match, cb) {
    if (match.target) {
      const tween = new Tween(this).to({
        x: match.target.tile.col * hOffset,
        y: match.target.tile.row * vOffset,
      }, 0.2);
      tween.on('complete', () => this.hide(cb));
      this.addComponent(tween);
    } else {
      this.hide(cb);
    }
  }

  killTarget(match, cb) {
    this.refreshText();
    this.parent.setChildIndex(this, this.parent.numChildren - 1);
    cb();
  }

  revive() {
    this.x = this.tile.col * hOffset;
    this.y = (this.tile.row - 1) * vOffset;
    this.alpha = 1;
    this.textureName = `tiles/${this.tile.color}`;

    this.refreshText();
  }

  refreshText() {
    this.infoText.text = {
      [Tile.type.DEFAULT]: '',
      [Tile.type.HORIZONTAL]: '-',
      [Tile.type.VERTICAL]: '|',
      [Tile.type.DIAGONAL]: 'X',
      [Tile.type.ROOK]: '+',
      [Tile.type.BOMB]: 'B',
      [Tile.type.DROP]: '↓'
    }[this.tile.type];
  }

  fall(cb) {
    const {fallPath, fallDelay} = this.tile;
    const stepTime = 0.1;

    const tween = new Tween({
      x: fallPath.x.map(v => v * hOffset),
      y: fallPath.y.map(v => v * vOffset),
    }, stepTime * fallPath.x.length);

    tween.ease = Ease.linear;
    tween.interpolation = Interpolation.linear;
    tween.delay = stepTime * fallDelay;
    tween.on('complete', cb);
    this.addComponent(tween);
  }

  afterShuffle(cb) {
    const tile = this.tile;

    const tween = new Tween(this).to({
      x: tile.col * hOffset,
      y: tile.row * vOffset,
    }, 0.4);
    tween.on('complete', cb);
    this.addComponent(tween);
  }
}
