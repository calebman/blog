---
title: 前后端分离模式下的DevOps
date: 2019-03-01 11:03:25
description: Jenkins+Git+Maven+Nodejs实现前后端分离项目的自动化运维
categories: 
- 运维
tags: 
- jenkins
- maven
- nodejs
- devops
copyright: true
---

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-home-pic.jpg)
<!-- more -->

# 背景概述

## 理解Devops

&emsp;&emsp; [维基百科](https://zh.wikipedia.org/wiki/DevOps)对Devops的定义是：一种重视“软件开发人员（Dev）”和“IT运维技术人员（Ops）”之间沟通合作的文化、运动或惯例。透过自动化“软件交付”和“架构变更”的流程，来使得构建、测试、发布软件能够更加地快捷、频繁和可靠。

&emsp;&emsp;自动化运维以及持续集成部署是Devops的核心思想，当你发现自己每天花费了大量的时间在等待程序**打包/上传至服务器等**过程中时，你就应该思考，是否需要将这些重复性的行为交给机器去做，来解放自己花费在这部分的时间。

## 我为何要引入Devops

### 背景简介

&emsp;&emsp;楼主是一个常年在二三线城市小公司漂泊的苦逼程序员，小公司的特性就是一人当三人使，一个人兼做开发测试加运维，公司采用敏捷开发模式，现有平台**4套**，大部分都是前后端分离的系统，由于功能调整的比较快导致部署演示的频次非常高，最多会出现一天部署**10次**左右，再加上ssh文件上传与webpack的打包程序的运行时间较长，最快的**本地打包**+**ssh上传**+**启动远程运行脚本**的流程走下来也得5min左右，所以光部署这一块花费的人力成本已经不可忽略了。

### 应用架构简介

&emsp;&emsp;楼主公司的web应用主要采用SpringBoot+Vuejs前后端分离开发模式，打包后的应用由Nginx来动静内容分发，应用架构的详情可见我的另一篇博客[前后端分离开发模式的实践总结](/2019-02-23-server-front-separate/)，源代码获取[点击这里](https://github.com/calebman/server-front-separate)，本文也将围绕着这个结构的工程来做自动化部署。

### 冲突与问题

* 等待程序打包时间过长（特别是webpack的打包），大部分时间在等待，这件事在进行中也不好做别的事情
* 重复性劳动过多，每次打包都是运行打包脚本，上传打包后的文件夹，运行远程启动脚本
* 容易出错，假设现有的环境是两套（演示与生产），那么远端运行脚本需要根据环境的不同来传递不同的环境变量，人为错误极易发生

### 理想环境

* **程序员**提交代码至dev分支，此时触发演示环境的打包部署程序
* **技术老大**提交代码至master分支，此时触发生产环境的打包部署程序
* 打包成功/失败/中断通知到钉钉工作群

# Devops实践

## Windows10环境搭建

* java：[JDK开发环境搭建及环境变量配置](https://www.cnblogs.com/smyhvae/p/3788534.html)
* tomcat：[Windows安装和配置Tomcat](https://blog.csdn.net/haishu_zheng/article/details/50768272)
* git：[Git安装教程](https://www.jianshu.com/p/414ccd423efc)
* jenkins
  * [点此下载jenkins的war包](http://mirrors.jenkins-ci.org/war/latest/jenkins.war)
  * 将jenkins.war复制到tomcat服务器的webapps目录下
  * 配置jenkins的工作目录，在我的电脑-属性-高级系统设置-环境变量-添加系统变量JENKINS_HOME，内容是一个空的文件夹，作为jenkins的工作目录。**如果不想设置系统环境变量**也可以修改加载有jenkins.war的tomcat目录下的conf\context.xm文件，如下设置JENKINS_HOME
  * 访问jenkins的主页[http://localhost:8080/jenkins](http://localhost:8080/jenkins)

```xml
<!-- tomcat context.xml 环境变量设置 -->
<Context>
  <!-- 设置jenkins的工作目录 -->
  <Environment name="JENKINS_HOME" value="C:/jenkins/" type="java.lang.String"/>
</Context>
```

## CentOS7.3环境搭建

&emsp;&emsp;在CentOS7下搭建jenkins和Windows环境差不多，jenkins是一个依赖于web容易的war包，所以只要有java与tomcat环境即可

### git环境

```bash
# 判断git是否已存在 打印内容则代表存在
git --version
# 不存在则安装 出现complete说明安装成功
yum install -y git
```

### jdk环境

1. jdk1.8下载：[点此下载](https://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jdk-downloads.png)

2. 解压配置

```bash
mkdir /usr/java
# 使用Xftp将下载的jdk放到此目录
cd /usr/java
# 解压jdk
tar -zxvf jdk-8u201-linux-x64.tar.gz 
# 修改配置文件
vim /etc/profile
# 文件末尾添加java的环境变量

JAVA_HOME=/usr/java/jdk1.8.0_201
JRE_HOME=/usr/java/jdk1.8.0_201/jre
PATH=$PATH:$JAVA_HOME/bin:$JRE_HOME/bin
CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar:$JRE_HOME/lib
export JAVA_HOME JRE_HOME PATH CLASSPATH

# 使得配置生效
source /etc/profile
# 测试配置
java -version
```

### tomcat环境

1. tomcat8下载：[点此下载](https://tomcat.apache.org/download-80.cgi)

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-tomcat-downloads.png)

2. 解压配置

```bash
# 使用Xftp将下载的tomcat放到此目录
mkdir /usr/tomcat
cd /usr/tomcat
# 解压tomcat
tar -zxvf apache-tomcat-8.5.38.tar.gz 
# 测试运行
cd apache-tomcat-8.5.38
sh bin/startup.sh
# 检测服务是否成功启动 打印了进程即说明启动成功
netstat -nlp|grep 8080
# 稍微清理一下tomcat 删除没有用的项目
rm -rf /usr/tomcat/apache-tomcat-8.5.38/webapps/*
# 配置自动启动 /etc/rc.d/init.d 为启动运行脚本的目录
cd /etc/rc.d/init.d
# 创建自启动脚本
touch tomcat
# 写入脚本信息
vim tomcat
# 脚本信息如下 以下注释信息也需要复制进脚本文件 
# 如果缺少了chkconfig:234 20 80这个注释会报错无法识别为自启脚本

#!/bin/sh
#chkconfig:234 20 80  
#description:tomcat
JAVA_HOME=/usr/java/jdk1.8.0_201
export JAVA_HOME
PATH=$JAVA_HOME/bin:$PATH 
export PATH
tomcat_path=/usr/tomcat/apache-tomcat-8.5.38/bin
case "$1" in
        start)
                echo "start tomcat service.."
                sh ${tomcat_path}/startup.sh
                ;;
        *)
        exit 1
        ;;
esac

# 赋予权限
chmod 755 tomcat
# 注册tomcat服务自启
chkconfig --add tomcat
# 测试服务是否能够自启 先停止运行中的tomcat
sh /usr/tomcat/apache-tomcat-8.5.38/bin/shutdown.sh
service tomcat start
netstat -nlp|grep 8080
# 查看所有注册自启的服务
chkconfig
```

### jenkins环境

1. jenkins下载：[点此下载](http://mirrors.jenkins-ci.org/war/latest/jenkins.war)

2. 配置

```bash
mkdir /usr/jenkins
# 使用Xftp将下载的tomcat放到此目录
cd /usr/jenkins
# 复制jenkins.war至tomcat/webapps目录
cp jenkins.war /usr/tomcat/apache-tomcat-8.5.38/webapps
# jenkins.war会自动解包启动 进入tomcat/webapps目录查看 jenkins.war已经解包成了文件夹
cd /usr/tomcat/apache-tomcat-8.5.38/webapps
ls
# 修改tomcat环境配置将jenkins的工作目录切换至/home/app/jenkins
vi /usr/tomcat/apache-tomcat-8.5.38/conf/context.xml
# Context标签下添加以下内容

<Environment name="JENKINS_HOME" value="/home/app/jenkins" type="java.lang.String"/>

# 重启tomcat
cd /usr/tomcat/apache-tomcat-8.5.38
sh bin/shutdown.sh
sh bin/startup.sh
# 检查工作目录切换是否成功 有文件即成功
cd /home/app/jenkins
# 清空原先的工作空间 jenkins默认工作空间为 /root/.jenkins
rm -rf /root/.jenkins
```

## 配置Jenkins

### Jenkins的初始化

> 第一次进入jenkins时会要求使用初始密码解锁，按照提示操作就行了

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-init-password.png)

> 之后会提示你安装插件，在这里我们采用默认安装必要的插件即可，其他的插件我们可以在系统内部再去安装

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-customize-jenkins.png)

> 耐心等待插件安装完毕

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-default-install.png)

> 初始化完成，配置管理员用户

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-init-admin-user.png)

> 配置jenkins实例地址，举个例子解释实例配置的地址用处
>
> 假设你做了项目打包成功或者失败的通知，jenkins构建的默认通知信息里会带有一个进入系统的链接地址，方便用户直接从**邮件/钉钉**等地方进入系统查看构建详情，这个地址即是此处配置的实例地址

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-url-config.png)

> 所有配置完成后，成功进入系统

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-config-success.png)

### Jenkins的环境配置

#### 环境需求分析

1. 拉取远端master分支代码：**Git插件**
2. 运行前端打包脚本：**Nodejs环境**
3. 运行后端打包脚本：**Java环境+Maven插件**
4. 推送装有构建代码的文件夹：**SSH文件传输插件** 
5. 运行远程启动脚本：**SSH脚本运行插件**

#### 配置插件

&emsp;&emsp;对应**jenkins/系统管理/插件管理**目录，根据上述的打包流程得出插件需求，在[baidu](https://www.baidu.com)/[google](https://www.google.com)搜索得到jenkins上对应的插件名称，选择并安装它们。

* 插件的选择
  * **Publish Over SSH**：基于SSH协议的文件上传插件
  * **Nodejs**：nodejs运行环境
  * **Dingding**：钉钉推送通知
  * **Maven Integration**：Maven插件
* 插件的安装
  * 进入jenkins-系统管理-插件管理
  * 选择available（可选插件）标签
  * 搜索出以上选择的插件，勾选之后点击直接安装

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-plugin-manager-install.png)

#### 配置全局工具

&emsp;&emsp;对应**jenkins/系统管理/全局工具配置**目录，主要是配置打包所需的环境，如Java/Git/Maven等等，如果系统自带环境可以填写系统环境，如果没有可以采用jenkins自动安装的方式。

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-global-tools-setting.png)

1. JDK配置

> tips：如果找不到git的安装目录可以使用 which java 查看

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-global-tools-setting-jdk.png)

2. Git配置

> tips：如果找不到git的安装目录可以使用 which git 查看

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-global-tools-setting-git.png)

