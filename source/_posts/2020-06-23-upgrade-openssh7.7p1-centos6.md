---
title: CentOS 6.5 升级 OpenSSH 服务
date: 2020-06-23 20:15:30
thumbnail: https://resources.chenjianhui.site/2020-06-23-home-pic.jpg
categories: 
- 运维
tags: 
- centos
- openssh
- linux
---

&emsp;&emsp;公司最近项目做等保测试，在漏扫部分测试出了四台生产服务器有十余个关于 OpenSSH 的漏洞，故需要做升级工作，在此记录。

<!-- more -->

# CentOS 6.5 升级 SSH 服务

## 源起

CentOS 6.5 自带的 OpenSSH 版本过低，7.4以下 OpenSSH 版本存在严重漏洞：

1. OpenSSH 远程权限提升漏洞(CVE-2016-10010)
2. OpenSSH J-PAKE授权问题漏洞(CVE-2010-4478)
3. Openssh MaxAuthTries限制绕过漏洞(CVE-2015-5600)

## 升级记录

### yum 镜像源切换

> 如果 yum 镜像源无法使用可尝试下述方案，本次操作的服务器在内网环境下，内网的 DNS 无法解析 mirrors.aliyun.com，故手动配置了 hosts 与镜像地址。

```sh
# 写入 aliyun 镜像源的 host 解析记录
echo 59.47.236.246 mirrors.aliyun.com >> /etc/hosts
# 备份原始镜像源
mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup
# 下载新的镜像源
wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-6.repo
# 生成缓存
yum makecache
```

### 安装基础环境

> 此步骤安装 SSH 编译所需依赖项，如果 yum 不可用可使用 RPM 的方式手动安装。

1. yum 安装方式

```sh
# OpenSSH 编译依赖
yum -y install gcc-c++ zlib zlib-devel openssl openssl-devel pam-devel
```

