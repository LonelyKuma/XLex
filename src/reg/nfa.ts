import assert from 'assert';

export const Epsilon = '-1';

let id = 0;

export class NFANode {
  readonly _id: number;
  readonly trans: { [key: string]: NFANode[] } = {};
  isEnd: boolean = false;
  name?: string;

  constructor() {
    this._id = id++;
  }

  setEnd(name?: string) {
    if (name) {
      this.name = name;
    }
    this.isEnd = true;
  }

  link(w: string, node: NFANode) {
    assert(w === Epsilon || w.length === 1);
    if (!this.trans[w]) {
      this.trans[w] = [];
    }
    this.trans[w].push(node);
  }
}
