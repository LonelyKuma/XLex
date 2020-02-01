import assert from 'assert';
import { Random, MersenneTwister19937 } from 'random-js';
import { Epsilon, NFANode } from './nfa';

const random = new Random(MersenneTwister19937.autoSeed());

export class DFANode {
  readonly _id: number;
  isEnd: boolean = false;
  nfaSet: Set<NFANode>;
  trans: { [key: string]: DFANode } = {};

  constructor(_id: number, nodes: NFANode[]) {
    this._id = _id;
    this.nfaSet = new Set(nodes);
    for (let nfanode of this.nfaSet) {
      if (nfanode.isEnd) {
        this.isEnd = true;
        break;
      }
    }
  }

  link(w: string, v: DFANode) {
    if (!!this.trans[w]) {
      throw new Error('DFA has two same trans');
    }
    this.trans[w] = v;
  }
}

export default class DFA {
  readonly root: DFANode;

  constructor(nfaRoot: NFANode) {
    const hashCache: WeakMap<NFANode, number> = new WeakMap();
    function getHash(node: NFANode) {
      if (!hashCache.has(node)) {
        hashCache.set(node, random.uint53Full());
      }
      return hashCache.get(node) as number;
    }
    function hashSet(nodes: NFANode[]) {
      let val = 0;
      for (const node of nodes) {
        val ^= getHash(node);
      }
      return val;
    }

    const closureCache: WeakMap<NFANode, NFANode[]> = new WeakMap();
    function closure(node: NFANode): NFANode[] {
      if (closureCache.has(node)) {
        return closureCache.get(node) as NFANode[];
      }
      const set: Set<NFANode> = new Set([node]);
      if (Reflect.has(node.trans, Epsilon)) {
        for (const v of node.trans[Epsilon]) {
          if (node === v) {
            throw new Error('Closure Error: Node link to itself with Epsilon');
          }
          closure(v).forEach(node => set.add(node));
        }
      }
      closureCache.set(node, [...set]);
      return closureCache.get(node) as NFANode[];
    }

    const moveCache: WeakMap<
      NFANode[],
      { [key: string]: NFANode[] }
    > = new WeakMap();
    function move(nodes: NFANode[], w: string): NFANode[] {
      assert(w === Epsilon || w.length === 1);
      if (
        moveCache.has(nodes) &&
        Reflect.has(moveCache.get(nodes) as { [key: string]: NFANode[] }, w)
      ) {
        return (moveCache.get(nodes) as { [key: string]: NFANode[] })[w];
      }
      const set = new Set<NFANode>();
      for (const node of nodes) {
        if (Reflect.has(node.trans, w)) {
          node.trans[w].forEach(v => closure(v).forEach(x => set.add(x)));
        }
      }
      if (moveCache.has(nodes)) {
        const obj = moveCache.get(nodes) as { [key: string]: NFANode[] };
        Reflect.set(obj, w, [...set]);
        moveCache.set(nodes, obj);
      } else {
        moveCache.set(nodes, { [w]: [...set] });
      }
      return (moveCache.get(nodes) as { [key: string]: NFANode[] })[w];
    }

    const visited: Map<number, DFANode> = new Map();
    const queue: NFANode[][] = [];
    let totId = 0;

    function getNode(nodes: NFANode[]): DFANode {
      const hsh = hashSet(nodes);
      if (!visited.has(hsh)) {
        const u = new DFANode(totId++, nodes);
        visited.set(hsh, u);
        queue.push(nodes);
      }
      return visited.get(hsh) as DFANode;
    }

    this.root = getNode(closure(nfaRoot));

    while (queue.length > 0) {
      const back = queue.pop() as NFANode[];
      const u = getNode(back);
      const set: Set<string> = new Set([Epsilon]);
      for (const node of back) {
        for (const w of Reflect.ownKeys(node.trans)) {
          if (set.has(w as string)) continue;
          const next = move(back, w as string);
          if (next.length === 0) continue;
          u.link(w as string, getNode(next));
        }
      }
    }
  }
}
