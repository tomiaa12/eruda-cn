import Tool from '../DevTools/Tool'
import noop from 'licia/noop'
import $ from 'licia/$'
import toStr from 'licia/toStr'
import isFn from 'licia/isFn'
import Emitter from 'licia/Emitter'
import isStr from 'licia/isStr'
import isRegExp from 'licia/isRegExp'
import uncaught from 'licia/uncaught'
import trim from 'licia/trim'
import isHidden from 'licia/isHidden'
import isNull from 'licia/isNull'
import isArr from 'licia/isArr'
import extend from 'licia/extend'
import evalCss from '../lib/evalCss'
import Settings from '../Settings/Settings'
import LunaConsole from 'luna-console'
import LunaModal from 'luna-modal'
import { classPrefix as c } from '../lib/util'

function isMaxLogUnlimited(val) {
  return val === '无限' || val === 'infinite'
}

uncaught.start()

export default class Console extends Tool {
  constructor({ name = 'console', title = '控制台' } = {}) {
    super()

    Emitter.mixin(this)

    this.name = name
    this.title = title
    this._selectedLog = null
  }
  init($el, container) {
    super.init($el)
    this._container = container

    this._appendTpl()

    this._initCfg()

    this._initLogger()
    this._exposeLogger()
    this._bindEvent()
  }
  show() {
    super.show()
    this._handleShow()
  }
  overrideConsole() {
    const origConsole = (this._origConsole = {})
    const winConsole = window.console

    CONSOLE_METHOD.forEach((name) => {
      let origin = (origConsole[name] = noop)
      if (winConsole[name]) {
        origin = origConsole[name] = winConsole[name].bind(winConsole)
      }

      winConsole[name] = (...args) => {
        this[name](...args)
        origin(...args)
      }
    })

    return this
  }
  setGlobal(name, val) {
    this._logger.setGlobal(name, val)
  }
  restoreConsole() {
    if (!this._origConsole) return this

    CONSOLE_METHOD.forEach(
      (name) => (window.console[name] = this._origConsole[name])
    )
    delete this._origConsole

    return this
  }
  catchGlobalErr() {
    uncaught.addListener(this._handleErr)

    return this
  }
  ignoreGlobalErr() {
    uncaught.rmListener(this._handleErr)

    return this
  }
  filter(filter) {
    const $filterText = this._$filterText
    const logger = this._logger

    if (isStr(filter)) {
      $filterText.text(filter)
      logger.setOption('filter', trim(filter))
    } else if (isRegExp(filter)) {
      $filterText.text(toStr(filter))
      logger.setOption('filter', filter)
    } else if (isFn(filter)) {
      $filterText.text('ƒ')
      logger.setOption('filter', filter)
    }
  }
  destroy() {
    this._logger.destroy()
    super.destroy()

    this._container.off('show', this._handleShow)

    if (this._style) {
      evalCss.remove(this._style)
    }
    this.ignoreGlobalErr()
    this.restoreConsole()
    this._rmCfg()
  }
  _handleShow = () => {
    if (isHidden(this._$el.get(0))) return
    this._logger.renderViewport()
  }
  _handleErr = (err) => {
    this._logger.error(err)
  }
  _enableJsExecution(enabled) {
    const $el = this._$el
    const $jsInput = $el.find(c('.js-input'))

    if (enabled) {
      $jsInput.show()
      $el.rmClass(c('js-input-hidden'))
    } else {
      $jsInput.hide()
      $el.addClass(c('js-input-hidden'))
    }
  }
  _appendTpl() {
    const $el = this._$el

    this._style = evalCss(require('./Console.scss'))
    $el.append(
      c(`
      <div class="control">
        <span class="icon-clear clear-console"></span>
        <span class="level active" data-level="all">默认</span>
        <span class="level" data-level="info">信息</span>
        <span class="level" data-level="warning">警告</span>
        <span class="level" data-level="error">错误</span>
        <span class="filter-text"></span>
        <span class="icon-filter filter"></span>
        <span class="icon-copy icon-disabled copy"></span>
      </div>
      <div class="logs-container"></div>
      <div class="js-input">
        <div class="buttons">
          <div class="button cancel">取消</div>
          <div class="button execute">运行</div>
        </div>
        <span class="icon-right"></span>
        <textarea></textarea>
      </div>
    `)
    )

    const _$inputContainer = $el.find(c('.js-input'))
    const _$input = _$inputContainer.find('textarea')
    const _$inputBtns = _$inputContainer.find(c('.buttons'))

    extend(this, {
      _$control: $el.find(c('.control')),
      _$logs: $el.find(c('.logs-container')),
      _$inputContainer,
      _$input,
      _$inputBtns,
      _$filterText: $el.find(c('.filter-text')),
    })
  }
  _initLogger() {
    const cfg = this.config
    let maxLogNum = cfg.get('maxLogNum')
    maxLogNum = isMaxLogUnlimited(maxLogNum) ? 0 : +maxLogNum

    const $level = this._$control.find(c('.level'))
    const logger = new LunaConsole(this._$logs.get(0), {
      asyncRender: cfg.get('asyncRender'),
      maxNum: maxLogNum,
      showHeader: cfg.get('displayExtraInfo'),
      unenumerable: cfg.get('displayUnenumerable'),
      accessGetter: cfg.get('displayGetterVal'),
      lazyEvaluation: cfg.get('lazyEvaluation'),
    })

    logger.on('optionChange', (name, val) => {
      switch (name) {
        case 'level':
          $level.each(function () {
            const $this = $(this)
            const level = $this.data('level')
            const isMatch = level === val || (level === 'all' && isArr(val))

            $this[isMatch ? 'addClass' : 'rmClass'](c('active'))
          })
          break
      }
    })

    if (cfg.get('overrideConsole')) this.overrideConsole()

    this._logger = logger
  }
  _exposeLogger() {
    const logger = this._logger
    const methods = ['html'].concat(CONSOLE_METHOD)

    methods.forEach(
      (name) =>
        (this[name] = (...args) => {
          logger[name](...args)
          this.emit(name, ...args)

          return this
        })
    )
  }
  _bindEvent() {
    const container = this._container
    const $input = this._$input
    const $inputBtns = this._$inputBtns
    const $control = this._$control

    const logger = this._logger
    const config = this.config

    $control
      .on('click', c('.clear-console'), () => logger.clear(true))
      .on('click', c('.level'), function () {
        let level = $(this).data('level')
        $control.find('.eruda-active').each((_,el) => {
          $(el).rmClass('eruda-active')
        })
        $(this).addClass('eruda-active')
        if (level === 'all') {
          level = ['verbose', 'info', 'warning', 'error']
        }
        logger.setOption('level', level)
      })
      .on('click', c('.filter'), () => {
        LunaModal.prompt('查找').then((filter) => {
          if (isNull(filter)) return
          this.filter(filter)
        })
      })
      .on('click', c('.copy'), () => {
        this._selectedLog.copy()
        container.notify('复制成功', { icon: 'success' })
      })

    $inputBtns
      .on('click', c('.cancel'), () => this._hideInput())
      .on('click', c('.execute'), () => {
        const jsInput = $input.val().trim()
        if (jsInput === '') return

        logger.evaluate(jsInput)
        $input.val('').get(0).blur()
        this._hideInput()
      })

    $input.on('focusin', () => this._showInput())

    logger.on('insert', (log) => {
      const autoShow = log.type === 'error' && config.get('displayIfErr')

      if (autoShow) container.showTool(this.name).show()
    })

    logger.on('select', (log) => {
      this._selectedLog = log
      $control.find(c('.icon-copy')).rmClass(c('icon-disabled'))
    })

    logger.on('deselect', () => {
      this._selectedLog = null
      $control.find(c('.icon-copy')).addClass(c('icon-disabled'))
    })

    container.on('show', this._handleShow)
  }
  _hideInput() {
    this._$inputContainer.rmClass(c('active'))
    this._$inputBtns.css('display', 'none')
  }
  _showInput() {
    this._$inputContainer.addClass(c('active'))
    this._$inputBtns.css('display', 'flex')
  }
  _rmCfg() {
    const cfg = this.config

    const settings = this._container.get('settings')
    if (!settings) return

    settings
      .remove(cfg, 'asyncRender')
      .remove(cfg, 'jsExecution')
      .remove(cfg, 'catchGlobalErr')
      .remove(cfg, 'overrideConsole')
      .remove(cfg, 'displayExtraInfo')
      .remove(cfg, 'displayUnenumerable')
      .remove(cfg, 'displayGetterVal')
      .remove(cfg, 'lazyEvaluation')
      .remove(cfg, 'displayIfErr')
      .remove(cfg, 'maxLogNum')
      .remove(Settings.toolSectionLabel(this))
  }
  _initCfg() {
    const container = this._container

    const cfg = (this.config = Settings.createCfg(this.name, {
      asyncRender: true,
      catchGlobalErr: true,
      jsExecution: true,
      overrideConsole: true,
      displayExtraInfo: false,
      displayUnenumerable: true,
      displayGetterVal: true,
      lazyEvaluation: true,
      displayIfErr: false,
      maxLogNum: '无限',
    }))

    this._enableJsExecution(cfg.get('jsExecution'))
    if (cfg.get('catchGlobalErr')) this.catchGlobalErr()

    cfg.on('change', (key, val) => {
      const logger = this._logger
      switch (key) {
        case 'asyncRender':
          return logger.setOption('asyncRender', val)
        case 'jsExecution':
          return this._enableJsExecution(val)
        case 'catchGlobalErr':
          return val ? this.catchGlobalErr() : this.ignoreGlobalErr()
        case 'overrideConsole':
          return val ? this.overrideConsole() : this.restoreConsole()
        case 'maxLogNum':
          return logger.setOption('maxNum', isMaxLogUnlimited(val) ? 0 : +val)
        case 'displayExtraInfo':
          return logger.setOption('showHeader', val)
        case 'displayUnenumerable':
          return logger.setOption('unenumerable', val)
        case 'displayGetterVal':
          return logger.setOption('accessGetter', val)
        case 'lazyEvaluation':
          return logger.setOption('lazyEvaluation', val)
      }
    })

    const settings = container.get('settings')
    if (!settings) return

    settings
      .text(Settings.toolSectionLabel(this))
      .switch(cfg, 'asyncRender', '异步渲染')
      .switch(cfg, 'jsExecution', '启用JavaScript执行')
      .switch(cfg, 'catchGlobalErr', '捕获全局错误')
      .switch(cfg, 'overrideConsole', '覆盖控制台')
      .switch(cfg, 'displayIfErr', '自动显示错误')
      .switch(cfg, 'displayExtraInfo', '显示额外信息')
      .switch(cfg, 'displayUnenumerable', '显示不可枚举属性')
      .switch(cfg, 'displayGetterVal', '访问Getter值')
      .switch(cfg, 'lazyEvaluation', '懒评估')
      .select(cfg, 'maxLogNum', '最大日志数量', [
        '无限',
        '250',
        '125',
        '100',
        '50',
        '10',
      ])
      .separator()
  }
}

const CONSOLE_METHOD = [
  'log',
  'error',
  'info',
  'warn',
  'dir',
  'time',
  'timeLog',
  'timeEnd',
  'clear',
  'table',
  'assert',
  'count',
  'countReset',
  'debug',
  'group',
  'groupCollapsed',
  'groupEnd',
]
