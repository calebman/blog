---
title: Shell学习与归纳
date: 2019-08-25 19:32:46
thumbnail: https://resources.chenjianhui.site/2019-08-25-home-pic.jpg
categories: 
- Linux
tags: 
- Shell
- Linux
---

&emsp;&emsp;作为一个后端开发工程师在工作中不可能不与`Linux`服务器打交道，应用的部署测试，中间件的环境搭建，搭建个人的博客，甚至玩玩树莓派这些比较冷门的单片机计算机都离不开`Linux`指令与`Shell`编程，本文就来学习与归纳一些我个人用到的`Linux`指令与`Shell`语法并给出示例，本文只讲基础，细枝末节将另起博文详细分析。

<!-- more -->

# Shell语法归纳

## 变量与参数

### 变量定义与引用
```bash
#!/bin/sh
str="My name is JianhuiChen."
echo ${str}
str="Reset my name"
unset str
echo ${str}
```
![](https://resources.chenjianhui.site/2019-08-25-shell-exec-result-0.png)

### 参数引用
```bash
#!/bin/sh
echo "第一个参数为：$1"
echo "第二个参数为：$2"
echo "传递到脚本的参数个数为：$#"
echo "所有向脚本传递的参数为：$*"
echo "脚本运行的当前进程ID号为：$$"
echo "后台运行的最后一个进程的ID号为：$!"
echo "所有向脚本传递的参数为：$@"
echo "Shell使用的当前选项为：$-"
echo "最后命令的退出状态为：$?"
```
![](https://resources.chenjianhui.site/2019-08-25-shell-exec-result-1.png)

## 逻辑判断、循环与分支选择

### 逻辑判断
```bash
#!/bin/sh
x=5
y=10
z=20
# if then
echo "if then command"
if [ $x != $y ]
then
  echo "$x != $y"
  echo "Print again $x == $y"
fi
# if else
echo "if else command"
if [ $x != $y ]
then
  echo "$x != $y"
  echo "Print again $x != $y"
else
  echo "$x == $y"
fi
# if else-if else
echo "if else-if else command"
if [ $x == $y ]
then
  echo "$x == $y"
elif [ $y == $z ]
then
  echo "$x != $y and $y == $z"
else
  echo "$x != $y and $y != $z"
fi
```
![](https://resources.chenjianhui.site/2019-08-25-shell-exec-result-2.png)

### 循环
```bash
#!/bin/sh
# Define array
arr=(1 2 3 4 5)
# For loop
echo "For loop"
for var in ${arr[*]}
do
  echo "$var"
done
# While loop
echo "While loop"
i=0
while (( $i < ${#arr[*]} ))
do
  echo "${arr[$i]}"
  let "i++"
done
# Break and continue
echo "Break and continue"
j=0
while [[ $j < ${#arr[*]} ]]
do
  if [ $j == 3 ]
  then
    echo "Break in ${arr[$j]}"
    break
  elif [ $j == 1 ]
  then
    echo "Dump ${arr[$j]}"
    let "j++"
    continue
  else
    echo "Print ${arr[$j]}"
  fi
  let j++
done
```
![](https://resources.chenjianhui.site/2019-08-25-shell-exec-result-3.png)

### 分支选择
```bash
#!/bin/sh
x=3
case $x in
    1)  echo 'Case 1'
    ;;
    2)  echo 'Case 2'
    ;;
    3)  echo 'Case 3'
    ;;
    4)  echo 'Case 4'
    ;;
    *)  echo 'Default'
    ;;
esac
```

## 输出重定向
```bash
#!/bin/sh
export BIN_PATH=$(cd `dirname $0`;pwd)
echo BIN_PATH:[$BIN_PATH]
# 输出重定向到文件 >> 代表追加
nohup ping 127.0.0.1 > exec.log 2>&1 &
echo [if you want stop app, can run] kill -9 $!
echo [if you want search logs, can run] tail -f $BIN_PATH/exec.log
```
![](https://resources.chenjianhui.site/2019-08-25-shell-exec-result-4.png)

第一次看到`nohup ping 127.0.0.1 > exec.log 2>&1 &`这条语句的同学可能会有点懵逼，在这里我们一段一段来理解这条语句
* `nohub`：当前进程退出后运行程序不退出，也就是后台运行
* `ping 127.0.0.1`：具体执行的语句，这句就不过多解释了
* `> exec.log`：将语句执行的结果输出到`shell`脚本同级目录的exec.log文件，采用覆盖的模式，如果是追加输出可使用`>>`替换`>`
* `2>&1`：这句可能会复杂点，意思是将标准错误等效于标准输出，其中`&`起到了等效的作用
  * 0 表示stdin标准输入
  * 1 表示stdout标准输出
  * 2 表示stderr标准错误
* 最后一个`&`：这个是配合`nohub`使用的，意思是在脚本的结尾让程序自动运行，没有此指令脚本运行会卡在`nohub`处需要按一下任意键才可继续执行


# Linux指令与常用库归纳

## 文件与目录

* `ls`：列表显示文件与目录信息
* `tree`：树形显示文件与目录信息
* `cd`：切换目录
* `mkdir`：创建目录
* `pwd`：以绝对路径的方式显示用户当前工作目录
* `cp`：拷贝文件
* `rm`：删除文件
* `mv`：移动文件
* `diff`：比较文件差异
* `chmod`：文件授权
* `cat`：查看文件内容
* `head`：显示文件的头几行
* `tail`：显示文件的后几行
* `touch`：创建一个新文件
* `tar`：压缩与解压缩
* `sed`：非交互式文本编辑
* `vi`：交互式文本编辑，按`i`插入文本编辑文件，按`ESC`输入指令退出
  * `:w`：写入文件
  * `:w!`：不询问方式写入文件
  * `:wq`：保存并退出
  * `:q`：退出,
  * `:q!`：不保存退出

> 完成下面的语句对你记忆这些基础指令会有帮助
> 

```bash
#!/bin/sh
# 查看当前工作目录与其结构
pwd
ls
tree
# 创建一个目录 test-dir
mkdir test-dir
# 进入此目录
cd test-dir
# 创建一个文件 README.md
touch README.md
# 编辑文件插入一些内容
vi README.md
# 查看内容
cat README.md
# 查看文件的前两行
head -n2 README.md
# 循环读取文件的后三行
tail -n3 -f README.md
# 复制 README.md 到同级目录 README-COPY.md
cp README.md README-COPY.md
# 修改 README-COPY.md 的内容
vi README-COPY.md
# 与原文件比较差异性
diff README.md README-COPY.md
# 移动 README.md 到上一级目录
mv README.md ..
# 删除上一级目录的 README.md
rm ../README.md
# 将 README-COPY.md 重命名为 README.md
mv README-COPY.md README.md
# 授予 README.md 权限
chmod +x README.md
# 压缩 test-dir 目录
cd ..
tar -czvf test-dir.tar.gz test-dir
# 删除 test-dir 目录 建议使用参数 -i 进入询问模式
rm -rf test-dir
# 解压 test-dir.tar.gz
tar -xzvf test-dir.tar.gz
```

## 网络与常用库

* `ifconfig`：查看网络网卡信息
* `netstat`：显示网络状态，查看网络端口或者路由信息
* `lsof`：用于查看你进程开打的文件，打开文件的进程，进程打开的端口(TCP、UDP)
* `ping`：不多说了
* `telnet`：执行远程登录，可用测试网络端口链路是否通畅
* `ssh`：使用ssh协议远程登录主机
* `scp`：用于Linux之间复制文件和目录
* `ftp`：基于ftp协议的文件传输指令
* `wget`：网络下载器
* `curl`：`http`命令行工具

## 系统

* `shutdown`：关机
* `reboot`：重启
* `mount`：挂在次盘/文件系统
* `umount`：卸载磁盘/文件系统
* `exit`：退出当前终端
* `last`：显示最近一次登录的用户
* `history`：显示输入过的历史指令
* `ps`：列出系统中当前运行的进程
* `top`：实时显示系统资源的使用情况
* `free`：显示内存使用情况
* `quota`：显示磁盘使用情况
* `kill`：中止一个进程
* `uname`：显示操作系统相关信息的命令
* `du`：计算磁盘空间的使用情况
* `df`：报告文件系统磁盘空间的使用情况
* `su`：切换身份