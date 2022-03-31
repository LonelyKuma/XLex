import path from 'path';
import { readFileSync } from 'fs';
import { cac } from 'cac';
import graphviz from 'graphviz';

import { Reg } from './reg';
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
    const config = await loadConfig(option.config);
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

cli
  .command('build', 'Build lexer')
  .option('--config <config>', 'Config file path', { default: 'xlex.config' })
  .action(async (option: { config: string }) => {
    const config = await loadConfig(option.config);
    new Lexer(config);
  });

async function loadConfig(file: string) {
  const jiti = (await import('jiti')).default(__filename);
  return (await jiti(path.resolve(process.cwd(), file))).default;
}

cli.help();

cli.version(
  JSON.parse(readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'))
    .version
);

cli.parse();
