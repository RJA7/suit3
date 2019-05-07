import {AssetManager, GameObject} from 'black-engine';
import { Grid } from './grid-screen/grid-view';
import atlasTexture from 'assets/sheets/atlas.png';

export class Game extends GameObject {
  constructor() {
    super();

    const assets = new AssetManager();
    assets.enqueueAtlas('atlas', atlasTexture, 'assets/sheets/atlas.json');
    assets.enqueueGoogleFont('Titillium Web');
    assets.on('complete', this.create, this);
    assets.on('progress', FBInstant.setLoadingProgress, FBInstant);
    assets.loadQueue();
  }

  onAdded() {
    this.stage.on('resize', this.handleResize, this);
  }

  async create() {
    await FBInstant.startGameAsync();

    new Grid(this.stage);
  }

  handleResize() {

  }
}
