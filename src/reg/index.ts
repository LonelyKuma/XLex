import { DFA } from './dfa';
import { parse } from './parser';
import { NFANode } from './nfa';

export class Reg {
  readonly text: string;
  readonly name?: string;
  readonly nfa: NFANode;
  readonly dfa: DFA;

  /**
   * Creates an instance of Reg.
   * @param {string} s RegExp Pattern
   * @memberof Reg
   */
  constructor(s: string, option: { name?: string; minimize?: boolean } = {}) {
    this.text = s;
    if (option.name) {
      this.name = option.name;
    }

    this.nfa = parse(s, option.name);
    this.dfa = new DFA(this.nfa);
    if (
      option.minimize === undefined ||
      option.minimize === null ||
      option.minimize === true
    ) {
      this.dfa.minimize();
    }
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
