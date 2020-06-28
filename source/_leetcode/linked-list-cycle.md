---
title: 循环链表
group: 链表
level: normal
url: https://leetcode-cn.com/problems/linked-list-cycle/
---

# 前言

循环链表题型可用 Floyd、Brent 判圈算法解决，算法介绍可参考文章 [Floyd、Brent 判圈算法](/2020-06-24-floyd-cycle-detection-algorithm)，该文章图解了算法的运行流程。

# 循环链表I

> 给定一个链表，判断链表中是否有环。

1. 使用 Brent 算法，时间复杂度 O(n)，空间复杂度 O(1)。

```js
/**
 * Definition for singly-linked list.
 * function ListNode(val) {
 *     this.val = val;
 *     this.next = null;
 * }
 */

/**
 * @param {ListNode} head
 * @return {boolean}
 */
var hasCycle = function(head) {
    let slow, fast = head
    let step, stepLimit = 1
    for(;;) {
        step = 0
        while (step < stepLimit) {
            if (!fast) return false
            fast = fast.next
            if (fast === slow) return true
            step++
        }
        slow = fast
        stepLimit *= 2
    }
    return false
};
```

# 循环链表II

> 给定一个链表，返回链表开始入环的第一个节点。 如果链表无环，则返回 null。

1. 通过缓存的思路，时间复杂度 O(n)，空间复杂度 O(n)。

```js
/**
 * Definition for singly-linked list.
 * function ListNode(val) {
 *     this.val = val;
 *     this.next = null;
 * }
 */

/**
 * @param {ListNode} head
 * @return {ListNode}
 */
var detectCycle = function(head) {
  let node = head, cache = new Set()
  let i = 0
  while (node) {
      if (cache.has(node)) return node
      cache.add(node)
      node = node.next
  }
  return null
};
```

2. 通过修改链表的思路，时间复杂度 O(n)，空间复杂度 O(1)。

```js
var detectCycle = function(head) {
    let node = head, cache = {}
    while (node) {
        if (cache[node]) {
            return node
        }
        cache[node] = true
        node = node.next
    }
    return null
};
```

3. 使用 Floyd 算法，不修改链表且不用额外空间的思路，时间复杂度近似于 O(n)，空间复杂度 O(1)。

```js
var detectCycle = function(head) {
    if (!head) return null
    let slow = head, fast = head
    // 第一步，找相遇点
    for(;;) {
        slow = slow.next
        fast = fast.next ? fast.next.next : null
        if (!fast || !slow) return null
        if (slow === fast) {
            slow = head
            break
        }
    }
    // 第二步，等速移动，相遇点即环入口
    for(;;) {
        if (slow === fast) {
            return slow
        }
        slow = slow.next
        fast = fast.next
    }
};
```