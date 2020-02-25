import { Lexer, Token } from '../src/lexer';

test('Lexer', async () => {
  const config = await import('../xlex.config');
  const lexer = new Lexer(config);
  expect(lexer.run('123')).toStrictEqual([
    new Token({ type: 'Number', value: 123 }, 0, 0, 3)
  ]);
  expect(lexer.run(' abc_XYZ_1')).toStrictEqual([
    new Token({ type: 'Identifier', value: 'abc_XYZ_1' }, 0, 1, 9)
  ]);
  expect(lexer.run('1.123 + 1 + Xy1\n 999')).toStrictEqual([
    new Token({ type: 'Float', value: 1.123 }, 0, 0, 5),
    new Token({ type: 'Plus', value: '+' }, 0, 6, 1),
    new Token({ type: 'Number', value: 1 }, 0, 8, 1),
    new Token({ type: 'Plus', value: '+' }, 0, 10, 1),
    new Token({ type: 'Identifier', value: 'Xy1' }, 0, 12, 3),
    new Token({ type: 'Number', value: 999 }, 1, 1, 3)
  ]);
});
