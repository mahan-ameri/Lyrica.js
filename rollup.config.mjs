import terser from '@rollup/plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';

const builds = [
  {
    input: 'Lyrica.js',
    output: {
      file: 'dist/Lyrica.umd.cjs',
      format: 'umd',
      name: 'Lyrica',
      sourcemap: true
    }
  },
  {
    input: 'Lyrica.js',
    output: {
      file: 'dist/Lyrica.esm.mjs',
      format: 'es',
      sourcemap: true
    }
  },
  {
    input: 'Lyrica.js',
    output: {
      file: 'dist/Lyrica.umd.js',
      format: 'umd',
      name: 'Lyrica',
      sourcemap: true
    }
  },
  {
    input: 'Lyrica.js',
    output: {
      file: 'dist/Lyrica.cjs',
      format: 'cjs',
      sourcemap: true
    }
  }
];

export default isProduction
  ? [
      ...builds,
      {
        input: 'Lyrica.js',
        output: {
          file: 'dist/Lyrica.umd.min.js',
          format: 'umd',
          name: 'Lyrica',
          sourcemap: true
        },
        plugins: [terser()]
      }
    ]
  : builds;
