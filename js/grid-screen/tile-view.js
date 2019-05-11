import { Sprite, Tween, Interpolation, Ease } from 'black-engine';
import { config } from './config';
import { Tile } from 'js/suit3-engine/tile';

const hOffset = config.hOffset;
const vOffset = config.vOffset;

export class TileView extends Sprite {
  constructor(parent, tile) {
    super(`tiles/0/0`);
    parent.add(this);

    this.tile = tile;
    this.x = tile.col * hOffset;
    this.y = tile.row * vOffset;
    this.alignAnchor();

    tile.setView(this);
    this.refreshTexture();
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
      }, 0.9);
      tween.on('complete', () => this.hide(cb));
      this.addComponent(tween);
    } else {
      this.hide(cb);
    }
  }

  kick(match, cb) {
    this.refreshTexture();
    cb();
  }

  killTarget(match, cb) {
    this.refreshTexture();
    this.parent.setChildIndex(this, this.parent.numChildren - 1);
    cb();
  }

  revive() {
    this.x = this.tile.col * hOffset;
    this.y = (this.tile.row - 1) * vOffset;
    this.alpha = 1;

    this.refreshTexture();
  }

  refreshTexture() {
    switch (this.tile.type) {
      case Tile.type.IMMOVABLE:
        this.textureName = `tiles/${this.tile.type}/${this.tile.minor}`;
        break;
      default:
        this.textureName = `tiles/${this.tile.type}/${this.tile.color}`;
    }
  }

  fall(cb) {
    const {fallPath, fallDelay} = this.tile;
    const stepTime = 0.4;

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
