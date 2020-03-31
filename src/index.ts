import { RollupOptions } from 'rollup'
import cjsConfig from './cjsConfig'
import esmConfig from './esmConfig'
import umdConfig from './umdConfig'

export default function configRollup(options: Options, cb?: OptionsOverrideCallback): RollupOptions | RollupOptions[] {
  const res: RollupOptions[] = []

  options.target.forEach((target) => {
    switch (target) {
      case 'cjs':
        res.push(cjsConfig(options, cb))
        break;
      case 'esm':
        res.push(esmConfig(options, cb))
        break;
      case 'umd':
        res.push(umdConfig(options, cb))
        break;
      default:
        res.push(esmConfig(options, cb), umdConfig(options, cb))
        break;
    } 
  })
  return res
}
