---
title: Vite + Vue3.0 + SpringBoot 实践
date: 2020-07-11 18:50:14
categories: 
- 前端
tags: 
- Vite
- Vue
- SpringBoot
---

&emsp;&emsp;

# 工具集介绍

实践开始之前先一起来了解下我们即将要使用到的工具集，SpringBoot 就不再多说了，下面将会花费多一些的篇幅来讲解一下 Vite 与 Vue3.0 给我们带来的惊喜。

> 之所以把 Vite 放到 Vue3.0 之前讲，是因为 Vite 的关注点更具有“独特性”，如何来理解这句话，我们先看下 Vite 与 Vue3.0 的关注点：
> 
> Vue3.0 关注性能提升与更具逻辑组合性的 API，这是个热点问题，属于开发者的刚需。
> Vite 关注如何提升开发环境的体验，这是个较为冷门且吃力的问题，可以对比 webpack 的热重载，在模块较多的情况下，改一下代码需要等待的时间是秒级别的，多年来也没有太多优化的办法。
> 

## Vite

Vite is an opinionated web dev build tool that serves your code via native ES Module imports during dev and bundles it with Rollup for production.

Vite 是一个基于浏览器原生 ES Module 的开发服务器，生产模式使用 Rollup 打包。

> Rollup 是一个 JavaScript 模块打包器，可以将小块代码编译成大块复杂的代码，其官方文档[点此访问](https://www.rollupjs.com/guide/introduction/)

Vite 第一次暴露在公众视野是尤雨溪在B站直播中提到了，[录播视频点此访问](https://www.bilibili.com/s/video/BV1Hg4y1z7xW)，后来在[前端会客厅](https://www.bilibili.com/video/BV1qC4y18721)这个节目中主持人和尤雨溪深入讨论了一下 Vite 的应用场景与实现原理。

> 在了解 Vite 前我们先思考以下几个问题，通过阅读本章节的内容这些问题都能迎刃而解：
> 1. Vite 解决了什么问题？没有 Vite 之前的世界是怎样的？
> 2. 浏览器原生 [ES Module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) 是什么？
> 3. 我们该如何使用 Vite？

### Vite 解决了什么问题？

Vite 主要解决前端工程化的项目在达到一定规模后，开发环境代码热重载的效率问题，Vite 借助浏览器原生的 ES Module 可以做到以下几个事情：
1. 冷启动：项目启动时不需要加载、编译所有的模块代码，理论上能做到不管多大的项目都能有一个均衡、极速的启动时间；
2. 按需编译：Vite 会根据浏览器的请求仅编译其所需的源文件，配合 LRUCache 可以再次提升性能。
3. 高效的热更新：每个 Vue 文件都会有一个唯一 ID，开发者修改完单 Vue 文件的代码后，借助 WebSocket 与 vue.HMRRuntime 处理或者重新加载新的资源。

**那没有 Vite 之前的世界是怎样的？**

在没有 Vite 之前我们一般会选择 Vue Cli 作为 Vue 应用的开发脚手架，Vue Cli 的热更新基于 xxxzxxxxxxxzxxxxxxxzxxxxxxxzxxxxxxxzxxxxxxxzxxxxxxxzxxxx

### Vite 依赖的 ES Module 是什么？

ES Module 简称 ESM，是 ES6 标准中的模块化语法，使用过 Vue.js 的同学应该很熟悉下面的语法：

```js
// router.js
const routes = []
export default routes

// utils.js
function debug() {
  if (process.env.NODE_ENV === 'development') {
    console.log.apply(null, arguments)
  }
}
export {
  debug
}

// main.js
import _ from 'lodash'
import { debug } from './utils'
import routes from './routes'
// xxxx
```

上述代码能够被 Node.js 编译运行，那类似的语法能不能直接在浏览器运行呢？答案自然是可以的，浏览器已经开始实施这个标准来，到现在 Chrome，Safari，Edge 和 Firefox（从 60 版本开始）都支持ESM 模块。

* 那么在浏览器怎么使用 ESM 呢？主要分为以下两步：

  1. 通过 HTML 标签的方式指定以 `module` 方式加载脚本；

  ```html
  <script type="module" src="utils.js"></script>
  ```

  2. 以 `module` 方式加载的脚本可直接使用 ESM 语法；

  ```js
  import { debug } from './utils'
  ```

* ESM 语法实践：

  通过以下脚本能够获取到示例代码包，[示例源码点此访问](#ESM-实践代码)
  
  下方使用到库 anywhere，它是一个能够随时随地将你的当前目录变成一个静态文件服务器的根目录的工具，仓库介绍[点此访问](https://www.npmjs.com/package/anywhere)。
  
  ```sh
  $ wget https://resources.chenjianhui.site/esm-demo.zip
  $ unzip esm-demo.zip
  $ cd esm-demo && tree
  .
  ├── index.html
  ├── index.js
  └── utils.js
  $ yarn global add anywhere
  $ anywhere
  ```

* 使用 ESM 中常见的问题：

  1. Uncaught SyntaxError: Cannot use import statement outside a module.
  使用 ESM 语法的脚本需要使用 `type` 为 `module` 的标签引入。

  2. Uncaught TypeError: Failed to resolve module specifier "utils". Relative references must start with either "/", "./", or "../".
  使用 ESM 语法引入的包必须以 `/`，`./`，`../` 开头。

### 我们该如何使用 Vite？

```bash
$ yarn create vite-app <project-name>
$ cd <project-name>
$ yarn
$ yarn dev
```

## Vue3.0


# 实践

# 参考资料

* [vite —— 一种新的、更快地 web 开发工具 - 掘金](https://juejin.im/post/5ed9d652f265da76fa4b6b2d)
* [是什么尤大选择放弃Webpack？——vite 原理解析 - 小栈文章详情](https://z.itpub.net/dynamicdetail/69975286/17AAE12DC329E3E21D64A1DCF01DB0B0)
* [前端新工具--vite从入门到实战（一） - 知乎](https://zhuanlan.zhihu.com/p/149033579)
* [图说 ES Modules - 个人文章 - SegmentFault 思否](https://segmentfault.com/a/1190000014318751)

# 附录

## ESM 实践代码

1. index.html

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ESM Demo</title>
</head>
<script type="module" src="index.js"></script>
</html>
```

2. index.js

```js
import { debug } from './utils.js'
debug('ESM demo test.')
```

3. utils.js

```js
function debug() {
  console.log.apply(null, arguments)
}
export {
  debug
}
```