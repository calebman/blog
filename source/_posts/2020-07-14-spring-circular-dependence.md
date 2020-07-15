---
title: Spring 为什么要使用三级缓存？
date: 2020-07-14 21:08:14
thumbnail: https://resources.chenjianhui.site/2020-01-07-home-pic.jpeg
categories: 
- 后端
tags: 
- Spring
---

&emsp;&emsp;关于 Spring 为什么要使用三级缓存，而非二级缓存的问题，在网上有很多说法，查阅过很多文章总结了一下有以下几类理由：

1. 三级缓存解决了 AOP 增强对象的循环依赖问题。
2. 三级缓存不违背 Spring 在结合 AOP 跟 Bean 的生命周期的设计。
3. 三级缓存是为了提升了效率。

我先说我的观点，三级缓存是为了提升效率，下面我将论证我的观点，同时讲解清楚各级缓存的作用。

> 阅读本篇文章需要对 Spring 设计思路有一定的了解，在开始之前建议先阅读文章最底部[参考资料](#参考资料)中的部分文章。

# 序言

本篇文章以研究设计思路为主，在源代码方面不做过多的讲解，[参考资料](#参考资料)中已经有很多优秀的文章，图文并茂的描绘了代码运转流程。

## 一级缓存

一级缓存干的事情很简单，Spring 在完成了 Bean 的实例化、参数注入、初始化后总是需要有一个存储的地方吧，不可能用户每次获取 Bean 的时候都走一遍 createBean 流程，这可是一笔很大的性能开销，为避免这部分性能开销 Spring 就使用一级缓存存储这部分用户可直接使用的 Bean。

![](https://resources.chenjianhui.site/20200714150158.png)

> 作为一个简单的 IOC 容器，一级缓存就可以正常服务了，但是有一个特殊的场景可以把这个平衡打破，那就是循环依赖问题。
> 
> A -> B、B -> A，A、B 两个类互相作为对方的字段就构成了一个简单的循环依赖场景。按照上面设计的流程，在参数注入这一步就会出现无限循环的问题。

![](https://resources.chenjianhui.site/20200714151914.png)

## 二级缓存

为了解决循环依赖，Spring 引入了二级缓存，从设计思路上看，使用二级缓存解决循环依赖的方式很简单，刚我们说到 Bean 的创建分为实例化、参数注入、初始化三个大流程，我们只需要在实例化后将早期实例写入缓存，并且在参数注入阶段先读缓存，缓存未命中再走 Bean 的创建流程即可。

![](https://resources.chenjianhui.site/20200714151509.png)

**可以看到二级缓存已经能够解决掉循环依赖的问题了，那 Spring 为什么还需要设计一个三级缓存呢？**

我们回到文章开头提到的使用三级缓存的几类理由：

#### 1. 三级缓存解决了 AOP 增强对象的循环依赖问题

AOP 增强对象的功能是通过 [AbstractAutoProxyCreator](https://github.com/spring-projects/spring-framework/blob/master/spring-aop/src/main/java/org/springframework/aop/framework/autoproxy/AbstractAutoProxyCreator.java) 这个后置处理器完成的，我们完全可以在 Bean 实例化之后触发该处理器，而后将增强后的对象放置到二级缓存，也能够处理掉增强对象的循环依赖问题。

**所以并不需要三级缓存来解决 AOP 增强对象的循环依赖问题，二级缓存就能做到。更新后的流程如下所示：**

![](https://resources.chenjianhui.site/20200714164141.png)

#### 2. 三级缓存不违背 Spring 在结合 AOP 跟 Bean 的生命周期的设计

这句话取自[《面试必杀技，讲一讲Spring中的循环依赖-阿里云开发者社区》](https://developer.aliyun.com/article/766880)这篇文章的结论，简单理解就是：使用二级缓存会让 Bean 实例化之后就触发 AOP 后置处理，是违背 Spring 设计原则的，Spring 希望在 Bean 完成参数注入后再进行后置处理，所以使用三级缓存存储了 Bean 的创建工厂，这样没有循环依赖的 Bean 就不会触发工厂方法，在参数注入后再进行 AOP 代理，使其符合 Spring 的设计原则。

这个观点很有意思，二级缓存为了解决了 AOP 增强对象的循环依赖问题确实会有上面说到的问题，所有 Bean 的 AOP 后置处理都被提前到参数注入之前了。要反驳这个观点我们需要来看一段源代码，下方源代码出自[AbstractAutowireCapableBeanFactory#getEarlyBeanReference](https://github.com/spring-projects/spring-framework/blob/master/spring-beans/src/main/java/org/springframework/beans/factory/support/AbstractAutowireCapableBeanFactory.java#L970)：

![](https://resources.chenjianhui.site/20200714160636.png)

这段代码负责触发 AOP 后置处理，如果对象被类似于 @Transactional 注解作用，就会返回一个增强后的早期对象，重点我们来看一下接口 [SmartInstantiationAwareBeanPostProcessor](https://github.com/spring-projects/spring-framework/blob/master/spring-beans/src/main/java/org/springframework/beans/factory/config/SmartInstantiationAwareBeanPostProcessor.java) 的父类 [InstantiationAwareBeanPostProcessor](https://github.com/spring-projects/spring-framework/blob/master/spring-beans/src/main/java/org/springframework/beans/factory/config/InstantiationAwareBeanPostProcessor.java) 注释中描述的很清楚，该接口是在显式属性设置与自动装配前进行回调，所以我使用二级缓存让 Bean 实例化之后就触发 AOP 后置处理是没有问题的，符合 Spring 设计原则。

![](https://resources.chenjianhui.site/20200714160522.png)

#### 3. 三级缓存是为了提升了效率

这是我赞同的观点，那三级缓存相比二级缓存到底提升了哪一部分的效率呢？我们先来了解一下三级缓存干了什么事情。

## 三级缓存

与一、二级缓存不同，Spring 使用三级缓存存储了对象的创建工厂 [ObjectFactory](https://github.com/spring-projects/spring-framework/blob/master/spring-beans/src/main/java/org/springframework/beans/factory/ObjectFactory.java)，从代码上来看是这样的：

![](https://resources.chenjianhui.site/20200714162428.png)

![](https://resources.chenjianhui.site/20200714162432.png)

下面我们分两种情况来叙述三级缓存的工作流程：

#### 1. 有循环依赖的 Bean 加载流程

![](https://resources.chenjianhui.site/20200714170847.png)

在这里我们对比二级缓存的实现流程图来看：

![](https://resources.chenjianhui.site/20200714164141.png)

不难看出，三级缓存主要是将 AOP 的后置处理过程从 “立即处理” 变成了 “有循环依赖时处理”。这个微小的变更在有循环依赖的场景下性能差异不大，但是在普通没有循环依赖的 Bean 加载过程中性能差异就出现了。

#### 2. 没有循环依赖的 Bean 加载流程

![](https://resources.chenjianhui.site/20200714175142.png)

同样对比二级缓存的无循环依赖 Bean 加载流程来看：

![](https://resources.chenjianhui.site/20200714175132.png)

可以看到使用三级缓存为每一个没有循环依赖的 Bean 减少了一次 AOP 的后置处理操作。

换句话说，没有循环依赖的 Bean 不会执行 [AbstractAutowireCapableBeanFactory#getEarlyBeanReference](https://github.com/spring-projects/spring-framework/blob/master/spring-beans/src/main/java/org/springframework/beans/factory/support/AbstractAutowireCapableBeanFactory.java#L970) 方法，该方法的性能损耗主要在对 Bean 做反射取其注解（如 @Transactional）、类型等信息，用于判断是否需要进行 AOP 增强。且我们知道系统大多数的 Bean 都不会有循环依赖问题，这部分的性能优化是积少成多的。

**提个问题：没有循环依赖且需要增强的 Bean 在哪里做的 AOP 代理呢？**

答案是在 Bean 的初始化阶段，[AbstractAutowireCapableBeanFactory#initializeBean](https://github.com/spring-projects/spring-framework/blob/master/spring-beans/src/main/java/org/springframework/beans/factory/support/AbstractAutowireCapableBeanFactory.java#L606) 方法会通过 [applyBeanPostProcessorsBeforeInitialization](https://github.com/spring-projects/spring-framework/blob/master/spring-beans/src/main/java/org/springframework/beans/factory/support/AbstractAutowireCapableBeanFactory.java#L424) 调用 Spring 中所有实现 [BeanPostProcessor](https://github.com/spring-projects/spring-framework/blob/master/spring-beans/src/main/java/org/springframework/beans/factory/config/BeanPostProcessor.java) 接口的后置处理器，这里就包括 AOP 的后置处理器 [AbstractAutoProxyCreator](https://github.com/spring-projects/spring-framework/blob/master/spring-aop/src/main/java/org/springframework/aop/framework/autoproxy/AbstractAutoProxyCreator.java)。

![](https://resources.chenjianhui.site/20200714173151.png)

![](https://resources.chenjianhui.site/20200714173448.png)

# 总结

Spring 利用三级缓存做到有循环依赖时才进行早期对象的 AOP 代理，相比单纯使用二级缓存的方案，前者为没有循环依赖的 Bean 节省了一次 AOP 的后置处理扫描操作，由于该操作涉及使用反射，且没有循环依赖的 Bean 占比较大，因此该操作节省的性能是非常可观的。


# 参考资料

* [一文告诉你Spring是如何利用"三级缓存"巧妙解决Bean的循环依赖问题的【享学Spring】 - 云+社区 - 腾讯云](https://cloud.tencent.com/developer/article/1497692)
* [Spring 源码浅析——解决循环依赖 | huzb的博客](https://huzb.me/2019/03/11/Spring%E6%BA%90%E7%A0%81%E6%B5%85%E6%9E%90%E2%80%94%E2%80%94%E8%A7%A3%E5%86%B3%E5%BE%AA%E7%8E%AF%E4%BE%9D%E8%B5%96/)
* [面试必杀技，讲一讲Spring中的循环依赖-阿里云开发者社区](https://developer.aliyun.com/article/766880)
* [曹工说Spring Boot源码（29）-- Spring 解决循环依赖为什么使用三级缓存，而不是二级缓存 - 三国梦回 - 博客园](https://www.cnblogs.com/grey-wolf/p/13034371.html)