export function patchEvent(el, eventName, nextValue) {
  // 1. 可以先移除事件，再重新绑定事件
  // 2. or 自定义事件
  let invokers = el._vei || (el._vei = {})
  let exits = invokers[eventName]
  if (exits && nextValue) {
    // 更新
    exits.value = nextValue
  } else {
    // onClick -> click
    let event = eventName.slice(2).toLowerCase()
    if (nextValue) {
      const invoker = (invokers[eventName] = createInvoker(nextValue))
      el.addEventListener(event, invoker)
    } else if (exits) {
      // 如果有老值，将老的绑定事件删除
      el.removeEventListener(event, exits)
      invokers[eventName] = undefined
    }
  }
}

export function createInvoker(callback) {
  const invoker = (e) => invoker.value(e)
  invoker.value = callback
  return invoker
}
