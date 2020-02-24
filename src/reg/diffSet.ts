import { Random, MersenneTwister19937 } from 'random-js';

const random = new Random(MersenneTwister19937.autoSeed());

export class DiffSet<T> {
  private readonly hashCache: WeakMap<Object, number> = new WeakMap();

  getHash(node: T) {
    if (!this.hashCache.has(node)) {
      this.hashCache.set(node, random.uint53Full());
    }
    return this.hashCache.get(node) as number;
  }

  getSet(nodes: T[]) {
    return nodes.reduce((v, node) => v ^ this.getHash(node), 0);
  }
}
