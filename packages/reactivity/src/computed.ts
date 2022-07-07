import { isFunction } from '@vue/shared'
import { ReactiveEffect, track, trackEffect, triggerEffect } from './effect'

export class ComputedRef {
  public effect
  public _dirty = true // 默认应该取值的时候进行计算
  public __v_isReadonly = true
  public __v_isRef = true
  public _value
  public dep = new Set()
  constructor(public getter, public setter) {
    // 将用户的 getter放到effect中，这里面会进行依赖收集
    this.effect = new ReactiveEffect(getter, () => {
      // 稍后依赖的属性变化会执行此调度函数
      if (!this._dirty) {
        this._dirty = true

        // 实现一个触发更新
        triggerEffect(this.dep)
      }
    })
  }
  get value() {
    // 依赖收集
    trackEffect(this.dep)
    if (this._dirty) {
      // 值是脏的
      this._dirty = false // 只有第一次或依赖的值变化了，才需要走到这
      this._value = this.effect.run()
    }
    return this._value
  }
  set value(newValue) {
    this.setter(newValue)
  }
}

export const computed = (getterOrOptions) => {
  let onlyGetter = isFunction(getterOrOptions)
  let getter, setter
  if (onlyGetter) {
    getter = getterOrOptions
    setter = () => {
      console.warn('no set')
    }
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  return new ComputedRef(getter, setter)
}
