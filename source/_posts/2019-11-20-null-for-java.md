---
title: Java随笔——如何防止空指针
date: 2019-09-06 18:56:12
thumbnail: https://resources.chenjianhui.site/2019-09-20-home-pic.png
categories: 
- 随笔
- 后端
tags: 
- Java
---

&emsp;&emsp;很久没写博客啦，因为前段时间公司项目忙着上线（**绝对不是因为懒！**），公司事为大，现在稍微闲了点，整点随笔写写别荒废了自个的写作能力。今天的主题是**空指针**，这玩意儿在咱们的开发生涯中应该是出现最多的异常吧，今天我就讲讲如何在程序中**有效的防止**该异常的出现。

<!-- more -->

## 前言

最近读了一篇有意思的博客叫做**[空指针漫谈](https://github.com/MichealYang/Blog/issues/4)**，里面标注的原文链接已经失效了，所以我链了转载的地址。这篇博客讲述了**空指针**设计的起源（没想到原因仅仅是因为空指针的实现简单而已！），并在后续给出了一些放空指针异常的解决方案，所以今天我就针对**如何在Java语言中有效的防止空指针**这个问题展开讨论，本文基于JDK1.8进行讲述。

## 为何产生空指针

### 从程序的角度

`null`作为程序的一个特殊状态，在`Java`中，除了基本类型以外的所有引用类型都可以赋值为`null`，如果变量的值为`null`，那么接下来用它调用成员函数式便会抛出空指针异常

```java
public class NullPointTest {

    public static void main(String[] args) {
        List<String> strList = null;
        // NullPointException
        System.out.println(strList.size();
    }
}
```

### 从人为的角度

其实判断代码是否可能出现空指针并给出健壮性的代码不难实现，只需要先判非空再调用即可，但是就如**[空指针漫谈](https://github.com/MichealYang/Blog/issues/4)**此文所说

> 在某些地方，程序员可能会觉得某个变量从逻辑上可以保证它不会为空，于是就省略掉了空指针检查。
可是，时过境迁之后，因为代码的各种变化，导致这样的前提不再成立的时候，空指针异常就发生了，代码因此非常脆弱。
而有些谨慎的程序员，为未雨绸缪计，会在各个地方都加上保护性的空指针检查，又让代码变得非常臃肿。

总结来说就是空指针判断**全加代码臃肿，不加代码脆弱**，极端的方式并不能很好的解决此问题，我们要寻求一种合理的解决方式。


## 解决方案

### 更安全的使用API

这部分就是一些日常开发经验了，比如`str.equals("abc")`与`"abc".equals(str)`实现的效果相同，但是后者不存在空指针异常的可能性，同理的还有`str.toString()`与`String.valueOf(str)`等等，这部分技巧的掌握程度跟你的踩坑经验成正比，坑踩多了当然就记住了。

### 使用空注释

`@NonNull`与`@Nullable`两个注解可以告诉IDE此位置你是否允许空值出现，他支持使用在以下位置

- 方法参数
- 方法返回
- 局部变量
- 字段

这种**约定式设计**可以让**调用者有责任**不传递空值，通过`@NonNull`也可以告诉**调用者**此处可以不做空值校验请大胆使用，代码时过境迁之后维护者看到此注解也能明白此方法需要保持其逻辑返回不可为空

### 使用Optional包装结果

`Optional`类是`Java8`提供的一个新特性，它是为了解决空指针异常而引入的，而且，它是基于函数式风格设计的。首先我们来看看它是怎么解决空指针的呢？且听我娓娓道来

**如何防空？给空对象做一个包装**，什么叫做给空对象做一个包装？看看下面的代码

![](https://resources.chenjianhui.site/2019-09-21-code-t01.png)

这里定义了一个`ValueWarp`类用于包装函数的响应结果，`randomNullContentWarp`函数负责随机返回带有空内容的值包装而不直接返回空对象，`main`函数中循环调用此函数打印内容，这里我将重点讲一下ValueWarp中以下三个函数的设计

- **get**：获取包装内容，内容不存在时抛出`NoSuchElementException`异常
- **orElse**：获取包装内容，当包装内容不存在时采用用户传入的备选内容
- **ifPresent**：当包装内容不为空时调用用户传入的**内容消费行为**，这里用到了一个java8函数式编程库中的`Consumer`接口，相关说明在**[如何优雅的遍历树结构](/2019-08-29-essay)**这篇博客中有讲到

其实`get`方法并不能很好的防止由于空指针带来的异常问题，而`orElse`与`ifPresent`则可以防止此问题出现，最佳的实践方式应该是当你有**备选值**时使用`orElse`函数，当你只是想非空时执行则使用`ifPresent`函数，如上述例子中的`warp.ifPresent(o -> System.out.println(o));`代表非空时打印包装内容

**回到`Optional`类，我们看看它的代码**

![](https://resources.chenjianhui.site/2019-09-21-code-t03.png)

代码不多且不是很难懂，很多api都是以函数式的风格去设计的，确实其中部分api很适合用函数式的风格，为什么呢？举个例子，下述代码循环调用了一个可能产生空对象的函数，并打印符合数字大于3这个条件的字符串`I am ${数字内容}`

![](https://resources.chenjianhui.site/2019-09-21-code-t04.png)

这段代码**简洁性**不用多说，并且不需要考虑包装内容为空的情况，因为包装类已经给你内部统一好了处理逻辑，你可以把防空判断给去除，将代码重心放到业务上

## 总结

看到这里我想你对如何防止空指针已经有了一些思路了，总结来说分了三方面去防护

1. 对于明确了非空的位置使用`@NonNull`注释来告知维护/调用者
2. 对于不明确返回是否可空的函数使用`Optional`进行包装后返回，调用者可通过`ifPresent`方法来进行非空调用
3. 对于字符串类型可以更安全的去使用部分API

**最后，祝愿大家以后的代码永远没有空指针！**:star2:

## 参考资料

* [空指针漫谈](https://github.com/MichealYang/Blog/issues/4)
* [使用空注释——IBM](https://www.ibm.com/support/knowledgecenter/zh/SS8PJ7_9.6.1/org.eclipse.jdt.doc.user/tasks/task-using_null_annotations.htm#design_by_contract)
* [Java函数式开发——优雅的Optional空指针处理](https://my.oschina.net/chkui/blog/739034)