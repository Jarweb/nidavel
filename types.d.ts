declare module 'rollup-plugin-clear'
declare module '@rollup/plugin-alias'
declare module 'rollup-plugin-local-resolve'
declare module 'rollup-plugin-filesize'
declare module 'rollup-plugin-babel'
declare module 'rollup-plugin-eslint'
declare module '@rollup/plugin-image'
declare module 'rollup-plugin-analyzer'
declare module '@rollup/plugin-url'
declare module '@svgr/rollup'
declare module 'lodash.camelcase'

type Target = 'cjs' | 'esm' | 'umd'

interface Options {
  target: Target[],
  globals?: {[key: string]: string}, // 外部引入的依赖
  input?: string,
  external?: string[],
  alias?: { [key: string]: string },
  isTypescript?: boolean,
  minify?: boolean,
  filesize?: boolean,
  eslintOptions?: any,
  replaceOptions?: any
}

interface OptionsOverrideCallback {
  (config: RollupOptions): RollupOptions
}