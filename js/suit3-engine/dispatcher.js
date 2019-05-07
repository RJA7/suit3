import async from 'async';

const wrap = cb => () => cb();

export class Dispatcher {
  constructor() {
    this.BEFORE_KILL = 'beforeKill';
    this.MOVE = 'move';
    this.FAKE = 'fake';
    this.KILL = 'kill';
    this.FALL = 'fall';
    this.READY = 'ready';

    this.bindings = {
      [this.BEFORE_KILL]: [],
      [this.MOVE]: [],
      [this.FAKE]: [],
      [this.KILL]: [],
      [this.FALL]: [],
      [this.READY]: [],
    };
  }

  on(event, handler, context) {
    this.bindings[event].push({handler, context});
  }

  post(event, params, cb) {
    if (this.bindings[event].length === 0) {
      return cb && cb();
    }

    async.each(this.bindings[event], (binding, parallelCb) => {
      binding.handler.call(binding.context, params, wrap(parallelCb));
    }, cb);
  }
}
