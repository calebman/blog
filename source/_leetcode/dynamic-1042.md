---
title: 买卖股票的最佳时机
group: 动态规划
level: normal
url: https://leetcode-cn.com/explore/interview/card/bytedance/246/dynamic-programming-or-greedy/1042/
---

# 题干

> 给定一个数组，它的第 i 个元素是一支给定股票第 i 天的价格。
如果你最多只允许完成一笔交易（即买入和卖出一支股票一次），设计一个算法来计算你所能获取的最大利润。
注意：你不能在买入股票前卖出股票。
```sh
示例一：
输入: [7,1,5,3,6,4]
输出: 5
解释: 在第 2 天（股票价格 = 1）的时候买入，在第 5 天（股票价格 = 6）的时候卖出，最大利润 = 6-1 = 5 。
注意：利润不能是 7-1 = 6, 因为卖出价格需要大于买入价格；同时，你不能在买入前卖出股票。
示例二：
输入: [7,6,4,3,1]
输出: 0
解释: 在这种情况下, 没有交易完成, 所以最大利润为 0。
```

# 题解

## 解题思路

本题是典型的动态规划问题，先考虑拆分成子问题

> 举 [7,1,5,3,6,4] 这个例子，可以拆分成以下两种情况
(1) 第一天买入，最大价值为：[1,5,3,6,4] 的最大值 - 7，如果小于 0 则取 0
(2) 第一天不买入，最大价值为：基于这个 [1,5,3,6,4] 剩余 5 天的情况，所能获取的最大利润
最终结果取情况1、2的较大值

不难得出下方两个要素：
**1. 状态转移方程**
$$f(x) = max(max(p[n - x + 1]...p[n - 1]) - p[n - x], f(x - 1))$$
**2. 边界**
$$f(2) = max(p[1] - p[0], 0)$$ $$f(1) = 0$$ $$f(0) = 0$$
其中 p：股票数组、n：数组总长度、x：剩余数组长度

利用递归很容易做出如下代码实现：

```js
function maxProfit(prices) {
  if (prices.length < 2) {
    return 0
  }
  if (prices.length === 2) {
    // f(2) = max(p[1] - p[0], 0)
    return Math.max(prices[1] - prices[0], 0)
  }
  const price = prices.shift()
  // f(x) = max(max(p[n - x + 1]...p[n - 1]) - p[n - x], f(x - 1))
  return Math.max(Math.max(...prices) - price, maxProfit(prices))
}
```

## 优化方案

由于 f(x) 的值仅依赖 f(x - 1)，所以我们可以考虑从后往前递推值，具体实现如下：

```js
function maxProfit(prices) {
  let tmp = 0
  for (let i = prices.length - 2; i >= 0; i--) {
    tmp = Math.max(Math.max(...prices.slice(i)) - prices[i], tmp)
  }
  return tmp
}
```

而 `Math.max(...prices.slice(i)` 的计算可以通过存储一个临时变量 `max`，然后跟随数组遍历时比较获得，从而节省了数组的切割与比较操作，更新后的实现如下：

```js
function maxProfit(prices) {
  let tmp = 0
  let max = 0
  for (let i = prices.length - 2; i >= 0; i--) {
    max = Math.max(prices[i + 1], max)
    tmp = Math.max(max - prices[i], tmp)
  }
  return tmp
}
```