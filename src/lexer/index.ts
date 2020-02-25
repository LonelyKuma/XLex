import { DFA } from '../reg/dfa';
import { NFANode, Epsilon } from '../reg/nfa';
import { parse } from '../reg/parser';

export class Token {
  type: string;
  value: any;

  constructor(type: string, value: string) {
    this.type = type;
    this.value = value;
  }
}

interface RuleConfig {
  hooks: {
    beforeCreate?: () => void;
    created?: () => void;
  };
  tokens: Array<{
    type: string;
    rule: string;
    callback?: (Token) => Token;
  }>;
}

export class Lexer {
  private readonly config: RuleConfig;
  private readonly dfa: DFA;

  constructor(config: RuleConfig) {
    this.config = config;
    const root = new NFANode();
    for (const tokenRule of config.tokens) {
      root.link(Epsilon, parse(tokenRule.rule, tokenRule.type));
    }
    this.dfa = new DFA(root);
    this.dfa.minimize();
  }

  run(text: string): Token[] {
    text = text.replace(/\r|\r\n/g, '\n') + '\n';

    const result: Token[] = [];
    if (this.config.hooks.beforeCreate) {
      this.config.hooks.beforeCreate();
    }

    let row = 0,
      col = 0,
      cur = this.dfa.getRoot(),
      tot = '';
    for (let i = 0; i + 1 < text.length; i++) {
      const c = text[i];
      tot += c;
      const v = cur.next(c);
      if (v) {
        cur = v;
        if (!cur.next(text[i + 1])) {
          if (!cur.isEnd) {
            throw new Error(`Unexpected End at Row ${row}, Col ${col}`);
          }
          const token = new Token(cur.name as string, tot);
          result.push(token);
          cur = this.dfa.getRoot();
          tot = '';
        }
      } else {
        cur = this.dfa.getRoot();
        tot = '';
      }
      if (c === '\n') {
        row++;
        col = 0;
      } else {
        col++;
      }
    }

    if (this.config.hooks.created) {
      this.config.hooks.created();
    }
    return result;
  }
}
