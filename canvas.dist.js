!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.VCanvas=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
void function(){

  var h = _dereq_('virtual-hyperscript')
  var createElement = _dereq_('virtual-dom/vdom/create-element.js')
  var VNode = _dereq_('virtual-dom/vtree/vnode.js')
  var parseTags = _dereq_('./parse-tags.js')

  function CanvasWidget(properties, children){
    if ( !(this instanceof CanvasWidget) ) {
        return new CanvasWidget(paint, data)
    }

    this.properties = properties
    this.children = children
  }

  CanvasWidget.prototype.init = function(){
    var tree = h('canvas', this.properties)
    var elem = createElement(tree)
    this.update(null, elem)
    return elem
  }

  CanvasWidget.prototype.update = function(prev, elem){
    var context = elem.getContext('2d')
    var width = this.properties.width
    var height = this.properties.height

    context.clearRect(0, 0, width, height)

    this.children.forEach(function(child){
      if ( child.tagName === 'rect' ) {
        rect(context, child)
      } else if ( child.tagName === 'shape' ) {
        shape(context, child)
      }
    })
  }

  function gradient(ctx, p){
    var gradient = ctx.createLinearGradient(p.x0, p.y0, p.x1, p.y1)
    p.colorStops.forEach(function(s){
      gradient.addColorStop(s.offset, s.color)
    })
    return gradient
  }

  function style(ctx, p){
    return p.type == 'gradient'        ? gradient(ctx, p.value)
         : p.type == 'color'           ? p.value
         : /* otherwise */               '#000'
  }

  function shape(ctx, node){
    var p = node.properties
    ctx.save()
    ctx.beginPath()
    var first = p.points.shift()
    ctx.moveTo(first[0], first[1])
    p.points.forEach(function(point){
      ctx.lineTo(point[0], point[1])
    })
    ctx.closePath()
    node.children.forEach(function(d){
      ctx.save()
      var tagName = parseTags(d.tagName, d.properties)
      if ( tagName == 'fill' ) {
        ctx.fillStyle = style(ctx, d.properties)
        ctx.fill()
      } else if ( tagName = 'stroke' ) {
        ctx.lineWidth = d.properties.width || 1
        ctx.strokeStyle = style(ctx, d.properties)
        var offset = ctx.lineWidth % 2 ? 0.5 : 0
        ctx.stroke()
      }
      ctx.restore()
    })
    ctx.restore()
  }

  function rect(ctx, node){
    var p = node.properties
    var x = p.x, y = p.y, w = p.width, h = p.height

    node.children.forEach(function(d){
      ctx.save()
      var tagName = parseTags(d.tagName, d.properties)
      if ( tagName == 'fill' ) {
        ctx.fillStyle = style(ctx, d.properties)
        ctx.fillRect(x, y, w, h)
      } else if ( tagName = 'stroke' ) {
        ctx.lineWidth = d.properties.width || 1
        ctx.strokeStyle = style(ctx, d.properties)
        var offset = ctx.lineWidth % 2 ? 0.5 : 0
        ctx.strokeRect(x - offset, y - offset, w + offset * 2, h + offset * 2)
      }
      ctx.restore()
    })
  }

  function canvas(tag, properties, children){
    var tagName = parseTags(tag, properties)
    return tagName === 'canvas' ? (new CanvasWidget(properties, children))
         : /* else */             (new VNode(tagName, properties, children))
  }

  module.exports = canvas

}()

},{"./parse-tags.js":28,"virtual-dom/vdom/create-element.js":5,"virtual-dom/vtree/vnode.js":11,"virtual-hyperscript":14}],2:[function(_dereq_,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = _dereq_('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"min-document":29}],3:[function(_dereq_,module,exports){
module.exports = isObject

function isObject(x) {
    return typeof x === "object" && x !== null
}

},{}],4:[function(_dereq_,module,exports){
var isObject = _dereq_("is-object")

var isHook = _dereq_("../vtree/is-vhook")

module.exports = applyProperties

function applyProperties(node, props, previous) {
    for (var propName in props) {
        var propValue = props[propName]

        if (isHook(propValue)) {
            propValue.hook(node,
                propName,
                previous ? previous[propName] : undefined)
        } else {
            if (isObject(propValue)) {
                if (!isObject(node[propName])) {
                    node[propName] = {}
                }

                for (var k in propValue) {
                    node[propName][k] = propValue[k]
                }
            } else if (propValue !== undefined) {
                node[propName] = propValue
            }
        }
    }
}

},{"../vtree/is-vhook":6,"is-object":3}],5:[function(_dereq_,module,exports){
var document = _dereq_("global/document")

var applyProperties = _dereq_("./apply-properties")

var isVNode = _dereq_("../vtree/is-vnode")
var isVText = _dereq_("../vtree/is-vtext")
var isWidget = _dereq_("../vtree/is-widget")

module.exports = createElement

function createElement(vnode, opts) {
    var doc = opts ? opts.document || document : document
    var warn = opts ? opts.warn : null

    if (isWidget(vnode)) {
        return vnode.init()
    } else if (isVText(vnode)) {
        return doc.createTextNode(vnode.text)
    } else if (!isVNode(vnode)) {
        if (warn) {
            warn("Item is not a valid virtual dom node", vnode)
        }
        return null
    }

    var node = (vnode.namespace === null) ?
        doc.createElement(vnode.tagName) :
        doc.createElementNS(vnode.namespace, vnode.tagName)

    var props = vnode.properties
    applyProperties(node, props)

    var children = vnode.children

    for (var i = 0; i < children.length; i++) {
        var childNode = createElement(children[i], opts)
        if (childNode) {
            node.appendChild(childNode)
        }
    }

    return node
}

},{"../vtree/is-vnode":7,"../vtree/is-vtext":8,"../vtree/is-widget":9,"./apply-properties":4,"global/document":2}],6:[function(_dereq_,module,exports){
module.exports = isHook

function isHook(hook) {
    return hook && typeof hook.hook === "function" &&
        !hook.hasOwnProperty("hook")
}

},{}],7:[function(_dereq_,module,exports){
var version = _dereq_("./version")

module.exports = isVirtualNode

function isVirtualNode(x) {
    return x && x.type === "VirtualNode" && x.version === version
}

},{"./version":10}],8:[function(_dereq_,module,exports){
var version = _dereq_("./version")

module.exports = isVirtualText

function isVirtualText(x) {
    return x && x.type === "VirtualText" && x.version === version
}

},{"./version":10}],9:[function(_dereq_,module,exports){
module.exports = isWidget

function isWidget(w) {
    return w && w.type === "Widget"
}

},{}],10:[function(_dereq_,module,exports){
module.exports = "1"

},{}],11:[function(_dereq_,module,exports){
var version = _dereq_("./version")
var isVNode = _dereq_("./is-vnode")
var isWidget = _dereq_("./is-widget")
var isVHook = _dereq_("./is-vhook")

module.exports = VirtualNode

var noProperties = {}
var noChildren = []

function VirtualNode(tagName, properties, children, key, namespace) {
    this.tagName = tagName
    this.properties = properties || noProperties
    this.children = children || noChildren
    this.key = key != null ? String(key) : undefined
    this.namespace = (typeof namespace === "string") ? namespace : null

    var count = (children && children.length) || 0
    var descendants = 0
    var hasWidgets = false
    var descendantHooks = false
    var hooks

    for (var propName in properties) {
        if (properties.hasOwnProperty(propName)) {
            var property = properties[propName]
            if (isVHook(property)) {
                if (!hooks) {
                    hooks = {}
                }

                hooks[propName] = property
            }
        }
    }

    for (var i = 0; i < count; i++) {
        var child = children[i]
        if (isVNode(child)) {
            descendants += child.count || 0

            if (!hasWidgets && child.hasWidgets) {
                hasWidgets = true
            }

            if (!descendantHooks && (child.hooks || child.descendantHooks)) {
                descendantHooks = true
            }
        } else if (!hasWidgets && isWidget(child)) {
            if (typeof child.destroy === "function") {
                hasWidgets = true
            }
        }
    }

    this.count = count + descendants
    this.hasWidgets = hasWidgets
    this.hooks = hooks
    this.descendantHooks = descendantHooks
}

VirtualNode.prototype.version = version
VirtualNode.prototype.type = "VirtualNode"

},{"./is-vhook":6,"./is-vnode":7,"./is-widget":9,"./version":10}],12:[function(_dereq_,module,exports){
var DataSet = _dereq_("data-set")

module.exports = DataSetHook;

function DataSetHook(value) {
    if (!(this instanceof DataSetHook)) {
        return new DataSetHook(value);
    }

    this.value = value;
}

DataSetHook.prototype.hook = function (node, propertyName) {
    var ds = DataSet(node)
    var propName = propertyName.substr(5)

    ds[propName] = this.value;
};

},{"data-set":16}],13:[function(_dereq_,module,exports){
module.exports = SoftSetHook;

function SoftSetHook(value) {
    if (!(this instanceof SoftSetHook)) {
        return new SoftSetHook(value);
    }

    this.value = value;
}

SoftSetHook.prototype.hook = function (node, propertyName) {
    if (node[propertyName] !== this.value) {
        node[propertyName] = this.value;
    }
};

},{}],14:[function(_dereq_,module,exports){
var VNode = _dereq_("virtual-dom/vtree/vnode.js")
var VText = _dereq_("virtual-dom/vtree/vtext.js")
var isVNode = _dereq_("virtual-dom/vtree/is-vnode")
var isVText = _dereq_("virtual-dom/vtree/is-vtext")
var isWidget = _dereq_("virtual-dom/vtree/is-widget")
var isHook = _dereq_("virtual-dom/vtree/is-vhook")

var parseTag = _dereq_("./parse-tag.js")
var softSetHook = _dereq_("./hooks/soft-set-hook.js")
var dataSetHook = _dereq_("./hooks/data-set-hook.js")

module.exports = h

function h(tagName, properties, children) {
    var childNodes = []
    var tag, props, key, namespace

    if (!children && isChildren(properties)) {
        children = properties
        props = {}
    }

    props = props || properties || {}
    tag = parseTag(tagName, props)

    if (children) {
        addChild(children, childNodes)
    }

    // support keys
    if ("key" in props) {
        key = props.key
        props.key = undefined
    }

    // support namespace
    if ("namespace" in props) {
        namespace = props.namespace
        props.namespace = undefined
    }

    // fix cursor bug
    if (tag === "input" &&
        "value" in props &&
        props.value !== undefined &&
        !isHook(props.value)
    ) {
        props.value = softSetHook(props.value)
    }

    // add data-set support
    var keys = Object.keys(props)
    for (var j = 0; j < keys.length; j++) {
        var propName = keys[j]
        var value = props[propName]
        if (!isHook(value) && propName.substr(0, 5) === "data-") {
            props[propName] = dataSetHook(value)
        }
    }

    return new VNode(tag, props, childNodes, key, namespace)
}

function addChild(c, childNodes) {
    if (typeof c === "string") {
        childNodes.push(new VText(c))
    } else if (isChild(c)) {
        childNodes.push(c)
    } else if (Array.isArray(c)) {
        for (var i = 0; i < c.length; i++) {
            addChild(c[i], childNodes)
        }
    }
}

function isChild(x) {
    return isVNode(x) || isVText(x) || isWidget(x)
}

function isChildren(x) {
    return typeof x === "string" || Array.isArray(x)
}

},{"./hooks/data-set-hook.js":12,"./hooks/soft-set-hook.js":13,"./parse-tag.js":27,"virtual-dom/vtree/is-vhook":20,"virtual-dom/vtree/is-vnode":21,"virtual-dom/vtree/is-vtext":22,"virtual-dom/vtree/is-widget":23,"virtual-dom/vtree/vnode.js":25,"virtual-dom/vtree/vtext.js":26}],15:[function(_dereq_,module,exports){
module.exports = createHash

function createHash(elem) {
    var attributes = elem.attributes
    var hash = {}

    if (attributes === null || attributes === undefined) {
        return hash
    }

    for (var i = 0; i < attributes.length; i++) {
        var attr = attributes[i]

        if (attr.name.substr(0,5) !== "data-") {
            continue
        }

        hash[attr.name.substr(5)] = attr.value
    }

    return hash
}

},{}],16:[function(_dereq_,module,exports){
var createStore = _dereq_("weakmap-shim/create-store")
var Individual = _dereq_("individual")

var createHash = _dereq_("./create-hash.js")

var hashStore = Individual("__DATA_SET_WEAKMAP@3", createStore())

module.exports = DataSet

function DataSet(elem) {
    var store = hashStore(elem)

    if (!store.hash) {
        store.hash = createHash(elem)
    }

    return store.hash
}

},{"./create-hash.js":15,"individual":17,"weakmap-shim/create-store":18}],17:[function(_dereq_,module,exports){
(function (global){
var root = typeof window !== 'undefined' ?
    window : typeof global !== 'undefined' ?
    global : {};

module.exports = Individual

function Individual(key, value) {
    if (root[key]) {
        return root[key]
    }

    Object.defineProperty(root, key, {
        value: value
        , configurable: true
    })

    return value
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],18:[function(_dereq_,module,exports){
var hiddenStore = _dereq_('./hidden-store.js');

module.exports = createStore;

function createStore() {
    var key = {};

    return function (obj) {
        if (typeof obj !== 'object' || obj === null) {
            throw new Error('Weakmap-shim: Key must be object')
        }

        var store = obj.valueOf(key);
        return store && store.identity === key ?
            store : hiddenStore(obj, key);
    };
}

},{"./hidden-store.js":19}],19:[function(_dereq_,module,exports){
module.exports = hiddenStore;

function hiddenStore(obj, key) {
    var store = { identity: key };
    var valueOf = obj.valueOf;

    Object.defineProperty(obj, "valueOf", {
        value: function (value) {
            return value !== key ?
                valueOf.apply(this, arguments) : store;
        },
        writable: true
    });

    return store;
}

},{}],20:[function(_dereq_,module,exports){
module.exports=_dereq_(6)
},{}],21:[function(_dereq_,module,exports){
var version = _dereq_("./version")

module.exports = isVirtualNode

function isVirtualNode(x) {
    if (!x) {
        return false;
    }

    return x.type === "VirtualNode" && x.version === version
}

},{"./version":24}],22:[function(_dereq_,module,exports){
var version = _dereq_("./version")

module.exports = isVirtualText

function isVirtualText(x) {
    if (!x) {
        return false;
    }

    return x.type === "VirtualText" && x.version === version
}

},{"./version":24}],23:[function(_dereq_,module,exports){
module.exports = isWidget

function isWidget(w) {
    return w && typeof w.init === "function" && typeof w.update === "function"
}

},{}],24:[function(_dereq_,module,exports){
module.exports=_dereq_(10)
},{}],25:[function(_dereq_,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"./is-vhook":20,"./is-vnode":21,"./is-widget":23,"./version":24}],26:[function(_dereq_,module,exports){
var version = _dereq_("./version")

module.exports = VirtualText

function VirtualText(text) {
    this.text = String(text)
}

VirtualText.prototype.version = version
VirtualText.prototype.type = "VirtualText"

},{"./version":24}],27:[function(_dereq_,module,exports){
var classIdSplit = /([\.#]?[a-zA-Z0-9_:-]+)/
var notClassId = /^\.|#/

module.exports = parseTag

function parseTag(tag, props) {
    if (!tag) {
        return "div"
    }

    var noId = !("id" in props)

    var tagParts = tag.split(classIdSplit)
    var tagName = null

    if (notClassId.test(tagParts[1])) {
        tagName = "div"
    }

    var classes, part, type, i
    for (i = 0; i < tagParts.length; i++) {
        part = tagParts[i]

        if (!part) {
            continue
        }

        type = part.charAt(0)

        if (!tagName) {
            tagName = part
        } else if (type === ".") {
            classes = classes || []
            classes.push(part.substring(1, part.length))
        } else if (type === "#" && noId) {
            props.id = part.substring(1, part.length)
        }
    }

    if (classes) {
        if (props.className) {
            classes.push(props.className)
        }

        props.className = classes.join(" ")
    }

    return tagName ? tagName.toLowerCase() : "div"
}

},{}],28:[function(_dereq_,module,exports){
void function(){
  var classIdSplit = /([\.#]?[a-zA-Z0-9_:-]+)/
  var notClassId = /^\.|#/

  module.exports = parseTag

  function parseTag(tag, props) {
      if (!tag) {
          return "div"
      }

      var noId = !("id" in props)

      var tagParts = tag.split(classIdSplit)
      var tagName = null

      if (notClassId.test(tagParts[1])) {
          tagName = "div"
      }

      var classes, part, type, i
      for (i = 0; i < tagParts.length; i++) {
          part = tagParts[i]

          if (!part) {
              continue
          }

          type = part.charAt(0)

          if (!tagName) {
              tagName = part
          } else if (type === ".") {
              classes = classes || []
              classes.push(part.substring(1, part.length))
          } else if (type === "#" && noId) {
              props.id = part.substring(1, part.length)
          }
      }

      if (classes) {
          if (props.className) {
              classes.push(props.className)
          }

          props.className = classes.join(" ")
      }

      return tagName ? tagName.toLowerCase() : "div"
  }
}()

},{}],29:[function(_dereq_,module,exports){

},{}]},{},[1])
(1)
});