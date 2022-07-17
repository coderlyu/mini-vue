import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'
import { createRenderer, h } from '@vue/runtime-core'

const renderOptions = Object.assign(nodeOps, { patchProp })

export function render(vnode, container) {
  createRenderer(renderOptions).render(vnode, container)
}
