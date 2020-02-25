#!/usr/bin/env node

import path from 'path';
import { readFileSync } from 'fs';
import { cac } from 'cac';
import { Reg } from './reg';
import { Lexer } from './lexer';

const cli = cac('XLex');

cli
  .command('draw <reg> [name]', 'Draw DAG of the RegExp')
  .action((reg: string, name?: string) => {
    new Reg(reg).draw(name);
  });

cli
  .command('', 'Generate Lexer')
  .option('--config <config>', 'Config file path')
  .action(async (option: { config: string }) => {
    const config = await import(
      path.resolve(
        process.cwd(),
        option.config ? option.config : './xlex.config'
      )
    );
    const lexer = new Lexer(config);
    const text: string[] = [];
    process.stdin.on('data', data => {
      text.push(String(data));
    });
    process.stdin.on('end', () => {
      try {
        const result = lexer.run(text.join(''));
        console.log(result);
      } catch (err) {
        console.log(err);
      }
    });
  });

cli.help();

cli.version(
  JSON.parse(readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'))
    .version
);

cli.parse();
