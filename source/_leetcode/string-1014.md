---
title: 最长公共前缀
level: normal
url: https://leetcode-cn.com/explore/interview/card/bytedance/242/string/1014/
---

# 题干

编写一个函数来查找字符串数组中的最长公共前缀。

如果不存在公共前缀，返回空字符串 ""。

示例：

```sh
输入: ["flower","flow","flight"]
输出: "fl"

输入: ["dog","racecar","car"]
输出: ""
解释: 输入不存在公共前缀

说明: 所有输入只包含小写字母 a-z 
```

# 题解

## 解题思路

1. 取出字符串列表中最短的字符长度
2. 利用双循环匹配列表中的相应位置的每一个字符

```js
function longestCommonPrefix(strs) {
  if (!strs || strs.length === 0) {
    return ''
  }
  let same = '', match, endFlag
  const len = Math.min.apply(null, strs.map(o => o.length))
  for (let i = 0; i < len; i++) {
    endFlag = false
    match = strs[0].charAt(i)
    for (let j = 1; j < strs.length; j++) {
      if (match !== strs[j].charAt(i)) {
        endFlag = true
      }
    }
    if (endFlag) {
      break
    }
    same += match
  }
  return same
}
```

代码通过了检测，排名参考值为 95%

![](https://resources.chenjianhui.site/20200605134813.png)


