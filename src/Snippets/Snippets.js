import Tool from '../DevTools/Tool'
import defSnippets from './defSnippets'
import $ from 'licia/$'
import each from 'licia/each'
import escape from 'licia/escape'
import map from 'licia/map'
import remove from 'licia/remove'
import evalCss from '../lib/evalCss'
import { classPrefix as c } from '../lib/util'

export default class Snippets extends Tool {
  constructor() {
    super()

    this._style = evalCss(require('./Snippets.scss'))

    this.name = 'snippets'
    this.title = '插件'

    this._snippets = []
  }
  init($el) {
    super.init($el)

    this._bindEvent()
    this._addDefSnippets()
  }
  destroy() {
    super.destroy()

    evalCss.remove(this._style)
  }
  add(name, fn, desc) {
    this._snippets.push({ name, fn, desc })

    this._render()

    return this
  }
  remove(name) {
    remove(this._snippets, (snippet) => snippet.name === name)

    this._render()

    return this
  }
  run(name) {
    const snippets = this._snippets

    for (let i = 0, len = snippets.length; i < len; i++) {
      if (snippets[i].name === name) this._run(i)
    }

    return this
  }
  clear() {
    this._snippets = []
    this._render()

    return this
  }
  _bindEvent() {
    const self = this

    this._$el.on('click', '.eruda-run', function () {
      const idx = $(this).data('idx')

      self._run(idx)
    })
  }
  _run(idx) {
    this._snippets[idx].fn.call(null)
  }
  _addDefSnippets() {
    each(defSnippets, (snippet) => {
      this.add(snippet.name, snippet.fn, snippet.desc)
    })
  }
  _render() {
    const html = map(this._snippets, (snippet, idx) => {
      return `<div class="${c('section run')}" data-idx="${idx}">
        <h2 class="${c('name')}">${escape(snippet.name)}
          <div class="${c('btn')}">
            <span class="${c('icon-play')}"></span>
          </div>
        </h2>
        <div class="${c('description')}">
          ${escape(snippet.desc)}
        </div>
      </div>`
    }).join('')

    this._renderHtml(html)
  }
  _renderHtml(html) {
    if (html === this._lastHtml) return
    this._lastHtml = html
    this._$el.html(html)
  }
}
