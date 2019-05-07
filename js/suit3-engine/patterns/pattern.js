export class Pattern {
  match({directions, tileA, tileB, hash}) {
    return null; // {tiles: [tile..], target: null} = matches;
  }

  static markHash(tiles, hash) {
    for (let i = 0, l = tiles.length; i < l; i++) {
      hash[tiles[i].id] = true;
    }
  }
}
