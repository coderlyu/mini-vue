import { isFunction, isObject } from '@vue/shared'
import { ReactiveEffect } from './effect'
import { isReactive } from './reactive'

export function watch(source, cb) {
  // source 是用户传入的对象，cb就是对应的回调函数

  let getter
  if (isReactive(source)) {
    // 对用户传入的数据进行循环（递归循环，只要循环访问对象上的每一个属性，访问属性的时候会进行依赖收集）
    getter = () => traversal(source)
  } else if (isFunction(source)) getter = source
  let oldValue
  const job = () => {
    const newValue = effect.run()
    cb(newValue, oldValue)
    oldValue = newValue
  }
  const effect = new ReactiveEffect(getter, job)
  oldValue = effect.run()
}

// 考虑对象循环引用问题
function traversal(value, set = new Set()) {
  // 不是对象，结束递归
  if (!isObject(value)) return value
  if (set.has(value)) return value
  set.add(value)
  for (const key in value) {
    traversal(value[key], set)
  }
}
