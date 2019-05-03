export default class Pattern {
  match({directions, dataA, dataB, hash}) {
    return null; // {items: [data..], target: null} = matches;
  }

  static markHash(items, hash) {
    for (let i = 0, l = items.length; i < l; i++) {
      hash[items[i].id] = true;
    }
  }
}
