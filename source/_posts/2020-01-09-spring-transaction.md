---
title: 多数据源下SpringTransaction的探究
date: 2020-01-09 21:18:11
thumbnail: https://resources.chenjianhui.site/2020-01-09-home-pic.jpeg
categories: 
- 随笔
tags: 
- Spring
- Transaction
---

&emsp;&emsp;最近的项目开发中有部分同事反馈到现开发系统中存在一些声明式（注解）事务不生效的问题，经过一个多小时的排查最终定位了问题所在，在此记录一下。

<!-- more -->

# 前言

### 技术背景

现开发的系统使用`SpringBoot+JPA+Hibernate`作为基础框架进行开发，当然整体上还包括一些权限方面`Security`等和本次问题排查无关的信息不再详谈，以下是核心库的版本信息。

* SpringBoot：2.1.5.RELEASE
* Hibernate：5.3.10.Final

与常规系统不一样的地方在于，本系统由于业务的特殊性采用了双数据源的方案，既然是双数据源那么事务管理器方面也会对应配置两个。

### 双数据源实现方案

基于`JPA`实现双数据源并不麻烦，只需要建立两个配置类分别定义`DataSource、SessionFactory、PlatformTransactionManager`对象，其中`SessionFactory`配置好`Dao`层的扫描路径区分开即可，以下是配置的示例代码：

```java
@Configuration
public class SystemDSConfiguration {

    @Resource
    private Environment environment;

    /**
     * 系统数据源
     */
    @Primary
    @Bean
    public DataSource systemDataSource() {
        DruidDataSource druidDataSource = new DruidDataSource();
        druidDataSource.setUrl(environment.getProperty("spring.datasource.system.jdbc-url"));
        druidDataSource.setUsername(environment.getProperty("spring.datasource.system.username"));
        druidDataSource.setPassword(environment.getProperty("spring.datasource.system.password"));
        druidDataSource.setDriverClassName(environment.getProperty("spring.datasource.system.driver-class-name"));
        return druidDataSource;
    }

    @Primary
    @Bean
    public SessionFactory systemSessionFactory(DataSource dataSource) {
        LocalSessionFactoryBuilder sessionFactoryBuilder = new LocalSessionFactoryBuilder(dataSource);
        sessionFactoryBuilder.scanPackages("com.zjcds.tj.server.system");
        sessionFactoryBuilder.setProperty(AvailableSettings.SHOW_SQL, "true");
        return sessionFactoryBuilder.buildSessionFactory();
    }

    /**
     * 配置hibernate事务管理器
     * @return 返回事务管理器
     */
    @Primary
    @Bean
    public PlatformTransactionManager systemTransactionManager(DataSource dataSource) {
        return new JpaTransactionManager(systemSessionFactory(dataSource));
    }

}

@Configuration
public class BusinessDSConfiguration {

    @Resource
    private Environment environment;

    /**
     * 业务数据源
     */
    private DataSource businessDataSource() {
        DruidDataSource druidDataSource = new DruidDataSource();
        druidDataSource.setUrl(environment.getProperty("spring.datasource.business.jdbc-url"));
        druidDataSource.setUsername(environment.getProperty("spring.datasource.business.username"));
        druidDataSource.setPassword(environment.getProperty("spring.datasource.business.password"));
        druidDataSource.setDriverClassName(environment.getProperty("spring.datasource.business.driver-class-name"));
        return druidDataSource;
    }

    @Bean
    public SessionFactory businessSessionFactory() {
        LocalSessionFactoryBuilder sessionFactoryBuilder = new LocalSessionFactoryBuilder(this.businessDataSource());
        sessionFactoryBuilder.scanPackages("com.zjcds.tj.server.business");
        sessionFactoryBuilder.setProperty(AvailableSettings.SHOW_SQL, "true");
        return sessionFactoryBuilder.buildSessionFactory();
    }

    /**
     * 配置hibernate事务管理器
     * @return 返回事务管理器
     */
    @Bean
    public PlatformTransactionManager businessTransactionManager() {
        return new JpaTransactionManager(businessSessionFactory());
    }

}
```

