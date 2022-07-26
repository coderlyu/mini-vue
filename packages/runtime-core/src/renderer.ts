import { isString, ShapeFlags } from '@vue/shared'
import { patchProp as hostPatchProp } from 'packages/runtime-dom/src/patchProp'
import { createVnode, isSameVnode, Text } from './vnode'

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

  const normalize = (children, i) => {
    if (isString(children[i])) {
      let vnode = createVnode(Text, null, children[i])
      children[i] = vnode
    }
    return children[i]
  }

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      const child = normalize(children, i)
      patch(null, child, container)
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
      // 数组
      mountChildren(children, el)
    }

    hostInsert(el, container)
  }

  const processText = (n1, n2, container) => {
    if (n1 === null) {
      const el = (n2.el = hostCreateText(n2.children))
      hostInsert(el, container)
    } else {
      // 两个都是文本
      const el = (n2.el = n1.el)
      if (n1.children !== n2.children) {
        hostSetText(el, n2, container)
      }
    }
  }

  const patchProps = (oldProps, newProps, el) => {
    for (const key in newProps) {
      // 直接覆盖旧的
      hostPatchProp(el, key, oldProps[key], newProps[key])
    }
    for (const key in oldProps) {
      if (newProps[key] === null) {
        // 删除
        hostPatchProp(el, key, oldProps[key], null)
      }
    }
  }

  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i])
    }
  }
  const patchChildren = (n1, n2, el) => {
    // 比较两个虚拟节点的字节点的差异
    const c1 = n1.children
    const c2 = n2.children
    const prevShapeFlag = n1.shapeFlag

    const shapeFlag = n2.shapeFlag
    // 文本、null、数组

    // 比较两个字节点的差异
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1) // 文本和数组
      }
      if (c1 !== c2) {
        hostSetElementText(el, c2) // 文本和文本
      }
    } else {
      // 现在是数组为空
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 数组和数组
          // diff算法
        } else {
          // 数组和文本
          // 现在不是数组（文本和空）
          unmountChildren(c1)
        }
      } else {
        //
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 空和文本
          hostSetElementText(el, '')
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 空 数组
          mountChildren(c2, el)
        }
      }
    }
  }

  const patchElement = (n1, n2) => {
    // 先复用
    // 再比较属性
    // 再比较儿子
    const el = (n2.el = n1.el)
    const oldProps = n1.props || {}
    const newProps = n2.props || {}

    patchProps(oldProps, newProps, el)
    patchChildren(n1, n2, el)
  }

  const processElement = (n1, n2, container) => {
    if (n1 === null) {
      // 初次渲染
      mountElement(n2, container)
    } else {
      // 更新流程
      patchElement()
    }
  }

  const patch = (n1, n2, container) => {
    // 上一个旧node
    // n2 可能是一个文本
    if (n1 === n2) return

    if (n1 && !isSameVnode(n1, n2)) {
      // 不相同，删除老的，添加新的
      unmount(n1)
      n1 = null
    }

    const { type, shapeFlag } = n2

    switch (type) {
      case Text:
        processText(n1, n2, container)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container)
        }
        break
    }
  }
  const unmount = (vnode) => {
    hostRemove(vnode.el)
  }
  const render = (vnode, container) => {
    // 如果vnode 是空
    if (vnode === null) {
      // 卸载逻辑
      if (container._vnode) {
        // 渲染过，卸载dom
        unmount(container._vnode)
      }
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
