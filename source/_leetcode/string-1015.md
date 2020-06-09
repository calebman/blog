---
title: 字符串相乘
group: 字符串
level: normal
url: https://leetcode-cn.com/explore/interview/card/bytedance/242/string/1016/
---

# 题干

> 给定两个以字符串形式表示的非负整数 num1 和 num2，返回 num1 和 num2 的乘积，它们的乘积也表示为字符串形式。
```sh
示例一：
输入: num1 = "2", num2 = "3"
输出: "6"
示例二：
输入: num1 = "123", num2 = "456"
输出: "56088"
说明：
1. num1 和 num2 的长度小于110。
2. num1 和 num2 只包含数字 0-9。
3. num1 和 num2 均不以零开头，除非是数字 0 本身。
4. 不能使用任何标准库的大数类型（比如 BigInteger）或直接将输入转换为整数来处理。
```

# 题解

## 解题思路

采用竖式相乘法，和平时竖式相乘不一样的地方是，延后处理进位，举个例子：

```js
------------------- 传统方式立即进位 -------------------
    15
x   55
------
    75
   75
------
=  825

------------------- 当前算法延后进位 -------------------
    15 // num1
x   55 // num2
------
[0, 0, 0, 0]         // 初始化数组
[0, 1 * 5, 0, 0]     // num1[0] * num2[0]
[0, 5, 1 * 5, 0]     // num1[0] * num2[1]
[0, 5, 5 + 5 * 5, 0] // num1[1] * num2[0]
[0, 5, 30, 5 * 5]    // num1[1] * num2[1]
[0, 5, 30, 25]       // 竖式相乘结果集合
[0, 5, 32, 5]        // 从后往前进位
[0, 8, 2, 5]
[8, 2, 5]            // 去除前位 0 值，得到结果 825
```

```js
function multiply(num1, num2) {
  let cn = num1.length + num2.length;
  let c = new Array(cn).fill(0);
  // 竖式相乘但不进位
  for (let i = 0; i < num1.length; i++) {
    for (let j = 0; j < num2.length; j++) {
      c[i + j + 1] += Number(num1[i]) * Number(num2[j])
    }
  }
  // 从后往前处理进位   
  for (let i = cn - 1; i >= 0; i--) {
    let carry = Math.trunc(c[i] / 10);
    if (carry) {
      c[i - 1] += carry
    }
    c[i] = c[i] % 10
  }
  // 处理前面的 0
  while (c[0] === 0) {
    c.shift()
  }
  return c.join('') || '0'
}
```

## 如何优化

Karatsuba 算法能够将 O(n^2) 复杂度变成 O(n^1.5) 左右，具体实现见最下方的参考文献，在此给出个人的实现代码：

```js
function multiply(num1, num2) {
  if (num1.length === 1 && num2.length === 1) {
    return String(Number(num1) * Number(num2))
  }
  // 拆分
  const m = num1.length
  const n = num2.length
  const halfN = Math.floor(Math.max(m, n) / 2)
  const a = m > halfN ? num1.substring(0, m - halfN) : '0'
  const b = m > halfN ? num1.substring(m - halfN, m) : num1
  const c = n > halfN ? num2.substring(0, n - halfN) : '0'
  const d = n > halfN ? num2.substring(n - halfN, n) : num2
  // ab*cd = ac ad+bc bd
  const ac = multiply(a, c)
  const bd = multiply(b, d)
  // ad+bc = AC+AD+BC+BD-AC-BD = (A+B)(C+D)-AC-BD
  const adbc = sub(multiply(sum(a, b), sum(c, d)), ac, bd)
  // 进位
  const result = sum(carry(ac, 2 * halfN), carry(adbc, halfN), bd)
  return result
}

/**
 * 大数相加
 */
function sum() {
  const args = Array.from(arguments)
  let carry = 0
  let result = []
  let len = Math.max(...args.map(o => o.length))
  let i = len;
  while (i--) {
    let sum = args.map(s => (+s[i - len + s.length] || 0)).reduce((a, b) => a + b) + carry
    carry = parseInt(sum / 10)
    result.unshift(sum % 10)
  }
  if (carry) result.unshift(carry)
  return result.join('')
}
/**
 * 大数相减
 * TODO
 */
function sub() {
  const args = Array.from(arguments)
  return args.map(s => parseInt(s)).reduce((a, b) => a - b)
}
/**
 * 大数进位
 */
function carry(numStr, digits) {
  for (let i = 0; i < digits; i++) {
    numStr += '0'
  }
  return numStr
}
```

# 参考资料

* [知乎 Karatsuba乘法](https://zhuanlan.zhihu.com/p/42350768)
* [2名数学家或发现史上最快超大乘法运算法，欲破解困扰人类近半个世纪的问题](https://mp.weixin.qq.com/s/GCCEJWbNscJyf4K5nleOnA)