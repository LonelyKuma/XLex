import { parse } from './parser';
import { NFANode } from './nfa';

export class Reg {
  readonly text: string;
  readonly root: NFANode;

  constructor(s: string) {
    this.text = s;
    this.root = parse(s);
  }
}
