!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.VCanvas=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
module.exports = canvas

var equal = _dereq_('deep-equal')
var h = _dereq_('virtual-hyperscript')
var createElement = _dereq_('virtual-dom/vdom/create-element.js')
var VNode = _dereq_('virtual-dom/vtree/vnode.js')
var patch = _dereq_('virtual-dom/patch.js')
var diff = _dereq_('virtual-dom/diff.js')
var parseTags = _dereq_('./parse-tags.js')

function CanvasWidget(properties, children){
  if ( !(this instanceof CanvasWidget) ) {
      return new CanvasWidget(paint, data)
  }

  this.properties = properties
  this.children = children
}

CanvasWidget.prototype.init = function(){
  this.vnode = h('canvas', this.properties)
  var elem = createElement(this.vnode)
  this.update(null, elem)
  return elem
}

CanvasWidget.prototype.update = function(prev, elem){

  if ( prev ) {
    if ( ! equal(prev.properties, this.properties) ) {
      this.vnode = h('canvas', this.properties)
      var patches = diff(prev.vnode, this.vnode)

      patch(elem, patches)
    } else if ( equal(prev.children, this.children) ) {
      this.vnode = prev.vnode
      return
    }
  }

  render(this, elem)
}

function render(vcanvas, elem){
  var context = elem.getContext('2d')
  var width = vcanvas.properties.width
  var height = vcanvas.properties.height

  context.clearRect(0, 0, width, height)

  vcanvas.children.forEach(function(child){
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



},{"./parse-tags.js":42,"deep-equal":2,"virtual-dom/diff.js":5,"virtual-dom/patch.js":9,"virtual-dom/vdom/create-element.js":11,"virtual-dom/vtree/vnode.js":23,"virtual-hyperscript":28}],2:[function(_dereq_,module,exports){
var pSlice = Array.prototype.slice;
var objectKeys = _dereq_('./lib/keys.js');
var isArguments = _dereq_('./lib/is_arguments.js');

var deepEqual = module.exports = function (actual, expected, opts) {
  if (!opts) opts = {};
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (typeof actual != 'object' && typeof expected != 'object') {
    return opts.strict ? actual === expected : actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected, opts);
  }
}

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isBuffer (x) {
  if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
    return false;
  }
  if (x.length > 0 && typeof x[0] !== 'number') return false;
  return true;
}

function objEquiv(a, b, opts) {
  var i, key;
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return deepEqual(a, b, opts);
  }
  if (isBuffer(a)) {
    if (!isBuffer(b)) {
      return false;
    }
    if (a.length !== b.length) return false;
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b);
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key], opts)) return false;
  }
  return true;
}

},{"./lib/is_arguments.js":3,"./lib/keys.js":4}],3:[function(_dereq_,module,exports){
var supportsArgumentsClass = (function(){
  return Object.prototype.toString.call(arguments)
})() == '[object Arguments]';

exports = module.exports = supportsArgumentsClass ? supported : unsupported;

exports.supported = supported;
function supported(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
};

exports.unsupported = unsupported;
function unsupported(object){
  return object &&
    typeof object == 'object' &&
    typeof object.length == 'number' &&
    Object.prototype.hasOwnProperty.call(object, 'callee') &&
    !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||
    false;
};

},{}],4:[function(_dereq_,module,exports){
exports = module.exports = typeof Object.keys === 'function'
  ? Object.keys : shim;

exports.shim = shim;
function shim (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}

},{}],5:[function(_dereq_,module,exports){
var diff = _dereq_("./vtree/diff")

module.exports = diff

},{"./vtree/diff":16}],6:[function(_dereq_,module,exports){
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
},{"min-document":43}],7:[function(_dereq_,module,exports){
module.exports = isObject

function isObject(x) {
    return typeof x === "object" && x !== null
}

},{}],8:[function(_dereq_,module,exports){
var nativeIsArray = Array.isArray
var toString = Object.prototype.toString

module.exports = nativeIsArray || isArray

function isArray(obj) {
    return toString.call(obj) === "[object Array]"
}

},{}],9:[function(_dereq_,module,exports){
var patch = _dereq_("./vdom/patch")

module.exports = patch

},{"./vdom/patch":14}],10:[function(_dereq_,module,exports){
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

},{"../vtree/is-vhook":18,"is-object":7}],11:[function(_dereq_,module,exports){
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

},{"../vtree/is-vnode":19,"../vtree/is-vtext":20,"../vtree/is-widget":21,"./apply-properties":10,"global/document":6}],12:[function(_dereq_,module,exports){
// Maps a virtual DOM tree onto a real DOM tree in an efficient manner.
// We don't want to read all of the DOM nodes in the tree so we use
// the in-order tree indexing to eliminate recursion down certain branches.
// We only recurse into a DOM node if we know that it contains a child of
// interest.

var noChild = {}

module.exports = domIndex

function domIndex(rootNode, tree, indices, nodes) {
    if (!indices || indices.length === 0) {
        return {}
    } else {
        indices.sort(ascending)
        return recurse(rootNode, tree, indices, nodes, 0)
    }
}

function recurse(rootNode, tree, indices, nodes, rootIndex) {
    nodes = nodes || {}


    if (rootNode) {
        if (indexInRange(indices, rootIndex, rootIndex)) {
            nodes[rootIndex] = rootNode
        }

        var vChildren = tree.children

        if (vChildren) {

            var childNodes = rootNode.childNodes

            for (var i = 0; i < tree.children.length; i++) {
                rootIndex += 1

                var vChild = vChildren[i] || noChild
                var nextIndex = rootIndex + (vChild.count || 0)

                // skip recursion down the tree if there are no nodes down here
                if (indexInRange(indices, rootIndex, nextIndex)) {
                    recurse(childNodes[i], vChild, indices, nodes, rootIndex)
                }

                rootIndex = nextIndex
            }
        }
    }

    return nodes
}

// Binary search for an index in the interval [left, right]
function indexInRange(indices, left, right) {
    if (indices.length === 0) {
        return false
    }

    var minIndex = 0
    var maxIndex = indices.length - 1
    var currentIndex
    var currentItem

    while (minIndex <= maxIndex) {
        currentIndex = ((maxIndex + minIndex) / 2) >> 0
        currentItem = indices[currentIndex]

        if (minIndex === maxIndex) {
            return currentItem >= left && currentItem <= right
        } else if (currentItem < left) {
            minIndex = currentIndex + 1
        } else  if (currentItem > right) {
            maxIndex = currentIndex - 1
        } else {
            return true
        }
    }

    return false;
}

function ascending(a, b) {
    return a > b ? 1 : -1
}

},{}],13:[function(_dereq_,module,exports){
var applyProperties = _dereq_("./apply-properties")

var isWidget = _dereq_("../vtree/is-widget")
var VPatch = _dereq_("../vtree/vpatch")

var render = _dereq_("./create-element")
var updateWidget = _dereq_("./update-widget")

module.exports = applyPatch

function applyPatch(vpatch, domNode, renderOptions) {
    var type = vpatch.type
    var vNode = vpatch.vNode
    var patch = vpatch.patch

    switch (type) {
        case VPatch.REMOVE:
            return removeNode(domNode, vNode)
        case VPatch.INSERT:
            return insertNode(domNode, patch, renderOptions)
        case VPatch.VTEXT:
            return stringPatch(domNode, vNode, patch, renderOptions)
        case VPatch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
        case VPatch.VNODE:
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case VPatch.ORDER:
            reorderChildren(domNode, patch)
            return domNode
        case VPatch.PROPS:
            applyProperties(domNode, patch, vNode.propeties)
            return domNode
        default:
            return domNode
    }
}

function removeNode(domNode, vNode) {
    var parentNode = domNode.parentNode

    if (parentNode) {
        parentNode.removeChild(domNode)
    }

    destroyWidget(domNode, vNode);

    return null
}

function insertNode(parentNode, vNode, renderOptions) {
    var newNode = render(vNode, renderOptions)

    if (parentNode) {
        parentNode.appendChild(newNode)
    }

    return parentNode
}

function stringPatch(domNode, leftVNode, vText, renderOptions) {
    var newNode

    if (domNode.nodeType === 3) {
        domNode.replaceData(0, domNode.length, vText.text)
        newNode = domNode
    } else {
        var parentNode = domNode.parentNode
        newNode = render(vText, renderOptions)

        if (parentNode) {
            parentNode.replaceChild(newNode, domNode)
        }
    }

    destroyWidget(domNode, leftVNode)

    return newNode
}

function widgetPatch(domNode, leftVNode, widget, renderOptions) {
    if (updateWidget(leftVNode, widget)) {
        return widget.update(leftVNode, domNode) || domNode
    }

    var parentNode = domNode.parentNode
    var newWidget = render(widget, renderOptions)

    if (parentNode) {
        parentNode.replaceChild(newWidget, domNode)
    }

    destroyWidget(domNode, leftVNode)

    return newWidget
}

function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
    var parentNode = domNode.parentNode
    var newNode = render(vNode, renderOptions)

    if (parentNode) {
        parentNode.replaceChild(newNode, domNode)
    }

    destroyWidget(domNode, leftVNode)

    return newNode
}

function destroyWidget(domNode, w) {
    if (typeof w.destroy === "function" && isWidget(w)) {
        w.destroy(domNode)
    }
}

function reorderChildren(domNode, bIndex) {
    var children = []
    var childNodes = domNode.childNodes
    var len = childNodes.length
    var i

    for (i = 0; i < len; i++) {
        children.push(domNode.childNodes[i])
    }

    for (i = 0; i < len; i++) {
        var move = bIndex[i]
        if (move !== undefined) {
            var node = children[move]
            domNode.removeChild(node)
            domNode.insertBefore(node, childNodes[i])
        }
    }
}

},{"../vtree/is-widget":21,"../vtree/vpatch":24,"./apply-properties":10,"./create-element":11,"./update-widget":15}],14:[function(_dereq_,module,exports){
var document = _dereq_("global/document")
var isArray = _dereq_("x-is-array")

var domIndex = _dereq_("./dom-index")
var patchOp = _dereq_("./patch-op")

module.exports = patch

function patch(rootNode, patches) {
    var indices = patchIndices(patches)

    if (indices.length === 0) {
        return rootNode
    }

    var index = domIndex(rootNode, patches.a, indices)
    var ownerDocument = rootNode.ownerDocument
    var renderOptions

    if (ownerDocument !== document) {
        renderOptions = {
            document: ownerDocument
        }
    }

    for (var i = 0; i < indices.length; i++) {
        var nodeIndex = indices[i]
        rootNode = applyPatch(rootNode,
            index[nodeIndex],
            patches[nodeIndex],
            renderOptions)
    }

    return rootNode
}

function applyPatch(rootNode, domNode, patchList, renderOptions) {
    if (!domNode) {
        return rootNode
    }

    var newNode

    if (isArray(patchList)) {
        for (var i = 0; i < patchList.length; i++) {
            newNode = patchOp(patchList[i], domNode, renderOptions)

            if (domNode === rootNode) {
                rootNode = newNode
            }
        }
    } else {
        newNode = patchOp(patchList, domNode, renderOptions)

        if (domNode === rootNode) {
            rootNode = newNode
        }
    }

    return rootNode
}

function patchIndices(patches) {
    var indices = []

    for (var key in patches) {
        if (key !== "a") {
            indices.push(Number(key))
        }
    }

    return indices
}

},{"./dom-index":12,"./patch-op":13,"global/document":6,"x-is-array":8}],15:[function(_dereq_,module,exports){
var isWidget = _dereq_("../vtree/is-widget")

module.exports = updateWidget

function updateWidget(a, b) {
    if (isWidget(a) && isWidget(b)) {
        if ("name" in a && "name" in b) {
            return a.id === b.id
        } else {
            return a.init === b.init
        }
    }

    return false
}

},{"../vtree/is-widget":21}],16:[function(_dereq_,module,exports){
var isArray = _dereq_("x-is-array")
var isObject = _dereq_("is-object")

var VPatch = _dereq_("./vpatch")
var isVNode = _dereq_("./is-vnode")
var isVText = _dereq_("./is-vtext")
var isWidget = _dereq_("./is-widget")
var isThunk = _dereq_("./is-thunk")

module.exports = diff

function diff(a, b) {
    var patch = { a: a }
    walk(a, b, patch, 0)
    return patch
}

function walk(a, b, patch, index) {
    if (isThunk(b)) {
        if (isThunk(a)) {
            b = b.vnode = b.render(a)
            a = a.vnode
        } else {
            b = b.vnode = b.render(null)
        }
    }

    if (a === b) {
        hooks(b, patch, index)
        return
    }

    var apply = patch[index]

    if (b == null) {
        apply = appendPatch(apply, new VPatch(VPatch.REMOVE, a, b))
        destroyWidgets(a, patch, index)
    } else if (isVNode(b)) {
        if (isVNode(a)) {
            if (a.tagName === b.tagName &&
                a.namespace === b.namespace &&
                a.key === b.key) {
                var propsPatch = diffProps(a.properties, b.properties, b.hooks)
                if (propsPatch) {
                    apply = appendPatch(apply,
                        new VPatch(VPatch.PROPS, a, propsPatch))
                }
            } else {
                apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
                destroyWidgets(a, patch, index)
            }

            apply = diffChildren(a, b, patch, apply, index)
        } else {
            apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
            destroyWidgets(a, patch, index)
        }
    } else if (isVText(b)) {
        if (!isVText(a)) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
            destroyWidgets(a, patch, index)
        } else if (a.text !== b.text) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
        }
    } else if (isWidget(b)) {
        apply = appendPatch(apply, new VPatch(VPatch.WIDGET, a, b))

        if (!isWidget(a)) {
            destroyWidgets(a, patch, index)
        }
    }

    if (apply) {
        patch[index] = apply
    }
}

