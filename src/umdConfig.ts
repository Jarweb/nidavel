import { RollupOptions } from 'rollup'
import path from 'path'
import nodeResolve from '@rollup/plugin-node-resolve'
import clear from "rollup-plugin-clear"
import json from 'rollup-plugin-json'
import alias from '@rollup/plugin-alias'
import localResolve from 'rollup-plugin-local-resolve'
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import filesize from 'rollup-plugin-filesize'
import sourceMaps from 'rollup-plugin-sourcemaps'
import typescript from 'rollup-plugin-typescript2'
import babel from 'rollup-plugin-babel'
import { terser } from "rollup-plugin-terser"
import replace from "rollup-plugin-replace"
import { eslint } from 'rollup-plugin-eslint'
import image from '@rollup/plugin-image'
import url from 'rollup-plugin-url'
import svgr from '@svgr/rollup'
import postcss from 'rollup-plugin-postcss'
import autoprefixer from 'autoprefixer'
import camelCase from 'lodash.camelcase'
import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'
import commonjs from 'rollup-plugin-commonjs'

const env = process.env.NODE_ENV
const cwd = process.cwd()
const pkg = require(path.resolve(cwd, './package.json'))
const defaultExtensions = ['.ts', '.tsx', '.es6', '.es', '.mjs', '.js', '.jsx', '.json']
const styleExtensions = ['.less', '.scss', '.css' , '.sass']
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
      file: pkg.browser || path.resolve(cwd, './dist/index.umd.js'),
      sourcemap: true,
      format: 'umd',
      name: camelCase(pkg.name),
      globals: options.globals || {} // 全局依赖
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
      peerDepsExternal(),
      globals(),
      builtins(),
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
        runtimeHelpers: true,
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
                "browsers": [
                  'last 2 versions',
                  "> 0.25%",
                  "not dead"
                ]
              }
            }
          ],
          options.isTypescript !== false ?
          ["@babel/preset-typeScript"] : null
        ].filter(Boolean),
        plugins: [
          ["@babel/plugin-transform-runtime", { useESModules: true }],
          require.resolve('@babel/plugin-syntax-dynamic-import'),
          // react 优化
          require.resolve('babel-plugin-react-require'),
          require.resolve('@babel/plugin-syntax-jsx'),
          require.resolve('@babel/plugin-transform-react-jsx'),
          require.resolve('@babel/plugin-transform-react-display-name'),
          require.resolve('@babel/plugin-transform-react-constant-elements'),
          require.resolve('@babel/plugin-transform-react-jsx-compat'),
          env === 'development' && [
            require.resolve('@babel/plugin-transform-react-jsx-self'),
            require.resolve('@babel/plugin-transform-react-jsx-source'),
          ],
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
      terser(),
      postcss({
        extract: false,
        inject: true,
        minimize: true,
        autoModules: true,
        sourceMap: true,
        exec: true,
        extensions: styleExtensions,
        plugins: [
          autoprefixer({
            remove: false,
            flexbox: 'no-2009',
          })
        ]
      }),
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