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
  hooks?: {
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
  } = {};

  private readonly tokens: Array<{
    type: string;
    dfa: DFA;
    callback: (token: IToken) => IToken;
  }> = [];

  constructor(config: RuleConfig) {
    if (config.hooks !== undefined) {
      this.hooks = config.hooks;
    }
    for (const tokenRule of config.tokens) {
      if (!('rule' in tokenRule) || !('type' in tokenRule)) {
        throw new Error(
          `${JSON.stringify(
            tokenRule
          )} does not have attribute "type" or "rule".`
        );
      }
      const dfa = new DFA(parse(tokenRule.rule, tokenRule.type));
      dfa.minimize();
      this.tokens.push({
        type: tokenRule.type,
        dfa,
        callback: tokenRule.callback ? tokenRule.callback : token => token
      });
    }
  }

  *gen(text: string): Generator<Token> {
    text = text.replace(/\r\n|\r/g, '\n') + '\n';

    if (this.hooks.beforeCreate) {
      this.hooks.beforeCreate();
    }

    let row = 0,
      col = 0,
      tot = '';
    let cur: Array<DFANode | undefined> = this.tokens.map(({ dfa }) =>
      dfa.getRoot()
    );

    const reportError = (message: string) => {
      const text = `XLex Error: ${message}, at Row ${row} Col ${col -
        tot.length}.`;
      throw new Error(text);
    };

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
              try {
                const res = this.tokens[i].callback({
                  type: this.tokens[i].type,
                  value: tot
                });
                token = new Token(res, row, col - tot.length, tot.length);
              } catch (error) {
                reportError(error.message);
              }
              break;
            }
          }
          if (token) {
            yield token;
          } else {
            reportError('Unexpected ending');
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
          if (/\s/.test(c)) {
            cur = this.tokens.map(({ dfa }) => dfa.getRoot());
            tot = '';
          } else {
            reportError(`Unexpected character "${c}"`);
          }
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
    return new Token({ type: 'EOF', value: '' }, row, col, 0);
  }

  run(text: string): Token[] {
    const result: Token[] = [];
    for (const token of this.gen(text)) {
      result.push(token);
    }
    return result;
  }
}
