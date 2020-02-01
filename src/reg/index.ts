import { parse } from './parser';
import { NFANode } from './nfa';
import { DFA } from './dfa';

export class Reg {
  readonly text: string;
  readonly nfaRoot: NFANode;
  readonly root: DFA;

  constructor(s: string) {
    this.text = s;
    this.nfaRoot = parse(s);
    this.root = new DFA(this.nfaRoot);
  }

  test(text: string) {
    return this.root.test(text);
  }
}
