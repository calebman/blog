---
title: 随笔——缓存系列开篇一
date: 2019-01-07 19:20:21
thumbnail: https://resources.chenjianhui.site/2020-01-07-home-pic.jpeg
categories: 
- 随笔
tags: 
- Cache
---

跨过了2019来到了2020年，新年新气象，准备写一些**系列性质**的文章，旨在更好的对知识归纳总结，更系统的理解一块知识面。好的废话不多说，2020年开篇的主题是缓存系列，是个程序员或多或少都跟缓存打过交道，作为一个Java程序员大部分时候还是在应用层使用缓存，接触的缓存框架和中间件会比较多，但是**本系列并不想仅限于应用层讲述缓存**，我将从底层到CPU、操作系统，中层到浏览器、CDN，上层应用程序来讲述缓存的应用，通过这个系列能学习到缓存的应用场景及时机。

<!-- more -->

# 前言

新的一年我将稍微改变一下自己的文章排布，将复杂的问题作为一个系列分块讲述，提取模块的重点并减少单篇文章的篇幅，降低阅读时间。本篇文章作为缓存系列的开篇之作第一步自然是挖坑，本系列将从以下几个方面分多篇文章来讲述缓存。

1. 缓存系列开篇——缓存定义、浏览器、CDN中的缓存
2. 缓存系列二——操作系统、CPU中的缓存
3. 缓存系列三——应用程序中的缓存
4. 缓存系列四——常见的缓存中间件
5. 缓存系列五——缓存常见问题与总结

# 什么是缓存

关于定义你去搜索wiki、百度百科就会发现给出来的都是跟存储器相关的，这其实不是我想要的答案。

**我认为的缓存是一个抽象的概念，它可以是一个存储器、一个应用程序或者一个服务器，但不管它是什么东西，它的行为永远都是保存一份原始资源的副本并提供一个高速的访问途径，而有这个行为的任意东西都可以称之为缓存。**

知道缓存的定义后它的应用场景也就很清楚了，**当你有频繁读取的需求，且源数据访问速度远低于本地访问时，可采用缓存的解决方案。**

# 浏览器中的缓存

### 为何使用缓存

要知道浏览器为何使用缓存我们就得知道我们使用浏览器打开一个网页时，浏览器做了什么？

一个网页是由`HTML+JS+CSS+静态文件`组成的，当我们使用浏览器打开一个网页时，浏览器其实是在访问Web服务器的`HTML`、`JS`、`CSS`、静态文件（如图片、gif）等资源，做过Web开发的都知道`JS`与`CSS`以及静态文件在网站上线后基本不会改变，`HTML`作为网页结构如果是服务端渲染那么它是可变的。

结合这些知道再看看我们上面提到的缓存应用场景

1. 浏览器作为一个网页客户端，自然会有频繁请求网页的需求，即**频繁读取Web服务器的资源**
2. 浏览器访问Web服务器的速度肯定比访问本地的速度**慢一个量级**

于是浏览器就采用了本地缓存服务器资源的方式来减少发往服务器的请求，也提高了页面加载的效率，在用户使用时也会感受到第一次打开页面的时候有点慢，后面就快了很多。

**这里会有一个问题，浏览器不能缓存所有数据，这样会导致你网页重新发布了但是客户浏览器的网页确一直不更新，所以浏览器需要根据服务器的安排来缓存数据。**

### 如何使用浏览器缓存

服务器如何控制浏览器的缓存呢？这就得讲讲`HTTP协议`了，因为浏览器获取服务器资源都是通过此协议进行交互访问。为了更好的讲述浏览器缓存流程我截取了本人博客网站的一个`CSS`资源的响应体如下

```http
Request URL: https://chenjianhui.site/css/back-to-top.css
Request Method: GET
Status Code: 200 OK (from disk cache)
Remote Address: 120.79.79.226:443
Referrer Policy: no-referrer-when-downgrade
Accept-Ranges: bytes
Content-Length: 343
Content-Type: text/css
Date: Tue, 07 Jan 2020 02:19:37 GMT
ETag: "5e0aac7c-157"
Last-Modified: Tue, 31 Dec 2019 02:03:40 GMT
Server: nginx/1.15.12
Referer: https://chenjianhui.site/
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36

CSS Content ...
```

**重点关注以下几个响应头部信息**，这部分头部实现了**协商缓存**。

* Status Code：请求响应码，这里200代表成功，后面还有一个括号`from disk cache`描述了这个资源来自于本地磁盘的缓存。
* ETag：资源的特定版本的标识符，类似于资源的指纹（Hash值），用于提供给浏览器快速确定资源是否变化。
* Last-Modified：资源做出修改的日期及时间，通常被用作一个验证器来判断接收到的或者存储的资源是否彼此一致，由于精确度比`ETag`要低，所以这是一个备用机制。包含有`If-Modified-Since`或`If-Unmodified-Since`首部的条件请求会使用这个字段。

**那么整个网络请求的流程是怎样的呢？**

1. 客户端get请求资源，服务器返回资源，并在响应头中带上了`ETag`与`Last-Modified`的值，此时客户端将资源缓存在本地。
2. 客户端再次请求这个资源，在启用缓存的情况下，将上次请求的`ETag`属性值作为`If-None-Match`的值，`Last-Modified`的值作为`If-Modified-Since`随请求头发给服务器。
3. 服务器判断资源现有的`ETag`与`If-None-Match`的值是否相等，如果相等，会返回304和空的响应体。浏览器根据304取本地缓存。

**这就是浏览器缓存的全部了吗？** 当然不是，还有两个响应头部是用于浏览器缓存的，它们称之为**强制缓存**，分别是

