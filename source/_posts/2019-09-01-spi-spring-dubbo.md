---
title: 随笔——Java SPI、Dubbo与SpringBoot
date: 2019-09-01 09:22:41
thumbnail: https://resources.chenjianhui.site/essay.jpg
categories: 
- 随笔
tags: 
- Java
- Spring
- Dubbo
---

在平时的自我学习中，总结归纳能力是非常重要的，使用已有的知识体系去预测未知的领域，然后再进行不断的自我修正，个人认为这是个不错的学习方法。今天我们就总结归纳一下如题的三块知识体系，寻找它们的共性与区别。

<!-- more -->

# 前言

## SPI是什么

`SPI`全称`service provider interface`是JDK中内置的服务发现机制，如何来理解这个服务发现机制，做Java开发的必然或多或少都了解`Spring`框架以及它的周边生态，Spring很好的利用工厂模式+配置文件实现了`IOC`容器，让Java Bean的实例化由**硬编码**变成了**可配置**，这是个**解耦**的操作，那服务发现机制它的目的是什么，它其实是一种Java Bean的动态替换发现的机制，类比Spring你就会发现他们解决的问题是一样的，都是为了让程序能够消除部分的**硬编码**。

## 什么是硬编码

为了能够更加深入的理解`SPI`机制，我们可能需要先明白硬编码是什么？为什么程序中要尽可能消除硬编码？在这里可以参考我的这篇文章：[详解控制反转](https://github.com/calebman/spring-note/blob/master/notes/ioc/%E8%AF%A6%E8%A7%A3%E6%8E%A7%E5%88%B6%E5%8F%8D%E8%BD%AC.md)

## SPI的使用场景

* 数据库驱动加载接口实现类的加载，JDBC加载不同类型数据库的驱动
* 日志门面接口实现类加载，SLF4J加载不同提供商的日志实现类
* Spring中大量使用了SPI，比如：对servlet3.0规范对ServletContainerInitializer的实现、自动类型转换Type Conversion SPI(Converter SPI、Formatter SPI)等
* Dubbo中也大量使用SPI的方式实现框架的扩展, 不过它对Java提供的原生SPI做了封装，以解决原生SPI带来的部分副作用

# Java SPI

我们都知道Spring是以xml的形式配置Java Bean，然后通过解析此文件完成Bean的实例化，Java SPI做的事情是类似的，它将读取META-INF/services目录下的文件，文件名称是接口的全限定名，内容为该接口实现类的权限定名，举个SPI的使用示例

1. 先定义一个接口与一组实现类如下

```java
package com.exp.spi;

public interface IService {
    String getServiceName();
}
public class MenuService implements IService {
    @Override
    public String getServiceName() {
        return "菜单服务";
    }
}
public class UserService implements IService {
    @Override
    public String getServiceName() {
        return "用户服务";
    }
}
```
2. 在 src/main/resources/ 下建立 /META-INF/services 目录，新增文件com.exp.spi.IService内容如下

```
com.exp.spi.MenuService
com.exp.spi.UserService
```
3. 使用 ServiceLoader 来加载配置文件中指定的实现

```java
public class SPIMain {
    public static void main(String[] args) {
        ServiceLoader<IService> services = ServiceLoader.load(IService.class);
        for (IService s : services) {
            System.out.println(s.getServiceName());
        }
    }
}
```

运行此程序将会输出以下内容

```
菜单服务
用户服务
```

看到这里你会发现这是不是特别像SpringBoot中我们定义的自动化配置文件`META-INF/spring.factories`，这里面写的也是自动化配置类的全限定名，其实它的实现原理和Java SPI是一样的，在了解SpringBoot SPI之前我们先来看看Java SPI的实现原理。

从入口函数来看很容易找到核心类，查看ServiceLoader源码如下

![](https://resources.chenjianhui.site/2019-09-01-service-loader.png)

代码量不多，我们主要来读一下load方法因为我们的例子中就是调用的它，可以看到它指向了构造函数，而构造函数调用了reload方法最终返回了一个迭代器

![](https://resources.chenjianhui.site/2019-09-01-service-loader-01.png)

![](https://resources.chenjianhui.site/2019-09-01-service-loader-02.png)

迭代器负责在遍历时调用newInstance方法构造配置文件中的接口实现类，所以这也要求实现类必须要有一个无参构造，由于返回的是一个迭代器，如果你只想使用其中一个类，比如我们的例子中你只想用UserService，你必须要遍历全部的服务才能筛选出你要的那个类，而这么做全部的实现类都将被实例化，造成了资源的浪费，正是因为这些**副作用**的存在，很多框架才去实现了自己的SPI。

![](https://resources.chenjianhui.site/2019-09-01-service-loader-03.png)

# SpringBoot SPI

SpringBoot的SPI机制由spring-core工程中的org.springframework.core.io.support.SpringFactoriesLoader实现，源码如下，代码比较简单就不做过描述了，这里要讲的是如果能在看到并且理解了Java SPI的时候就关联到了SpringBoot的自动化配置原理，就拥有了举一反三的学习能力，这才是最重要的。

![](https://resources.chenjianhui.site/2019-09-01-spring-factories-loader.png)

# 小结 SPI

看到这里其实都能够清楚知道SPI的大概用法与应用场景，刚才我们也说到Java SPI的一个缺点就是无法做到按需加载，那么它还有没有别的缺点。

回到最初的例子，基于IService我们设计了UserService与MenuService，假设现在我有一个需求要在UserService中去调用MenuService的服务，使用Java SPI就无法实现**动态注入**的功能，那么SpringBoot SPI有没有对动态注入的功能提供支持呢？我们不妨看看代码

![](https://resources.chenjianhui.site/2019-09-01-spring-factories-loader-init.png)

不难发现这里也是调用newInstance方法来完成实例化的，所以也需要有一个无参构造函数，所以不能通过构造函数做参数注入，但是我们写自动化配置类的时候是可以使用注解完成Java Bean的动态注入的，这里的蹊跷之处有兴趣的同学可以自己去挖一挖，在有了入口并了解了Spring的核心组件的前提下，这一部分并不难懂，这也是在学习上举一反三的好时候。


# Dubbo SPI

有关Dubbo SPI它的实现就较为复杂了，它的配置与上面讲的方式也稍有不同，比如我们的例子的配置需要更改成

```properties
menuService=com.exp.spi.MenuService
userService=com.exp.spi.UserService
```

不难看出这是个键值对的配置方式，等号左边是该服务的key，右边为服务的全限定名，关于Dubbo SPI的具体说出可以参考[Dubbo 之于 SPI 扩展机制的实现分析](http://www.zhenchao.org/2017/12/17/rpc/dubbo-spi/)这篇文章，因为他讲的比我好，溜了


# 参考资料

* [理解的Java中SPI机制](https://juejin.im/post/5b9b1c115188255c5e66d18c)
* [Dubbo 之于 SPI 扩展机制的实现分析](http://www.zhenchao.org/2017/12/17/rpc/dubbo-spi/)
* [JDK和Spring中SPI的实现原理和区别](https://my.oschina.net/kipeng/blog/1789849)

