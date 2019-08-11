
class Compile {
  constructor(el, vm) {
    this.$vm = vm;
    this.$el = document.querySelector(el);

    if(this.$el) {
      this.$fragment = this.node2Fragment(this.$el);
      this.compileElement(this.$fragment);

      this.$el.appendChild(this.$fragment);
    }
  }

  node2Fragment(el) {
    let fragment = document.createDocumentFragment();
    let child

    while (child = el.firstChild) {
      fragment.appendChild(child)
    }
    return fragment;
  }

  compileElement(el) {
    let childNodes = el.childNodes

    Array.from(childNodes).forEach((node) => {
      let text = node.textContent;

      let reg = /\{\{(.*)\}\}/;

      if(this.isElementNode(node)) {
        this.compile(node);
      } else if(this.isTextNode(node) && reg.test(text)){
        this.compileText(node, RegExp.$1);
      }

      if(node.childNodes && node.childNodes.length) {
        this.compileElement(node);
      }
    });
  }


  compile(node) {
    let nodeAttrs = node.attributes;
    Array.from(nodeAttrs).forEach((attr) => {
      let attrName = attr.name;
      let exp = attr.value;
      if(this.isDirective(attrName)) {
        let dir = attrName.substring(2);
        this[dir] && this[dir](node, this.$vm, exp);
      }

      if(this.isEventDirective(attrName)) {
        let dir = attrName.substring(1);
        this.eventHandler(node, this.$vm, exp, dir);
      }
    });
  }

  compileText(node, exp) {
    this.text(node, this.$vm, exp);
  }

  eventHandler(node, vm, exp, dir) {
    let fn = vm.$options.methods && vm.$options.methods[exp];
    if(dir && fn) {
      node.addEventListener(dir, fn.bind(vm), false);
    }
  }


  isDirective(attr) {
    return attr.indexOf('k-') == 0;
  }

  isEventDirective(dir) {
    return dir.indexOf('@') === 0;
  }

  isElementNode(node) {
    return node.nodeType == 1;
  }

  isTextNode(node) {
    return node.nodeType == 3;
  }

  text(node, vm, exp) {
    this.update(node, vm, exp, 'text');
  }

  html(node, vm, exp) {
    this.update(node, vm, exp, 'html');
  }

  model(node, vm, exp) {
    this.update(node, vm, exp, 'model');
    let val = vm[exp];

    node.addEventListener('input', (e) => {
      let newVal = e.target.value;

      vm[exp] = newVal;

      val = newVal;
    })
  }

  update(node, vm, exp, dir) {
    let updaterFn = this[dir+ 'Updater'];
    updaterFn && updaterFn(node, vm[exp]);

    new Watch(vm, exp, function (value) {
      updaterFn && updaterFn(node, value);
    });
  }

  textUpdater(node, value) {
    console.log('----', node, value);
    node.textContent = value;
  }

  htmlUpdater(node, value) {
    console.log('++++', node, value);
    node.innerHTML = value;
  }

  modelUpdater(node, value) {
    console.log('====', node, value);
    node.value = value;
  }

}
