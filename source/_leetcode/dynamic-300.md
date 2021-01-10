---
title: 最长上升子序列
group: 动态规划
level: normal
url: https://leetcode-cn.com/problems/longest-increasing-subsequence/
---

# 题干

> 给定一个无序的整数数组，找到其中最长上升子序列的长度。
```sh
示例：
输入: [10,9,2,5,20,40,28,29,1,3]
输出: 4 
解释: 最长的上升子序列是 [2,5,20,28,29]，它的长度是 5。
```

# 题解

## 解题思路

首先考虑使用贪心算法，取数组中的最大值，然后向前递推得到子串，举例说明：

[10,9,2,5,20,40,28,29,1,3] => [10,9,2,5,20,40] => [2,5,20,40] => 4

并不能得到正确的结果，需要回溯判断，考虑动态规划

**1. 列举状态转移方程**
$$f(x) = max(g(x), f(x - 1))$$
**2. 列举边界**
$$f(1) = 1$$ $$f(0) = 0$$
其中 g(x)：当前数组从后往前算的最长上升子序列的长度 x：数组长度

利用递归实现代码如下：

```js
function lengthOfLIS(nums) {
  if (nums.length === 0) {
    return 0
  }
  let end = nums[nums.length - 1]
  let cnt = 1
  for (let i = nums.length - 2; i >= 0; i--) {
    if(end > nums[i]) {
      end = nums[i]
      cnt++
    }
  }
  nums.pop()
  return Math.max(cnt, lengthOfLIS(nums))
}
```