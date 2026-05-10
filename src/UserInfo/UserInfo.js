import Tool from '../DevTools/Tool'
import evalCss from '../lib/evalCss'
import escape from 'licia/escape'
import copy from 'licia/copy'
import toNum from 'licia/toNum'
import { classPrefix as c } from '../lib/util'

function safeGetStorageValue(storage, key) {
  try {
    return storage?.getItem(key) || ''
  } catch {
    return ''
  }
}

function safeParseUserInfo(rawValue) {
  if (!rawValue) {
    return { userInfo: null, parseError: '' }
  }

  try {
    const parsed = JSON.parse(rawValue)
    const userInfo =
      parsed &&
      typeof parsed === 'object' &&
      parsed.userInfo &&
      typeof parsed.userInfo === 'object'
        ? parsed.userInfo
        : parsed

    if (!userInfo || typeof userInfo !== 'object') {
      return {
        userInfo: null,
        parseError: 'localStorage.userInfo 不是对象结构，无法按字段展示。',
      }
    }

    return { userInfo, parseError: '' }
  } catch (error) {
    return {
      userInfo: null,
      parseError: error instanceof Error ? error.message : 'userInfo 解析失败。',
    }
  }
}

function getCurrentAccount(userInfo) {
  const accounts = userInfo?.clientInfo?.accts
  if (!Array.isArray(accounts) || !accounts.length) {
    return null
  }

  return accounts[0] || null
}

function readUserInfoSnapshot() {
  const rawUserInfo = safeGetStorageValue(window.localStorage, 'userInfo')
  const { userInfo, parseError } = safeParseUserInfo(rawUserInfo)

  return {
    rawUserInfo,
    userInfo,
    parseError,
    session: safeGetStorageValue(window.localStorage, 'session'),
    rndKey: safeGetStorageValue(window.localStorage, 'rndKey'),
    hlId:
      safeGetStorageValue(window.sessionStorage, 'hlId') ||
      userInfo?.hlId ||
      '',
    currentAccount: getCurrentAccount(userInfo),
    session3: userInfo?.permission?.token || '',
    updatedAt: Date.now(),
  }
}

function isEmptyValue(value) {
  return value == null || (typeof value === 'string' && value.trim() === '')
}

