<div align="center">
  <a href="https://eruda.liriliri.io/" target="_blank">
    <img src="https://eruda.liriliri.io/icon.png" width="400">
  </a>
</div>

<h1 align="center">Eruda 中文版</h1>

<div align="center">

一个适用于移动端浏览器的前端调试控制台（中文增强版）。

基于 Eruda 进行中文化与部分体验优化。

[![NPM version](https://img.shields.io/npm/v/eruda-cn?style=flat-square)](https://www.npmjs.com/package/eruda-cn)
[![License](https://img.shields.io/npm/l/eruda-cn?style=flat-square)](https://www.npmjs.com/package/eruda-cn)

</div>

<img src="https://eruda.liriliri.io/screenshot.jpg" style="width:100%">

---

## 介绍

Eruda 是一个专为移动端网页设计的调试工具，可在手机浏览器中提供类似 Chrome DevTools 的调试能力。

本仓库基于官方 Eruda 进行中文化处理，方便中文开发者在移动端进行：

- Console 控制台调试
- Network 网络请求查看
- Elements 元素查看
- Resources 资源管理
- Sources 源码查看
- Performance 性能分析
- Storage 本地存储查看

等功能。

适用于：

- H5 调试
- WebView 调试
- 移动端页面开发
- Hybrid App 调试
- 内嵌浏览器调试

---

## 在线 Demo

访问官方演示站点：

https://eruda.liriliri.io/

手机扫码体验：

![Demo](https://eruda.liriliri.io/qrcode.png)

---

## 安装

### npm

```bash
npm install eruda-cn
```

### pnpm

```bash
pnpm add eruda-cn
```

---

## 使用方式

```html
<script src="node_modules/eruda-cn/eruda.js"></script>
<script>
  eruda.init()
</script>
```

---

## CDN 引入

```html
<script src="https://cdn.jsdelivr.net/npm/eruda-cn"></script>
<script>
  eruda.init()
</script>
```

---

## 功能截图

<img src="https://eruda.liriliri.io/screenshot.jpg" style="width:100%">

---

## 与官方版本的区别

本项目主要包含：

- 中文界面翻译
- 中文文案优化
- 更适合中文开发者的使用体验

核心功能与官方 Eruda 保持一致。

---

## 官方项目

- Eruda 官方仓库：
  https://github.com/liriliri/eruda

- 官方文档：
  https://eruda.liriliri.io/docs/

---

## 相关项目

- chii
  远程调试工具
  https://github.com/liriliri/chii

- chobitsu
  Chrome DevTools Protocol JavaScript 实现
  https://github.com/liriliri/chobitsu

- eruda-webpack-plugin
  Eruda Webpack 插件
  https://github.com/huruji/eruda-webpack-plugin

---

## License

MIT
