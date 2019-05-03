import ColorPattern from '../suit3-engine/patterns/color';
import TPattern from '../suit3-engine/patterns/t-pattern';
import LPattern from '../suit3-engine/patterns/l-pattern';

const r = () => Math.random() * 3 | 0;
const emp = null;

export default {
  rows: 7,
  cols: 7,
  colors: 3,

  patterns: [
    new TPattern(),
    new LPattern(),
    new ColorPattern(),
  ],

  // optional
  grid: [
    [r(), r(), r(), r(), r(), r(), r()],
    [r(), r(), r(), r(), r(), r(), r()],
    [r(), r(), r(), r(), r(), r(), r()],
    [r(), r(), r(), r(), r(), r(), r()],
    [r(), r(), r(), r(), r(), r(), r()],
    [r(), emp, r(), r(), r(), emp, r()],
    [r(), r(), r(), r(), r(), r(), r()],
  ],

  // not used in engine
  hOffset: 80,
  vOffset: 80,
};
