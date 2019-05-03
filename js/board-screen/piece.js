import {Sprite, Tween, Timer, Ease, TextField} from 'black-engine';
import Data from '../suit3-engine/data';
import config from './config';

const hOffset = config.hOffset;
const vOffset = config.vOffset;

export default class Piece extends Sprite {
  constructor(parent, data) {
    super(`piece_${data.color}`);
    parent.add(this);

    const infoText = new TextField('', 'Arial', 0xffffff, 36);
    infoText.strokeThickness = 5;
    infoText.strokeColor = 0x000000;
    infoText.x = config.hOffset / 2;
    infoText.y = config.vOffset / 2 + 7;
    infoText.alignAnchor();
    this.add(infoText);

    this.infoText = infoText;
    this.data = data;
    this.x = data.col * hOffset;
    this.y = data.row * vOffset;
    this.alignAnchor();

    data.setSprite(this);
    this.refreshText();
  }

  move(cb) {
    const data = this.data;

    const tween = new Tween(this)
      .to({x: data.col * hOffset, y: data.row * vOffset}, 0.2);

    tween.on('complete', cb);
    this.addComponent(tween);
  }

  fake(cb) {
    const data = this.data;

    const tween = new Tween(this)
      .to({x: data.col * hOffset, y: data.row * vOffset}, 0.2);
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
        x: match.target.data.col * hOffset,
        y: match.target.data.row * vOffset,
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
    this.x = this.data.col * hOffset;
    this.y = (this.data.row - 1) * vOffset;
    this.alpha = 1;
    this.textureName = `piece_${this.data.color}`;

    this.refreshText();
  }

  refreshText() {
    this.infoText.text = {
      [Data.type.DEFAULT]: '',
      [Data.type.HORIZONTAL]: '-',
      [Data.type.VERTICAL]: '|',
      [Data.type.DIAGONAL]: 'X',
      [Data.type.ROOK]: '+',
      [Data.type.BOMB]: 'B',
    }[this.data.type];
  }

  fall(cb) {
    const {fallPath, fallDelay} = this.data;
    const stepTime = 0.2;

    const step = (i = 0) => {
      if (fallPath.x[i] === undefined) {
        cb();
        return;
      }

      const x = fallPath.x[i] * hOffset;
      const y = fallPath.y[i] * vOffset;

      const tween = new Tween(this).to({x, y}, stepTime);
      tween.ease = Ease.linear;
      tween.on('complete', () => step(i + 1));
      this.addComponent(tween);
    };

    if (fallDelay === 0) {
      step();
    } else {
      const timer = new Timer(stepTime * fallDelay);
      timer.on('complete', () => step());
      this.addComponent(timer);
    }
  }

  afterShuffle(cb) {
    const data = this.data;

    const tween = new Tween(this).to({
      x: data.col * hOffset,
      y: data.row * vOffset,
    }, 0.4);
    tween.on('complete', cb);
    this.addComponent(tween);
  }
}
