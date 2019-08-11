/**
 *  思路：
 *  1. 将页面dom 转化成ast
 *  2. 处理页面逻辑，生成code, 并且在转ast 的时候,把虚拟dom 上的回调update 传过去了， 这样只要set 的时候，就会执行回调
 *  3. code -> innerhtml
 */
class Kvue {
  constructor(options) {
      this.$options = options;
      this.$data = options.data;

      this.observer(this.$data); // 监测数据变化，执行回调

      if(options.created) {
        options.created.call(this);
      }

      this.$compile = new Compile(options.el, this);
  }

  observer(value) { // 这个函数里面主要是属性代理， 和数据响应式
    if(!value || (typeof value !== 'object')){
      return;
    }
    // 给这个对象的每一个属性都做响应式
    Object.keys(value).forEach((key) => {
      this.proxyData(key);
      this.defineReactive(value, key, value[key]);
    });
  }

  proxyData(key) { // 对象的属性代理
    Object.defineProperty(this, key, {
      configurable: false,
      enumerable: true,
      get() {
        return this.$data[key];
      },
      set(newVal) {
        this.$data[key] = newVal;
      }
    })
  }

  defineReactive(obj, key, val) {
    this.observer(val); // 递归调用 让所有的属性都变成响应式
    const dep = new Dep();
    Object.defineProperty(obj, key, {
      enumerable: false,
      configurable: true,
      get() {
        Dep.target && dep.addDep(Dep.target);
        return val
      },
      set(newVal) {
        if(newVal === val) {
          return;
        }

        val = newVal;
        dep.notify()

      }
    })
  }
}

// 观察者模式
class Dep {
  constructor() {
    this.deps = []
  }

  depend() {
    Dep.target.addDep(this);
  }

  addDep(dep) {
    if(!this.deps.includes(dep)) {
      this.deps.push(dep)
    }
  }

  notify() {
    this.deps.forEach((dep) => {
      dep.update();
    })
  }
}

Dep.target = null;


class Watch {
  constructor(vm, key, cb) {
    this.cb = cb;
    this.vm = vm;
    this.key = key;
    this.value = this.get();
  }

  get() {
    Dep.target = this;
    let value = this.vm[this.key];
    return value;
  }

  update() {
    this.value = this.get();
    this.cb.call(this.vm, this.value);
  }
}
