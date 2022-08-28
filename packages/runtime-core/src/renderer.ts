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

  const mountElement = (vnode, container, anchor) => {
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

    hostInsert(el, container, anchor)
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
        hostPatchProp(el, key, oldProps[key], undefined)
      }
    }
  }

  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i])
    }
  }
  const patchKeyedChildren = (c1, c2, el) => {
    let i = 0,
      e1 = c1.length - 1,
      e2 = c2.length - 1

    // 从前比
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el)
      } else {
        // 不一样了
        break
      }
      i++
    }
    // 从后比
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el)
      } else {
        break
      }
      e1--
      e2--
    }
    // i要比e1大说明有新增的
    // i和 e2之间的是新增的部分
    if (i > e1) {
      if (i <= e2) {
        while (i <= e2) {
          const nextPos = e2 + 1
          // 根据下一个的索引来看参照物
          const anchor = nextPos < c2.length ? c2[nextPos].el : null
          patch(null, c2[i], el, anchor)
          i++
        }
      }
    } else if (i > e2) {
      // 卸载
      // i要比e2大说明有要卸载的
      // i和 e1之间的是卸载的部分
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i])
          i++
        }
      }
    }
    // 乱序比较
    let s1 = i,
      s2 = i
    const keyToNewIndexMap = new Map()
    for (let i = s2; i < e2; i++) {
      keyToNewIndexMap.set(c2[i].key, i)
    }
    // 循环老的元素，看一下新的里面有没有，如果有说明要比较差异，没有就要添加到列表中，老的有新的没有要删除
    const toBePatched = e2 - s2 + 1
    const newIndexToOldIndexMap = new Array(toBePatched).fill(0) // 记录是否对比过的映射表

    for (let i = s1; i < e1; i++) {
      const oldChild = c1[i] // 老节点
      let newIndex = keyToNewIndexMap.get(oldChild.key)
      if (newIndex === undefined) {
        unmount(oldChild)
      } else {
        // 新的位置对应老的位置，如果数组里放的值>0说明以及patch过了
        newIndexToOldIndexMap[newIndex - s2] = i + 1 // 用来标记当前以及patch过的结果
        patch(oldChild, c2[newIndex], el)
      }
    }

    // 优化
    // 获取最长递增子序列
    const increment = getSequence(newIndexToOldIndexMap)
    // 需要移动位置
    let j = increment.length - 1
    for (let i = toBePatched - 1; i >= 0; i--) {
      const index = i + s2
      let current = c2[index]
      let anchor = index + 1 < c2.length ? c2[index + 1] : null
      // hostInsert(current.el, el)
      if (newIndexToOldIndexMap[i] === 0) {
        patch(null, current, el, anchor)
      } else {
        // 以及对比过属性和儿子了
        if (i != increment[i]) {
          // 目前无论如何都做了一遍倒叙插入，其实可以不用的，可以根据刚才的数组来减少插入次数
          hostInsert(current.el, el, anchor)
        } else {
          j--
        }
      }
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
          patchKeyedChildren(c1, c2, el)
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

  const processElement = (n1, n2, container, anchor = null) => {
    if (n1 === null) {
      // 初次渲染
      mountElement(n2, container, anchor)
    } else {
      // 更新流程
      patchElement(n1, n2)
    }
  }

  const patch = (n1, n2, container, anchor = null) => {
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
          processElement(n1, n2, container, anchor)
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

function getSequence(arr: number[]): number[] {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
