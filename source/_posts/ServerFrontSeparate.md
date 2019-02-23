---
title: 前后端分离开发模式的实践总结
date: 2019-02-23 11:03:25
description: SpringBoot+Vuejs+Nginx从开发至部署构建一个成熟的前后端分离应用
categories: 
- 前后端分离
tags: 
- SpringBoot
- vuejs
- Nginx
copyright: true
top: 12
---

![](http://pnb4x7vrc.bkt.clouddn.com/old-architecture.png)
<!-- more -->

# 前言

&emsp;&emsp; 实践前后端分离的开发模式已经有两年左右的时间了，对于前后端分离开发模式的概念在这里不做过多解释，本文主要是总结开发模式并构建一个较为成熟的前后端分离应用

# 技术选型

&emsp;&emsp; 关于技术选型方面线下国内比较流行的主要是SpringBoot+Vuejs这个技术栈，所以本文将基于这个技术栈来讲解，涉及到的技术主要有

* 环境
  * Java
  * Maven
  * Nodejs
  * Nginx
* 前端
  * vuejs
  * vuex
  * vue-router
* 后端
  * SpringBoot

# 环境准备

&emsp;&emsp; 这里简要引用Windows下的环境搭建，关于Linux(Centos7)的环境搭建会再部署架构中讲到

* Java : [JDK开发环境搭建及环境变量配置](https://www.cnblogs.com/smyhvae/p/3788534.html)
* Maven :[Maven开发环境搭建](https://www.cnblogs.com/youqc/archive/2017/10/15/7673913.html)
* Nodejs :[NodeJS、NPM安装配置与测试步骤(windows版本)](https://www.cnblogs.com/mq0036/p/5243209.html)
* Nginx :[windows下nginx的安装及使用](https://www.cnblogs.com/jiangwangxiang/p/8481661.html)

# 构建前后端分离工程

## 目录规划

```

```

## 后端工程

&emsp;&emsp;后端工程主要基于SpringBoot脚手架搭建，SpringBoot基础的集成环境搭建可以参考我的另一篇博客[SpringBoot集成环境搭建](http://chenjianhui.name/2019/02/21/SpringBoot/)，不过这次使用的后端工程会和教程的有所出入，主要是修改了maven打包的配置，以符合最终的目录生成结构

## 前端工程

# 部署架构

## 单点部署

## 集群部署