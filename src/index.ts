import { cac } from 'cac';
import { Reg } from './reg';

const cli = cac('XLex');

const params = cli.parse();

export { Reg };