* Expires： 响应头包含日期/时间，即在此时候之后，响应过期。如果是无效的日期代表资源已经过期。
* Cache-Control：通过指定指令来实现缓存机制，缓存指令是单向的。比如`Cache-Control: max-age=30`代表该资源可以缓存的30秒，`max-age`的优先级将高于`Expires`。

### 实践浏览器缓存

在知道了缓存头部的作用后，我们可以写一些代码来实践一下让浏览器缓存我们的数据。

> 由于使用Java代码启动一个HTTP服务器还需要经过编译过程太过麻烦，因此这里采用`Nodejs`来实现缓存示例

```js
const PORT = 3030;
const CACHE_SECONDS = 10;
// 加载http模块
var http = require('http');
// 创建http服务器
var server = http.createServer(function (req, res) {
  if (req.url === '/test.js') {
    // 设置缓存响应头部
    res.setHeader('Cache-Control', `max-age=${CACHE_SECONDS}, public`);
    res.end(`document.body.append('Load script test.js on ${new Date()}')`)
  } else {
    // 首页加载 test.js 脚本
    res.end(`<html><body><h1>Script will cache ${CACHE_SECONDS} seconds</h1></body><script src="http://localhost:${PORT}/test.js"></script></html>`);
  }
})
server.listen(PORT)
console.log(`Listening in http://localhost:${PORT}`)
```

这段代码可以拷贝到有`Nodejs`环境的机器中使用`node xxx.js`直接运行，它主要做了以下几件事情:

1. 监听3030端口启动了一个`HTTP`服务器，默认提供了一个`HTML`页面，该页面通过`script`标签加载了`test.js`脚本。
2. 当访问`test.js`脚本时设置了`Cache-Control: max-age=10, public`响应头部，即允许浏览器缓存该资源10秒。
3. `test.js`脚本向页面写入了一行字符串，该字符串包含了服务器响应脚本的时间`new Date()`。

现在我们通过浏览器测试一下缓存头部是否生效，运行脚本文件后在浏览器打开`http://localhost:3030`如下图所示。

![](https://resources.chenjianhui.site/2020-01-07-http-cache-exp-1.png)

可以看到这里显示加载脚本的时间是`14:12:13`，现在我们**十秒内刷新一下页面**，运行效果如下图。

![](https://resources.chenjianhui.site/2020-01-07-http-cache-exp-2.png)

这里可以看到显示效果上没有改变，但是网络监控方面显示脚本是从缓存中获取(from memory cache)，现在我们静候一段时间再点击刷新，脚本缓存失效重新从服务器上获取了最新资源，时间变成了`14:12:45`，运行效果如下图。

![](https://resources.chenjianhui.site/2020-01-07-http-cache-exp-3.png)

**有关其他的缓存头部可以根据相同的方式进行测试，多动手对自己理解这些`HTTP`响应头部以及协议会有很大的帮助。**

# CDN中的缓存

为什么`CDN`缓存要和浏览器缓存放一起说呢？因为它们都是为了**提高网页访问速度**而设计的。浏览器缓存是提高了**频繁请求资源**的速度，CDN缓存提高了**单次请求资源**的速度。

### CDN是什么

CDN是Content Delivery Network的简称，即“内容分发网络”的意思。一般我们所说的CDN加速，一般是指网站加速或者用户下载资源加速。

**那么它如何做到加速效果呢？**

就近访问原则，就如同你找水电燃气的缴费点，由于各个缴费点提供的服务是一样的，你肯定会选择离你最近的服务点进行缴费。同理在访问网页时我们也可以根据客户机的位置，为它选择一个最近的服务节点提供资源服务，寻找最近服务节点的这个过程就叫做CDN加速。

### CDN工作原理

了解`CDN`的工作原理之前我们先来看看传统网站的访问过程

1. 浏览器输入chenjianhui.site
2. 浏览器请求`DNS`服务器，查询到chenjianhui.site对应服务器的IP
3. 向该服务器发起HTTP请求得到网页、加载其他内容、渲染页面等等（这里简略了一些东西、比如我们上面聊到的浏览器缓存）

这里需要重点讲一下第2步，因为`CND`就是在这一步做了文章，其具体过程如下所示：

* `chenjianhui.site`解析成IP的具体过程
  1. 操作系统查询本地缓存（host文件或者是浏览器的缓存）是否有解析记录，有则直接使用，没有则进入第2步
  2. 操作系统向`LocalDNS`查询域名的IP地址，一般称运营商的DNS服务器为`LocalDNS`，这里`LocalDNS`会先查询本地缓存，没有则进入第3步
  3. `LocalDNS`向`RootDNS`查询得到权威服务器，传说中全球只有几台的那些服务器称之为`RootDNS`
  4. `LocalDNS`向权威服务器查询IP地址，缓存这个地址并将结果返回给客户端

`CDN`其实就是作用于域名解析的第4步，传统的网站第4步是返回一个IP地址，而加入`CDN`后这里一般返回一个`CNAME`记录

> 这里要补充一个知识点，常见的`DNS`解析记录有A，AAAA，CNAME等等，其中
> * A记录是域名到IPV4地址的
> * AAAA记录是域名到IPV6地址的
> * CNAME记录是域名到域名的，即你去问问这个域名，他知道该解析成什么

5. `LocalDns`得到一个`CNAME`记录，向智能调度DNS查询域名的ip地址
6. 智能调度DNS 根据一定的算法和策略(比如静态拓扑，容量等)，将最适合的CDN节点IP地址回应给`LocalDns`

# 参考资料

* [MDN ETag](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/ETag)
* [MDN Last-Modified](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Last-Modified)
* [MDN Cache-Control](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control)
* [CDN的原理以及其中的一些技术](https://colobu.com/2016/09/23/CDN-introduction/)

# 关于公众号

![](https://resources.chenjianhui.site/wechat-qrcode.png)