import antfu from '@antfu/eslint-config';

export default antfu(
  {
    type: 'lib',
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: true,
    },
    typescript: true,
    ignores: [
      // TODO https://github.com/antfu/eslint-config/blob/main/src/globs.ts
      '**/node_modules/**',
      '**/dist',
    ],
  },
  [{
    rules: {
      'ts/explicit-function-return-type': 'off',
    },
  }],
);
