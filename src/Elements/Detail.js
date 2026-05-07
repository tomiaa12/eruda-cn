import isEmpty from 'licia/isEmpty'
import lowerCase from 'licia/lowerCase'
import pick from 'licia/pick'
import toStr from 'licia/toStr'
import map from 'licia/map'
import isEl from 'licia/isEl'
import escape from 'licia/escape'
import startWith from 'licia/startWith'
import contain from 'licia/contain'
import unique from 'licia/unique'
import each from 'licia/each'
import keys from 'licia/keys'
import isNull from 'licia/isNull'
import trim from 'licia/trim'
import isFn from 'licia/isFn'
import isBool from 'licia/isBool'
import safeGet from 'licia/safeGet'
import $ from 'licia/$'
import h from 'licia/h'
import extend from 'licia/extend'
import MutationObserver from 'licia/MutationObserver'
import CssStore from './CssStore'
import Settings from '../Settings/Settings'
import LunaModal from 'luna-modal'
import LunaBoxModel from 'luna-box-model'
import chobitsu from '../lib/chobitsu'
import { formatNodeName } from './util'
import { isErudaEl, classPrefix as c } from '../lib/util'

export default class Detail {
  constructor($container, devtools) {
    this._$container = $container
    this._devtools = devtools
    this._curEl = document.documentElement
    this._initObserver()
    this._initCfg()
    this._initTpl()
    this._bindEvent()
  }
  show(el) {
    this._curEl = el
    this._rmDefComputedStyle = true
    this._computedStyleSearchKeyword = ''
    this._enableObserver()
    this._render()
    this._highlight()
  }
  hide = () => {
    this._$container.hide()
    this._disableObserver()
    chobitsu.domain('Overlay').hideHighlight()
  }
  destroy() {
    this._disableObserver()
    this.restoreEventTarget()
    this._rmCfg()
  }
  overrideEventTarget() {
    const winEventProto = getWinEventProto()

    const origAddEvent = (this._origAddEvent = winEventProto.addEventListener)
    const origRmEvent = (this._origRmEvent = winEventProto.removeEventListener)

    winEventProto.addEventListener = function (type, listener, useCapture) {
      addEvent(this, type, listener, useCapture)
      origAddEvent.apply(this, arguments)
    }

    winEventProto.removeEventListener = function (type, listener, useCapture) {
      rmEvent(this, type, listener, useCapture)
      origRmEvent.apply(this, arguments)
    }
  }
  restoreEventTarget() {
    const winEventProto = getWinEventProto()

    if (this._origAddEvent) winEventProto.addEventListener = this._origAddEvent
    if (this._origRmEvent) winEventProto.removeEventListener = this._origRmEvent
  }
  _highlight = (type) => {
    const el = this._curEl

    const highlightConfig = {
      showInfo: false,
    }
    if (!type || type === 'all') {
      extend(highlightConfig, {
        showInfo: true,
        contentColor: 'rgba(111, 168, 220, .66)',
        paddingColor: 'rgba(147, 196, 125, .55)',
        borderColor: 'rgba(255, 229, 153, .66)',
        marginColor: 'rgba(246, 178, 107, .66)',
      })
    } else if (type === 'margin') {
      highlightConfig.marginColor = 'rgba(246, 178, 107, .66)'
    } else if (type === 'border') {
      highlightConfig.borderColor = 'rgba(255, 229, 153, .66)'
    } else if (type === 'padding') {
      highlightConfig.paddingColor = 'rgba(147, 196, 125, .55)'
    } else if (type === 'content') {
      highlightConfig.contentColor = 'rgba(111, 168, 220, .66)'
    }

    const { nodeId } = chobitsu.domain('DOM').getNodeId({ node: el })
    chobitsu.domain('Overlay').highlightNode({
      nodeId,
      highlightConfig,
    })
  }
  _initTpl() {
    const $container = this._$container

    const html = `<div class="${c('control')}">
      <span class="${c('icon-left back')}"></span>
      <span class="${c('element-name')}"></span>
      <span class="${c('icon-refresh refresh')}"></span>
    </div>
    <div class="${c('element')}">
      <div class="${c('attributes section')}"></div>
      <div class="${c('styles section')}"></div>
      <div class="${c('computed-style section')}"></div>
      <div class="${c('listeners section')}"></div>
    </div>`

    $container.html(html)

    this._$elementName = $container.find(c('.element-name'))
    this._$attributes = $container.find(c('.attributes'))
    this._$styles = $container.find(c('.styles'))
    this._$listeners = $container.find(c('.listeners'))
    this._$computedStyle = $container.find(c('.computed-style'))

    const boxModelContainer = h('div')
    this._$boxModel = $(boxModelContainer)
    this._boxModel = new LunaBoxModel(boxModelContainer)
  }
  _toggleAllComputedStyle() {
    this._rmDefComputedStyle = !this._rmDefComputedStyle

    this._render()
  }
  _render() {
    const data = this._getData(this._curEl)
    const $attributes = this._$attributes
    const $elementName = this._$elementName
    const $styles = this._$styles
    const $computedStyle = this._$computedStyle
    const $listeners = this._$listeners

    $elementName.html(data.name)

    let attributes = '<tr><td>空</td></tr>'
    if (!isEmpty(data.attributes)) {
      attributes = map(data.attributes, ({ name, value }) => {
        return `<tr>
          <td class="${c('attribute-name-color')}">${escape(name)}</td>
          <td class="${c('string-color')}">${value}</td>
        </tr>`
      }).join('')
    }
    attributes = `<h2>属性</h2>
    <div class="${c('table-wrapper')}">
      <table>
        <tbody>
          ${attributes} 
        </tbody>
      </table>
    </div>`
    $attributes.html(attributes)

    let styles = ''
    if (!isEmpty(data.styles)) {
      const style = map(data.styles, ({ selectorText, style }) => {
        style = map(style, (val, key) => {
          return `<div class="${c('rule')}"><span>${escape(
            key
          )}</span>: ${val};</div>`
        }).join('')
        return `<div class="${c('style-rules')}">
          <div>${escape(selectorText)} {</div>
            ${style}
          <div>}</div>
        </div>`
      }).join('')
      styles = `<h2>样式</h2>
      <div class="${c('style-wrapper')}">
        ${style}
      </div>`
      $styles.html(styles).show()
    } else {
      $styles.hide()
    }

    let computedStyle = ''
    if (data.computedStyle) {
      let toggleButton = c(`<div class="btn toggle-all-computed-style">
        <span class="icon-expand"></span>
      </div>`)
      if (data.rmDefComputedStyle) {
        toggleButton = c(`<div class="btn toggle-all-computed-style">
          <span class="icon-compress"></span>
        </div>`)
      }

      computedStyle = `<h2>
        计算样式
        ${toggleButton}
        <div class="${c('btn computed-style-search')}">
          <span class="${c('icon-filter')}"></span>
        </div>
        ${
          data.computedStyleSearchKeyword
            ? `<div class="${c('btn filter-text')}">${escape(
                data.computedStyleSearchKeyword
              )}</div>`
            : ''
        }
      </h2>
      <div class="${c('box-model')}"></div>
      <div class="${c('table-wrapper')}">
        <table>
          <tbody>
          ${map(data.computedStyle, (val, key) => {
            return `<tr>
              <td class="${c('key')}">${escape(key)}</td>
              <td>${val}</td>
            </tr>`
          }).join('')}
          </tbody>
        </table>
      </div>`

      $computedStyle.html(computedStyle).show()
      this._boxModel.setOption('element', this._curEl)
      $computedStyle.find(c('.box-model')).append(this._$boxModel.get(0))
    } else {
      $computedStyle.text('').hide()
    }

    let listeners = ''
    if (data.listeners) {
      listeners = map(data.listeners, (listeners, key) => {
        listeners = map(listeners, ({ useCapture, listenerStr }) => {
          return `<li ${useCapture ? `class="${c('capture')}"` : ''}>${escape(
            listenerStr
          )}</li>`
        }).join('')
        return `<div class="${c('listener')}">
          <div class="${c('listener-type')}">${escape(key)}</div>
          <ul class="${c('listener-content')}">
            ${listeners}
          </ul>
        </div>`
      }).join('')
      listeners = `<h2>事件监听器</h2>
      <div class="${c('listener-wrapper')}">
        ${listeners} 
      </div>`
      $listeners.html(listeners).show()
    } else {
      $listeners.hide()
    }

    this._$container.show()
  }
  _getData(el) {
    const ret = {}

    const cssStore = new CssStore(el)

    const { className, id, attributes, tagName } = el

    ret.computedStyleSearchKeyword = this._computedStyleSearchKeyword
    ret.attributes = formatAttr(attributes)
    ret.name = formatNodeName({ tagName, id, className, attributes })

    const events = el.erudaEvents
    if (events && keys(events).length !== 0) ret.listeners = events

    if (needNoStyle(tagName)) {
      return ret
    }

    let computedStyle = cssStore.getComputedStyle()

    const styles = cssStore.getMatchedCSSRules()
    styles.unshift(getInlineStyle(el.style))
    styles.forEach((style) => processStyleRules(style.style))
    ret.styles = styles

    if (this._rmDefComputedStyle) {
      computedStyle = rmDefComputedStyle(computedStyle, styles)
    }
    ret.rmDefComputedStyle = this._rmDefComputedStyle
    const computedStyleSearchKeyword = lowerCase(ret.computedStyleSearchKeyword)
    if (computedStyleSearchKeyword) {
      computedStyle = pick(computedStyle, (val, property) => {
        return (
          contain(property, computedStyleSearchKeyword) ||
          contain(val, computedStyleSearchKeyword)
        )
      })
    }
    processStyleRules(computedStyle)
    ret.computedStyle = computedStyle

    return ret
  }
  _bindEvent() {
    const devtools = this._devtools

    this._$container
      .on('click', c('.toggle-all-computed-style'), () =>
        this._toggleAllComputedStyle()
      )
      .on('click', c('.computed-style-search'), () => {
        LunaModal.prompt('查找').then((filter) => {
          if (isNull(filter)) return
          filter = trim(filter)
          this._computedStyleSearchKeyword = filter
          this._render()
        })
      })
      .on('click', '.eruda-listener-content', function () {
        const text = $(this).text()
        const sources = devtools.get('sources')

        if (sources) {
          sources.set('js', text)
          devtools.showTool('sources')
        }
      })
      .on('click', c('.element-name'), () => {
        const sources = devtools.get('sources')

        if (sources) {
          sources.set('object', this._curEl)
          devtools.showTool('sources')
        }
      })
      .on('click', c('.back'), this.hide)
      .on('click', c('.refresh'), () => {
        this._render()
        devtools.notify('Refreshed', { icon: 'success' })
      })

    this._boxModel.on('highlight', this._highlight)
  }
  _initObserver() {
    this._observer = new MutationObserver((mutations) => {
      each(mutations, (mutation) => this._handleMutation(mutation))
    })
  }
  _enableObserver() {
    this._observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true,
    })
  }
  _disableObserver() {
    this._observer.disconnect()
  }
  _handleMutation(mutation) {
    if (isErudaEl(mutation.target)) return

    if (mutation.type === 'attributes') {
      if (mutation.target !== this._curEl) return
      this._render()
    }
  }
  _rmCfg() {
    const cfg = this.config

    const settings = this._devtools.get('settings')

    if (!settings) return

    settings
      .remove(cfg, 'overrideEventTarget')
      .remove(cfg, 'observeElement')
      .remove(Settings.toolSectionLabel(this._devtools.get('elements')))
  }
  _initCfg() {
    const cfg = (this.config = Settings.createCfg('elements', {
      overrideEventTarget: true,
    }))

    if (cfg.get('overrideEventTarget')) this.overrideEventTarget()

    cfg.on('change', (key, val) => {
      switch (key) {
        case 'overrideEventTarget':
          return val ? this.overrideEventTarget() : this.restoreEventTarget()
      }
    })

    const settings = this._devtools.get('settings')
    if (!settings) return

    settings
      .text(Settings.toolSectionLabel(this._devtools.get('elements')))
      .switch(cfg, 'overrideEventTarget', '捕获事件监听器')

    settings.separator()
  }
}