function diffProps(a, b, hooks) {
    var diff

    for (var aKey in a) {
        if (!(aKey in b)) {
            continue
        }

        var aValue = a[aKey]
        var bValue = b[aKey]

        if (hooks && aKey in hooks) {
            diff = diff || {}
            diff[aKey] = bValue
        } else {
            if (isObject(aValue) && isObject(bValue)) {
                if (getPrototype(bValue) !== getPrototype(aValue)) {
                    diff = diff || {}
                    diff[aKey] = bValue
                } else {
                    var objectDiff = diffProps(aValue, bValue)
                    if (objectDiff) {
                        diff = diff || {}
                        diff[aKey] = objectDiff
                    }
                }
            } else if (aValue !== bValue && bValue !== undefined) {
                diff = diff || {}
                diff[aKey] = bValue
            }
        }
    }

    for (var bKey in b) {
        if (!(bKey in a)) {
            diff = diff || {}
            diff[bKey] = b[bKey]
        }
    }

    return diff
}

function getPrototype(value) {
    if (Object.getPrototypeOf) {
        return Object.getPrototypeOf(value)
    } else if (value.__proto__) {
        return value.__proto__
    } else if (value.constructor) {
        return value.constructor.prototype
    }
}

function diffChildren(a, b, patch, apply, index) {
    var aChildren = a.children
    var bChildren = reorder(aChildren, b.children)

    var aLen = aChildren.length
    var bLen = bChildren.length
    var len = aLen > bLen ? aLen : bLen

    for (var i = 0; i < len; i++) {
        var leftNode = aChildren[i]
        var rightNode = bChildren[i]
        index += 1

        if (!leftNode) {
            if (rightNode) {
                // Excess nodes in b need to be added
                apply = appendPatch(apply, new VPatch(VPatch.INSERT, null, rightNode))
            }
        } else if (!rightNode) {
            if (leftNode) {
                // Excess nodes in a need to be removed
                patch[index] = new VPatch(VPatch.REMOVE, leftNode, null)
                destroyWidgets(leftNode, patch, index)
            }
        } else {
            walk(leftNode, rightNode, patch, index)
        }

        if (isVNode(leftNode) && leftNode.count) {
            index += leftNode.count
        }
    }

    if (bChildren.moves) {
        // Reorder nodes last
        apply = appendPatch(apply, new VPatch(VPatch.ORDER, a, bChildren.moves))
    }

    return apply
}