### 声明式事务的使用

熟悉`SpringBoot`的同学应该都知道，声明式使用事务只需要在服务的实现类或者函数上写上`@Transactional`注解即可，所以本系统对于事务的使用也很简单，示例代码如下：

```java
package com.zjcds.tj.server.business.service.impl;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class BusinessService implements IBusinessService {

  private final BusinessDTO.DTOConverter businessDTOConverter = new BusinessDTO.DTOConverter();

  private final IBussinessDao businessDao;

  public BusinessVO saveBusiness(BusinessDTO dto) {
    log.debug("Save business {}", dto);
    BussinessEntity entity = businessDTOConverter.doForward(dto);
    bussinessDao.save(entity);
    throw new Exception("DB rollback test.");
  }

  // more code ...
}
```

这个服务按照预期的运行结果BussinessEntity业务实体不应该被持久化到数据库中，但这篇文章的出现代表代码的执行结果正好与预期相反，所以接下来就要排查一下为什么事务没有生效呢？

# 分析

分析问题的产生原因之前我们先要搞懂`@Transactional`是怎么起作用的，我尝试把**@Transactional 工作原理**作为关键字在`google`中搜索，看了一部分文章后总结了有以下几类

* 讲`@Transactional`用法一类（如何使用、声明式、命令式）
* 讲事务概念性一类（事务的属性和行为等等）
* 讲Spring实现事务的原理与核心类

结合搜索到的内容我准备按照自己的思路进源码看一看，毕竟源码面前无秘密。接下来我将叙述一下我如何从源码中找到我想要的东西。

### （一）整合搜索结果

刚才我说到结合搜索到的内容，但没说是什么内容，这里我给一下搜索内容中我认为比较重要的一些知识点：

1. SpringBoot有两种方式开启事务
  * 自动装载依赖于`TransactionAutoConfiguration`
  * 手动启用依赖于`@EnableTransactionManagemen`
2. Spring事务是基于AOP运作的，`TransactionInterceptor`是其切面的实现类
3. @Transactional中提供了一些配置如`transactionManager、rollbackFor`等等，`AnnotationTransactionAttributeSource`负责读取这些配置
4. PlatformTransactionManager作为Spring中事务管理器的定义，包括`getTransaction、commit、rollback`三个方法

现在你也有这些知识点了，马上我们将进入`Transactional`的源码解析部分。要看源码首先我们要找到入口，我们先看第一个知识点，由于我的项目中没有使用@EnableTransactionManagemen注解，所以事务是通过TransactionAutoConfiguration自动完成装载配置。

> SpringBoot自动装配有两种实现方式
> * 第一种是**类SPI机制**，通过扫描META-INF/spring.factories文件中的定义的类进行装配
> * 第二种是**@Import机制**，通过扫描@Import注解中定义的类进行装配

### （二）TransactionAutoConfiguration的探究

TransactionAutoConfiguration的代码如下，代码量并不多并且我大部分都给出了注释，接下来我们该如何去看这个代码呢？

**结合第二个知识点，Spring事务是基于AOP运作的**，既然是基于`AOP`那就一定会有切面的定义。

> SpringAOP的实现方式有两种
> * 第一种是**JDK代理**
> * 第二种是**Cglib代理**

