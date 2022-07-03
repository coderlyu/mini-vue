import { isObject } from '@vue/shared'
import { mutableHandlers, ReactiveFlags } from './baseHandler'
// 只能做对象的代理
const reactiveMap = new WeakMap() // key 只能是对象（弱引用）

export function reactive(target) {
  if (!isObject(target)) {
    return
  }

  // 代理对象被再次代理 可以直接返回
  // 如果target是代理对象，那么一定被代理过了，会走get
  if (target[ReactiveFlags.IS_REACTIVE]) return target

  // 实现同一个对象 代理多次，返回同一个代理
  let exisitProxy = reactiveMap.get(target)
  if (exisitProxy) {
    return exisitProxy
  }
  // receiver: 当前的代理对象
  // Reflect 修改 this 指向改成 proxy
  const proxy = new Proxy(target, mutableHandlers)
  reactiveMap.set(target, exisitProxy)
  return proxy
}
