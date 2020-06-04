---
title: 无重复字符的最长子串
level: normal
url: https://leetcode-cn.com/explore/interview/card/bytedance/242/string/1012/
---

# 题干

给定一个字符串，请你找出其中不含有重复字符的 最长子串 的长度

示例：

```sh
输入: "abcabcbb"
输出: 3 
解释: 因为无重复字符的最长子串是 "abc"，所以其长度为 3。

输入: "bbbbb"
输出: 1
解释: 因为无重复字符的最长子串是 "b"，所以其长度为 1。

输入: "pwwkew"
输出: 3
解释: 因为无重复字符的最长子串是 "wke"，所以其长度为 3。
     请注意，你的答案必须是 子串 的长度，"pwke" 是一个子序列，不是子串。
```

# 题解

## 解题思路

1. 通过一个数组维护无重复字符列表
2. 循环目标字符串，当字符存在于数组时，记录数组当前长度与历史长度的较大值，并根据匹配位切割数组 `'dvcdf'` 匹配到第四位时的数组变换 `[d, v, c]` => `[v, c, d]`
3. 最后取数组与历史记录值的较大值

```js
function lengthOfLongestSubstring(s) {
  let arr = []
  let len = 0
  s.split('').forEach(s => {
    const i = arr.indexOf(s)
    if(i > -1) {
      arr = arr.slice(i + 1, arr.length)
    }
    arr.push(s)
    len = Math.max(arr.length, len)
  })
  return len
}
```

该方法通过了 Leetcode 的检测，但是执行耗时过长，排名在 75%

![](https://resources.chenjianhui.site/20200604202543.png)

## 优化方案

1. 原先用于存储无重复字符列表的数组空间可以节省，因为字符列表是连续的，所以可以通过一个下标标记实现
2. 匹配的时间复杂度和原来是一样的，数组切割的部分可以移除，节省这部分性能

```js
function lengthOfLongestSubstring(s) {
  let len = 0
  let q = 0
  const arr = s.split('')
  for (let i = 0; i < arr.length; i++) {
    for (let j = q; j < i; j++) {
      if(arr[j] === arr[i]) {
        q = j + 1
        break
      }
    }
    len = Math.max(i - q + 1, len)
  }
  return len
}
```

该方法执行耗时和内存都有提升

![](https://resources.chenjianhui.site/20200604204730.png)