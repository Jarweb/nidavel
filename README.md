# nidavel is a planet

## 特性：

- 支持 cjs、umd、esm
- 默认支持 ts
- 默认支持 eslint。需要手动添加 .eslintrc.json 文件
- 默认通过 bable + preset-typeScript 进行编译
- 集成 babel react 优化插件和 esnext 实验性插件
- 默认入口 src/index.ts， 默认输出目录 dist
- 默认不进行代码压缩
- 默认打包不会添加 polyfill，建议在应用打包中进行 polyfill，以避免 polyfill 重复


## 使用：

```code
import configRollup from 'nidavel'

// simple
export default configRollup(options)

// overrides
export defualt configRollup(options, (config) => {
  return {
    ...config,
    ...{
      // overrides
    }
  }
})
```

## 配置：

```code
type Target = 'cjs' | 'esm' | 'umd'

interface Options {
  target: Target[],
  globals?: {[key: string]: string}, // 外部引入的依赖
  input?: string, // 入口，default src/index.ts
  external?: string[], // 排除打包的库
  alias?: { [key: string]: string },
  isTypescript?: boolean, // default true
  minify?: boolean, // default false
  filesize?: boolean, // default true
  eslintOptions?: any,
  replaceOptions?: any
}

interface OptionsOverrideCallback {
  (config: RollupOptions): RollupOptions
}
```