// Patch records for all destroyed widgets must be added because we need
// a DOM node reference for the destroy function
function destroyWidgets(vNode, patch, index) {
    if (isWidget(vNode)) {
        if (typeof vNode.destroy === "function") {
            patch[index] = new VPatch(VPatch.REMOVE, vNode, null)
        }
    } else if (isVNode(vNode) && vNode.hasWidgets) {
        var children = vNode.children
        var len = children.length
        for (var i = 0; i < len; i++) {
            var child = children[i]
            index += 1

            destroyWidgets(child, patch, index)

            if (isVNode(child) && child.count) {
                index += child.count
            }
        }
    }
}

// Execute hooks when two nodes are identical
function hooks(vNode, patch, index) {
    if (isVNode(vNode)) {
        if (vNode.hooks) {
            patch[index] = new VPatch(VPatch.PROPS, vNode.hooks, vNode.hooks)
        }

        if (vNode.descendantHooks) {
            var children = vNode.children
            var len = children.length
            for (var i = 0; i < len; i++) {
                var child = children[i]
                index += 1

                hooks(child, patch, index)

                if (isVNode(child) && child.count) {
                    index += child.count
                }
            }
        }
    }
}

// List diff, naive left to right reordering
function reorder(aChildren, bChildren) {

    var bKeys = keyIndex(bChildren)

    if (!bKeys) {
        return bChildren
    }

    var aKeys = keyIndex(aChildren)

    if (!aKeys) {
        return bChildren
    }

    var bMatch = {}, aMatch = {}

    for (var key in bKeys) {
        bMatch[bKeys[key]] = aKeys[key]
    }

    for (var key in aKeys) {
        aMatch[aKeys[key]] = bKeys[key]
    }

    var aLen = aChildren.length
    var bLen = bChildren.length
    var len = aLen > bLen ? aLen : bLen
    var shuffle = []
    var freeIndex = 0
    var i = 0
    var moveIndex = 0
    var moves = shuffle.moves = {}

    while (freeIndex < len) {
        var move = aMatch[i]
        if (move !== undefined) {
            shuffle[i] = bChildren[move]
            moves[move] = moveIndex++
        } else if (i in aMatch) {
            shuffle[i] = undefined
            moves[move] = moveIndex++
        } else {
            while (bMatch[freeIndex] !== undefined) {
                freeIndex++
            }

            if (freeIndex < len) {
                var freeChild = bChildren[freeIndex]
                if (freeChild) {
                    moves[freeIndex] = moveIndex++
                    shuffle[i] = freeChild
                }
                freeIndex++
            }
        }
        i++
    }

    return shuffle
}

