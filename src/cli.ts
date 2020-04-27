#!/usr/bin/env node

import path from 'path';
import { readFileSync } from 'fs';
import { cac } from 'cac';
import { Reg } from './reg';
import graphviz from 'graphviz';
import { Lexer } from './lexer';

const cli = cac('XLex');

cli
  .command('draw <reg> [name]', 'Draw DAG of the RegExp')
  .action((reg: string, name?: string) => {
    const r = new Reg(reg);
    name = name ? name : 'RegExp';
    const g = graphviz.digraph(name);
    for (const node of r.dfa.getNodes()) {
      g.addNode(String(node._id), {
        shape: node.isEnd ? 'doublecircle' : 'circle',
        fillcolor: node._id === r.dfa.getRoot()._id ? 'grey' : 'white',
        style: 'filled'
      });
    }
    for (const node of r.dfa.getNodes()) {
      for (const w of Reflect.ownKeys(node.trans)) {
        g.addEdge(String(node._id), String(node.trans[w as string]._id), {
          label: w
        });
      }
    }
    g.output('svg', name + '.svg');
    console.log(`Generate DAG: ${name}.svg`);
  });

cli
  .command('', 'Generate Token')
  .option('--config <config>', 'Config file path', { default: 'xlex.config' })
  .action(async (option: { config: string }) => {
    const config = await import(path.resolve(process.cwd(), option.config));
    const lexer = new Lexer(config);
    const text: string[] = [];
    process.stdin.on('data', data => {
      text.push(String(data));
    });
    process.stdin.on('end', () => {
      try {
        const result = lexer.run(text.join(''));
        console.log(JSON.stringify(result, null, 2));
      } catch (err) {
        console.log(err);
        process.exit(1);
      }
    });
  });

cli.help();

cli.version(
  JSON.parse(readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'))
    .version
);

cli.parse();