function serializeValue(value) {
  if (value == null) {
    return ''
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}

function formatValue(valueClass, emptyClass, value) {
  if (isEmptyValue(value)) {
    return `<span class="${valueClass} ${emptyClass}">未读取到</span>`
  }

  if (typeof value === 'boolean') {
    return `<span class="${valueClass}">${value ? 'true' : 'false'}</span>`
  }

  if (typeof value === 'object') {
    return `<span class="${valueClass}">${escape(
      JSON.stringify(value, null, 2)
    )}</span>`
  }

  return `<span class="${valueClass}">${escape(String(value))}</span>`
}

function buildMarkup(snapshot) {
  let copyIdx = 0
  const copySlots = []

  function renderItem(label, value) {
    const text = serializeValue(value)
    const myIdx = copyIdx++
    copySlots.push(text)

    return `
    <div class="${c('item')}">
      <span class="${c('label')}">${escape(label)}</span>
      <div class="${c('content')}">
        ${formatValue(c('value'), c('empty'), value)}
        <button type="button" class="${c(
          'user-info-copy-btn'
        )}" data-copy-idx="${myIdx}">复制</button>
      </div>
    </div>
  `
  }

  function renderSection(title, description, items) {
    return `
    <section class="${c('section')}">
      <h3 class="${c('section-title')}">${escape(title)}</h3>
      ${description ? `<p class="${c('section-desc')}">${escape(description)}</p>` : ''}
      <div class="${c('grid')}">
        ${items.join('')}
      </div>
    </section>
  `
  }

  const {
    userInfo,
    rawUserInfo,
    parseError,
    currentAccount,
    session,
    session3,
    rndKey,
    hlId,
  } = snapshot

  const rawJsonText = userInfo
    ? JSON.stringify(userInfo, null, 2)
    : rawUserInfo || '当前页面没有 localStorage.userInfo'

  const sections = [
    renderSection(
      '基础信息',
      '',
      [
        renderItem('区号', userInfo?.areaCode),
        renderItem('手机号', userInfo?.phone),
        renderItem('邮箱', userInfo?.email),
        renderItem('uin', userInfo?.uin),
        renderItem('星财号', hlId),
        renderItem('密码状态', userInfo?.pwdStatus),
        renderItem('美股问卷', userInfo?.quotationTag),
        renderItem('开户状态', userInfo?.clientStatus),
        renderItem('session', session),
        renderItem('session3', session3),
        renderItem('autoLogin', userInfo?.autoLogin),
        renderItem('神策用户ID', userInfo?.distinctId),
        renderItem('是否是专业投资者', userInfo?.isPi),
      ]
    ),
    renderSection(
      '账户信息',
      '',
      [
        renderItem('acctId', currentAccount?.acctId),
        renderItem('cltId', currentAccount?.cltId),
        renderItem('subAcctId', currentAccount?.subAcctId),
        renderItem('type', currentAccount?.type),
        renderItem('cltTag', currentAccount?.cltTag),
        renderItem('星股宝账户', currentAccount?.entrustInfo),
      ]
    ),
    renderSection(
      '补充信息',
      '',
      [
        renderItem('昵称', userInfo?.profile?.nickName),
        renderItem('loginExpire', userInfo?.loginExpire),
        renderItem('Expire', userInfo?.Expire),
        renderItem('updateTime', userInfo?.updateTime),
        renderItem('rndKey', rndKey),
        renderItem('permission.hk', userInfo?.permission?.hk),
        renderItem('permission.us', userInfo?.permission?.us),
        renderItem('permission.cn', userInfo?.permission?.cn),
        renderItem('permission.usOp', userInfo?.permission?.usOp),
        renderItem('permission.ip', userInfo?.permission?.ip),
        renderItem(
          'language / aeCode',
          [userInfo?.language, userInfo?.aeCode].filter(Boolean).join(' / ')
        ),
      ]
    ),
  ]

  const notice = parseError
    ? `<div class="${c('notice')}">${escape(parseError)}</div>`
    : ''

  const html = `
    <div class="${c('user-info-root')}">
      ${notice}
      ${sections.join('')}
      <section class="${c('section')}">
        <h3 class="${c('section-title')}">localStorage.userInfo 原文</h3>
        <pre class="${c('code-block')}">${escape(rawJsonText)}</pre>
      </section>
    </div>
  `

  return { html, copySlots }
}

export default class UserInfo extends Tool {
  constructor() {
    super()

    this._style = evalCss(require('./UserInfo.scss'))

    this.name = 'userInfo'
    this.title = '用户信息'
    this._copySlots = []
    this._pollTimer = null
    this._lastSignature = ''
  }

  init($el, container) {
    super.init($el)
    this._container = container

    this._render(true)
    this._bindEvent()

    this._pollTimer = window.setInterval(() => {
      this._render(false)
    }, 1000)
  }

  show() {
    super.show()
    this._render(true)
  }

  destroy() {
    if (this._pollTimer != null) {
      window.clearInterval(this._pollTimer)
      this._pollTimer = null
    }

    super.destroy()
    evalCss.remove(this._style)
  }

  _render(force) {
    const snapshot = readUserInfoSnapshot()
    const signature = JSON.stringify([
      snapshot.rawUserInfo,
      snapshot.session,
      snapshot.rndKey,
      snapshot.hlId,
    ])

    if (!force && signature === this._lastSignature) {
      return
    }

    this._lastSignature = signature

    const { html, copySlots } = buildMarkup(snapshot)
    this._copySlots = copySlots
    this._$el.html(html)
  }

  _bindEvent() {
    const self = this
    this._$el.on('click', c('.user-info-copy-btn'), function () {
      const idx = toNum(this.getAttribute('data-copy-idx'))
      const text = self._copySlots[idx]
      if (text === undefined) {
        return
      }

      copy(text)
      self._container.notify('已复制', { icon: 'success' })
    })
  }
}
