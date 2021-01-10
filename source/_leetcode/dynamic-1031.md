---
title: 俄罗斯套娃信封问题
group: 动态规划/贪心
level: hard
url: https://leetcode-cn.com/explore/interview/card/bytedance/246/dynamic-programming-or-greedy/1031/
---

# 题干

> 给定一些标记了宽度和高度的信封，宽度和高度以整数对形式 (w, h) 出现。当另一个信封的宽度和高度都比这个信封大的时候，这个信封就可以放进另一个信封里，如同俄罗斯套娃一样。
请计算最多能有多少个信封能组成一组“俄罗斯套娃”信封（即可以把一个信封放到另一个信封里面）。
说明: 不允许旋转信封
```sh
示例：
输入: envelopes = [[5,4],[6,4],[6,7],[2,3]]
输出: 3 
解释: 最多信封的个数为 3, 组合为: [2,3] => [5,4] => [6,7]。
```

# 题解

## 解题思路

首先考虑贪婪算法，对每个数组取其 w + h 然后升序排列，循环依次判断能否套入信封：

[[5,4],[6,4],[6,7],[2,3]] => [[2,3],[5,4],[6,4],[6,7]] => [[2,3],[5,4],[6,7]] => 3

从这个例子来看，能够取得正确值，但是下面这个例子就不行了：

[[13,11],[18,13],[14,18],[18,19]] => [[13,11],[18,13]] => 2

正确答案是 [[13,11],[14,18],[18,19]]

局部最优并没有取得全局最优，所以贪婪算法不适用与此场景，在此场景需要考虑回溯，尝试动态规划

首先尝试拆分子问题，举例说明：

[[5,4],[6,4],[6,7],[2,3]] 中选取一项作为头部，剩下可以做尾部

$$$$


```js
function maxEnvelopes(envelopes) {
  if (envelopes.length === 0 || envelopes.length === 1) {
    return envelopes.length
  }
  let result = 0
  for (let i = 0; i < envelopes.length; i++) {
    const cur = envelopes[i]
    result = Math.max(1 + maxEnvelopes(envelopes.filter(o => o[0] > cur[0] && o[1] > cur[1])), result)
  }
  return result
}
```