```java
@Configuration
// 代表某个类型的Bean存在时此配置才加载
@ConditionalOnClass(PlatformTransactionManager.class)
// 代表当前类加载完成后将加载配置中的类
@AutoConfigureAfter({JtaAutoConfiguration.class, HibernateJpaAutoConfiguration.class,
        DataSourceTransactionManagerAutoConfiguration.class,
        Neo4jDataAutoConfiguration.class})
// 使@ConfigurationProperties注解生效
@EnableConfigurationProperties(TransactionProperties.class)
public class TransactionAutoConfiguration {

    // 定义一个Bean托管于Spring容器 函数返回值代表BeanType 函数名称代表BeanName
    @Bean
    // 代表Spring容器中没有与之匹配的Bean时 此配置加载
    @ConditionalOnMissingBean
    public TransactionManagerCustomizers platformTransactionManagerCustomizers(
            ObjectProvider<PlatformTransactionManagerCustomizer<?>> customizers) {
        return new TransactionManagerCustomizers(
                customizers.orderedStream().collect(Collectors.toList()));
    }

    @Configuration
    // 指定Bean在容器中只有一个 如果有多个需要用@Primary标记主体
    @ConditionalOnSingleCandidate(PlatformTransactionManager.class)
    public static class TransactionTemplateConfiguration {

        private final PlatformTransactionManager transactionManager;

        public TransactionTemplateConfiguration(
                PlatformTransactionManager transactionManager) {
            this.transactionManager = transactionManager;
        }

        @Bean
        @ConditionalOnMissingBean
        public TransactionTemplate transactionTemplate() {
            return new TransactionTemplate(this.transactionManager);
        }

    }

    @Configuration
    // 指定Bean存在时才加载此配置
    @ConditionalOnBean(PlatformTransactionManager.class)
    @ConditionalOnMissingBean(AbstractTransactionManagementConfiguration.class)
    // 不难发现 这里有关于aop的定义 我们将先观察此配置文件
    public static class EnableTransactionManagementConfiguration {

        @Configuration
        // 这里通过注解手动启用了事务模块
        @EnableTransactionManagement(proxyTargetClass = false)
        // 配置文件中指定值匹配时生效
        @ConditionalOnProperty(prefix = "spring.aop", name = "proxy-target-class",
                havingValue = "false", matchIfMissing = false)
        public static class JdkDynamicAutoProxyConfiguration {

        }

        @Configuration
        @EnableTransactionManagement(proxyTargetClass = true)
        @ConditionalOnProperty(prefix = "spring.aop", name = "proxy-target-class",
                havingValue = "true", matchIfMissing = true)
        public static class CglibAutoProxyConfiguration {

        }

    }

}
```

观察这个类你很快就能发现一个关键点，你要找到切面配置就在最下方`EnableTransactionManagementConfiguration`这个类中，而这个类又使用了`@EnableTransactionManagement`这个注解，而它也是我们前面提到手动开启事务的注解，所以无论如何我们都得关注一下它。

### （三）@EnableTransactionManagement的探究

首先我们看看@EnableTransactionManagement的代码

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(TransactionManagementConfigurationSelector.class)
public @interface EnableTransactionManagement {

    // 是否要创建基于Cglib的代理，否则创建JDK的代码
    boolean proxyTargetClass() default false;

    // 应该如何采用事务通知 Proxy 或者 Aspectj
    AdviceMode mode() default AdviceMode.PROXY;

    int order() default Ordered.LOWEST_PRECEDENCE;
}
```

对我来说，该代码就一个有效信息，加载了TransactionManagementConfigurationSelector这个配置类，所以接下来看看它的代码

```java
// AdviceModeImportSelector 提供根据AdviceMode的值进行配置切换的策略
public class TransactionManagementConfigurationSelector extends AdviceModeImportSelector<EnableTransactionManagement> {


    @Override
    protected String[] selectImports(AdviceMode adviceMode) {
        switch (adviceMode) {
            case PROXY:
                // 基于JDK代理实现切面配置 默认采用
                return new String[]{AutoProxyRegistrar.class.getName(),
                        ProxyTransactionManagementConfiguration.class.getName()};
            case ASPECTJ:
                // 基于ASPECTJ实现切面配置
                return new String[]{determineTransactionAspectClass()};
            default:
                return null;
        }
    }

