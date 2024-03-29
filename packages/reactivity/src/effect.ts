/**
 * 当前正在执行依赖收集的函数，获取proxy代理对象上的属性的时候使用
 */
export let activeEffect = undefined

function cleanupEffect(effect) {
  const { deps } = effect
  deps.forEach((dep) => {
    dep.delete(effect)
  })
  effect.deps.length = 0
}

export class ReactiveEffect {
  public parent = null // 父级 effect
  public deps = [] // 记录依赖了哪些属性
  public active = true // 是否激活状态
  constructor(public fn, public scheduler?) {}
  run() {
    // 如果是非激活的情况，只需要执行函数，不需要进行依赖收集
    if (!this.active) {
      return this.fn()
    }
    try {
      this.parent = activeEffect // 保存父级 effect
      // 依赖收集，核心就是将当前的 effect 和稍后渲染的属性关联在一起
      activeEffect = this

      // 清空之前收集的依赖，重新收集
      cleanupEffect(this)

      // 当稍后调用取值操作的时候，就可以获取到这个全局的 activeEffect
      return this.fn()
    } catch (error) {
      activeEffect = this.parent
      //   this.parent = null
    }
  }
  stop() {
    if (this.active) {
      this.active = false
      cleanupEffect(this) // 停止 effect 的收集
    }
  }
}

// 一个 effect 对应多个属性，一个属性对应多个effect
// 多对对
const targetMap = new WeakMap()
// { 对象: { 属性: Map{ [name]: Set } } }
export function track(target, type, key) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }
  trackEffects(dep)
}

export function trackEffects(dep) {
  if (activeEffect) {
    let shouldTrack = !dep.has(activeEffect) // 去重
    if (shouldTrack) {
      dep.add(activeEffect)

      // 让effect记录对应的 dep，稍后清理的时候会用到
      activeEffect.deps.push(dep)
    }
  }
}

export function trigger(target, type, key, value, oldValue) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const effects = depsMap.get(key)
  triggerEffects(effects)
  if (!effects) return
}

export function triggerEffects(effects) {
  // 先拷贝一份，避免死循环，（先删除收集的依赖，再重新收集依赖）
  effects = new Set(effects)

  effects.forEach((effect) => {
    // 在执行 effect时，如果有要执行自己，需要屏蔽掉，不无限调用
    // if (effect !== activeEffect)
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run()
    }
  })
}

export function effect(fn, options: any = {}) {
  // fn可以根据状态变化 重新执行，effect可以嵌套着写

  const _effect = new ReactiveEffect(fn, options.scheduler) // 创建响应式的effect

  _effect.run() // 默认先执行一次

  const runner = _effect.run.bind(_effect) // 绑定this指向
  runner.effect = _effect // 将 effect 挂在到 runner 函数上

  return runner
}