2. rpm 安装方式参考链接：[https://github.com/Junyangz/upgrade-openssh-centos](https://github.com/Junyangz/upgrade-openssh-centos)



### 安装并开启 telnet 服务

> 此步骤是防止在更新 SSH 时断开连接导致无法登录服务器，此时可采用 telnet 登录。

```sh
# telnet 环境，防止 ssh 服务关闭后无法连接服务器
yum -y install telnet-server* telnet
# 启用 telnet 服务用于远程登录
vi /etc/xinetd.d/telnet
# 将其中 disable 字段的 yes 改为 no 以启用 telnet 服务
# 允许 root 用户通过 telnet 登录
mv /etc/securetty /etc/securetty.old    
# 启动telnet服务
service xinetd start        
# 使telnet服务开机启动，避免升级过程中服务器意外重启后无法远程登录系统
chkconfig xinetd on 
# 查看 telnet 端口
less /etc/services | grep telnet
# telnet          23/tcp
# telnet          23/udp
```

使用 telnet 登录服务器的方式如下：

```sh
telnet 192.168.xx.xx
# Trying 192.168.xx.xx...
# Connected to 192.168.xx.xx.
# Escape character is '^]'.
# Password: 
# 输入密码即可登录
```

### 更新 OpenSSL 到 1.0.2.o

OpenSSL >= 1.0.1 可以不用升级 OpenSSL，运行  `openssl version` 可以查看版本信息，如果出现 `openssl: command not found` 说明服务器可能在使用 `nss` 模块，可通过 `yum info nss` 查看其相关信息，如果没有安装 OpenSSL 需要进行下方的步骤。

> 此步骤更新 OpenSSL 依赖，脚本来源于[Upgrade OpenSSH to 7.7p1 in CentOS 6 - Junyangz's docs](https://docs.junyangz.com/ops/upgrade-openssh-to-7.7p1-in-centos6#upgrade-openssl-to-1-0-2-o)，根据实际情况改造 openssl 备份部分的脚本，可直接放置服务器运行升级。

```sh
#!/bin/sh
# Copyright © 2018 Junyangz
# Update by JianhuiChen
# Create workspace
# mkdir ssh_upgrade && cd ssh_upgrade
# Download the new version of openssl
rm -f openssl-1.0.2o.tar.gz
wget https://ftp.openssl.org/source/old/1.0.2/openssl-1.0.2o.tar.gz
# Query the server's old version of openssl
find / -name openssl
find / -name "libssl*"
timestamp=$(date +%s)
# Backup openssl based on the results of the query above
cp  /usr/lib64/libssl3.so  /usr/lib64/libssl3.so.10-${timestamp}
cp  /usr/lib64/libssl.so.10  /usr/lib64/libssl.so.10-${timestamp}
mv /usr/bin/openssl /usr/bin/openssl-${timestamp}
mv /usr/include/openssl /usr/include/openssl-${timestamp}
mv /etc/pki/ca-trust/extracted/openssl /etc/pki/ca-trust/extracted/openssl-${timestamp}
# remove old OpenSSL rpm package
rpm -qa |grep openssl|xargs -i rpm -e --nodeps {}
# compile and install new OpenSSL
tar zxvf openssl-1.0.2o.tar.gz && cd openssl-1.0.2o
./config --prefix=/usr/local/openssl --openssldir=/etc/ssl --shared zlib&& make && make test && make install
ln -s /usr/local/openssl/bin/openssl /usr/bin/openssl
ln -s /usr/local/openssl/include/openssl /usr/include/openssl

echo "/usr/local/openssl/lib">>/etc/ld.so.conf
ldconfig
mv  /usr/lib64/libcrypto.so.10-*  /usr/lib64/libcrypto.so.10
mv  /usr/lib64/libssl.so.10-*  /usr/lib64/libssl.so.10
#ldconfig -v # for check
echo "OpenSSl version upgrades as to lastest:" && openssl version
# openssl version -a
# OpenSSL 1.0.2o  27 Mar 2018
# built on: reproducible build, date unspecified
# platform: linux-x86_64
# options:  bn(64,64) rc4(16x,int) des(idx,cisc,16,int) idea(int) blowfish(idx)
# compiler: gcc -I. -I.. -I../include  -DOPENSSL_THREADS -D_REENTRANT -DDSO_DLFCN -DHAVE_DLFCN_H -Wa,--noexecstack -m64 -DL_ENDIAN -O3 -Wall -DOPENSSL_IA32_SSE2 -DOPENSSL_BN_ASM_MONT -DOPENSSL_BN_ASM_MONT5 -DOPENSSL_BN_ASM_GF2m -DRC4_ASM -DSHA1_ASM -DSHA256_ASM -DSHA512_ASM -DMD5_ASM -DAES_ASM -DVPAES_ASM -DBSAES_ASM -DWHIRLPOOL_ASM -DGHASH_ASM -DECP_NISTZ256_ASM
# OPENSSLDIR: "/usr/local/openssl/ssl"
```

### 更新 OpenSSH 到 7.7p1

> 此步骤更新 OpenSSH 依赖，复制下方脚本到 sh 文件，直接执行即可，脚本来源于[Upgrade OpenSSH to 7.7p1 in CentOS 6 - Junyangz's docs](https://docs.junyangz.com/ops/upgrade-openssh-to-7.7p1-in-centos6#upgrade-openssl-to-1-0-2-o)。

```sh
#!/bin/sh
# Create workspace
# mkdir ssh_upgrade && cd ssh_upgrade
# Download the new version of openssh
rm -f openssh-7.7p1.tar.gz
wget http://ftp.openbsd.org/pub/OpenBSD/OpenSSH/portable/openssh-7.7p1.tar.gz
timestamp=$(date +%s)
# Backup old OpenSSH
cp -R /etc/ssh /etc/ssh-${timestamp}
cp /etc/init.d/sshd /etc/init.d/sshd-${timestamp}

rpm -qa | grep openssh
rpm -e --nodeps `rpm -qa | grep openssh`

tar zxvf openssh-7.7p1.tar.gz && cd openssh-7.7p1
./configure --prefix=/usr/local/openssh --sysconfdir=/etc/ssh \
--with-ssl-dir=/usr/local/openssl && make && make install

ln -s /usr/local/openssh/sbin/sshd /usr/sbin/sshd
# Copy ssh config files
cp ssh_config /etc/ssh/
cp sshd_config /etc/ssh/
cp moduli /etc/ssh/

# 复制启动脚本到/etc/init.d
# 根据安装路径情况，可能需要修改启动脚本中sshd的路径
cp contrib/redhat/sshd.init /etc/init.d/sshd
chmod +x /etc/init.d/sshd
/usr/sbin/sshd -t -f /etc/ssh/sshd_config # vim /etc/init.d/sshd

# 加入开机自启
chkconfig --add sshd
chkconfig sshd on
chkconfig sshd --list

# 开启root用户远程登录。
sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/g' /etc/ssh/sshd_config

# 开启SSH服务
# 千万不能restart。使用restart会造成连不上，需要登录控制台启动。
service sshd start
echo "New version upgrades as to lastest:" && $(/usr/sbin/sshd -V)
```

### 关闭 telnet 服务

> 检测新版的 OpenSSH 是否能够远程登录，如果没问题可关闭 telnet 服务，在这里使用备份的配置覆盖当前配置即可。

```sh
vi /etc/xinetd.d/telnet
# 将其中 disable 字段的 no 改为 yes 以禁用 telnet 服务
# Disable telnet login
mv /etc/securetty.old /etc/securetty
# Stop telnet service
service xinetd stop        
chkconfig xinetd off 
```

## F&Q

1. 运行 `service sshd start` 报错  <span style="color: #f81d22;">/etc/init.d/sshd: line 41: /usr/bin/ssh-keygen:No such file or directory</span>

```sh
# 创建软链接
ln -s /usr/local/openssh/sbin/sshd /usr/sbin/sshd
```

2. 运行 `ssh -V` 报错 <span style="color: #f81d22;">-sh: /usr/bin/ssh: No such file or directory</span>

```sh
# 到安装目录执行脚本
/usr/sbin/sshd -V
```

3. `libcrypto.so.10` 库丢失 <span style="color: #f81d22;"> error while loading shared libraries: libcrypto.so.10: cannot open shared object file: No such file or directory</span>

```sh
# 64 位系统
ln -s /usr/local/openssl/lib/libcrypto.so.1.0.0 /usr/lib64/libcrypto.so.10
ln -s /usr/local/openssl/lib/libssl.so.1.0.0 /usr/lib64/libssl.so.10
# 32 位系统
ln -s /usr/local/openssl/lib/libcrypto.so.1.0.0 /usr/lib/libcrypto.so.10
ln -s /usr/local/openssl/lib/libssl.so.1.0.0 /usr/lib/libssl.so.10
```

## 参考资料

* [Upgrade OpenSSH to 7.7p1 in CentOS 6 - Junyangz's docs](https://docs.junyangz.com/ops/upgrade-openssh-to-7.7p1-in-centos6#upgrade-openssl-to-1-0-2-o)