    private String determineTransactionAspectClass() {
        return (ClassUtils.isPresent("javax.transaction.Transactional", getClass().getClassLoader()) ?
                TransactionManagementConfigUtils.JTA_TRANSACTION_ASPECT_CONFIGURATION_CLASS_NAME :
                TransactionManagementConfigUtils.TRANSACTION_ASPECT_CONFIGURATION_CLASS_NAME);
    }

}
```

如果不特殊配置，这里会默认采用JDK动态代理的方案，所以`AutoProxyRegistrar、ProxyTransactionManagementConfiguration`这两个配置类会被加载

1. AutoProxyRegistrar

```java
@Override
public void registerBeanDefinitions(..) {
    ...
    if (mode == AdviceMode.PROXY) {
        AopConfigUtils.registerAutoProxyCreatorIfNecessary(registry);
        if ((Boolean) proxyTargetClass) {
            AopConfigUtils.forceAutoProxyCreatorToUseClassProxying(registry);
            return;
        }
    }
    ...
}
```

2. ProxyTransactionManagementConfiguration

```java
@Configuration
public class ProxyTransactionManagementConfiguration extends AbstractTransactionManagementConfiguration {

    @Bean(name = TransactionManagementConfigUtils.TRANSACTION_ADVISOR_BEAN_NAME)
    // 用作Bean的分类
    @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
    // 事务增强器
    public BeanFactoryTransactionAttributeSourceAdvisor transactionAdvisor() {
        BeanFactoryTransactionAttributeSourceAdvisor advisor = new BeanFactoryTransactionAttributeSourceAdvisor();
        advisor.setTransactionAttributeSource(transactionAttributeSource());
        advisor.setAdvice(transactionInterceptor());
        if (this.enableTx != null) {
            advisor.setOrder(this.enableTx.<Integer>getNumber("order"));
        }
        return advisor;
    }

    @Bean
    @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
    // 事务注解信息读取
    public TransactionAttributeSource transactionAttributeSource() {
        return new AnnotationTransactionAttributeSource();
    }

    @Bean
    @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
    // 方法拦截器
    public TransactionInterceptor transactionInterceptor() {
        TransactionInterceptor interceptor = new TransactionInterceptor();
        interceptor.setTransactionAttributeSource(transactionAttributeSource());
        if (this.txManager != null) {
            interceptor.setTransactionManager(this.txManager);
        }
        return interceptor;
    }

}
```

**至此我们已经找到了事务方法拦截器`TransactionInterceptor`的定义之处，接下来就看看我们的方法被事务拦截后干了什么？**

### （四）TransactionInterceptor探究

阅读TransactionInterceptor这个类不难发现`invoke`即是事务拦截的主要实现，而它仅有两句代码而已，主要是调用了父类的`invokeWithinTransaction`方法。

```java
// MethodInterceptor 方法拦截接口 invoke作为具体实现函数
public class TransactionInterceptor extends TransactionAspectSupport implements MethodInterceptor, Serializable {

    public TransactionInterceptor() {
    }

    public TransactionInterceptor(PlatformTransactionManager ptm, Properties attributes) {
        setTransactionManager(ptm);
        setTransactionAttributes(attributes);
    }

    public TransactionInterceptor(PlatformTransactionManager ptm, TransactionAttributeSource tas) {
        setTransactionManager(ptm);
        setTransactionAttributeSource(tas);
    }


    @Override
    @Nullable
    // 事务方法拦截的具体实现 调用了父类的invokeWithinTransaction方法
    public Object invoke(MethodInvocation invocation) throws Throwable {
        // 获取代理的目标类
        Class<?> targetClass = (invocation.getThis() != null ? AopUtils.getTargetClass(invocation.getThis()) : null);
        return invokeWithinTransaction(invocation.getMethod(), targetClass, invocation::proceed);
    }


    //---------------------------------------------------------------------
    // Serialization support
    //---------------------------------------------------------------------
    private void writeObject(ObjectOutputStream oos) throws IOException {
        // ...
    }

    private void readObject(ObjectInputStream ois) throws IOException, ClassNotFoundException {
        // ...
    }

}
```

紧接着我们查看父类的invokeWithinTransaction方法，代码量虽然比较多，但是结合项目的配置很快就会发现，由于我们使用的是`JpaTransactionManager`所以后面的条件是不会进去的，因此我们只需要看前面一小段的代码即可，这段代码中有一个获取事务管理器的函数叫做`determineTransactionManager`，双数据源下的事务失效很有可能是事务管理器获取错误导致的。

```java
// BeanFactoryAware 为当前类提供了 BeanFactory 资源
// InitializingBean 当前类构造完成时将收到通知
public abstract class TransactionAspectSupport implements BeanFactoryAware, InitializingBean {

