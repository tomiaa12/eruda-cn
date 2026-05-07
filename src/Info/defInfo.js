import detectBrowser from 'licia/detectBrowser'
import detectOs from 'licia/detectOs'
import escape from 'licia/escape'
// import map from 'licia/map'

const browser = detectBrowser()

export default [
  {
    name: '位置',
    val() {
      return escape(location.href)
    },
  },
  {
    name: '用户代理',
    val: navigator.userAgent,
  },
  {
    name: '设备',
    val: [
      '<table><tbody>',
      `<tr><td class="eruda-device-key">屏幕</td><td>${screen.width} * ${screen.height}</td></tr>`,
      `<tr><td>视口</td><td>${window.innerWidth} * ${window.innerHeight}</td></tr>`,
      `<tr><td>像素比</td><td>${window.devicePixelRatio}</td></tr>`,
      '</tbody></table>',
    ].join(''),
  },
  {
    name: '系统',
    val: [
      '<table><tbody>',
      `<tr><td class="eruda-system-key">系统</td><td>${detectOs()}</td></tr>`,
      `<tr><td>浏览器</td><td>${
        browser.name + ' ' + browser.version
      }</td></tr>`,
      '</tbody></table>',
    ].join(''),
  },
  // {
  //   name: 'About',
  //   val:
  //     '<a href="https://eruda.liriliri.io" target="_blank">Eruda v' +
  //     VERSION +
  //     '</a>',
  // },
]
