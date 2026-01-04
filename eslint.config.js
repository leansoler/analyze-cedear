// @ts-check

const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const prettierConfig = require('eslint-plugin-prettier/recommended');

module.exports = [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    rules: {
      // e.g. "@typescript-eslint/explicit-function-return-type": "off",
    },
  }
];