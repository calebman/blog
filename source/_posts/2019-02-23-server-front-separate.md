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
---

![](https://resources.chenjianhui.site/2019-02-23-home-pic.png)
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
  * vue-cli
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

&emsp;&emsp;整体目录主要分为三块，如下所示

![整体目录结构](https://resources.chenjianhui.site/2019-02-23-root-folder.png)

&emsp;&emsp;打包后的目录主要分为三块，如下所示
![项目打包目录](https://resources.chenjianhui.site/2019-02-23-dist-folder.png)

## 后端工程

&emsp;&emsp;后端工程主要基于SpringBoot脚手架搭建，SpringBoot基础的集成环境搭建可以参考我的另一篇博客[SpringBoot集成环境搭建](/2018-02-21-build-springboot-env/)

&emsp;&emsp;首先创建一个只有Web功能的SpringBoot项目，修改其maven打包的配置实现以下两个功能

* 将打包的jar文件移动至dist目录下
* 将多环境配置文件从jar内部移动至外部的dist/config目录下

&emsp;&emsp;此项修改主要依赖于以下两个maven插件
* [maven-resources-plugin](http://maven.apache.org/plugins/maven-resources-plugin)
* [maven-antrun-plugin](http://maven.apache.org/plugins/maven-antrun-plugin)

&emsp;&emsp;详细的插件配置如下，在server/pom.xml的plugins标签下添加如下代码
```xml
<!--复制配置文件-->
<plugin>
    <artifactId>maven-resources-plugin</artifactId>
    <executions>
        <execution>
            <id>copy-resources</id>
            <phase>validate</phase>
            <goals>
                <goal>copy-resources</goal>
            </goals>
            <configuration>
                <outputDirectory>${project.basedir}/../dist/config</outputDirectory>
                <overwrite>true</overwrite>
                <resources>
                    <resource>
                        <directory>src/main/resources</directory>
                        <includes>
                            <include>**/*</include>
                        </includes>
                    </resource>
                </resources>
            </configuration>
        </execution>
    </executions>
</plugin>
<!--移动并重命名jar包-->
<plugin>
    <artifactId>maven-antrun-plugin</artifactId>
    <executions>
        <execution>
            <phase>package</phase>
            <goals>
                <goal>run</goal>
            </goals>
            <configuration>
                <target>
                    <move file="${project.basedir}/target/${project.artifactId}-${project.version}.${project.packaging}" tofile="${project.basedir}/../dist/${project.artifactId}-${project.version}.${project.packaging}" />
                </target>
            </configuration>
        </execution>
    </executions>
</plugin>
```
&emsp;&emsp;进入到server/pom.xml同级目录，执行mvn clean package指令，打包成功会在dist目录下生成编译后的jar文件，dist/config目录下生成项目的配置文件

## 前端工程

&emsp;&emsp;前端工程主要基于vue-cli脚手架创建，vue项目的环境搭建可以参照[vue-用Vue-cli从零开始搭建一个Vue项目](http://www.cnblogs.com/superlizhao/p/8664326.html)
&emsp;&emsp;现在创建一个基础的vue项目，修改config/index.js配置以实现打包的静态资源生成至dist/html目录

![前端打包配置修改](https://resources.chenjianhui.site/2019-02-23-front-build-config.png)

&emsp;&emsp;进入到front/package.json同级目录，执行npm run build指令，打包成功会在dist/html目录生成静态文件

## 集成测试

### 来个接口

&emsp;&emsp;编写一个获取用户信息的接口
```java
@SpringBootApplication
@Controller
public class ServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ServerApplication.class, args);
    }

    /**
     * 获取当前登录用户的个人信息
     *
     * @return 当前登录用户的个人信息
     */
    @RequestMapping("/user/me")
    @ResponseBody
    public Map<String, Object> me() {
        Map<String, Object> result = new HashMap<>();
        result.put("username", "admin");
        result.put("roles", Arrays.asList("admin", "normal", "none"));
        result.put("depts", Arrays.asList("办公室", "组织部"));
        result.put("menus", Arrays.asList("工作台", "系统管理"));
        return result;
    }
}
```

### 配置代理

&emsp;&emsp;配置以下前端工程的代理转发，用于解决开发环境接口调试的跨域问题
![](https://resources.chenjianhui.site/2019-02-23-front-proxy-config.png)

### 写个页面

&emsp;&emsp;写个前端页面测试后端接口，进入front/package.json同级目录执行npm i axios -s，修改HelloWord.vue组件为如下代码

```javascript
<template>
  <div class="hello">
    <h1 v-if="loading">{{ '正在加载用户信息' }}</h1>
    <h1 v-else-if="errMsg">{{ errMsg }}</h1>
    <div v-else>
      <p>username: {{userInfo.username}}</p>
      <p>roles: {{userInfo.roles}}</p>
      <p>depts: {{userInfo.depts}}</p>
      <p>menus: {{userInfo.menus}}</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
export default {
  name: 'HelloWorld',
  data () {
    return {
      loading: false,
      userInfo: {
        username: '',
        roles: [],
        depts: [],
        menus: []
      },
      errMsg: null
    }
  },
  created () {
    this.loading = true
    axios.get('/api/user/me').then(response => {
      this.userInfo = response.data
    }).catch(err => {
      console.error(err)
      this.errMsg = err
    }).finally(() => { this.loading = false })
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1,
h2 {
  font-weight: normal;
}
</style>
```

进入测试链接[http://localost:8081](http://localost:8081)

# 单点部署

## nginx配置

&emsp;&emsp;分离部署主要依赖于nginx来完成，利用nginx来分发前后端的内容，nginx的配置如下
```nginx

#user root;# linux下必须有此配置 不然会导致403权限不足
worker_processes  1;

#error_log  logs/error.log;
#error_log  logs/error.log  notice;
#error_log  logs/error.log  info;

#pid        logs/nginx.pid;


events {
    worker_connections  1024;
}


http {
    include       mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  logs/access.log  main;
    error_log logs/error.log error;

    sendfile        on;
    #tcp_nopush     on;

    #keepalive_timeout  0;
    keepalive_timeout  65;

    #gzip  on;
	
	server {
		listen       80;
		server_name  localhost;
		set $application_path C:/workspace/java/server-front-separate;# 这里的父级路径需要根据项目路径设置
		
		location /api {
		    proxy_pass http://localhost:8080/;
		    proxy_set_header Host $host;
		    proxy_set_header X-Real-IP $remote_addr;
		    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		}
		
		location / {
		    alias $application_path/dist/html/;
		    try_files $uri $uri/ /index.html last;# 解决页面刷新404问题
		    index  index.html index.htm;
		}
	}
}

```
## 打包前后端应用

* 前端应用: 进入front/package.json同级目录，执行npm run build指令
* 后端应用: 进入server/pom.xml同级目录，执行mvn clean package指令

## 编写快速启动脚本（支持多环境）

* linux下启动脚本start.sh

```bash
#!/bin/sh
# 常量定义
export BIN_PATH=$(cd `dirname $0`;pwd)
echo BIN_PATH:[$BIN_PATH]
cd $BIN_PATH
cd ..
export CONTEXT_PATH=`pwd`
echo CONTEXT_PATH:[$CONTEXT_PATH]
export LOG_PATH=/data/logs/sso
echo LOG_PATH:[$LOG_PATH]
# 需要指定启动的模式是test，还是prod，默认是test，如果不指定的话
ACTION_MODE=$1
if [ "$ACTION_MODE" = "" ]
then
	ACTION_MODE=test
fi
echo STARTING APPLICATION ACTION_MODE:[$ACTION_MODE]
# 判断log文件夹是否存在 不存在则创建
if [ ! -d $LOG_PATH ]; then
  mkdir $LOG_PATH
fi
# 删除历史的server.log文件
rm -f $LOG_PATH/server.log
# 后台启动应用 并输出控制台日志
nohup java -jar server-0.0.1-SNAPSHOT.jar --spring.profiles.active=$ACTION_MODE >> $LOG_PATH/server.log 2>&1 &
# 显示输出前二十行的日志
head -n 20 $LOG_PATH/server.log
```

* windows下启动脚本start.bat

```bash
@echo off
:: 设置jar名称
set JAR_NAME=server-0.0.1-SNAPSHOT
:: 常量定义
set BIN_PATH=%~dp0
echo BIN_PATH:[%BIN_PATH%]
cd %BIN_PATH%
cd ..
set CONTEXT_PATH=%cd%
echo CONTEXT_PATH:[%CONTEXT_PATH%]
echo JAR_NAME:[%JAR_NAME%]
:: 需要指定启动的模式是test，还是prod，默认是test，如果不指定的话
set /p ACTION_MODE_INPUT=请输入启动环境，不输入采用默认环境[test]:
if not "%ACTION_MODE_INPUT%" equ "" (set ACTION_MODE=%ACTION_MODE_INPUT%) else (set ACTION_MODE=test)
echo STARTING APPLICATION ACTION_MODE:%ACTION_MODE%
set PROCESS_NAME=JAVA_APP_%JAR_NAME%_%ACTION_MODE%
title %PROCESS_NAME%
echo PROCESS_NAME:[%PROCESS_NAME%]
:: 后台启动应用 并输出控制台日志
java -jar %JAR_NAME%.jar --spring.profiles.active=%ACTION_MODE%
```

* linux下关闭脚本stop.sh

```bash
#!/bin/sh
# 需要指定停止的模式是test，还是prod，默认是test，如果不指定的话默认取test
ACTION_MODE=$1
if [ "$ACTION_MODE" = "" ]
then
	ACTION_MODE=test
fi
echo STOPPING APPLICATION ACTION_MODE:[$ACTION_MODE]
pid=`ps -ef | grep server-0.0.1-SNAPSHOT.jar | grep $ACTION_MODE | grep -v grep | awk '{print $2}'`
# 判断进程是否再运行 在运行则终止
if [ -n "$pid" ]
then
   kill -9 $pid
   echo application stop success
else
   echo application already stop
fi

```

* windows下关闭脚本stop.bat

```bash
@echo off
:: 设置jar名称
set JAR_NAME=server-0.0.1-SNAPSHOT
:: 需要指定终止的模式是test，还是prod，默认是test，如果不指定的话
set /p ACTION_MODE_INPUT=请输入关闭应用的运行环境，不输入采用默认环境[test]:
if not "%ACTION_MODE_INPUT%" equ "" (set ACTION_MODE=%ACTION_MODE_INPUT%) else (set ACTION_MODE=test)
echo STARTING APPLICATION ACTION_MODE:%ACTION_MODE%
echo JAR_NAME:[%JAR_NAME%]
set PROCESS_NAME=JAVA_APP_%JAR_NAME%_%ACTION_MODE%
echo PROCESS_NAME:[%PROCESS_NAME%]
:: 杀死对应进程    
tasklist /nh /fi "WINDOWTITLE eq %PROCESS_NAME%"|find /i "cmd.exe" >nul
if ERRORLEVEL 1 (echo Application already stop) else (taskkill /fi "WINDOWTITLE eq %PROCESS_NAME%" >nul & echo Application stop success)
echo This window will close in 10 seconds
ping 127.1 -n 11 >nul
```

## 启动nginx以及后端服务

* windwos
  * 运行nginx.exe
  * 运行dist/bin/start.bat
* linux
  * nginx -s start
  * dist/bin/start.sh prod

# 源码获取

[https://github.com/calebman/server-front-separate](https://github.com/calebman/server-front-separate)