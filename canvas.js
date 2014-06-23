module.exports = canvas

var equal = require('deep-equal')
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
    }
    if ( equal(prev.children, this.children) ) {
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
    } else if ( child.tagName === 'circle' ) {
      circle(context, child)
    } else if ( child.tagName === 'data' ) {
      data(context, child)
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
function circle(ctx, node){
  var p = node.properties
  ctx.save()
  ctx.beginPath()
  ctx.arc(p.x,p.y,p.r,0,Math.PI*2,true)
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

function handleData(array, data) {
  var i, j, ptr = 0, c
  if(array.shape.length === 3) {
    if(array.shape[2] === 3) {
      for(i=0; i<array.shape[0]; ++i) {
        for(j=0; j<array.shape[1]; ++j) {
          data[ptr++] = array.get(i,j,0)>>>0
          data[ptr++] = array.get(i,j,1)>>>0
          data[ptr++] = array.get(i,j,2)>>>0
          data[ptr++] = 255
        }
      }
    } else if(array.shape[2] === 4) {
      for(i=0; i<array.shape[0]; ++i) {
        for(j=0; j<array.shape[1]; ++j) {
          data[ptr++] = array.get(i,j,0)>>>0
          data[ptr++] = array.get(i,j,1)>>>0
          data[ptr++] = array.get(i,j,2)>>>0
          data[ptr++] = array.get(i,j,3)>>>0
        }
      }
    } else if(array.shape[3] === 1) {
      for(i=0; i<array.shape[0]; ++i) {
        for(j=0; j<array.shape[1]; ++j) {
          var c = array.get(i,j,0)>>>0
          data[ptr++] = c
          data[ptr++] = c
          data[ptr++] = c
          data[ptr++] = 255
        }
      }
    } else {
      return new Error("Incompatible array shape")
    }
  } else if(array.shape.length === 2) {
    for(i=0; i<array.shape[0]; ++i) {
      for(j=0; j<array.shape[1]; ++j) {
        var c = array.get(i,j,0)>>>0
        data[ptr++] = c
        data[ptr++] = c
        data[ptr++] = c
        data[ptr++] = 255
      }
    }
  } else {
    return new Error("Incompatible array shape")
  }
  return data
}



function data(ctx, node){
  var p = node.properties
  var imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
  var data = imageData.data
  data = handleData(p.array, data)
  if (typeof data === "Error") throw data
  ctx.putImageData(imageData, p.x, p.y)

}

function rect(ctx, node){
  var p = node.properties
  var x = p.x, y = p.y, w = p.width, h = p.height

  node.children.forEach(function(d){
    ctx.save()
    var tagName = parseTags(d.tagName, d.properties)
    if ( d.properties.value.compose ) {
      ctx.globalCompositeOperation = d.properties.value.compose
    }
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


