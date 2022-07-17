export function patchStyle(el, prevValue, nextValue) {
  // 样式需要对比差异
  for (const key in nextValue) {
    // 用新的直接覆盖即可
    el.style[key] = nextValue = [key]
  }

  if (prevValue) {
    for (const key in prevValue) {
      if (nextValue[key] == null) el.style[key] = null
    }
  }
}