function keyIndex(children) {
    var i, keys

    for (i = 0; i < children.length; i++) {
        var child = children[i]

        if (child.key !== undefined) {
            keys = keys || {}
            keys[child.key] = i
        }
    }

    return keys
}

function appendPatch(apply, patch) {
    if (apply) {
        if (isArray(apply)) {
            apply.push(patch)
        } else {
            apply = [apply, patch]
        }

        return apply
    } else {
        return patch
    }
}

},{"./is-thunk":17,"./is-vnode":19,"./is-vtext":20,"./is-widget":21,"./vpatch":24,"is-object":7,"x-is-array":8}],17:[function(_dereq_,module,exports){
module.exports = isThunk

function isThunk(t) {
    return t && t.type === "Thunk"
}

},{}],18:[function(_dereq_,module,exports){
module.exports = isHook

function isHook(hook) {
    return hook && typeof hook.hook === "function" &&
        !hook.hasOwnProperty("hook")
}

},{}],19:[function(_dereq_,module,exports){
var version = _dereq_("./version")

module.exports = isVirtualNode

function isVirtualNode(x) {
    return x && x.type === "VirtualNode" && x.version === version
}

},{"./version":22}],20:[function(_dereq_,module,exports){
var version = _dereq_("./version")

module.exports = isVirtualText

function isVirtualText(x) {
    return x && x.type === "VirtualText" && x.version === version
}

},{"./version":22}],21:[function(_dereq_,module,exports){
module.exports = isWidget

function isWidget(w) {
    return w && w.type === "Widget"
}

},{}],22:[function(_dereq_,module,exports){
module.exports = "1"

},{}],23:[function(_dereq_,module,exports){
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

},{"./is-vhook":18,"./is-vnode":19,"./is-widget":21,"./version":22}],24:[function(_dereq_,module,exports){
var version = _dereq_("./version")

VirtualPatch.NONE = 0
VirtualPatch.VTEXT = 1
VirtualPatch.VNODE = 2
VirtualPatch.WIDGET = 3
VirtualPatch.PROPS = 4
VirtualPatch.ORDER = 5
VirtualPatch.INSERT = 6
VirtualPatch.REMOVE = 7

module.exports = VirtualPatch

function VirtualPatch(type, vNode, patch) {
    this.type = Number(type)
    this.vNode = vNode
    this.patch = patch
}

VirtualPatch.prototype.version = version.split(".")
VirtualPatch.prototype.type = "VirtualPatch"

},{"./version":22}],25:[function(_dereq_,module,exports){
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

},{"data-set":30}],26:[function(_dereq_,module,exports){
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
    var propName = propertyName.substr(3)

    ds[propName] = this.value;
};

},{"data-set":30}],27:[function(_dereq_,module,exports){
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

},{}],28:[function(_dereq_,module,exports){
var VNode = _dereq_("virtual-dom/vtree/vnode.js")
var VText = _dereq_("virtual-dom/vtree/vtext.js")
var isVNode = _dereq_("virtual-dom/vtree/is-vnode")
var isVText = _dereq_("virtual-dom/vtree/is-vtext")
var isWidget = _dereq_("virtual-dom/vtree/is-widget")
var isHook = _dereq_("virtual-dom/vtree/is-vhook")

var parseTag = _dereq_("./parse-tag.js")
var softSetHook = _dereq_("./hooks/soft-set-hook.js")
var dataSetHook = _dereq_("./hooks/data-set-hook.js")
var evHook = _dereq_("./hooks/ev-hook.js")

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

    var keys = Object.keys(props)
    var propName, value
    for (var j = 0; j < keys.length; j++) {
        propName = keys[j]
        value = props[propName]
        if (isHook(value)) {
            continue
        }

        // add data-foo support
        if (propName.substr(0, 5) === "data-") {
            props[propName] = dataSetHook(value)
        }

        // add ev-foo support
        if (propName.substr(0, 3) === "ev-") {
            props[propName] = evHook(value)
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
    return typeof x === "string" || Array.isArray(x) || isChild(x)
}

},{"./hooks/data-set-hook.js":25,"./hooks/ev-hook.js":26,"./hooks/soft-set-hook.js":27,"./parse-tag.js":41,"virtual-dom/vtree/is-vhook":34,"virtual-dom/vtree/is-vnode":35,"virtual-dom/vtree/is-vtext":36,"virtual-dom/vtree/is-widget":37,"virtual-dom/vtree/vnode.js":39,"virtual-dom/vtree/vtext.js":40}],29:[function(_dereq_,module,exports){
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

},{}],30:[function(_dereq_,module,exports){
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

},{"./create-hash.js":29,"individual":31,"weakmap-shim/create-store":32}],31:[function(_dereq_,module,exports){
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
},{}],32:[function(_dereq_,module,exports){
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

},{"./hidden-store.js":33}],33:[function(_dereq_,module,exports){
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

},{}],34:[function(_dereq_,module,exports){
module.exports=_dereq_(18)
},{}],35:[function(_dereq_,module,exports){
var version = _dereq_("./version")

module.exports = isVirtualNode

function isVirtualNode(x) {
    if (!x) {
        return false;
    }

    return x.type === "VirtualNode" && x.version === version
}

},{"./version":38}],36:[function(_dereq_,module,exports){
var version = _dereq_("./version")

module.exports = isVirtualText

function isVirtualText(x) {
    if (!x) {
        return false;
    }

    return x.type === "VirtualText" && x.version === version
}

},{"./version":38}],37:[function(_dereq_,module,exports){
module.exports = isWidget

function isWidget(w) {
    return w && typeof w.init === "function" && typeof w.update === "function"
}

},{}],38:[function(_dereq_,module,exports){
module.exports=_dereq_(22)
},{}],39:[function(_dereq_,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"./is-vhook":34,"./is-vnode":35,"./is-widget":37,"./version":38}],40:[function(_dereq_,module,exports){
var version = _dereq_("./version")

module.exports = VirtualText

function VirtualText(text) {
    this.text = String(text)
}

VirtualText.prototype.version = version
VirtualText.prototype.type = "VirtualText"

},{"./version":38}],41:[function(_dereq_,module,exports){
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

},{}],42:[function(_dereq_,module,exports){
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

},{}],43:[function(_dereq_,module,exports){

},{}]},{},[1])
(1)
});