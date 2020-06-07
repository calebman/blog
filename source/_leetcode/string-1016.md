---
title: 字符串的排列
group: 字符串
level: normal
url: https://leetcode-cn.com/explore/interview/card/bytedance/242/string/1016/
---

# 题干

> 给定两个字符串 s1 和 s2，写一个函数来判断 s2 是否包含 s1 的排列。
换句话说，第一个字符串的排列之一是第二个字符串的子串。
```sh
示例一：
输入: s1 = "ab" s2 = "eidbaooo"
输出: True
解释: s2 包含 s1 的排列之一 ("ba").
示例二：
输入: s1= "ab" s2 = "eidboaoo"
输出: False
注意：
1. 输入的字符串只包含小写字母
2. 两个字符串的长度都在 [1, 10,000] 之间
```

# 题解

## 解题思路

1. 取得字符串 s1 的 `Unicode` 累加大小，遍历字符串 s2 每次取长度为 `s1.length` 的字符串与 s1 比较
2. 如果 `Unicode` 累加值不一样则进行下一轮比较
3. 累加值一样则进行更加准确的匹配，只要匹配成功就返回结果

```js
function checkInclusion(s1, s2) {
  if (s1.length > s2.length) {
    return false
  }
  if (s1.length === 1) {
    return s2.includes(s1)
  }
  const s1Len = s1.length
  const s1Arr = s1.split('')
  const s1CharCodeSum = s1.split('').map(c => c.charCodeAt()).reduce((total, n) => total + n)
  let charCodeSum
  for (let i = 0; i < s2.length - s1Len + 1; i++) {
    if (i === 0) {
      charCodeSum = s2.substr(0, s1Len).split('').map(c => c.charCodeAt()).reduce((total, n) => total + n)
    } else {
      // 减首位的 Unicode 值，增尾部的 Unicode值
      charCodeSum = charCodeSum - s2.charAt(i - 1).charCodeAt() + s2.charAt(i + s1Len - 1).charCodeAt()
    }
    if (charCodeSum === s1CharCodeSum) {
      // 进行更加准确的匹配
      let child = s2.substr(i, s1Len)
      if (s1Arr.every(s => child.includes(s))) {
        return true
      }
    }
  }
  return false
}
```

leetcode 成绩单一般，考虑下如何优化

![](https://resources.chenjianhui.site/20200605153204.png)

## 优化思路

实在没想到优化的思路，去参考了下 50ms 大神的代码

```js
function checkInclusion(s1, s2) {
  const getCode = s => s.charCodeAt() - 97

  const count = new Array(26).fill(0);
  for (let i = 0; i < s1.length; i++) {
      count[getCode(s1[i])]++;
  }
  let left = 0;
  let right = 0;
  while(right < s2.length) {
      const c = s2[right++];
      
      count[getCode(c)]--;
      
      while (left < right && count[getCode(c)] < 0) {
          count[getCode(s2[left++])]++;
      }
      if (right - left === s1.length) {
          return true;
      }
  }
  return false;
};
```

理解这个算法首先要清楚的是，s2 是否能被 s1 排列组合得到，这个判断的依据是 s2 在一段相等长度且连续的字符集中，有着跟 s1 同数量的同种类字符，举个例子：

> abcacc 是否包含 acc 的排列，可以通过移位的方式移动到 ab`cac`c 的 cac 段时，其有两个 c 和一个 a 即代表它是 acc 的排列。

上述算法创造了一个计数器 `count` 记录了 S1 字符包含的字符数量分布，由于题目说明只能是小写字母，于是它巧用了字符的 Unicode 创建了一个长度为26的数组来作为计数器的实现，而后通过 right 指针进行移位操作，移位时计数变更，当计数值小于0代表**区间字符包含无法组合成为S1**，需要通过 left 指针进行计数回滚，在 right 指针移位过程中区间字符数与 S1 的长度相等时，代表可排列。

在此通过下图对其流程稍作分析：

![](https://resources.chenjianhui.site/20200607210937.png)