void function(){

  var h = require('virtual-hyperscript')
  var createElement = require('virtual-dom/vdom/create-element.js')
  var VNode = require('virtual-dom/vtree/vnode.js')
  var patch = require('virtual-dom/patch.js')
  var diff = require('virtual-dom/diff.js')
  var parseTags = require('./parse-tags.js')

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
console.log('a')
    return elem
  }


  function shouldUpdate(current, previous) {

    var cargs = current.args
    var pargs = previous.args

    // fast case for args is zero case.
    if (cargs.length === 0 && pargs.length === 0) {
      return false
    }

    if (cargs.length !== pargs.length) {
      return true
    }

    var max = cargs.length > pargs.length ? cargs.length : pargs.length

    for (var i = 0; i < max; i++) {
      if (cargs[i] !== pargs[i]) {
        return true
      }
    }

    return false
  }

  CanvasWidget.prototype.update = function(prev, elem){
console.log('x')
    if ( !shouldUpdate(this, previous) ) {
        this.vnode = previous.vnode
        return
    }
    var context = elem.getContext('2d')
//    var width = this.properties.width
//    var height = this.properties.height
console.log('z')

    context.clearRect(0, 0, width, height)

    this.children.forEach(function(child){
      if ( child.tagName === 'rect' ) {
        rect(context, child)
      } else if ( child.tagName === 'shape' ) {
        shape(context, child)
      }
    })

    var patches = diff(previous.vnode, this.vnode)
    patch(domNode, patches)
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
