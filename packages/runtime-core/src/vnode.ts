import { isArray, isString, ShapeFlags } from '@vue/shared'

export function isVnode(vnode) {
  return !!(vnode && vnode.__v_isVnode)
}

export function createVnode(type, props?, children?) {
  // 组合方案 shapeFlag
  let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0
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
