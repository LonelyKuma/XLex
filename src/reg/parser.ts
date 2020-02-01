import { NFANode, Epsilon } from './nfa';
import assert from 'assert';

export function parse(text: string) {
  if (text.length === 0) {
    throw new Error('Text can not be empty.');
  }

  let pos = 0;
  let curChar = text[0];

  function nextChar(ch: string | null = null) {
    if (ch) {
      assert(curChar === ch);
    }
    pos++;
    if (pos >= text.length) {
      return null;
    } else {
      return (curChar = text[pos]);
    }
  }

  const root = new NFANode();
  let curNode = root;

  function factor(fa: NFANode) {
    let tot = new NFANode();
    if (curChar == '\\') {
      nextChar('\\');
      fa.link(curChar, tot);
      nextChar(curChar);
    } else if (curChar == '[') {
      nextChar('[');

      nextChar(']');
    } else if (curChar == '(') {
      nextChar('(');
      fa.link(Epsilon, tot);
      tot = expr(tot);
      nextChar(')');
    } else {
      fa.link(curChar, tot);
      nextChar(curChar);
    }
    return tot;
  }

  function term(fa: NFANode) {
    const tot = factor(fa);
    if (curChar === '*') {
      nextChar('*');
    } else if (curChar === '+') {
      nextChar('+');
    }
    return tot;
  }

  function expr(fa: NFANode) {
    const tot = term(fa);
    if (curChar !== '|') {
      return tot;
    }
    const ed = new NFANode();
    tot.link(Epsilon, ed);
    while (curChar === '|') {
      nextChar('|');
      const tot = term(fa);
      tot.link(Epsilon, ed);
    }
    return ed;
  }

  while (pos < text.length) {
    curNode = expr(curNode);
  }

  curNode.isEnd = true;

  return root;
}
