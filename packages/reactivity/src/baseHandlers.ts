import { isObject } from '@vue/shared'
import { track, trigger } from './effect'
import { reactive } from './reactive'
export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
}
export const mutableHandlers = {
  get(target, key, receiver) {
    // 判断 target 是否已经是响应式的
    if (key === ReactiveFlags.IS_REACTIVE) return true

    track(target, 'get', key)

    let result = Reflect.get(target, key, receiver)

    // 深度代理实现，性能好，取值就可以进行代理
    if (isObject(result)) return reactive(result)

    return result
  },
  set(target, key, value, receiver) {
    // 去代理上设置值，执行set
    let oldValue = target[key]
    let result = Reflect.set(target, key, value, receiver)
    if (oldValue !== value) {
      // 值变化了，进行更新
      trigger(target, 'set', key, value, oldValue)
    }
    return result
  },
}
