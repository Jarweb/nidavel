import { RollupOptions } from 'rollup'
import path from 'path'
import nodeResolve from '@rollup/plugin-node-resolve'
import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'
import clear from "rollup-plugin-clear"
import json from 'rollup-plugin-json'
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
import image from '@rollup/plugin-image'
import url from 'rollup-plugin-url'
import svgr from '@svgr/rollup'
import camelCase from 'lodash.camelcase'

const env = process.env.NODE_ENV
const cwd = process.cwd()
const pkg = require(path.resolve(cwd, './package.json'))
const defaultExtensions = ['.ts', '.tsx', '.es6', '.es', '.mjs', '.js', '.jsx', '.json']
const styleExtensions = ['.less', '.scss', '.css']
const externalDeps = Object.keys(Object.assign({}, pkg.dependencies))
const externalPeerDeps = Object.keys(Object.assign({}, pkg.peerDependencies))
const formatAlias = (alias: { [key: string]: string }) => {
  return Object.keys(alias).map((item) => ({
    find: item,
    replacement: alias[item]
  }))
}

const configRollup = (options: Options, cb?: OptionsOverrideCallback): RollupOptions => {
  const aliasEntry = options.alias ? formatAlias(options.alias) : []
  const config: RollupOptions = {
    input: options.input || pkg.entry || path.resolve(cwd, './src/index.ts'),
    output: {
      file: pkg.main || path.resolve(cwd, './dist/index.cjs.js'),
      sourcemap: true,
      format: 'cjs',
      name: camelCase(pkg.name),
    },
    external: [
      ...externalDeps,
      ...externalPeerDeps,
      ...options.external || [],
    ],
    plugins: [
      clear({
        targets: ["dist"]
      }),
      peerDepsExternal(), // 排除依赖
      globals(), // 当使用 node 全局变量时，会自动插入全局变量的依赖
      builtins(), // 当使用 node 内部模块时，会自动插入模块的代码，继续解析
      nodeResolve({
        mainFields: ['module', 'jsnext:main', 'main'],
        extensions: defaultExtensions
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
      image(),
      svgr(),
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
          ...aliasEntry
        ],
        customResolver: nodeResolve({
          extensions: [...defaultExtensions, ...styleExtensions]
        })
      }),
      options.isTypescript !== false ?
      typescript({
        typescript: require('typescript'),
        useTsconfigDeclarationDir: true,
        objectHashIgnoreUnknownHack: true
      }) : null,
      babel({
        babelrc: false,
        exclude: 'node_modules/**',
        sourceMaps: true,
        extensions: defaultExtensions,
        // rootMode: "upward",
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
          options.isTypescript !== false &&
          ["@babel/preset-typeScript"],
        ].filter(Boolean),
        plugins: [
          require.resolve('@babel/plugin-syntax-dynamic-import'),
          // react 优化
          require.resolve('babel-plugin-react-require'),
          require.resolve('@babel/plugin-syntax-jsx'),
          require.resolve('@babel/plugin-transform-react-jsx'),
          require.resolve('@babel/plugin-transform-react-display-name'),
          require.resolve('@babel/plugin-transform-react-constant-elements'),
          require.resolve('@babel/plugin-transform-react-jsx-compat'),
          env === 'development' ? [
            require.resolve('@babel/plugin-transform-react-jsx-self'),
            require.resolve('@babel/plugin-transform-react-jsx-source'),
          ] : null,
          // 实验性
          require.resolve('@babel/plugin-proposal-do-expressions'),
          require.resolve('@babel/plugin-proposal-export-default-from'),
          require.resolve('@babel/plugin-proposal-export-namespace-from'),
          require.resolve('@babel/plugin-proposal-nullish-coalescing-operator'),
          require.resolve('@babel/plugin-proposal-optional-chaining'),
          [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
          [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
        ].filter(Boolean)
      }),
      options.minify ?
      terser() : null,
      eslint(options.eslintOptions ? options.eslintOptions : {
        include: [
          'src/**',
        ]
      }),
      options.replaceOptions ? 
      replace(options.replaceOptions) : null,
      options.filesize !== false &&
      filesize(),
    ].filter(Boolean)
  }

  return cb ? cb(config) : config
}

export default configRollup