function processStyleRules(style) {
  each(style, (val, key) => (style[key] = processStyleRule(val)))
}

const formatAttr = (attributes) =>
  map(attributes, (attr) => {
    let { value } = attr
    const { name } = attr
    value = escape(value)

    const isLink =
      (name === 'src' || name === 'href') && !startWith(value, 'data')
    if (isLink) value = wrapLink(value)
    if (name === 'style') value = processStyleRule(value)

    return { name, value }
  })

const regColor = /rgba?\((.*?)\)/g
const regCssUrl = /url\("?(.*?)"?\)/g

function processStyleRule(val) {
  // For css custom properties, val is unable to retrieved.
  val = toStr(val)

  return val
    .replace(
      regColor,
      '<span class="eruda-style-color" style="background-color: $&"></span>$&'
    )
    .replace(regCssUrl, (match, url) => `url("${wrapLink(url)}")`)
}

function getInlineStyle(style) {
  const ret = {
    selectorText: 'element.style',
    style: {},
  }

  for (let i = 0, len = style.length; i < len; i++) {
    const s = style[i]

    ret.style[s] = style[s]
  }

  return ret
}

function rmDefComputedStyle(computedStyle, styles) {
  const ret = {}

  let keepStyles = ['display', 'width', 'height']
  each(styles, (style) => {
    keepStyles = keepStyles.concat(keys(style.style))
  })
  keepStyles = unique(keepStyles)

  each(computedStyle, (val, key) => {
    if (!contain(keepStyles, key)) return

    ret[key] = val
  })

  return ret
}

