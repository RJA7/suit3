import { CanvasDriver, Input, Engine, StageScaleMode } from "black-engine";
import Raven from 'raven-js';
import { Game } from './game';

const start = async () => {
  await FBInstant.initializeAsync();

  const black = new Engine('container', Game, CanvasDriver, [Input]);
  black.pauseOnBlur = false;
  black.pauseOnHide = false;
  black.start();
  black.stage.setSize(640, 960);
  black.stage.scaleMode = StageScaleMode.LETTERBOX;
};

const isProduction = false; // todo

if (isProduction) {
  Raven
    .config('https://7b0ad856f7b245ef8376cc6b5ca301cb@sentry.io/1443527')
    // .setRelease('6d5a6a446805a06154e25e2fa203d67b9e762f5d')
    .install()
    .context(start);
} else {
  start();
}
