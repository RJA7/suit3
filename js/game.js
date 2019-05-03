import piece_0 from 'assets/slices/pieces/piece_0.png';
import piece_1 from 'assets/slices/pieces/piece_1.png';
import piece_2 from 'assets/slices/pieces/piece_2.png';

import {AssetManager, GameObject} from 'black-engine';
import {Board} from 'js/board-screen/board';

export class Game extends GameObject {
  constructor() {
    super();

    const assets = new AssetManager();
    assets.enqueueImage('piece_0', piece_0);
    assets.enqueueImage('piece_1', piece_1);
    assets.enqueueImage('piece_2', piece_2);
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

    new Board(this.stage);
  }

  handleResize() {

  }
}
