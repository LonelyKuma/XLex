#!/usr/bin/env node

import path from 'path';
import { readFileSync } from 'fs';
import { cac } from 'cac';
import { Reg } from './reg';

const cli = cac('XLex');

cli.command('draw <reg> [name]').action((reg: string, name?: string) => {
  new Reg(reg).draw(name);
});

cli.help();

cli.version(
  JSON.parse(readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'))
    .version
);

cli.parse();