3. Maven配置

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-global-tools-setting-maven.png)

4. NodeJS配置

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-global-tools-setting-nodejs.png)

#### 配置文件管理

&emsp;&emsp;对应**jenkins/系统管理/Managed files**目录，主要是管理自定义的配置文件，如Maven的settings.xml，Npm的npmrc.config文件等等，我们在这主要配置一下Maven和Npm的仓库镜像，使其切换到国内的阿里云的Maven镜像和淘宝的Npm镜像。

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-managed-files.png)

1. Maven settings.xml

&emsp;&emsp;新增Maven settings.xml配置文件，在mirrors标签下添加以下配置
```xml
<mirror>  
    <id>alimaven</id>  
    <name>aliyun maven</name>  
    <url>http://maven.aliyun.com/nexus/content/groups/public/</url>  
    <mirrorOf>central</mirrorOf>          
</mirror>
```

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-managed-files-maven.png)


2. Npm config file

&emsp;&emsp;新增Npm config file配置文件，修改registry的配置
```properties
registry=https://registry.npm.taobao.org
```
![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-managed-files-npm.png)


#### 配置全局凭据

&emsp;&emsp;对应**jenkins/凭据/系统/全局凭据**目录，主要是用于添加如gitlab/ssh等受限访问应用的信任凭据。

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-unrestricted-add.png)

