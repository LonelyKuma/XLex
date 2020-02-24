import { parse } from './parser';
import { NFANode } from './nfa';
import { DFA } from './dfa';

export class Reg {
  readonly text: string;
  readonly nfa: NFANode;
  readonly dfa: DFA;

  constructor(s: string) {
    this.text = s;
    this.nfa = parse(s);
    this.dfa = new DFA(this.nfa);
  }

  test(text: string) {
    return this.dfa.test(text);
  }
}
