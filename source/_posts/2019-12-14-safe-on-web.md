---
title: 随笔——如何打造一个安全的系统
date: 2019-12-14 10:26:14
thumbnail: https://resources.chenjianhui.site/2019-12-14-home-pic.jpg
categories: 
- 随笔
tags: 
- Java
---

&emsp;&emsp;作为一个在主打网络安全系公司实习过的人，不得不了解下系统安全设计相关的知识，本篇博客将以一个虚拟的需求开始，尝试以讲**系统设计者阿辉**与**黑客小刘**互相博弈的故事，这样的方式去让大家学习到我了解到的网络安全。

<!-- more -->

## 虚拟的需求

2018年3月某日位于G城的一个下午，公司领导拍脑袋想出了一个需求，经过了三个小时的开会讨论，系统的功能模块确定了，名字就叫**弱鸡掌上生活APP**，下面是它的功能模块图

![](https://resources.chenjianhui.site/2019-12-24-ruoji-app.png)

需求总结来说很简单
1. 平台客户使用此平台进行生活缴费
2. 平台服务人员受理客户的服务，并在每个月底进行对账

那既然是有管理平台的系统肯定少不了权限，作为一个客户服务人员肯定不能参与对账吧，所以阿辉先开始了权限相关的设计，业务方面委派给了大超。

## 系统权限设计

开始权限设计之前阿辉先了解了一下权限设计的相关知识，说到权限就离不开**权限设计的原则**以及**RBAC**的设计方式。

### 权限设计的原则

1. 最小特权原则：用户在完成某个任务时，其得到的权限不应该大于完成该任务所需要的最小权限。
2. 职责分离原则：权限分配时要考虑权限互斥的情况，如文章的创建与审核权限如果被一个用户同时拥有，那么将会出现自动审核的情况。
3. 数据抽象原则：权限设计时不单纯的以对数据的增删改查操作来定义权限，需要结合业务场景来定义权限，如政府申报单审核的初审、复审、终审业务应该定义成三个权限，使其粒度更加合理。

### 什么是RBAC

> 在20世纪90年代期间，大量的专家学者和专门研究单位对RBAC的概念进行了深入研究，先后提出了许多类型的RBAC模型，其中以美国George Mason大学信息安全技术实验室（LIST）提出的RBAC96模型最具有系统性，得到普遍的公认

RBAC模型是web权限设计领域中一个成熟的理论方案，它全称为Role-Based Access Control即以角色为基础的访问控制，其设计的核心思想即将**角色、用户、权限**关联起来，系统可以根据不同的账号获得背后的角色，进而从角色中获取权限信息来判断是否有某些资源的访问权限。

**那RBAC解决了什么问题呢？**

我们先来看看传统无角色概念的权限设计，用户被直接授予权限的缺点。
1. 权限配置相当麻烦
2. 无法快速为多个用户批量删除/编辑权限
3. 用户多身份下权限配置维护麻烦

而RBAC不仅解决了传统权限设计的缺点，还支持了权限设计的三个原则
- 最小特权原则：RBAC模型可以通过授予角色权限的**多少与大小**来决定用户拥有的特权，用户得到的权限不应该大于完成某任务所需要的权限。
- 职责分离原则：RBAC模型可通过指派**互斥的角色**完成同一个任务。
- 数据抽象原则：RBAC模型的权限实体即可抽象成**许可权**，其支持的抽象程度与模型的实现细节有关。

### 什么是RBAC96模型

RBAC96包括RBAC0~RBAC3四个概念性模型，在这里分别介绍一下

- **RBAC0符合RBAC概念系统的最低要求**
RBAC0指出了角色，用户，访问权限和会话的关系，用户至少包含一个角色，角色至少包含一个权限，一个用户可以激活多个角色，用户、角色、权限均是多对多的关系

- **RBAC1在RBAC0的基础上增加了角色继承的关系**
RBAC1定义了一个角色可以获得另一个角色的权限继承权，在有上下级的机构体系中此模型可适用

- **RBAC2在RBAC0的基础上引入了SSD和DSD**
RBAC2限制了权限授予操作的限制性，防止用户拥有概念上互斥的权限，如上文说到的文章创建与审核权限。
  1. SSD(Static Separation of Duty)静态职责分离
    - 互斥角色规则：同一个用户在两个互斥的角色中只能选择一个
    - 基数规则：一个用户拥有的角色是有限的，一个角色拥有的权限也是有限的
    - 先决规则：用户想获得高级的角色，首先必须拥有低级的角色
  2. DSD(Dynamic...)动态职责分离
    - 运行时互斥规则：一个用户可以拥有两个角色，但运行时只能激活一个角色


- **RBAC3是RBAC1和RBAC2的集合**

### 支持RBAC的主流框架

1. [Shiro](https://shiro.apache.org/)
2. [Spring Security](https://spring.io/projects/spring-security)

在对比了两者的优缺点后，阿辉凭着对Spring的亲切感选择了Spring Security，根据官方的文档描述阿辉很快就完成了权限相关的设计，结合大超开发的话费充值功能弱鸡APP快速上线了。

## 系统安全防护

### 黑客小刘

在一个阳光明媚的下午，张三在某不知名奶茶店连着wifi悠闲的喝着奶茶，突然收到一条手机余额只剩3毛的欠费提醒，张三第一时间想到了弱鸡APP，熟练的打开它并完成了一笔话费充值，此时手机发出了一条HTTP请求如下

```http
POST /service/call/charge HTTP/1.1
Host: app.ruoji.cn
Content-Type: application/json
Cache-Control: no-cache
Access-Token: 56ad9e8e-e404-5f6a-a7d3-a3125583f2cc

{"mobile":"13312123312","amount":50}
```

另一边黑客小刘已在此等候多时，他早已经控制了奶茶店的wifi，并不断的截获发往公网的请求内容，专业的小刘敏锐的捕捉到张三的这个请求不一般，他尝试着修改请求内容为

```http
POST /service/call/charge HTTP/1.1
Host: app.ruoji.cn
Content-Type: application/json
Cache-Control: no-cache
Access-Token: 56ad9e8e-e404-5f6a-a7d3-a3125583f2cc

{"mobile":"17477212341","amount":300}
```

不多久，小刘朋友的手机显示话费到账300元，小刘心喜找到弱鸡APP的一个漏洞，可以利用此漏洞给别人充话费然后自己收取部分费用，由此迎娶白富美走上人生巅峰！

三天后弱鸡APP收到越来越多的用户投诉，程序员大超检查日志发现了自己系统存在请求能被篡改的漏洞，这可不得了，大超立马去咨询老大阿辉该怎么解决？阿辉知晓后，安慰了大超没关系，问题发现得早，损失还不是很严重，然后开除了大超，开始了弱鸡APP的修复之路。

### 接口防篡改设计

阿辉为了防止接口被篡改，引入了**参数签名**的概念

1. 客户端与服务端约定了一个字符串**ABBACC**，参与签名算法
2. 客户端发送网络请求之前使用MD5算法对**参数体+ABBACC**做一次哈希得到签名值signature，放到请求的query部分发往服务器
3. 服务端接收到请求后同样使用MD5算法对**参数体+ABBACC**做一次哈希得到签名值，并核对query部分的签名值，匹配则代表请求未被篡改

于是话费充值接口的请求体变成了如下示例，只要约定字符串**ABBACC**不泄漏，理论上请求是不可篡改的

```http
POST /service/call/charge?signature=BB9BBD082F5C05B5BBC8BF7F6A59FD72 HTTP/1.1
Host: app.ruoji.cn
Content-Type: application/json
Cache-Control: no-cache
Access-Token: 572caf12-b62e-b3ce-c969-b36ebe165078

{"mobile":"13312123312","amount":50}
```

### 阿辉的思考🤔

黑客小刘的事件发生后，阿辉意识到客户的网络大部分情况不能保证是在一个安全的环境运行，客户在弱鸡APP上的操作最终也只不过是转换成一堆报文在网络上传递，要获取这些报文简直轻而易举。想到这里阿辉开始把自己当成一个黑客，来寻找自己弱鸡APP的漏洞。

### token盗用与重放攻击

敏锐的阿辉没过多久就发现弱鸡APP还存在一些致命的漏洞，由于系统是针对APP提供服务，APP不像网页端有cookie-session机制可以直接使用，而是使用token来鉴别用户，且弱鸡APP为了提高用户体验将token的有效期设置的很长，防止用户经常需要登录，这就存在用户token的盗用问题。

1. 黑客通过控制wifi抓取弱鸡APP的网络请求
2. 分析请求内容很容易找到令牌位置
3. 使用令牌伪装成用户干其他事情

与token盗用同时存在的还有重放攻击问题，**黑客可以通过重新发送张三的话费充值请求，亲切的帮其多充几次话费**

#### 防止token盗用

防止token盗用即让token的时效性降低，问题演变成**如何即满足用户能够长期保持登录状态又能降低token的时效性？**refresh_token出现了，从名字上很容易看出，它是为刷新token而存在的token，这么说其实有点绕，总结它与普通token的区别是

1. 时效性比token长很多
2. 用于token失效后的更新操作凭证

现在阿辉把token的时效性设置成了一小时，当token失效时就发送一个请求来换取新的token，refresh_token的时效性设置成一周，如果用户一周没有使用app则需要重新登录

```http
POST /service/token/refresh?signature=CAB800F028D909F0E0B8B12D11A8FB08 HTTP/1.1
Host: app.ruoji.cn
Content-Type: application/json
Cache-Control: no-cache
Access-Token: 572caf12-b62e-b3ce-c969-b36ebe165078

{"refresh_token":"572asc2-a19c-a2de-c719-b36fbe465078"}
```

#### 防止重放攻击

简单来说防止重放攻击就是要让每一个网络请求体只能用一次，阿辉很快就想到一个方案

1. 随机数方案
  - 客户端发送请求时生成**一串随机数**放到请求体中
  - 服务端维护一个**随机数池**，每个收到的随机数都放到池中，当请求体中的随机数与池中冲突时认为是重复请求不受理

此方案有一个很明显的缺陷，随机数池将被无限扩充，终有一日所有请求都将无法受理，阿辉思考片刻提出了第二个方案

2. 随机数+时间戳方案
  - 客户端发送请求时生成**一串随机数**与**时间戳**放到请求体中
  - 服务端先校验时间戳，与服务器时间相差**五分钟**则拒绝处理
  - 时间戳校验通过则将随机数放置随机数池中，并给此随机数设置一个**五分钟**的有效期
  - 如果随机数与随机数池中冲突时认为是重复请求不受理

现在充值话费的请求变成了

```http
POST /service/call/charge?signature=D4E8FEE98427C555135FEAAE258077DE HTTP/1.1
Host: app.ruoji.cn
Content-Type: application/json
Cache-Control: no-cache
Access-Token: 572caf12-b62e-b3ce-c969-b36ebe165078

{"mobile":"13312123312","amount":50,"r":182713,"timestamp":1576576992917}
```

至此，黑客无法再篡改或者重复利用截获的网络报文了，但是好景不长，没过多久弱鸡APP的客服收到**部分用户被盗号的投诉**，阿辉不敢怠慢，很快就发现了问题所在

### 数据裸奔

阿辉发现现在的请求确实篡改不了了，但是部分敏感的请求报文是在互联网上”裸奔“的，比如下面这个登录请求

```http
POST /service/login?signature=B1D927521CA28E458C4192CF2090631D HTTP/1.1
Host: app.ruoji.cn
Content-Type: application/json
Cache-Control: no-cache

{"account":"zhangsan","password":"zhangsan123456","r":131763,"timestamp":1576576992917}
```

黑客稍微分析一下就知道这是一个账号为zhangsan密码为zhangsan123456的登录操作，接下来黑客只需要打开弱鸡APP使用该账号密码进行登录并修改密码即可不费吹灰之力盗号，这种数据明文传输的行为即是数据裸奔

**那么如何防止数据裸奔呢？**

#### 传输加密

阿辉第一时间想到的解决方案是客户端和服务器都约定好加密算法和密钥，HTTP的请求与响应报文都使用这套加密算法和密钥进行通信，常用的对称加密算法有DES、3DES、AES、RC5、RC6等，阿辉采用AES算法并与APP端约定好了密钥为**ACMYTE**，登录请求报文变成了如下示例

```http
POST /service/login?signature=B1D927521CA28E458C4192CF2090631D HTTP/1.1
Host: app.ruoji.cn
Content-Type: application/json
Cache-Control: no-cache

{"secret":"6780bfw0YjIh7UoByQEcP8qpBnJPj0lgphVBLEbBsU78D1QwBQ9JMggNaCMArXgH8NKG4x+le2zx+HtXnGKTeGvrrV32hGC5GJhSrxCkQDGJbokCKyzsHTlq+4DO3Bej"}
```

这样黑客截获的报文就无法被直接看穿了，阿辉放心的将这套设计上线运行，两天后客服**还是在不断收到盗号的投诉**，阿辉眉头一紧看来事情并没有那么简单，这个黑客是有点水平的。

阿辉经过一天的分析得出结论，黑客应该是**反编译了弱鸡APP**的源代码，得到了源码中存储的约定密钥**ACMYTE**，得到密钥的黑客只需要不断代入市面上的加密算法即可获得明文结果。阿辉心想，既然持久化在APP端不安全，要不写在服务端用网络请求的方式下发到APP端？那这个获取密钥的请求被截获了怎么办？百思不解的阿辉请教了大学老师阿甘，阿甘提示可以使用**非对称密钥进行加密**，阿辉顺着思路开始了下一步的防护工作。

#### 非对称密钥加密

凭着阿辉快速的学习与理解能力，很快就搭建起了一套基于非对称密钥加密的通信方式

![](https://resources.chenjianhui.site/2019-12-14-pki-eq-flow.jpg)

这套体系下黑客就算反编译了APP也无法去破解请求报文，但阿辉发觉**所有的接口响应时间都变慢了不少**，仔细分析阿辉找到问题所在，非对称密钥的加解密效率较低，造成了较差的用户体验。

这个问题并没有困扰阿辉太久，强大的融会贯通能力让他很快找到了合适的解决方案，上述两个方案的冲突点在于

1. 对称密钥存在密钥泄漏风险
2. 非对称密钥存在性能低下问题

**何不把两者取长补短结合起来使用，当弱鸡APP登录时采用非对称密钥的交互方式，服务端下发token的同时附带一个与其关联的对称密钥，之后的业务交互都使用这个对称密钥加密进行。**

阿辉心情激动的落地了这个思路并将其上线，并将实现思路与老师阿甘交流畅谈，阿甘听完后笑着说：你这是**实现了一个HTTPS的协议流程**呀。阿辉听后本着不重复造轮子的精神去了解了一下HTTPS协议的交互流程，发现确实和自己思路大致一样，看着自己实现的交互流程阿辉心想，我这种方案的确实现了需求，但是有几个很严重的缺陷

1. 在业务层做加密而不放在传输层**对业务代码的侵入性太强**
2. 以这种方式发布的服务**无法做到普适性**，难以推广使用

综上原因阿辉选择抛弃自主研发的“HTTPS”，开始在传输层改造自己的应用

#### 启用HTTPS

阿辉的部署架构是简单的Nginx+多Tomcat搭建而成的小型服务集群，在查阅了相关的文档说明后，阿辉开始了HTTPS的配置工作

1. 使用 OpenSSL 生成 SSL Key 和 CSR 文件
2. 修改 Nginx 的配置文件并重启

![](https://resources.chenjianhui.site/2019-12-14-ssl-nginx-conf.png)

阿辉信心满满的将开启了HTTPS防护的弱鸡APP上了线，值得高兴的是根据客服的反馈盗号申诉的人明显减少，但有一个坏消息，***盗号情况却没完全消失**，阿辉心想难道这套体系下还能被盗取密码么？难道我这体系还有漏洞...阿辉与黑客新一轮的周旋开始了。

### 中间人攻击

黑客小刘自张三话费事件尝到甜头以后就一直在关注弱鸡APP，弱鸡APP在不断升级的同时小刘也在不断成长，小刘与阿辉的博弈让两人的水平都在不断攀升，今天小刘很高兴，因为他利用中间人攻击再次破解了阿辉的安全防线。

**何为中间人攻击？**

中间人攻击(Man-in-the-MiddleAttack，简称“MITM攻击”)是指攻击者**使用公钥交换的方式**来拦截消息并转发取代它们，原始双方表面上看仍然互相通信，但是内容可能已经被窥探或篡改，其攻击流程如下所示

![](https://resources.chenjianhui.site/2019-12-14-MTTM.png)

1. 服务器向客户端发送公钥。
2. 攻击者截获**真实的公钥**，保留在自己手上。
3. 攻击者自己生成一个**伪造的公钥**，发给客户端。
4. 客户端收到伪造的公钥后，使用此公钥加密**对称密钥**得到密钥密文发给服务器。
5. 攻击者截获获密钥密文，用自己的私钥解密获得对称密钥，同时使用**真实的公钥**加密对称密钥发给服务器。
6. 至此客户端与服务器通**暴露的对称密钥**进行通信，对于攻击者来说等同于明文通信。

不难理解中间人攻击是发生在服务器的证书的下发阶段，问题根本原因在于：**客户端无法确定服务器下发的证书是否被中间人篡改？**

#### CA体系

阿辉经过查阅资料也了解到了中间人攻击，在了解到问题的根本原因后解决它变得简单了，只需要给弱鸡APP找到一个验证证书是否被篡改的方式即可，阿辉在网络上寻找解决方案，**CA体系**进入了阿辉的视野。

CA(Certificate Authority)是指提供可信证书的认证中心机构，它把用户的公钥和用户的其他标识信息（如名称、e-mail、身仹证号等）捆绑在一起，在互联网上验证用户的身份。

也就是说阿辉可以**将弱鸡APP的证书与其标识信息在CA机构中注册**，之后弱鸡APP获取服务器下发的证书后先去CA机构中验证证书的来源，确定来源可靠后再进行网络交互，这便防止了中间人攻击。

#### 拓展

其实不仅仅在网站交互中存在中间人攻击问题，只要是基于非对称加密的传输协议都会存在该问题，比如**Linux服务器的登录认证**是通过**SSH协议**来进行的，平常我们登录一个服务器的流程是这样的

```bash
> ssh root@192.168.31.100

The authenticity of host 'host (192.168.31.100)' can't be established.
RSA key fingerprint is 98:2e:d7:e0:de:9f:ac:67:28:c2:42:2d:37:16:58:4d.
Are you sure you want to continue connecting (yes/no)?
```

系统会提示无法确定192.168.31.100公钥的真实性，只知道它的**公钥指纹**，是否还要继续连接？

公钥指纹是代表对公钥MD5计算后的值，由于公钥的长度比较长不容易比对，便用这个较短的指纹值进行比较，为什么要比较，其实就是为了防止中间人攻击篡改掉公钥信息。而我们如何知道服务器的公钥指纹呢？这里也没有比较好的办法，一般情况下可以在网站公示或者采用密钥对登录。

当你输入yes后表示公钥被接受，它将被保存于$HOME/.ssh/known_hosts中作为信任的主机，再次连接时将跳过警告。

```bash
Are you sure you want to continue connecting (yes/no)? yes
Warning: Permanently added 'host,192.168.31.100' (RSA) to the list of known hosts.
Password: ******
```

### 阿辉的心态🤔

经过一连续的事件阿辉的心态有了明显的变化，它意识到系统的安全设计是一个很重要模块，在一些涉及资金的模块时更是要对其严格把关，检查设计、开发与部署方面是否存在安全漏洞。抱着这样的心态，阿辉准备**重新审视**并检查一遍弱鸡APP是否还存在其他的安全漏洞。

### 敏感信息防护

阿辉先从弱鸡APP的**数据库设计**开始检查，结合自己最近获取到的安全知识阿辉很快就发现了**系统用户表**设计的有问题。

![](https://resources.chenjianhui.site/2019-12-14-normal-sys-user-design.png)

这样的设计虽然非常简单易懂，但是阿辉模拟了一下**如果数据库信息泄漏**了，那自己系统的所有用户数据不就完全公开了么，想想都令人害怕，看来得找个办法对**脱库数据**进行保护。

#### 密文存储

为了规避密码泄漏的风险，密码不应该明文存储在数据库中，那就转换成密文存储！阿辉立马想到两种手段

1. 通过**加密算法**存储密码，用户登录时对接收到的密码做同样的加密然后对比数据库
2. 通过**hash（摘要）算法**存储密码，用户登录时对接收到的密码做同样的hash然后对比数据库

对比两种方案后阿辉选择了后者，主要有以下两个原因

1. 加密算法需要一个密钥，**密钥的存储**也是有泄漏风险的
2. 密码不同于用户名称这样的字段，它**没有转换明文这种需求**并且它也不希望自己能被逆向转换，正好符合摘要算法的场景

经过改造后的系统用户数据如下所示

![](https://resources.chenjianhui.site/2019-12-14-hash-sys-user-design.png)

现在看来数据脱库后的风险似乎降了许多，但阿辉不多久又了解到一个名词，叫做**密码字典**，代指包括许多人们习惯性设置的密码的数据字典，比如Github就有一个叫做[爆破字典](https://github.com/rootphantomer/Blasting_dictionary)的仓库，阿辉不禁心想，用户数据脱库后，人们可以通过密码字典来反向寻找与密码相匹配的用户，也能达到破解的效果（如果用户密码设置的不复杂），破解的思路如下

1. 遍历密码字典，从密码字典中取出一条密码，对其做hash算法得到**密码摘要**
2. 使用密码摘要作为条件查询数据库的信息便可找到以此为密码的账户列表

可见这种设计方式如果数据库中存在相同密码的用户，一次查询匹配可以将它们全部获取，这对破解者也太友好了，**看来方案还得改改**。

#### 加盐存储

阿辉经过搜索很快就得到了一种更好的方案，也就是加盐存储，阿辉修改了系统用户的表结构，给它增加了一个字段叫做**salt（盐值）**，这个盐值需要**随机生成并且尽量保证每个用户都不一样**，password密码字段中存储也不再只是对密码的hash了，而是hash(password+salt)，数据表变成了如下结构

![](https://resources.chenjianhui.site/2019-12-14-salt-sys-user-design.png)

在用户登录时验证流程如下
1. 获取用户提交的密码submitPassword与其数据库中存储的盐值salt
2. 判断**hash(submitPassword+salt)**是否与数据库中存储的密码password相等

**流程改造后并不复杂，重点是salt怎么让数据更加安全的呢？我们先来看看破解的流程**

1. 遍历密码字典，从密码字典中取出一条密码
2. 遍历用户数据表取salt字段拼接到密码后面形成新的字符串，hash后与密码字段匹配

这个破解流程和上面的未加盐值的破解流程最大的区别是，相同密码的用户不会被一次性获取到了，增加了暴力破解的复杂度。

**我们假设密码字典有20W条数据，弱鸡APP有100W个用户，那么完全覆盖需要匹配多少次呢？**

不难算出，匹配次数为20Wx100W，也就是说最多需要**2000亿次**可得到密码字典覆盖到的用户，这个运算量的成本已经非常高了，而且在设计的时候也**不一定就把盐值放在密码之后hash**，也可以放到前面或者中间，由于破解者不知道盐值与密码的组成方式，这会给破解带来更大的难度。

这个设计暂时成为了阿辉满意的方案，除了数据方面，阿辉还去了解了一下其他可能出现的安全漏洞，并做了以下总结

### 安全漏洞防护

#### SQL 注入

SQL注入攻击是将击是输入参数**未经过滤，直接拼接到SQL语句当中解析，执行达到预想之外的一种行为**。比如下方的函数就存在sql注入风险，示例中通过传递参数的方式把sys_user表删除了。

```java
public SysUser findUserByAccount(String account) {
  String sql = "select * from sys_user where account = " + account;
  execute(sql);
}

public static void main(String[] args) {
  String account = "'';drop table sys_user;"
  findUserByAccount(account);
  // select * from sys_user where account = '';drop table sys_user;
}
```

阿辉看了看自己的系统，使用hibernate作为持久层且没有任何SQL拼接的操作，框架会帮系统防止SQL注入，放下心来，日后再去阅读框架是怎么去防止SQL注入的。

#### XSS 攻击

XSS攻击通过在目标网站上**注入恶意脚本并运行，盗取用户的令牌信息**。比如系统有一块公共评论展示区，有一个用户留下了JS脚本`alert('123')`，网站如果没有做XSS过滤那么在评论渲染时脚本就会被执行，只要打开这个评论区的用户就会弹出一个123的提示框，如果用户留下的是一个盗用token并将其发到自己服务器，那么它就可以伪装成其他用户进行操作。

#### CSRF 攻击

CSRF攻击与XSS攻击不同之处在于，**XSS盗取了令牌信息，但是CSRF没有盗取，它诱导用户点击链接去访问用户曾经认证过的网站并运行一些操作**，详见[跨站请求伪造wiki](https://zh.wikipedia.org/wiki/%E8%B7%A8%E7%AB%99%E8%AF%B7%E6%B1%82%E4%BC%AA%E9%80%A0)

## 总结

网络安全是一个日益火热的话题，这些知识作为一项软技能虽然不能给我们的开发带来大的帮助，但却是很重要且不可或缺的一块知识。

**写这篇文章的目的一来给自己所了解到的安全知识做一个总结，第二也希望文章能够对想了解这块内容的人提供一些帮助**，文章的编写借鉴了网上部分优秀文章的内容，都在下方的参考资料中，同样希望这些优秀博文能够帮助到想要了解这块内容的同学们。共勉。

## 参考资料

* [Web系统权限控制如何设计](https://cloud.tencent.com/developer/article/1356359)
* [权限系统与RBAC模型概述](https://blog.csdn.net/yangwenxue_admin/article/details/73936803)
* [RBAC权限管理](https://vaniot-s.github.io/2018/03/16/RBAC/)
* [什么是中间人攻击？——知乎](https://zhuanlan.zhihu.com/p/62025258)
* [SSH原理与运用（一）：远程登录](https://www.ruanyifeng.com/blog/2011/12/ssh_remote_login.html)
* [Nginx 配置 HTTPS 服务器](https://aotu.io/notes/2016/08/16/nginx-https/index.html)
* [为什么要在密码里加点“盐”](https://lichao.dev/2013/07/05/password-salt)
* [WEB应用常见15种安全漏洞一览](https://blog.fundebug.com/2019/01/25/11-security-flaws-for-web-application/)