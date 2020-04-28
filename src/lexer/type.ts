export interface IToken {
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

export interface RuleConfig {
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

export const Comment = '__Comment__';
