module.exports = {
  hooks: {},
  tokens: [
    {
      type: 'Identifier',
      rule: '[_a-zA-Z][_a-zA-Z0-9]*'
    },
    {
      type: 'Number',
      rule: '\\+?[0-9]+.?',
      callback({ type, value }) {
        const num = Number.parseInt(value);
        if (num >= Number.MAX_SAFE_INTEGER) {
          throw new Error(`"${value}" is bigger than max safe integer`);
        }
        return {
          type, value: num
        };
      }
    },
    {
      type: 'Float',
      rule: '[0-9]+.[0-9]+|.[0-9]+',
      callback({ type, value }) {
        const num = Number.parseFloat(value)
        if (!isFinite(num)) {
          throw new Error(`"${value}" is not a leggal float number`);
        }
        return {
          type, value: num
        }
      }
    },
    {
      type: 'Plus',
      rule: '\\+'
    },
    {
      type: 'Minus',
      rule: '-'
    }
  ]
};