    @Nullable
    protected Object invokeWithinTransaction(Method method, @Nullable Class<?> targetClass,
                                             final InvocationCallback invocation) throws Throwable {

        TransactionAttributeSource tas = getTransactionAttributeSource();
        // 读取 @Transactional 中定义的属性
        final TransactionAttribute txAttr = (tas != null ? tas.getTransactionAttribute(method, targetClass) : null);
        // 根据定义的属性获取一个事务管理器
        final PlatformTransactionManager tm = determineTransactionManager(txAttr);
        final String joinpointIdentification = methodIdentification(method, targetClass, txAttr);
        if (txAttr == null || !(tm instanceof CallbackPreferringPlatformTransactionManager)) {
            // 由于本项目配置的是JpaTransactionManager 将进入此代码块
            // 必要时创建事务
            TransactionInfo txInfo = createTransactionIfNecessary(tm, txAttr, joinpointIdentification);

            Object retVal;
            try {
                // 执行被代理的函数并获取结果
                retVal = invocation.proceedWithInvocation();
            }
            catch (Throwable ex) {
                // 回滚事务并将异常原样抛出
                completeTransactionAfterThrowing(txInfo, ex);
                throw ex;
            }
            finally {
                cleanupTransactionInfo(txInfo);
            }
            // 提交事务并返回结果
            commitTransactionAfterReturning(txInfo);
            return retVal;
        }

        else {
            final ThrowableHolder throwableHolder = new ThrowableHolder();
            // ... more code
        }
    }
}
```

我们看到`determineTransactionManager`这个方法是根据`@Transactional`中的某些属性来获取事务管理器，接下来看看它具体是怎么实现的。

```java
@Nullable
protected PlatformTransactionManager determineTransactionManager(@Nullable TransactionAttribute txAttr) {
    if (txAttr == null || this.beanFactory == null) {
        // 返回方法拦截器中预先定义的事务管理器
        return getTransactionManager();
    }

    String qualifier = txAttr.getQualifier();
    if (StringUtils.hasText(qualifier)) {
        // 读取qualifier属性 如果其不为空则去Bean工厂中获取对应名称的事务管理器
        return determineQualifiedTransactionManager(this.beanFactory, qualifier);
    } else if (StringUtils.hasText(this.transactionManagerBeanName)) {
        // 如果方法拦截器中定义了名字则采用容器中同名的事务管理器
        return determineQualifiedTransactionManager(this.beanFactory, this.transactionManagerBeanName);
    } else {
        PlatformTransactionManager defaultTransactionManager = getTransactionManager();
        if (defaultTransactionManager == null) {
            defaultTransactionManager = this.transactionManagerCache.get(DEFAULT_TRANSACTION_MANAGER_KEY);
            if (defaultTransactionManager == null) {
                // 如果都不匹配就获取定义为主体的事务管理器
                defaultTransactionManager = this.beanFactory.getBean(PlatformTransactionManager.class);
                this.transactionManagerCache.putIfAbsent(
                        DEFAULT_TRANSACTION_MANAGER_KEY, defaultTransactionManager);
            }
        }
        return defaultTransactionManager;
    }
}
```

### （五）问题浮出水面

**经过debug分析我找到了事务失效的原因，由于我的Bussiness模块获取了System模块的事务管理器导致其事务失效。**这里有人可能会感到疑惑，获取了错误的事务管理器不会报错么？

这块我们可以这么分析，想想在`mysql`中我们是怎么开启事务的。

```bash
mysql> begin; # 数据库A开启事务
Query OK, 0 rows affected (0.00 sec)
 
mysql> delete from sys_user where id = 1; # 数据库A执行删除脚本
Query OK, 1 row affected (0.01 sec)
mysql> rollback; # 数据库A回滚
Query OK, 0 rows affected (0.01 sec)
 
