---
title: 使用 Vuepress 编写组件示例文档的最佳实践
date: 2020-05-31 21:09:46
thumbnail: https://resources.chenjianhui.site/2020-05-31-home-pic.jpg
categories: 
- 前端
tags: 
- vuejs
- vuepress
- plugin
---

&emsp;&emsp;这篇文章面向使用 `Vuepress` 来开发 `Vue` 组件文档库的用户服务，去年差不多这个时候我为公司开发了一个基于 AntDesignVue 封装的高阶组件库，经过一年的版本迭代与文档更新，收获了很多坑点，其中有一个就是关于组件示例维护相关的，今年有意重构组件库的文档与代码结构，后面会陆陆续续将踩到的坑点与相应的解决方案一一描述，好的进入今天的主题：**文档示例编写的最佳实践方案**。

<!-- more -->

> 关于最佳实践方案我提供了一个插件 [vuepress-plugin-demo-container](https://github.com/calebman/vuepress-plugin-demo-container) 来统一解决，插件的具体介绍、示例与使用文档 [点此访问](https://docs.chenjianhui.site/vuepress-plugin-demo-container/zh/)。

# 前言

## 什么是组件示例文档？

当你使用 Vue、React 或者其他语言编写了一个组件库，如 [Element UI](https://element.eleme.cn/2.0/#/zh-CN)、[Ant Design Vue](https://www.antdv.com/docs/vue/introduce-cn/) 或是像我一样基于它们开发的业务封装库，都需要使用文档来支撑，而使用文档必然会**包含代码与示例**，这部分就是组件示例文档。

举个例子，Element UI 的 [Color Picker](https://element.eleme.cn/2.0/#/zh-CN/component/color-picker) 组件文档，其中就包含了多份示例代码，假设我们现在完成了组件开发，需要使用 Vuepress 写一份和它一样的使用文档，该怎么做呢？

## 使用 Vuepress 构建组件示例文档

### 方案一

熟悉 Vuepress 的同学应该不难想到解决方案，由于 Vuepress 支持在 Markdown 中编写符合 Vue 语法的代码，所以我们可以这么写：

```html
## 示例展示
<template>
  <color-picker size="mini"></color-picker>
</template>
## 示例代码如下
```html
<template>
  <color-picker size="mini"></color-picker>
</template>
`` ` <= 删除左侧空格
```
### 方案二

如果示例中还包含 `export default {}` 代码块，我们可以借助 Vuepress 会自动注册 `components` 目录下组件的特性，或者通过 `enhanceApp.js` 钩子自己注册示例代码文件，然后使用 `<<< @/filepath` 语法将示例代码文件引入，这部分操作的具体文档可以 [点此查看](https://vuepress.vuejs.org/zh/guide/markdown.html#%E5%AF%BC%E5%85%A5%E4%BB%A3%E7%A0%81%E6%AE%B5)，这么操作下来写法变成了这样：

```html
## 示例展示
<color-picker-basic-demo></color-picker-basic-demo>
## 示例代码如下
```html
<<< @/docs/.vuepress/components/color-picker-basic-demo.vue
`` ` <= 删除左侧空格
```

### 方案三

当然这么做还不太行，我们还想要和 Element UI 或者 Ant Design Vue 一样漂亮的示例代码块，示例部分有框框包起来，代码部分可以省略/展开并提供复制功能、在线编辑功能。这倒也不难，我们可以自己开发一个 `DemoBlock` 组件来包裹组件示例，结构和样式都可以开发成你自己喜欢的样子，这部分做完后写法变成了这样：

```html
<demo-block source="<color-picker size=\"mini\"></color-picker>">
  <template slot="demo">
    <color-picker size="mini"></color-picker>
  </template>
</demo-block>
```

### 方案四

你会发现 `<<< @/filepath` 语法在组件内就不好使了，示例和代码得写两遍才行，而且代码还得作为一个 `String` 传递进去，那有没有办法在上述的实现基础上不写两边示例代码呢？

**办法当然是有的，程序员的智慧是无穷的**，[vuepress-plugin-extract-code](https://github.com/vuepress-reco/vuepress-plugin-extract-code) 这个插件给了解决方案，它手动解析了组件内的 `<<< @/filepath` 语法并将其转换成了代码文本，使用这个插件后写法变成了这样：

```html
<reco-demo>
  <color-picker-basic-demo slot="demo"></color-picker-basic-demo>
  <template slot="code-vue">
    <<< @/docs/.vuepress/components/color-picker-basic-demo.vue
  </template>
</reco-demo>
```

### 方案 Element UI

到这里我们已经演变了四个版本，暂停一下我们去看看 Element UI 的组件文档是怎么编写的，[点此查看 Color Picker 的文档](https://github.com/ElemeFE/element/blob/dev/examples/docs/zh-CN/color-picker.md)，不想点的直接看下方示例：

```html
::: demo 使用 v-model 与 Vue 实例中的一个变量进行双向绑定，绑定的变量需要是字符串类型。
``` html
<template>
  <color-picker size="mini" v-model="color"></color-picker>
</template>

<script>
  export default {
    data() {
      return {
        color: '#409EFF'
      }
    }
  };
</script>
`` ` <= 删除左侧空格
:::
```

上述示例的渲染结果 [点此查看](https://element.eleme.cn/2.0/#/zh-CN/component/color-picker)，就这个示例来看，他至少有两点好处：

1. **示例与代码不用写两遍**
2. **不复杂的示例可以直接写在 Markdown 中编写，不需要每个示例都建一个文件**

而对比方案四的好处就在于第2点，相比之下后者有更高的灵活度，而方案四需要每个示例都建一个 Vue 文件并且被 Vuepress 全局引入。

## 如何实现？

[vuepress-plugin-demo-container](https://github.com/calebman/vuepress-plugin-demo-container) 已经实现了上述最佳方案，在 Vuepress 中引入该插件即可获得想要的效果，关于该插件的介绍可以 [点此查看](https://docs.chenjianhui.site/vuepress-plugin-demo-container/zh/)，文档提供了**它的工作原理、渲染效果、与插件比较及使用方式**等描述，在这里我就不再赘述了，如果有建议或疑问可以通过或者评论或者 [Issus](https://github.com/calebman/vuepress-plugin-demo-container/issues) 提供给我，我将尽力解答。

# 关于公众号

![](https://resources.chenjianhui.site/wechat-qrcode.png)