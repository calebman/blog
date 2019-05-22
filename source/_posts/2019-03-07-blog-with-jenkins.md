---
title: 我的博客可以自己部署啦
date: 2019-03-07 11:52:18
thumbnail: https://resources.chenjianhui.site/2019-03-07-home-pic.jpg
categories: 
- 测试
tags: 
- jenkins
---

博客你已经长大了，该学会自己部署了

<!-- more -->

我的自动化运维平台已经成功上线啦~

博客可以自己照顾自己啦~

本篇博客用于测试自动化运维平台是否正常运行

在我写完这篇博客执行以下脚本后

```bash
git add .
git commit -m"自动部署测试"
git push origin master
```

这时候对话开始了

> github：jenkins兄弟，快起来，该干活了
>
> Jenkins看看来的任务，blogs，ok，i know
>
> jenkins：包在我身上
```bash
# 拉取代码
git clone https://github.com/calebman/blog.git
# 打印版本
node -v
npm -v
# 安装hexo-cli脚手架
npm install -g hexo-cli
hexo -v
# 安装依赖
npm i
# 打包博客
hexo clean
hexo g
# 将打包文件移动到服务器的指定目录 nginx配置目录
cp -rf public/* /home/app/application/blogs/
# 部署到 github.io
hexo d
```

> jenkins：发封邮件给主人告诉他我干完了
>
> 盯
>
> 看看手机，好的看来博客已经上线了
>
> 访问**[http://blog.chenjianhui.site](http://blog.chenjianhui.site)**试试
>
> 有了，jenkins辛苦辣，下次给你换个更好的服务器环境

测试成功
Ending~

