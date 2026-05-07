import logger from '../lib/logger'
import emitter from '../lib/emitter'
import Url from 'licia/Url'
import now from 'licia/now'
import startWith from 'licia/startWith'
import $ from 'licia/$'
import upperFirst from 'licia/upperFirst'
import loadJs from 'licia/loadJs'
import trim from 'licia/trim'
import LunaModal from 'luna-modal'
import { isErudaEl } from '../lib/util'
import evalCss from '../lib/evalCss'

let style = null

export default [
  {
    name: '描边所有元素',
    fn() {
      if (style) {
        evalCss.remove(style)
        style = null
        return
      }

      style = evalCss(
        '* { outline: 2px dashed #707d8b; outline-offset: -3px; }',
        document.head
      )
    },
    desc: '为所有元素添加颜色边框',
  },
  {
    name: '刷新页面',
    fn() {
      const url = new Url()
      url.setQuery('timestamp', now())

      window.location.replace(url.toString())
    },
    desc: '刷新页面',
  },
  {
    name: '搜索文本',
    fn() {
      LunaModal.prompt('输入文本').then((keyword) => {
        if (!keyword || trim(keyword) === '') {
          return
        }

        search(keyword)
      })
    },
    desc: '高亮页面中的文本',
  },
  {
    name: '编辑页面',
    fn() {
      const body = document.body

      body.contentEditable = body.contentEditable !== 'true'
    },
    desc: '切换页面编辑模式',
  },
  {
    name: '适应屏幕',
    // https://achrafkassioui.com/birdview/
    fn() {
      const body = document.body
      const html = document.documentElement
      const $body = $(body)
      if ($body.data('scaled')) {
        window.scrollTo(0, +$body.data('scaled'))
        $body.rmAttr('data-scaled')
        $body.css('transform', 'none')
      } else {
        const documentHeight = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight
        )
        const viewportHeight = Math.max(
          document.documentElement.clientHeight,
          window.innerHeight || 0
        )
        const scaleVal = viewportHeight / documentHeight
        $body.css('transform', `scale(${scaleVal})`)
        $body.data('scaled', window.scrollY)
        window.scrollTo(0, documentHeight / 2 - viewportHeight / 2)
      }
    },
    desc: '将整个页面缩放到适应屏幕',
  },
  {
    name: '加载Vue插件',
    fn() {
      loadPlugin('vue')
    },
    desc: 'Vue开发工具',
  },
  {
    name: '加载监控插件',
    fn() {
      loadPlugin('monitor')
    },
    desc: '显示页面FPS、内存和DOM节点',
  },
  {
    name: '加载功能插件',
    fn() {
      loadPlugin('features')
    },
    desc: '浏览器功能检测',
  },
  {
    name: '加载性能插件',
    fn() {
      loadPlugin('timing')
    },
    desc: '显示性能和资源时间',
  },
  {
    name: '加载代码插件',
    fn() {
      loadPlugin('code')
    },
    desc: '编辑和运行JavaScript',
  },
  {
    name: '加载基准测试插件',
    fn() {
      loadPlugin('benchmark')
    },
    desc: '运行JavaScript基准测试',
  },
  {
    name: '加载地理位置插件',
    fn() {
      loadPlugin('geolocation')
    },
    desc: '测试地理位置',
  },
  {
    name: '加载方向插件',
    fn() {
      loadPlugin('orientation')
    },
    desc: '测试方向API',
  },
  {
    name: '加载触摸插件',
    fn() {
      loadPlugin('touches')
    },
    desc: '可视化屏幕触摸',
  },
]

evalCss(require('./searchText.scss'), document.head)

function search(text) {
  const root = document.body
  const regText = new RegExp(text, 'ig')

  traverse(root, (node) => {
    const $node = $(node)

    if (!$node.hasClass('eruda-search-highlight-block')) return

    return document.createTextNode($node.text())
  })

  traverse(root, (node) => {
    if (node.nodeType !== 3) return

    let val = node.nodeValue
    val = val.replace(
      regText,
      (match) => `<span class="eruda-keyword">${match}</span>`
    )
    if (val === node.nodeValue) return

    const $ret = $(document.createElement('div'))

    $ret.html(val)
    $ret.addClass('eruda-search-highlight-block')

    return $ret.get(0)
  })
}

function traverse(root, processor) {
  const childNodes = root.childNodes

  if (isErudaEl(root)) return

  for (let i = 0, len = childNodes.length; i < len; i++) {
    const newNode = traverse(childNodes[i], processor)
    if (newNode) root.replaceChild(newNode, childNodes[i])
  }

  return processor(root)
}

function loadPlugin(name) {
  const globalName = 'eruda' + upperFirst(name)
  if (window[globalName]) return

  let protocol = location.protocol
  if (!startWith(protocol, 'http')) protocol = 'http:'

  loadJs(
    `${protocol}//cdn.jsdelivr.net/npm/eruda-${name}@${pluginVersion[name]}`,
    (isLoaded) => {
      if (!isLoaded || !window[globalName])
        return logger.error('Fail to load plugin ' + name)

      emitter.emit(emitter.ADD, window[globalName])
      emitter.emit(emitter.SHOW, name)
    }
  )
}

const pluginVersion = {
  monitor: '1.1.1',
  features: '2.1.0',
  timing: '2.0.1',
  code: '2.2.0',
  benchmark: '2.0.1',
  geolocation: '2.1.0',
  orientation: '2.1.1',
  touches: '2.1.0',
  vue: '1.1.1',
}
