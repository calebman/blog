---
title: 高德地图结合贝塞尔曲线
date: 2019-09-06 18:56:12
thumbnail: https://resources.chenjianhui.site/2019-09-06-home-pic.jpg
categories: 
- 随笔
- 前端
tags: 
- Vue
- AMap
---

很久没更新博客了，并不是因为自己懒（绝对不是！），而是忙着上线公司项目（为了恰饭），最近项目提交测试，得空写一下最近积累的一些知识，今天这篇博客的主题是，**如何使用高德地图绘制一个抛物线**

<!-- more -->

## 前言

高德地图相关的内容我接触的还是比较少的，最近是因为项目需要在地图上显示**资源点到事故点的调度信息抛物线**，但是调度操作可能不止一次，这里我们需要把多次调度根据一定的**曲率**区分开来，就像这样

![](https://resources.chenjianhui.site/2019-11-20-exp.gif)

因此问题就变成了，如何使用高德地图通过两点绘制一条曲线

## 画线

要解决画曲线首先我们要知道怎么在高德地图画一条直线，首先参阅高德地图的api我们知道**巡航器**可以用作画线并且有抛物的效果，参考[此链接](https://lbs.amap.com/api/amap-ui/demos/amap-ui-pathsimplifier/simple-demo)

## 测试