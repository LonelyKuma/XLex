import assert from 'assert';
import graphviz from 'graphviz';

import { Epsilon, NFANode } from './nfa';
import { DiffSet } from './diffSet';

export class DFANode {
  readonly _id: number;
  readonly trans: { [key: string]: DFANode } = {};
  readonly isEnd: boolean = false;
  readonly name?: string;

  constructor(_id: number, nodes: NFANode[] | DFANode[]) {
    this._id = _id;
    let mn = Number.MAX_VALUE;
    for (const { _id, isEnd, name } of nodes) {
      if (isEnd) {
        this.isEnd = true;
        if (_id < mn) {
          mn = _id;
          this.name = name;
        }
      }
    }
  }

  link(w: string, v: DFANode) {
    if (!!Reflect.has(this.trans, w)) {
      throw new Error('DFA has two same trans');
    }
    this.trans[w] = v;
  }

  next(w: string) {
    if (!Reflect.has(this.trans, w)) {
      return undefined;
    }
    return this.trans[w];
  }
}

export class DFA {
  private root: DFANode;
  private nodes: DFANode[] = [];
  private alphaBet: string[];

  constructor(nfaRoot: NFANode) {
    const hSet = new DiffSet<NFANode>();

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

    const alphaSet = new Set<string>();
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
      alphaSet.add(w);
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

    const getNode = (nodes: NFANode[]) => {
      const hsh = hSet.getSet(nodes);
      if (!visited.has(hsh)) {
        const u = new DFANode(totId++, nodes);
        this.nodes.push(u);
        visited.set(hsh, u);
        queue.push(nodes);
      }
      return visited.get(hsh) as DFANode;
    };

    this.root = getNode(closure(nfaRoot));

    while (queue.length > 0) {
      const back = queue.pop() as NFANode[];
      const u = getNode(back);
      const set: Set<string> = new Set([Epsilon]);
      for (const node of back) {
        for (const w of Reflect.ownKeys(node.trans)) {
          if (set.has(w as string)) continue;
          set.add(w as string);
          const next = move(back, w as string);
          if (next.length === 0) continue;
          u.link(w as string, getNode(next));
        }
      }
    }

    this.alphaBet = [...alphaSet];
  }

  size() {
    return this.nodes.length;
  }

  minimize() {
    const hash = new DiffSet<DFANode>();

    const intersect = (x: DFANode[], y: DFANode[]) => {
      const set = new Set(y.map(node => node._id));
      return x.filter(node => set.has(node._id));
    };

    const complement = (x: DFANode[], y: DFANode[]) => {
      const set = new Set(y.map(node => node._id));
      return x.filter(node => !set.has(node._id));
    };

    const w: DFANode[][] = [
      this.nodes.filter(node => !node.isEnd),
      this.nodes.filter(node => node.isEnd)
    ];
    const hSet = new Set<number>([hash.getSet(w[0]), hash.getSet(w[1])]);
    let p = [w[0], w[1]];

    while (w.length > 0) {
      const a = w.pop() as DFANode[];
      hSet.delete(hash.getSet(a));
      const set = new Set<number>(a.map(node => node._id));
      for (const c of this.alphaBet) {
        const x = this.nodes.filter(
          node => c in node.trans && set.has(node.trans[c]._id)
        );
        const np: DFANode[][] = [];
        for (const y of p) {
          const xy = intersect(x, y);
          const yx = complement(y, x);
          if (xy.length === 0 || yx.length === 0) {
            np.push(y);
            continue;
          }
          np.push(xy);
          np.push(yx);
          if (hSet.has(hash.getSet(y))) {
            let id = -1;
            const hy = hash.getSet(y);
            for (let i = 0; i < w.length; i++) {
              if (hash.getSet(w[i]) === hy) {
                id = i;
                break;
              }
            }
            assert(id !== -1);
            hSet.delete(hy);
            w[id] = xy;
            w.push(yx);
            hSet.add(hash.getSet(xy));
            hSet.add(hash.getSet(yx));
          } else {
            if (xy.length <= yx.length) {
              w.push(xy);
              hSet.add(hash.getSet(xy));
            } else {
              w.push(yx);
              hSet.add(hash.getSet(yx));
            }
          }
        }
        p = np;
      }
    }

    const nNodes: DFANode[] = p.map((nodes, i) => new DFANode(i, nodes));
    const map = new WeakMap<DFANode, number>();
    p.forEach((set, i) => set.forEach(node => map.set(node, i)));
    for (const set of p) {
      for (const node of set) {
        const u = nNodes[map.get(node) as number];
        for (const w of Reflect.ownKeys(node.trans)) {
          if (w in u.trans) continue;
          u.link(
            w as string,
            nNodes[map.get(node.trans[w as string]) as number]
          );
        }
      }
    }
    this.root = nNodes[map.get(this.root) as number];
    this.nodes = nNodes;
  }

  test(text: string) {
    let cur: DFANode = this.root;
    for (const c of text) {
      const next = cur.next(c);
      if (next !== undefined) {
        cur = next;
      } else {
        return false;
      }
    }
    return cur.isEnd;
  }

  draw(name: string) {
    const g = graphviz.digraph(name);
    for (const node of this.nodes) {
      g.addNode(String(node._id), {
        shape: node.isEnd ? 'doublecircle' : 'circle',
        fillcolor: node._id === 0 ? 'grey' : 'white',
        style: 'filled'
      });
    }
    for (const node of this.nodes) {
      for (const w of Reflect.ownKeys(node.trans)) {
        g.addEdge(String(node._id), String(node.trans[w as string]._id), {
          label: w
        });
      }
    }
    g.output('svg', name + '.svg');
  }
}
