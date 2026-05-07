import Tool from '../DevTools/Tool'
import defInfo from './defInfo'
import each from 'licia/each'
import isFn from 'licia/isFn'
import isUndef from 'licia/isUndef'
import cloneDeep from 'licia/cloneDeep'
import evalCss from '../lib/evalCss'
import map from 'licia/map'
import escape from 'licia/escape'
import copy from 'licia/copy'
import $ from 'licia/$'
import { classPrefix as c } from '../lib/util'

export default class Info extends Tool {
  constructor() {
    super()

    this._style = evalCss(require('./Info.scss'))

    this.name = 'info'
    this.title = '系统信息'
    this._infos = []
  }
  init($el, container) {
    super.init($el)
    this._container = container

    this._addDefInfo()
    this._bindEvent()
  }
  destroy() {
    super.destroy()

    evalCss.remove(this._style)
  }
  add(name, val) {
    const infos = this._infos
    let isUpdate = false

    each(infos, (info) => {
      if (name !== info.name) return

      info.val = val
      isUpdate = true
    })

    if (!isUpdate) infos.push({ name, val })

    this._render()

    return this
  }
  get(name) {
    const infos = this._infos

    if (isUndef(name)) {
      return cloneDeep(infos)
    }

    let result

    each(infos, (info) => {
      if (name === info.name) result = info.val
    })

    return result
  }
  remove(name) {
    const infos = this._infos

    for (let i = infos.length - 1; i >= 0; i--) {
      if (infos[i].name === name) infos.splice(i, 1)
    }

    this._render()

    return this
  }
  clear() {
    this._infos = []

    this._render()

    return this
  }
  _addDefInfo() {
    each(defInfo, (info) => this.add(info.name, info.val))
  }
  _render() {
    const infos = []

    each(this._infos, ({ name, val }) => {
      if (isFn(val)) val = val()

      infos.push({ name, val })
    })

    const html = `<ul>${map(
      infos,
      (info) =>
        `<li><h2 class="${c('title')}">${escape(info.name)}<span class="${c(
          'icon-copy copy'
        )}"></span></h2><div class="${c('content')}">${info.val}</div></li>`
    ).join('')}</ul>`

    this._renderHtml(html)
  }
  _bindEvent() {
    const container = this._container

    this._$el.on('click', c('.copy'), function () {
      const $li = $(this).parent().parent()
      const name = $li.find(c('.title')).text()
      const content = $li.find(c('.content')).text()
      copy(`${name}: ${content}`)
      container.notify('Copied', { icon: 'success' })
    })
  }
  _renderHtml(html) {
    if (html === this._lastHtml) return
    this._lastHtml = html
    this._$el.html(html)
  }
}
