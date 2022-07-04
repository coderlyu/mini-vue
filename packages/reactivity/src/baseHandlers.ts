import { track, trigger } from './effect'
export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
}
export const mutableHandlers = {
  get(target, key, receiver) {
    // 判断 target 是否已经是响应式的
    if (key === ReactiveFlags.IS_REACTIVE) return true

    track(target, 'get', key)

    return Reflect.get(target, key, receiver)
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
