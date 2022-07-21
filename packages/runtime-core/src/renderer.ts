import { ShapeFlags } from '@vue/shared'
import { patchProp as hostPatchProp } from 'packages/runtime-dom/src/patchProp'

export function createRenderer(renderOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    setText: hostSetText,
    querySelector: hostQuerySelector,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    createElement: hostCreateElement,
    createText: hostCreateText,
  } = renderOptions

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      patch(null, children[i], container)
    }
  }

  const mountElement = (vnode, container) => {
    const { type, props, shapeFlag, children } = vnode
    const el = (vnode.el = hostCreateElement(type)) // 将真实元素挂载到虚拟节点上
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 文本
      hostSetElementText(children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      //
      mountChildren(children, el)
    }

    hostInsert(el, container)
  }
  const patch = (n1, n2, container) => {
    // n2 可能是一个文本
    if (n1 === n2) return
    if (n1 === null) {
      // 初次渲染
      mountElement(n2, container)
    } else {
      // 更新流程
    }
  }
  const render = (vnode, container) => {
    // 如果vnode 是空
    if (vnode === null) {
      // 卸载逻辑
    } else {
      // 初始化和更新
      patch(container._vnode || null, vnode, container)
    }
    container._vnode = vnode
  }
  return {
    render,
  }
}
