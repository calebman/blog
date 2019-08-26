---
title: Vue+SpringBoot单jar部署
date: 2019-08-15 20:11:21
thumbnail: https://resources.chenjianhui.site/thinking-home-pic.jpg
categories: 
- 前后端分离
tags: 
- Vue
- SpringBoot
---

在前后端分离的开发模式中，到项目的打包发布阶段我们一般都是会采用一个支持`HTTP`动静分离的中间件来部署前后端应用，最常见的就是`Nginx`，它不仅可以帮我们做动静分离，还可以做后端请求的负载均衡，这一部分的实现教程很多在此就不做过多解释，文本想讲的是如何不依赖中间件，将前端打包的内容嵌入后端，以一个`jar`发布。

<!-- more -->

# 思考

&emsp;&emsp;本人是基于`SpringBoot`+`Vuejs`来做前后端分离开发的，所以本次也基于这两个技术展来思考如何实现，在想如何不依赖中间件实现部署时我们得先思考**中间件为我们的前后端分离部署带来了什么？**

&emsp;&emsp;以`Nginx`举例，如下是前后端分离部署模式下的一个配置示例主要干了三件事情

* 使用`alias`实现静态资源的分发
* 使用`try_files`实现前端路由的转发，如**http://localhost/home**这个地址是对应不到静态资源的，这个时候就会触发404响应，`try_files`指令在对应不到静态资源时将内容转发到**/index.html**也就是前端首页，以此来实现`history`模式的前端路由
* 使用`proxy_pass`实现后端请求的分发

```nginx
location /front {
    alias $application_path/traffic-sso/html;
    try_files $uri $uri/ /index.html last;
    index index.html index.htm;
}

location /api/ {
    proxy_pass http://localhost:8080/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

&emsp;&emsp;在知道中间件完成的核心功能后，我们需要基于`SpringBoot`项目也去完成这么一套功能，既能实现集成部署了，我们现在一项一项功能分析一下

* 静态资源的分发：可通过配置静态文件映射来实现
* 前端路由的转发：可通过拦截器来实现
* 后端请求的分发：可通过拦截器来实现

&emsp;&emsp;总体来说实现上不是什么问题，静态文件映射配置很容易在此不做过多描述，问题主要在拦截器的实现，需要有两个拦截器分别实现以下两个分发

* `http://localhost:8080/front/**`  => `index.html`
* `http://localhost:8080/api/**` => `http://localhost:8080/**`


# 代码实现

&emsp;&emsp;观察上面拦截器其实主要就是实现一个路径匹配与处理器转发的功能，基于此需求我们定义`RewriteFilter.java`如下，这里使用`Spring Web MVC`的`AntPathMatcher`来做路径匹配器，使用了`Java8`的`Function`来做转发逻辑定义，代码比较简单就不做过多描述了

```java
/**
 * @author JianhuiChen
 * @description 基于转发逻辑的过滤器
 * @date 2019-08-22
 */
public class RewriteFilter implements Filter {
    
    private Logger log = LoggerFactory.getLogger(RewriteFilter.class);

    /**
     * 配置url通配符
     */
    private final String urlPattern;

    /**
     * 转发逻辑
     */
    private final Function<HttpServletRequest, String> rewriteHandler;

    /**
     * 路径匹配器
     */
    private AntPathMatcher pathMatcher = new AntPathMatcher();

    public RewriteFilter(String urlPattern, Function<HttpServletRequest, String> rewriteHandler) {
        this.urlPattern = urlPattern;
        this.rewriteHandler = rewriteHandler;
    }

    @Override
    public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;
        String servletPath = request.getServletPath();
        String context = request.getContextPath();
        // 匹配的路径重写
        if (pathMatcher.match(urlPattern, servletPath)) {
            String rewritePath = rewriteHandler.apply(request);
            log.debug("Rewrite {} to {}", servletPath, rewritePath);
            String fullPath;
            if (rewritePath.startsWith("/")) {
                fullPath = context + rewritePath;
            } else {
                fullPath = context + "/" + rewritePath;
            }
            req.getRequestDispatcher(fullPath).forward(req, resp);
        } else {
            chain.doFilter(req, resp);
        }
    }
}
```

&emsp;&emsp;现在我们将静态资源与拦截器配置使用

* 首先运行前端项目的打包指令将打包的静态资源拷贝到`SpringBoot`的`public/static/resources`目录下
* 配置前端路由的转发拦截器
```java
    @Bean
    public FilterRegistrationBean frontFilter() {
        FilterRegistrationBean<RewriteFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new RewriteFilter("/front/**", http -> "index.html"));
        registration.addUrlPatterns("/front/*");
        registration.setName("frontFilter");
        registration.setOrder(1);
        return registration;
    }
```
* 配置后端路由的转发拦截器
```java
    /**
     * 匹配前端请求前缀
     * 所有 /api/* 请求映射至 /*
     * exp /api/resources/users/me -> /resources/users/me
     */
    @Bean
    public FilterRegistrationBean apiFilter() {
        FilterRegistrationBean<RewriteFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new RewriteFilter("/api/**",
                http -> http.getServletPath().replaceFirst("/api", "")));
        registration.addUrlPatterns("/api/*");
        registration.setName("apiFilter");
        registration.setOrder(1);
        return registration;
    }
```

# 测试

&emsp;&emsp;打开浏览器输入链接[http://localhost:8080/front](http://localhost:8080/front)完成测试

# 其他

## AntPathMatcher相关记录

&emsp;&emsp;`AntPathMatcher`是`Spring`用于路径匹配的工具类，我们经常写的`@RequestMapping`就是的匹配逻辑就与它有关，它主要的匹配模式有以下三种

* `?` 匹配任何单字符
* `*` 匹配0或者任意数量的字符
* `**` 匹配0或者更多的目录

&emsp;&emsp;`AntPathMatcher`采用最长匹配原则，如`/api/**`与`/api/resources/**`来匹配`/api/resources/users/me`，后者会被成功匹配

