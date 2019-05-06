export default class Pattern {
  match({directions, tileA, tileB, hash}) {
    return null; // {items: [tile..], target: null} = matches;
  }

  static markHash(items, hash) {
    for (let i = 0, l = items.length; i < l; i++) {
      hash[items[i].id] = true;
    }
  }
}
