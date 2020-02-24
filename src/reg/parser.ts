import { NFANode, Epsilon } from './nfa';
import assert from 'assert';

export function parse(text: string) {
  if (text.length === 0) {
    throw new Error('Text can not be empty');
  }

  let pos = 0;
  let curChar: string | undefined = text[0];

  function nextChar(ch: string) {
    assert(curChar === ch);
    pos++;
    if (pos >= text.length) {
      return (curChar = undefined);
    } else {
      return (curChar = text[pos]);
    }
  }

  function peekChar() {
    if (pos + 1 < text.length) {
      return text[pos + 1];
    } else {
      return undefined;
    }
  }

  function range(fa: NFANode) {
    const ed = new NFANode();
    while (curChar && curChar !== ']') {
      if (peekChar() === '-') {
        const left = curChar;
        nextChar(curChar);
        nextChar('-');
        const right = curChar;
        nextChar(curChar);
        for (let i = left.charCodeAt(0); i <= right.charCodeAt(0); i++) {
          fa.link(String.fromCharCode(i), ed);
        }
      } else {
        fa.link(curChar, ed);
        nextChar(curChar);
      }
    }
    if (!curChar) {
      throw new Error('Unexpected EOF');
    }
    return ed;
  }

  function factor(fa: NFANode) {
    let tot = new NFANode();
    if (curChar === '\\') {
      nextChar('\\');
      fa.link(curChar, tot);
      nextChar(curChar);
    } else if (curChar === '[') {
      nextChar('[');
      tot = range(fa);
      nextChar(']');
    } else if (curChar === '(') {
      nextChar('(');
      fa.link(Epsilon, tot);
      tot = expr(tot);
      nextChar(')');
    } else if (curChar) {
      if (curChar === '*' || curChar === '+' || curChar === '?') {
        throw new Error(`Unexpected Letter ${curChar}`);
      }
      fa.link(curChar, tot);
      nextChar(curChar);
    } else {
      throw new Error('Unexpected EOF');
    }
    return tot;
  }

  function term(fa: NFANode) {
    const tot = factor(fa);
    if (curChar === '*') {
      const ed = new NFANode();
      tot.link(Epsilon, fa);
      tot.link(Epsilon, ed);
      fa.link(Epsilon, ed);
      nextChar('*');
      return ed;
    } else if (curChar === '+') {
      const ed = new NFANode();
      tot.link(Epsilon, fa);
      tot.link(Epsilon, ed);
      nextChar('+');
      return ed;
    } else if (curChar === '?') {
      fa.link(Epsilon, tot);
      nextChar('?');
    }
    return tot;
  }

  function termList(fa: NFANode) {
    let tot = term(fa);
    while (curChar && curChar !== '|' && curChar !== ')') {
      tot = term(tot);
    }
    return tot;
  }

  function expr(fa: NFANode) {
    const tot = termList(fa);
    const ed = new NFANode();
    tot.link(Epsilon, ed);
    while (curChar && curChar === '|') {
      nextChar('|');
      const tot = termList(fa);
      tot.link(Epsilon, ed);
    }
    return ed;
  }

  const root = new NFANode();
  const end = expr(root);

  end.isEnd = true;

  return root;
}
