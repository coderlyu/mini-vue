var VueReactivity = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/reactivity/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    computed: () => computed,
    effect: () => effect,
    reactive: () => reactive,
    ref: () => ref,
    watch: () => watch
  });

  // packages/reactivity/src/effect.ts
  var activeEffect = void 0;
  function cleanupEffect(effect2) {
    const { deps } = effect2;
    deps.forEach((dep) => {
      dep.delete(effect2);
    });
    effect2.deps.length = 0;
  }
  var ReactiveEffect = class {
    constructor(fn, scheduler) {
      this.fn = fn;
      this.scheduler = scheduler;
      this.parent = null;
      this.deps = [];
      this.active = true;
    }
    run() {
      if (!this.active) {
        return this.fn();
      }
      try {
        this.parent = activeEffect;
        activeEffect = this;
        cleanupEffect(this);
        return this.fn();
      } catch (error) {
        activeEffect = this.parent;
      }
    }
    stop() {
      if (this.active) {
        this.active = false;
        cleanupEffect(this);
      }
    }
  };
  var targetMap = /* @__PURE__ */ new WeakMap();
  function track(target, type, key) {
    if (!activeEffect)
      return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = /* @__PURE__ */ new Set());
    }
    trackEffects(dep);
  }
  function trackEffects(dep) {
    if (activeEffect) {
      let shouldTrack = !dep.has(activeEffect);
      if (shouldTrack) {
        dep.add(activeEffect);
        activeEffect.deps.push(dep);
      }
    }
  }
  function trigger(target, type, key, value, oldValue) {
    const depsMap = targetMap.get(target);
    if (!depsMap)
      return;
    const effects = depsMap.get(key);
    triggerEffects(effects);
    if (!effects)
      return;
  }
  function triggerEffects(effects) {
    effects = new Set(effects);
    effects.forEach((effect2) => {
      if (effect2.scheduler) {
        effect2.scheduler();
      } else {
        effect2.run();
      }
    });
  }
  function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
  }

  // packages/shared/src/index.ts
  var isObject = (value) => {
    return typeof value === "object" && value !== null;
  };
  var isFunction = (value) => {
    return typeof value === "function";
  };
  var isArray = Array.isArray;

  // packages/reactivity/src/baseHandlers.ts
  var mutableHandlers = {
    get(target, key, receiver) {
      if (key === "__v_isReactive" /* IS_REACTIVE */)
        return true;
      track(target, "get", key);
      let result = Reflect.get(target, key, receiver);
      if (isObject(result))
        return reactive(result);
      return result;
    },
    set(target, key, value, receiver) {
      let oldValue = target[key];
      let result = Reflect.set(target, key, value, receiver);
      if (oldValue !== value) {
        trigger(target, "set", key, value, oldValue);
      }
      return result;
    }
  };

  // packages/reactivity/src/reactive.ts
  var reactiveMap = /* @__PURE__ */ new WeakMap();
  function reactive(target) {
    if (!isObject(target)) {
      return;
    }
    if (target["__v_isReactive" /* IS_REACTIVE */])
      return target;
    let exisitProxy = reactiveMap.get(target);
    if (exisitProxy) {
      return exisitProxy;
    }
    const proxy = new Proxy(target, mutableHandlers);
    reactiveMap.set(target, exisitProxy);
    return proxy;
  }
  function isReactive(value) {
    return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
  }

  // packages/reactivity/src/computed.ts
  var ComputedRef = class {
    constructor(getter, setter) {
      this.getter = getter;
      this.setter = setter;
      this._dirty = true;
      this.__v_isReadonly = true;
      this.__v_isRef = true;
      this.dep = /* @__PURE__ */ new Set();
      this.effect = new ReactiveEffect(getter, () => {
        if (!this._dirty) {
          this._dirty = true;
          triggerEffects(this.dep);
        }
      });
    }
    get value() {
      trackEffects(this.dep);
      if (this._dirty) {
        this._dirty = false;
        this._value = this.effect.run();
      }
      return this._value;
    }
    set value(newValue) {
      this.setter(newValue);
    }
  };
  var computed = (getterOrOptions) => {
    let onlyGetter = isFunction(getterOrOptions);
    let getter, setter;
    if (onlyGetter) {
      getter = getterOrOptions;
      setter = () => {
        console.warn("no set");
      };
    } else {
      getter = getterOrOptions.get;
      setter = getterOrOptions.set;
    }
    return new ComputedRef(getter, setter);
  };

  // packages/reactivity/src/watch.ts
  function watch(source, cb) {
    let getter;
    if (isReactive(source)) {
      getter = () => traversal(source);
    } else if (isFunction(source))
      getter = source;
    let oldValue;
    let cleanup;
    const onCleanup = (fn) => {
      cleanup = fn;
    };
    const job = () => {
      if (cleanup)
        cleanup();
      const newValue = effect2.run();
      cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    };
    const effect2 = new ReactiveEffect(getter, job);
    oldValue = effect2.run();
  }
  function traversal(value, set = /* @__PURE__ */ new Set()) {
    if (!isObject(value))
      return value;
    if (set.has(value))
      return value;
    set.add(value);
    for (const key in value) {
      traversal(value[key], set);
    }
  }

  // packages/reactivity/src/ref.ts
  var RefImpl = class {
    constructor(value) {
      this.dep = /* @__PURE__ */ new Set();
      this.__v_isRef = true;
      this._value = toReactive(value);
    }
    get value() {
      trackEffects(this.dep);
      return this._value;
    }
    set value(newValue) {
      if (newValue !== this.rawValue) {
        this._value = toReactive(newValue);
        this.rawValue = newValue;
        triggerEffects(this.dep);
      }
    }
  };
  function toReactive(value) {
    return isObject(value) ? reactive(value) : value;
  }
  function ref(value) {
    return new RefImpl(value);
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=reactivity.global.js.map
