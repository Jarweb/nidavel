import path from 'path'
import nodeResolve from '@rollup/plugin-node-resolve'
import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'
import clear from "rollup-plugin-clear"
import alias from '@rollup/plugin-alias'
import localResolve from 'rollup-plugin-local-resolve'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import filesize from 'rollup-plugin-filesize'
import commonjs from 'rollup-plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'
import typescript from 'rollup-plugin-typescript2'
import babel from 'rollup-plugin-babel'
import { terser } from "rollup-plugin-terser"
import replace from "rollup-plugin-replace"
import { eslint } from 'rollup-plugin-eslint'
import url from 'rollup-plugin-url'
import json from 'rollup-plugin-json'

const pkg = require('./package.json')

const env = process.env.NODE_ENV
const cwd = process.cwd()
const defaultExtensions = ['.ts', '.tsx', '.es6', '.es', '.mjs', '.js', '.jsx', '.json']
const styleExtensions = ['.less', '.scss', '.css']
const externalDeps = Object.keys(Object.assign({}, pkg.dependencies))
const externalPeerDeps = Object.keys(Object.assign({}, pkg.peerDependencies))

const config = {
  input: './src/index.ts',
  output: {
    file: pkg.main || 'dist/cjs/index.js',
    sourcemap: true,
    format: 'cjs',
  },
  external: [ // 依赖通过依赖安装，不包含依赖代码集成
    ...externalDeps,
    ...externalPeerDeps,
    ...['path']
  ],
  plugins: [
    clear({
      targets: ["dist"]
    }),
    peerDepsExternal(), // 排除依赖
    globals(), // 当使用 node 全局变量时，会自动插入全局变量的依赖
    builtins(), // 当使用 node 内部模块时，会自动插入模块的代码，继续解析
    nodeResolve({ // 依赖查找
      mainFields: ['module', 'jsnext:main', 'main'],
      extensions: defaultExtensions,
    }),
    localResolve(),
    sourceMaps(),
    commonjs({ // 将 common 模块转成 es 模块
      include: [
        'node_modules/', 
        "node_modules/**",
        "node_modules/**/*", 
      ],
    }),
    json(),
    url({
      fileName: '[dirname][hash:8][extname]',
      sourceDir: path.join(cwd, '.')
    }),
    alias({
      entries: [
        {
          find: '@',
          replacement: path.resolve(cwd, './src')
        },
      ],
      customResolver: nodeResolve({
        extensions: [...defaultExtensions, ...styleExtensions]
      })
    }),
    typescript({
      typescript: require('typescript'),
      useTsconfigDeclarationDir: true,
      objectHashIgnoreUnknownHack: true
    }),
    babel({
      babelrc: false,
      exclude: 'node_modules/**',
      sourceMaps: true,
      extensions: defaultExtensions,
      rootMode: "upward",
      presets: [
        [
          "@babel/preset-env",
          {
            "useBuiltIns": false,
            "modules": false,
            "loose": false,
            "debug": false,
            "targets": {
              "node": "current",
            }
          }
        ],
        ["@babel/preset-typeScript"]
      ],
      plugins: [
        require.resolve('@babel/plugin-syntax-dynamic-import'),
        // react 优化
        require.resolve('babel-plugin-react-require'),
        require.resolve('@babel/plugin-syntax-jsx'),
        require.resolve('@babel/plugin-transform-react-jsx'),
        require.resolve('@babel/plugin-transform-react-display-name'),
        require.resolve('@babel/plugin-transform-react-constant-elements'),
        require.resolve('@babel/plugin-transform-react-jsx-compat'),
        ...(env === 'development' ? [
          require.resolve('@babel/plugin-transform-react-jsx-self'),
          require.resolve('@babel/plugin-transform-react-jsx-source'),
        ] : []),
        // 实验性
        require.resolve('@babel/plugin-proposal-object-rest-spread'),
        require.resolve('@babel/plugin-proposal-do-expressions'),
        require.resolve('@babel/plugin-proposal-export-default-from'),
        require.resolve('@babel/plugin-proposal-export-namespace-from'),
        require.resolve('@babel/plugin-proposal-nullish-coalescing-operator'),
        require.resolve('@babel/plugin-proposal-optional-chaining'),
        [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
        [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
      ]
    }),
    eslint({
      include: [
        'src/**',
      ]
    }),
    filesize(),
    // terser(),
    // replace({
    //   "process.env.NODE_ENV": JSON.stringify('production'),
    // }),
  ]
}

export default config