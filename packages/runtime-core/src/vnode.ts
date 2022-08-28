import { isArray, isObject, isString, ShapeFlags } from '@vue/shared'
export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')
export function isVnode(vnode) {
  return !!(vnode && vnode.__v_isVnode)
}

export function isSameVnode(n1, n2) {
  // 判断两个虚拟节点是否是相同的
  // 标签名相同
  // key相同
  return n1.type === n2.type && n1.key === n2.key
}

export function createVnode(type, props?, children?) {
  // 组合方案 shapeFlag
  let shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0
  const vnode = {
    el: null, // 真实节点
    type,
    props,
    children,
    key: props?.['key'],
    shapeFlag,
    __v_isVnode: true,
  }
  if (children) {
    if (isArray(children)) {
      type = ShapeFlags.ARRAY_CHILDREN
    } else {
      children = String(children)
      type = ShapeFlags.TEXT_CHILDREN
    }

    vnode.shapeFlag = vnode.shapeFlag | type
  }
  return vnode
}
