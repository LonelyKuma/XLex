import { DFA, DFANode } from '../reg/dfa';
import { parse } from '../reg/parser';

interface IToken {
  type: string;
  value: any;
}

export class Token {
  type: string;
  value: any;
  position: {
    row: number;
    col: number;
    length: number;
  };

  constructor(
    { type, value }: IToken,
    row: number,
    col: number,
    length: number
  ) {
    this.type = type;
    this.value = value;
    this.position = { row, col, length };
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
    callback?: (IToken: IToken) => IToken;
  }>;
}

export class Lexer {
  private hooks: {
    beforeCreate?: () => void;
    created?: () => void;
  };

  private readonly tokens: Array<{
    type: string;
    dfa: DFA;
    callback: (token: IToken) => IToken;
  }> = [];

  constructor(config: RuleConfig) {
    this.hooks = config.hooks;
    for (const tokenRule of config.tokens) {
      const dfa = new DFA(parse(tokenRule.rule, tokenRule.type));
      dfa.minimize();
      this.tokens.push({
        type: tokenRule.type,
        dfa,
        callback: tokenRule.callback ? tokenRule.callback : token => token
      });
    }
  }

  run(text: string): Token[] {
    text = text.replace(/\r\n|\r/g, '\n') + '\n';

    const result: Token[] = [];
    if (this.hooks.beforeCreate) {
      this.hooks.beforeCreate();
    }

    let row = 0,
      col = 0,
      tot = '';
    let cur: Array<DFANode | undefined> = this.tokens.map(({ dfa }) =>
      dfa.getRoot()
    );

    const next = (
      cur: Array<DFANode | undefined>,
      w: string
    ): [number, Array<DFANode | undefined>] => {
      let c = 0;
      const nx = cur.map(node =>
        node ? (w in node.trans ? (c++, node.trans[w]) : undefined) : undefined
      );
      return [c, nx];
    };

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const [cnt, nxt] = next(cur, c);

      if (cnt === 0) {
        if (tot.length > 0) {
          let token: Token | undefined = undefined;
          for (let i = 0; i < this.tokens.length; i++) {
            if (cur[i]?.isEnd) {
              token = new Token(
                this.tokens[i].callback({
                  type: this.tokens[i].type,
                  value: tot
                }),
                row,
                col - tot.length,
                tot.length
              );
              break;
            }
          }
          if (token) {
            result.push(token);
          } else {
            throw new Error(`Unexpected ending at Row ${row} Col ${col}`);
          }
        }
        const [cnt, v] = next(
          this.tokens.map(({ dfa }) => dfa.getRoot()),
          c
        );
        if (cnt > 0) {
          cur = v;
          tot = c;
        } else {
          cur = this.tokens.map(({ dfa }) => dfa.getRoot());
          tot = '';
        }
      } else {
        cur = nxt;
        tot += c;
      }

      if (c === '\n') {
        row++;
        col = 0;
      } else {
        col++;
      }
    }

    if (this.hooks.created) {
      this.hooks.created();
    }
    return result;
  }
}
