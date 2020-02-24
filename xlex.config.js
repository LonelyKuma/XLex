module.exports = {
  hooks: {},
  tokens: [
    {
      type: 'Identifier',
      rule: '[_a-zA-Z][_a-zA-Z0-9]*'
    },
    {
      type: 'Number',
      rule: '[0-9]+',
      callback({ type, value }) {
        return {
          type, value: Number.parseInt(value)
        };
      }
    },
    {
      type: 'Float',
      rule: '[0-9]+.[0-9]+',
      callback({ type, value }) {
        return {
          type, value: Number.parseFloat(value)
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