#### 其他配置

1. **Publish over SSH**插件

&emsp;&emsp;该插件的配置在**jenkins/系统管理/系统设置**目录，主要的配置如下：

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-publish-over-ssh-config.png)

&emsp;&emsp;高级配置下还可以配置SSH端口，重置默认设置等等，这里不做过多讲解

2. **Dingding通知**使用

&emsp;&emsp;钉钉通知的配置在任务的配置项中，配置起来较为简单（比微信通知简单太多）只需要两步操作。

（1）获取钉钉通知自定义机器人webhook的access_token，[点此进入](https://open-doc.dingtalk.com/docs/doc.htm?treeId=257&articleId=105735&docType=1)钉钉开放平台获取配置帮助

（2）在任务中配置通知
![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-dingding-setting.png)

&emsp;&emsp;通知效果如图，点击即可进入jenkins管理平台查看详情

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-dingding-notice.png)

### Jenkins的任务配置

&emsp;&emsp;至此基于一个前后端分离项目的自动打包配置已经基本完成，现在我们使用jenkins构建一个任务来测试配置是否成功，本次构建任务是基于我的一个开源模板项目[server-front-separate](https://github.com/calebman/server-front-separate.git)来进行。

#### 新建任务

&emsp;&emsp;进入jenkins根目录点击新建任务
![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-new-task.png)

&emsp;&emsp;任务新建成功
![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-task-list.png)

#### 任务基础配置

&emsp;&emsp;本次的基础配置我们需要达到任务能够自动化打包的效果，为达到此效果我们至少需要配置以下几项内容：

* 源码管理
* 构建环境
* 后端构建步骤
* 前端构建步骤

1. 源码管理

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-task-git.png)

