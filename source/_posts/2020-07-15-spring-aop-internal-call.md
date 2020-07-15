---
title: 为什么 Spring AOP 无法拦截类内部调用？
date: 2020-07-15 18:30:11
categories: 
- 后端
tags: 
- Spring
- AOP
---

&emsp;&emsp;Spring AOP 想必大家都不陌生，经常写后端的同学肯定用过 @Transactional 注解，我们先来看一段代码：

```java
import org.springframework.aop.framework.AopContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author JianhuiChen
 * @description 内部调用 AOP 的示例
 * @date 2020-07-15
 */
@Service
public class ExpService {

    public void foo() {
        this.bar();
    }

    @Transactional(rollbackFor = Exception.class)
    public void bar() {
        // 一些数据库的写入、更新操作...
        throw new RuntimeException("抛出异常尝试触发数据库回滚");
    }
}
```

接下来写一段单元测试代码，调用 ExpService 的 foo 方法，请问函数调用能否触发数据回滚？

```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class ServerApplicationTests {

    @Resource
    private ExpService expService;

    @Test
    public void fooTest() {
        expService.foo();
    }
}
```

既然我都提这个问题了，答案肯定是不能触发，从表现上来看 foo 的 @Transactional 注解似乎 “失效了”，我们知道 @Transactional 注解依赖于 Spring AOP 机制实现，这个表现结果就是我们今天要讨论的问题：**为什么 Spring AOP 无法拦截类内部调用？**

# 写个例子

用 @Transactional 的例子还不足以代表 Spring AOP，下面我们针对 ExpService 写个函数调用日志记录的切面，将问题模拟出来。

```java
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;

/**
 * @author JianhuiChen
 * @description 服务层函数调用日志记录
 * @date 2020-07-15
 */
@Aspect
@Configuration
public class ServiceLogAspect {

    /**
     * 定义定点
     */
    @Pointcut("bean(expService)")
    public void excudePointcut() {

    }

    @Around("excudePointcut()")
    public Object aroundController(ProceedingJoinPoint pdj) throws Throwable {
        System.out.println(String.format("调用方法 %s，共 %d 个参数",
                pdj.getSignature().getName(), pdj.getArgs().length));
        return pdj.proceed();
    }
}
```

运行结果如下，可以看到函数 bar 并没有被 ServiceLogAspect 切面作用。

```
调用方法 foo，共 0 个参数

java.lang.RuntimeException: 抛出异常尝试触发数据库回滚

	at exp.aop.ExpService.bar(ExpService.java:28)
	at exp.aop.ExpService.foo(ExpService.java:15)
```

那么我们现在将 “@Transactional 注解在为何函数内部调用失效？” 这个问题，简化成了 “自定义的切面在为何函数内部调用失效？”，别小看这个简化的过程，现在我们至少不用分析 @Transactional 的内部处理逻辑了，这可是一个略微庞大的体系。

# 寻找原因

要分析上面的问题我们得有一些必要的知识储备，Spring AOP 是怎么运作的？有关这个问题相信你很容易通过搜索引擎得到想要的答案，本篇文章不做过多的说明，我们直接来分析问题的产生原因。

Spring AOP 是通过代理来实现的，使用 Java 来实现代理有两种方式，静态与动态代理，我们先用静态代理的方式将 ExpService 的代理类写出来，它应该是下面这个样子：

```java
/**
 * @author JianhuiChen
 * @description ExpService 的静态代理实现
 * @date 2020-07-15
 */
public class ExpServiceProxy extends ExpService {

    public void foo() {
        // 开启事务
        try {
            System.out.println("调用方法 foo，共 0 个参数");
            super.foo();
            // 提交事务
        } catch (Exception ex) {
            // 回滚事务
            throw ex;
        }
    }

    public void bar() {
        // 开启事务
        try {
            System.out.println("调用方法 bar，共 0 个参数");
            super.bar();
            // 提交事务
        } catch (Exception ex) {
            // 回滚事务
            throw ex;
        }
    }
}
```

可以理解为 ExpServiceProxy 就是我们使用 @Resource 注入的 ExpService，在单元测试调用 expService.foo() 时其实调用的是 ExpServiceProxy 的 foo 方法，我们稍微观察一下这个方法，主要是 super.foo() 这句代码，调用的是父类未被增强的函数，自然就不会触发切面的功能。

**那动态代理的类长什么样子呢？**

我们启动 SpringBoot 服务，通过 [arthas](https://alibaba.github.io/arthas/) 连接正在运行的服务，使用 [jad 指令](https://alibaba.github.io/arthas/jad.html) 将代理类反编译并输出到文件，执行的指令如下所示：

```sh
[arthas@8633]$ jad --source-only \
exp.aop.ExpService$$EnhancerBySpringCGLIB$$67b53145 \
> /data/ExpServiceProxy.java
```

截取动态代理类的部分内容如下所示：

```java
public class ExpService$$EnhancerBySpringCGLIB$$67b53145
extends ExpService
implements SpringProxy,
Advised,
Factory {
  // ....
    public final void foo() {
        MethodInterceptor methodInterceptor = this.CGLIB$CALLBACK_0;
        if (methodInterceptor == null) {
            ExpService$$EnhancerBySpringCGLIB$$67b53145.CGLIB$BIND_CALLBACKS(this);
            methodInterceptor = this.CGLIB$CALLBACK_0;
        }
        if (methodInterceptor != null) {
            Object object = methodInterceptor.intercept(this, CGLIB$foo$1$Method, CGLIB$emptyArgs, CGLIB$foo$1$Proxy);
            return;
        }
        super.foo();
    }

    public final void bar() {
        MethodInterceptor methodInterceptor = this.CGLIB$CALLBACK_0;
        if (methodInterceptor == null) {
            ExpService$$EnhancerBySpringCGLIB$$67b53145.CGLIB$BIND_CALLBACKS(this);
            methodInterceptor = this.CGLIB$CALLBACK_0;
        }
        if (methodInterceptor != null) {
            Object object = methodInterceptor.intercept(this, CGLIB$bar$0$Method, CGLIB$emptyArgs, CGLIB$bar$0$Proxy);
            return;
        }
        super.bar();
    }
  // ....
}
```

可以看到由于我们的类没有实现接口，Spring 使用 CGLIB 以继承的方式生成了代理类，可以看到代理类最后是通过父类的函数来执行具体业务逻辑，这一部分本质上和我们实现的静态代理没有区别。

# 如何解决

那我们非要调用内部方法也得到增强的效果该怎么办呢？了解原理后其实很简单，只需要得到增强后的对象即可，所以至少有以下两种办法可以做到：

1. 通过 @Resource 注入一个自身的代理对象。

```java
@Service
public class ExpService {

    @Resource
    private ExpService expService;

    public void foo() {
        expService.bar();
    }

    @Transactional(rollbackFor = Exception.class)
    public void bar() {
        // 一些数据库的写入、更新操作...
        throw new RuntimeException("抛出异常尝试触发数据库回滚");
    }
}
```

2. 通过 AopContext 获取当前上下文的代理对象。

```java
@Service
public class ExpService {

    public void foo() {
        if (null != AopContext.currentProxy()) {
            ((ExpService) AopContext.currentProxy()).bar();
        } else {
            this.bar();
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void bar() {
        // 一些数据库的写入、更新操作...
        throw new RuntimeException("抛出异常尝试触发数据库回滚");
    }
}
```

