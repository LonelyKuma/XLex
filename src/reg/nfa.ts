import assert from 'assert';

export const Epsilon = '-1';

let id = 0;

export class NFANode {
  _id: number;
  isEnd: boolean = false;
  trans: { [key: string]: NFANode[] } = {};

  constructor() {
    this._id = id++;
  }

  link(w: string, node: NFANode) {
    assert(w === Epsilon || w.length === 1);
    if (!this.trans[w]) {
      this.trans[w] = [];
    }
    this.trans[w].push(node);
  }
}
