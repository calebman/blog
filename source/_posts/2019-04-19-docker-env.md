---
title: 使用Docker搭建隔离开发环境
date: 2019-04-19 13:34:30
thumbnail: https://resources.chenjianhui.site/2019-04-19-home-pic.png
categories: 

- Docker
tags: 
- Docker
- mysql
- redis
---

使用Docker搭建隔离开发环境

<!-- more -->

# 前言

&emsp;&emsp; 最近接触到了Docker相关的知识，了解了它的相关特性，并基于它搭建了一些如mysql/redis/mq作为一个后端开发所必须的的环境，为什么使用Docker来搭建，听我娓娓道来。

<center>
<img src="https://resources.chenjianhui.site/2019-04-19-wtf-gaoshou.JPG?imageView2/2/w/300/h/300/q/75|imageslim"/>
</center>

&emsp;&emsp; 梦回到刚学后端的时候，你需要搭建个mysql环境，然后你去搜了下[windows mysql 环境搭建](https://www.baidu.com/s?wd=windows%20mysql%20%E7%8E%AF%E5%A2%83%E6%90%AD%E5%BB%BA)，得到了一种叫绿色版安装，一种叫傻瓜式（安装包）式安装，一顿操作之后我们的电脑终于多了一个mysql的服务，然后使用Navicat成功连接上了，开始沾沾自喜。

&emsp;&emsp;一个月后，由于某种原因（可能你删了mysql包的哪个文件）你需要把mysql重装一下，于是乎你又去搜了下[windows mysql 卸载](https://www.baidu.com/s?wd=windows%20mysql%20卸载)，你惊喜的得到了这么一个结果

![](https://resources.chenjianhui.site/2019-04-19-search-uninstall-mysql.png)

&emsp;&emsp;WTF？彻底卸载可还行，于是你花了比安装更多的力气去卸载了一个mysql。

<center>
<img src="https://resources.chenjianhui.site/2019-04-19-wtf-question.JPG?imageView2/2/w/300/h/300/q/75|imageslim"/>
</center>

&emsp;&emsp;工作一年之后，你回想起你的这波操作，不禁笑了起来，你看着现在的vmware+centOS虚拟机中挂着的mysql+redis环境不禁沾沾自喜，虚拟机中的开发环境与本机完全隔离，哪天我不要环境了直接把虚拟机卸了就行，真是一个很完美的配置呢~

<center>
<img src="https://resources.chenjianhui.site/2019-04-19-wtf-kuaile.JPG"/>
</center>

&emsp;&emsp;但是，你似乎忘记了，你花费了多大的力气踩了多少的坑才折腾好你这套环境，想到这你不禁为自己留下心疼的眼泪。

<center>
<img src="https://resources.chenjianhui.site/2019-04-19-wtf-liulei.JPG"/>
</center>

&emsp;&emsp;这套环境支撑你跑了很久，在此之间你还学会了很多linux的常规指令，成为了一个运维小能手，有一天你在逛社区的时候看到一篇文章叫做[使用 Docker 快速搭建开发环境](https://www.jianshu.com/p/c1b79afc6d63)，能有多**“快”**，我得去瞅瞅，跟着它敲了一遍代码，mysql，它，起来了。

<center>
<img src="https://resources.chenjianhui.site/2019-04-19-wtf-wtf.GIF"/>
</center>

&emsp;&emsp;我告诉自己，我得去看看这东西，它是个什么妖魔鬼怪。

<center>
<img src="https://resources.chenjianhui.site/2019-04-19-wtf-good.JPG?imageView2/2/w/300/h/300/q/75|imageslim"/>
</center>


# Docker介绍

&emsp;&emsp;Docker于2013年发布， 属于 Linux 容器的一种封装，提供简单易用的容器使用接口，可以轻易的使用/制作一个镜像（带有环境的容器）。具体详细的介绍网上有太多了，这里就不赘述了。

# 环境搭建

## Windows Docker环境搭建

&emsp;&emsp;环境搭建的文章也很多，我这里主要说一下可能会踩到的坑，docker针对windows的用户主要有两个安装包可以下载，我们可以在阿里云平台看到关于安装的Docker的一些建议，具体区别可以参考这篇博客[dockerToolbox和docker for windows的区别](https://blog.csdn.net/JENREY/article/details/84493812)，本文主要讲一下Docker for Windows的安装流程。

* Docker Toolbox：Docker工具集安装器
* Docker for Windows：Windows平台的Docker安装

![](http://resources.chenjianhui.site/2019-04-19-aliyun-windwos-docker-install.png)

1. 进入[https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) 下载Docker for Windows安装包；

![](https://resources.chenjianhui.site/2019-04-19-download-docker.png)

2. 执行Docker for Windows安装程序，一路next，Docker运行成功后会有通知且右下角有logo图标存在；
3. 没了，Docker这就算安装好了，使用PowerShell或者cmd执行命令试试
![](https://resources.chenjianhui.site/2019-04-19-exec-docker-test.png)
4. Docker安装完成后，由于它需要Hyper-V的支持，这会与VMware的虚拟机启动产生冲突报错如下，具体原因请参考[Docker 和 vmware 共存工作](https://blog.csdn.net/qq_40374604/article/details/83095410)
![](https://resources.chenjianhui.site/2019-04-19-vmware-error.png)


## 熟悉一下基本流程

&emsp;&emsp;在这个阶段我们使用Docker拉取一个集成了SSH服务的centOS7系统镜像，将它运行起来并使用Xshell远程连接做一些基本的linux操作

```bash
# docker pull 拉取镜像指令
# jdeathe/centos-ssh代表镜像名称 centos-7代表镜像标签（版本）不填取最新latest
# 具体镜像信息查看 https://hub.docker.com/
docker pull jdeathe/centos-ssh:centos-7
# docker images 查看已经拉取的镜像列表
docker images
# docker run 将镜像构建成容器
# -d 分离运行 不会在命令行打印容器运行日志
# --name 指定容器名称
# -p 2020:22 将本机的2020端口映射到容器的22端口
# --env 设置容器支持的环境配置
# jdeathe/centos-ssh:centos-7 镜像名称
docker run -d --name centos-ssh -p 2020:22 --env SSH_PASSWORD_AUTHENTICATION=true --env SSH_USER=admin --env SSH_USER_PASSWORD=123456 jdeathe/centos-ssh:centos-7
# docker inspect 查看指定容器的详细信息 centos-ssh是刚刚指定的容器名称
docker inspect centos-ssh
# docker ps 查看容器信息 运行成功则会显示在列表中
docker ps
# 使用XShell进入容器 locahost:2020 admin/123456
```

&emsp;&emsp;成功连接上容器并执行了一些基础操作

![](https://resources.chenjianhui.site/2019-04-19-docker-centos-ssh-xshell.png)


&emsp;&emsp;除去不必要的打印信息指令，我们只需要使用两行代码即可创建一个centOS系统镜像容器

## 可视化界面

&emsp;&emsp;指令操作虽然能让你更加熟练且装逼，但它总是繁琐的，Docker官方及周边提供了很多基于Docker指令的傻瓜式UI程序，在这里我主要介绍两款

### Kitematic GUI程序

&emsp;&emsp;Kitematic是由Docker官方提供的一款桌面应用，提供了Windows平台下的绿色版压缩包，使用起来非常简单。

1. 前往Kitematic的[github releases仓库](https://github.com/docker/kitematic/releases)下载Kitematic-XXX-Windows.zip；
2. 解压直接运行 Kitematic.exe，界面如下

![](https://resources.chenjianhui.site/2019-04-19-docker-gui.png)

点击一个容器可进入详情页面

![](https://resources.chenjianhui.site/2019-04-19-docker-gui-containers.png)

点击Settings进入配置页面

![](https://resources.chenjianhui.site/2019-04-19-docker-gui-container-setttings.png)

### Portainer Web程序

&emsp;&emsp;Portainer是一个轻量级的管理界面，可以让您轻松地管理不同的Docker环境，功能比Kitematic强大许多。

&emsp;&emsp;Portainer是基于网页来操作的，本质上是一个B/S架构的程序，它有单独的镜像发布在Docker中，所以它的使用也非常便捷，我们只需要拉取镜像运行即可。

```bash
# 拉取最新的portainer镜像
docker pull portainer/portainer
# --restart=always 代表容器总是随着Docker启动而启动
# -v 配置持久化路径
docker run -d -p 9000:9000 --restart=always -v /var/run/docker.sock:/var/run/docker.sock --name portainer portainer/portainer
# 检查服务运行状态
docker ps
# 正常情况下服务已经运行在 http://localhost:9000
```

1. 进入 [http://localhost:9000/#/init/admin](http://localhost:9000/#/init/admin) ， 进行管理员配置；

![](https://resources.chenjianhui.site/2019-04-19-portainer-init-admin.png)

2. 初始化Docker端点配置[http://localhost:9000/#/init/endpoint](http://localhost:9000/#/init/endpoint) ， 需要配合在Docker配置开启Web Api服务；

![](https://resources.chenjianhui.site/2019-04-19-portainer-init-endpoint.png)

![](https://resources.chenjianhui.site/2019-04-19-docker-settings.png)

3. 进入Portainer主页，查看相关配置

![](https://resources.chenjianhui.site/2019-04-19-portainer-home.png)

![](https://resources.chenjianhui.site/2019-04-19-portainer-dashboard.png)

## 开发集成环境搭建

&emsp;&emsp;在有了前面环境的铺垫之后，现在可以很轻易就搭建好我们所需要的开发环境，具体操作无非是

1. 找到所需的镜像及版本，拉取镜像
2. 根据镜像描述做好配置并启动
3. 测试环境是否可用

### mysql

&emsp;&emsp;任意找一个GUI程序搜索到所需的镜像，拉取运行即可

![](https://resources.chenjianhui.site/2019-04-19-gui-mysql.png)

&emsp;&emsp;关于mysql连接密码可在环境变量中配置重启

![](https://resources.chenjianhui.site/2019-04-19-gui-mysql-settings.png)

&emsp;&emsp;使用Navicat测试连接是否可用，这里主要要看镜像与宿主机器的端口映射表，使用 localhost:3306 root/123456 即可连接上mysql，环境搭建成功

![](https://resources.chenjianhui.site/2019-04-19-gui-mysql-settings-ports.png)

### redis

&emsp;&emsp;使用Kitematic搜索redis相关镜像，点击创建，使用RedisDesktopManager进行测试，默认是没有密码验证的模式，如果需要更改可以进入容器内部修改，这部分操作我会在后续的博客整理

![](https://resources.chenjianhui.site/2019-04-19-gui-redis.png)


### rabbitmq

&emsp;&emsp;其他的环境操作都是类似的，当然如果没有搜索你想要的镜像（比如你想要一个mysql+redis的镜像），可以自己构建发布，在此之前你可能需要注册一个Docker账号

![](https://resources.chenjianhui.site/2019-04-19-rabbitmq.png)

## 其他配置

### Docker镜像加速

&emsp;&emsp;注册一个阿里云账号，进入控制台->容器镜像服务->镜像中心->镜像加速器，获取到加速器的地址，复制到Docker的Settings/Daemon中，重启Docker即可。

# 参考资料

* [Windows 10 安装Docker for Windows - 晓晨Master - 博客园](https://www.cnblogs.com/stulzq/p/7743667.html)
* [使用 Docker 快速搭建开发环境](https://www.jianshu.com/p/c1b79afc6d63)
* [dockerToolbox和docker for windows的区别- Null的博客- CSDN博客](https://blog.csdn.net/JENREY/article/details/84493812)
* [Docker 和 vmware 共存工作 - rodert - CSDN博客](https://blog.csdn.net/qq_40374604/article/details/83095410)
* [Docker各种可视化界面的比较](https://blog.csdn.net/qq273681448/article/details/75007828)