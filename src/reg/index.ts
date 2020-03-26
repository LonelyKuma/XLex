import { parse } from './parser';
import { NFANode } from './nfa';
import { DFA } from './dfa';

export class Reg {
  readonly text: string;
  readonly name?: string;
  readonly nfa: NFANode;
  readonly dfa: DFA;

  /**
   * Creates an instance of Reg.
   * @param {string} s RegExp Pattern
   * @param {string} [name] Name of this instance
   * @memberof Reg
   */
  constructor(s: string, name?: string) {
    this.text = s;
    if (name) {
      this.name = name;
    }
    this.nfa = parse(s, name);
    this.dfa = new DFA(this.nfa);
    this.dfa.minimize();
  }

  /**
   * Test whether reg can accept text
   * @param {string} text
   * @returns {boolean}
   * @memberof Reg
   */
  test(text: string): boolean {
    return this.dfa.test(text);
  }
}