mysql> 
```

同样Spring在使用事务时也是在远程执行脚本，只不过流程变成了下面这个样子，数据库A开启了事务我们却在数据库B执行脚本，理论上是不会报错的，但是数据库B的事务肯定不会生效。

```bash
mysql> begin; # 数据库A开启事务
Query OK, 0 rows affected (0.00 sec)
 
mysql> delete from sys_user where id = 1; # 数据库B执行删除脚本
Query OK, 1 row affected (0.01 sec)
mysql> rollback; # 数据库A回滚
Query OK, 0 rows affected (0.01 sec)
 
mysql> 
```

# 解决方案

既然问题已经找到了接下来要考虑下如何解决，其实上文很早的时候就提到了`@Transactional`有一个配置叫做`transactionManager`，可以指定当前启用事务的方法用哪个事务管理器。

```java
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
public @interface Transactional {

	@AliasFor("transactionManager")
	String value() default "";

	@AliasFor("value")
	String transactionManager() default "";

	// ...
}
```

所以最简单的一种方案就是给所有的`Service`实现类都加上指定事务管理器名称的`@Transactional`注解，但是我们的系统开发已经接近尾声，我不想一个一个去修改文件，有没有不修改原来的代码而采用新增代码的方式去解决呢？

办法当然是有的，整理一下前面提到的**获取事务管理器的流程**，大概如下所示：

1. `TransactionAttributeSource`组件负责解析`@Transactional`的配置得到`TransactionAttribute`
2. 读取`TransactionAttribute`中的`qualifier`用于获取一个具名的事务管理器

**如果我们能够替换一个`TransactionAttributeSource`的实现让其根据包名返回不同的事务管理器名称，即可完成上述需求。** 要替换我们就得知道这玩意儿在哪儿定义的，其实阅读源码的过程中我们已经看到过了，`ProxyTransactionManagementConfiguration`这个类负责了定义工作，我们只需要重新定义一个`ProxyTransactionManagementConfiguration`即可完成替换了，因为`TransactionAutoConfiguration`中有`@ConditionalOnMissingBean(AbstractTransactionManagementConfiguration.class)`的限定，而`AbstractTransactionManagementConfiguration`即是我们需要自定义配置的父类，自定义后事务的自动化配置将不会加载`EnableTransactionManagementConfiguration`，所以不会出现Bean的定义冲突问题。

```java
public class TransactionAutoConfiguration {

    @Configuration
    @ConditionalOnBean(PlatformTransactionManager.class)
    @ConditionalOnMissingBean(AbstractTransactionManagementConfiguration.class)
    public static class EnableTransactionManagementConfiguration {
      // more code...
    }

    // more code
}
```

废话不多说直接给代码，此配置可通过包名前缀实现动态切换事务管理器，撒花完结。

```java
@Configuration
public class MyProxyTransactionManagementConfiguration extends ProxyTransactionManagementConfiguration {


    /**
     * 重写了事务注解属性解析器的内容
     * 让其根据包名动态的获取事务管理器名称
     * 以达到不修改Service代码的前提下保证多数据源下的事务能够正常运行
     *
     * @return 事务注解属性解析器
     */
    @Bean
    @Role(BeanDefinition.ROLE_INFRASTRUCTURE)
    @Override
    public TransactionAttributeSource transactionAttributeSource() {
        return new AnnotationTransactionAttributeSource() {
            @Override
            public TransactionAttribute getTransactionAttribute(Method method, @Nullable Class<?> targetClass) {
                DefaultTransactionAttribute attribute = (DefaultTransactionAttribute) super.getTransactionAttribute(method, targetClass);
                if (attribute != null && attribute.getQualifier() == null) {
                    // 获取方法归属类的全名
                    String name = method.getDeclaringClass().getName();
                    if (name.startsWith("com.zjcds.tj.server.system")) {
                        attribute.setQualifier("systemTransactionManager");
                    } else if (name.startsWith("com.zjcds.tj.server.business")) {
                        attribute.setQualifier("businessTransactionManager");
                    }
                }
                return attribute;
            }
        };
    }
}
```