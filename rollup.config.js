
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs    from '@rollup/plugin-commonjs';





const es_config = {

  input: 'build/ts/index.js',

  output: {
    file   : 'build/rollup/index.mjs',
    format : 'es',
    name   : 'kyrie'
  },

  plugins : [

    nodeResolve({
      mainFields     : ['module', 'main'],
      browser        : true,
      extensions     : [ '.ts' ],
      preferBuiltins : false
    }),

    commonjs()

  ]

};





const cjs_config = {

  input: 'build/ts/index.js',

  output: {
    file   : 'build/rollup/index.cjs',
    format : 'commonjs',
    name   : 'kyrie'
  },

  plugins : [

    nodeResolve({
      mainFields     : ['module', 'main'],
      browser        : true,
      extensions     : [ '.ts' ],
      preferBuiltins : false
    }),

    commonjs()

  ]

};





const cli_config = {

  input: 'build/ts/cli.js',

  output: {
    file   : 'build/rollup/cli.cjs',
    format : 'commonjs',
    banner : '#!/usr/bin/env node',
    name   : 'kyrie-cli'
  },

  plugins : [

    nodeResolve({
      mainFields     : ['module', 'main'],
      browser        : false,
      extensions     : [ '.ts', '.js' ],
      preferBuiltins : true
    }),

    commonjs()

  ]

};




export default [ es_config, cjs_config, cli_config ];