2. 构建环境

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-task-build-env-node.png)

3. 后端构建步骤

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-task-build-maven.png)

4. 前端构建步骤

> linux环境下采用Shell脚本构建，换行分割指令
> 

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-task-build-node-linux.png)

```bash
cd front/
node -v
npm -v
npm i
npm run build
```

> Windows环境下采用批处理脚本构建，使用&与&&来连接指令，&代表下一条指令必定执行，&&代表当上一条指令出现错误下一条指令不执行
> 

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-task-build-node-windows.png)

```bash
cd front/ & node -v & npm -v & npm i && npm run build
```

#### 构建运行

&emsp;&emsp;基础配置完成后，我们进入项目主页进行一次构建测试

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-task-building.png)

&emsp;&emsp;构建成功后进入任务的工作空间，可以查看到项目已经打包成功，项目的目录结构描述详见我的另一篇博客[前后端分离开发模式的实践总结](/2019-02-23-server-front-separate/)

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-task-build-success.png)

### Jenkins任务自动化

&emsp;&emsp;至此项目已经能够通过jenkins平台来进行打包操作了，但是这还远远没达到**自动化**的概念，我们的目标是通过**git代码提交操作来触发构建**并且**自动部署**到生产/演示服务器上，所以接下来进行自动化的配置工作

#### 自动构建

&emsp;&emsp;自动构建是指通过Git服务器的Webhooks来触发Jenkins的打包构建流程，在这里我们将实现以下流程：

* 更新代码至github项目的master分支
* jenkins开始构建代码

&emsp;&emsp;jenkins默认对github的webhook有支持使得这个流程的配置非常简单，jenkins的webhook触发地址为**${JENKINS_URL}/github-webhook/**，其中JENKINS_URL为jenkins服务在公网的根目录地址，可以在**jenkins/系统管理/系统设置**处修改此默认地址

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-github-webhook-setting.png)

&emsp;&emsp;得到Webhook地址后我们只需要在github的项目Settings选项卡上添加此地址即可，github默认触发Webhook的逻辑是push代码时即触发

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-github-add-webhook.png)

&emsp;&emsp;当然，别忘记了在jenkins的任务中勾选Github hook触发构建

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-task-github-hook-setting.png)

#### 自动部署

&emsp;&emsp;自动部署是指在代码构建完成后将生成的发布代码推送到远程服务器中并启动它们，流程如下：

* 代码构建成功后上传打包目录
* 运行远程脚本重启服务

&emsp;&emsp;上文我们讲到**Publish Over SSH**这个插件能够远程推送代码并运行脚本，自动部署的功能即依赖此插件，配置如下：

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-task-publish-over-ssh-setting.png)

```bash
# 定义脚本执行地址
export COMMAND_PATH=/home/app/application/server-front-separate/bin
# 将所有脚本文件转换为UNIX格式
sed -i 's/\r//' $COMMAND_PATH/*.sh
# 停止服务
sh $COMMAND_PATH/stop.sh test
# 启动服务
sh $COMMAND_PATH/start.sh test
```

#### 构建通知

&emsp;&emsp;在这里我们使用钉钉来做通知功能，钉钉通知的配置在上文已经介绍过了，通知的的类型有四种，我们需要哪种类型的通知直接勾选即可，四种通知类型正好对应jenkins任务构建的三种状态：

* 成功：构建步骤与构建后的操作全部成功，对应**构建成功时通知**
* 失败：构建步骤失败，对应**构建失败时通知**
* 不稳定：构建步骤成功但构建后的操作存在失败的情况，对应**构建中断时通知**

### 常见问题

#### 中文乱码

&emsp;&emsp;在**jenkins/系统管理/系统设置**中添加全局属性：

![](http://pnb4x7vrc.bkt.clouddn.com/2019-03-01-jenkins-global-env-config.png)


# 参考资料

[Jenkins——应用篇——插件使用——Publish over SSH](https://blog.csdn.net/houyefeng/article/details/51027885)
[jenkins 集成钉钉机器人](https://blog.csdn.net/workdsz/article/details/77947183)
[Jenkins之解决乱码问题](https://blog.csdn.net/ZZY1078689276/article/details/77839045)
[Jenkins与Github集成 webhook配置](https://blog.csdn.net/qq_21768483/article/details/80177920)