const NO_STYLE_TAG = ['script', 'style', 'meta', 'title', 'link', 'head']

const needNoStyle = (tagName) => {
  NO_STYLE_TAG.indexOf(tagName.toLowerCase()) > -1
}

const wrapLink = (link) => `<a href="${link}" target="_blank">${link}</a>`

function addEvent(el, type, listener, useCapture = false) {
  if (!isEl(el) || !isFn(listener) || !isBool(useCapture)) return

  const events = (el.erudaEvents = el.erudaEvents || {})

  events[type] = events[type] || []
  events[type].push({
    listener: listener,
    listenerStr: listener.toString(),
    useCapture: useCapture,
  })
}

function rmEvent(el, type, listener, useCapture = false) {
  if (!isEl(el) || !isFn(listener) || !isBool(useCapture)) return

  const events = el.erudaEvents

  if (!(events && events[type])) return

  const listeners = events[type]

  for (let i = 0, len = listeners.length; i < len; i++) {
    if (listeners[i].listener === listener) {
      listeners.splice(i, 1)
      break
    }
  }

  if (listeners.length === 0) delete events[type]
  if (keys(events).length === 0) delete el.erudaEvents
}

const getWinEventProto = () => {
  return safeGet(window, 'EventTarget.prototype') || window.Node.prototype
}
