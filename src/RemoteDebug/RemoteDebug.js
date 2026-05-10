import Tool from '../DevTools/Tool'
import evalCss from '../lib/evalCss'
import escape from 'licia/escape'
import { classPrefix as c } from '../lib/util'

const REMOTE_TARGET_URL = 'https://web.mfosunhani.com/engine/chii/target.js'
const REMOTE_CONSOLE_URL = 'https://web.mfosunhani.com/engine/remote-debug/'
const REMOTE_SCRIPT_SELECTOR =
  'script[data-eruda-remote-debug="chii-target"]'

let loadPromise = null
let loaded = false

function getChiiId() {
  try {
    return window.sessionStorage.getItem('chii-id') || ''
  } catch {
    return ''
  }
}

function loadRemoteDebugger() {
  if (loaded) {
    return Promise.resolve()
  }

  if (loadPromise) {
    return loadPromise
  }

  const existingScript = document.querySelector(REMOTE_SCRIPT_SELECTOR)
  if (existingScript && existingScript.dataset.loaded === 'true') {
    loaded = true
    return Promise.resolve()
  }

  loadPromise = new Promise((resolve, reject) => {
    const script =
      existingScript ||
      Object.assign(document.createElement('script'), {
        async: true,
        src: REMOTE_TARGET_URL,
      })

    script.dataset.erudaRemoteDebug = 'chii-target'

    const handleLoad = () => {
      script.dataset.loaded = 'true'
      loaded = true
      loadPromise = null
      resolve()
    }

    const handleError = () => {
      loadPromise = null
      if (!existingScript) {
        script.remove()
      }
      reject(new Error('远程调试脚本加载失败。'))
    }

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })

    if (!existingScript) {
      document.head.appendChild(script)
    }
  })

  return loadPromise
}

export default class RemoteDebug extends Tool {
  constructor() {
    super()

    this._style = evalCss(require('./RemoteDebug.scss'))

    this.name = 'remoteDebug'
    this.title = '远程调试'
    this._status = loaded ? 'loaded' : 'idle'
    this._errorMessage = ''
  }
  init($el, container) {
    super.init($el)
    this._container = container

    this._render()
    this._bindEvent()
  }
  show() {
    super.show()
    this._render()
  }
  destroy() {
    super.destroy()

    evalCss.remove(this._style)
  }
  _render() {
    const isLoading = this._status === 'loading'
    const isLoaded = loaded || this._status === 'loaded'
    const chiiId = isLoaded ? getChiiId() : ''
    const statusMarkup = isLoaded
      ? `
        <div class="${c('notice')}">
          远程调试脚本已连接，PC 端打开
          <a
            class="${c('link')}"
            href="${REMOTE_CONSOLE_URL}"
            target="_blank"
            rel="noreferrer"
          >${REMOTE_CONSOLE_URL}</a>
          进行调试。
          <div class="${c('meta')}">
            当前连接 id：
            <div class="${c('code')}">${escape(chiiId || '未获取到')}</div>
          </div>
        </div>
      `
      : this._errorMessage
        ? `
          <div class="${c('notice')}" data-tone="error">
            ${escape(this._errorMessage)}
          </div>
        `
        : ''

    this._$el.html(
      c(`
        <div class="remote-debug-content">
          <section class="section">
            <h2 class="title">远程调试</h2>
            <p class="description">
              点击按钮加载 Chii 远程调试脚本，然后在 PC 端打开调试页面连接当前设备。
            </p>
            <div class="actions">
              <button
                type="button"
                class="button load-remote-debug"
                ${isLoading || isLoaded ? 'disabled' : ''}
              >
                ${isLoading ? '加载中...' : isLoaded ? '已连接' : '连接远程调试'}
              </button>
            </div>
            ${statusMarkup}
          </section>
        </div>
      `)
    )
  }
  _bindEvent() {
    this._$el.on('click', c('.load-remote-debug'), async () => {
      if (this._status === 'loading' || loaded) {
        return
      }

      this._status = 'loading'
      this._errorMessage = ''
      this._render()

      try {
        await loadRemoteDebugger()
        this._status = 'loaded'
        this._container.notify('远程调试已连接', { icon: 'success' })
      } catch (error) {
        this._status = 'error'
        this._errorMessage =
          error instanceof Error ? error.message : '远程调试脚本加载失败。'
        this._container.notify(this._errorMessage, { icon: 'error' })
      }

      this._render()
    })
  }
}
