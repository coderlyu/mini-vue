import { isArray, isObject } from '@vue/shared'
import { createVnode, isVnode } from './vnode'

export function h(type, propsChildren, children) {
  // 除了这三个参数之外的肯定是孩子
  const l = arguments.length
  if (l === 2) {
    if (isObject(propsChildren) && !isArray(propsChildren)) {
      if (isVnode(propsChildren)) {
        // 虚拟节点就包装成数组
        return createVnode(type, null, [propsChildren])
      }
      return createVnode(type, propsChildren)
    } else {
      return createVnode(type, null, propsChildren) // 是数组
    }
  } else {
    if (l > 3) {
      children = Array.from(arguments).slice(2)
    } else if (l === 3 && isVnode(children)) {
      children = [children]
    }
    return createVnode(type, propsChildren, children)
  }
}
