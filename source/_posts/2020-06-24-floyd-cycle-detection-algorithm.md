---
title: Floyd、Brent 判圈算法
date: 2020-06-24 22:33:34
thumbnail: https://resources.chenjianhui.site/algorithm-home-pic.jpeg
categories: 
- Algorithm
tags: 
- Algorithm
---

&emsp;&emsp;本文主要介绍 Floyd 与 Brent 判圈算法及其使用场景，以图解的方式详细描述算法的运行流程，并在文末给出算法的部分应用场景与对应 Leetcode 的题型。

<!-- more -->

# 何为判圈算法

> 根据维基百科的定义，判圈算法是可以在有限状态机、迭代函数或者链表上判断是否存在环，以及求出该环的起点与长度的算法。

也就是说判圈算法能够为我们解决以下三个问题：
1. 判断链表是否有环
2. 求环的长度
3. 确定环的入口

**那么它是如何来解决这些问题的？下面通过算法概述这一章节，讲述一下算法的实现原理。**

# 算法概述

## Floyd 判圈算法

> Floyd 判圈算法的核心原理是，如果存在环，那么从同一个起点(即使这个起点不在某个环上)处，同时开始以不同速度前进的2个指针必定会在某个时刻相遇。

举个简单的例子，下方示例展示了一个不规则的环形链表，。我们给下方示例的运行分为两个阶段：
1. 第一阶段：相遇阶段，我们设置 `Slow、Fast` 两个指针，Fast 以 Slow 的两倍速度运行，最终它们会在某个节点相遇。
2. 第二阶段：寻找环入口阶段，节点相遇后我们将 Slow 指针重置到链表原点，并且将 Slow、Fast 指针设置为一样的运行速度，它们再次相遇的点即环的入口。

> 该示例展示了 Floyd 判圈算法寻找链表环形入口的过程，可通过 Next 按钮单步执行，观测算法运行流程。

{% raw %}
<script src="https://cdn.jsdelivr.net/npm/vue@2.6.11"></script>
<div id="demo1"></div>
{% endraw %}

**接下来同学可能会有疑问，为什么这两个阶段结合起来能够找到环状入口？下方我们通过一张图以数学的方式来证明一下该算法，下图来源于[环形链表 II - 环形链表 II - 力扣（LeetCode）](https://leetcode-cn.com/problems/linked-list-cycle-ii/solution/huan-xing-lian-biao-ii-by-leetcode/)**

![](https://resources.chenjianhui.site/20200628141710.png)

> 我们利用已知的条件：慢指针移动 1 步，快指针移动 2 步，来说明它们相遇在环的入口处。
> $$2 * distance(slow) = distance(fast)$$
> $$2(F + a) = F + a + b + a$$
> $$F = b$$
> 所以在第一阶段末，只需要归位一个节点并以同样的速度运行，即可在环入口相遇。

## Brent 判圈算法

Brent 判圈算法在判断链表是否有环的场景中可以比Floyd更快一点，他的算法原理如下：

> 该示例展示了 Brent 算法判断链表是否有环的过程，可通过 Next 按钮单步执行，观测算法运行流程。
> 值得注意的是，Brent 算法无法找到环的入口节点。

{% raw %}
<div id="demo2" ></div>
{% endraw %}

# 应用题

* [141. 环形链表 - 力扣（LeetCode）](https://leetcode-cn.com/problems/linked-list-cycle/)
* [142. 环形链表 II - 力扣（LeetCode）](https://leetcode-cn.com/problems/linked-list-cycle-ii/)
* [287. 寻找重复数 - 力扣（LeetCode）](https://leetcode-cn.com/problems/find-the-duplicate-number/)
* [160. 相交链表 - 力扣（LeetCode）](https://leetcode-cn.com/problems/intersection-of-two-linked-lists/)

# 参考资料

* [Floyd 判圈算法 | Hexo](https://iznauy.github.io/2019/04/18/Floyd-%E5%88%A4%E5%9C%88%E7%AE%97%E6%B3%95/)
* [Brent 判圈算法学习](http://zhengyhn.github.io/post/algorithm/brent.loop/)
* [环形链表 II - 环形链表 II - 力扣（LeetCode）](https://leetcode-cn.com/problems/linked-list-cycle-ii/solution/huan-xing-lian-biao-ii-by-leetcode/)

{% raw %}
<script>
function drawLinkedList(id, { linkedList, width, slow, fast }) {
  // init
  linkedList.forEach(o => o.handle = false)
  const canvas = document.getElementById(id)
  const maxWidth = 50 + Math.ceil(linkedList.length / 2) * 85
  width = Math.min(maxWidth, width)
  canvas.width = width
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = "#fff"
  ctx.beginPath()
  ctx.fillRect(0, 0, width, 200)
  ctx.closePath()
  // draw
  const head = linkedList[0]
  head.x = 25
  head.y = 25
  let node = head
  let col = 0
  let leftStart = true
  const r = 20
  while (true) {
    let { x, y } = node
    // circle
    if (slow === node && fast === node) {
      drawCircle(ctx, x, y, r, '#8bc34a', Math.PI, true)
      drawCircle(ctx, x, y, r, '#ff9800', Math.PI, false)
    } else if (slow === node) {
      drawCircle(ctx, x, y, r, '#8bc34a')
    } else if (fast === node) {
      drawCircle(ctx, x, y, r, '#ff9800')
    } else {
      drawCircle(ctx, x, y, r)
    }
    // text
    ctx.beginPath()
    ctx.fillStyle = '#000'
    ctx.font = '20px Arial'
    ctx.fillText(node.val, x - 6, y + 6)
    // arrow
    let pointStart = leftStart ? [x + r, y] : [x - r, y]
    col++
    let edge = false
    if (col > linkedList.length / 2) {
      leftStart = false
      col = 0
      edge = true
    }
    if (node.next) {
      if (!node.next.handle) {
        node.next.x = leftStart ? (25 + col * 80) : (width - 25 - col * 80)
        node.next.y = leftStart ? 25 : 105
        node.handle = true
      }
      let pointEnd = leftStart ? [node.next.x - r, node.next.y] : [node.next.x + r, node.next.y]
      if (node.next.handle && node.next.circleStart === true) {
        pointEnd = [node.next.x, node.next.y + r]
      }
      if (edge) {
        pointEnd = [node.next.x, node.next.y - r]
      }
      drawArrow(ctx, pointStart[0], pointStart[1], pointEnd[0], pointEnd[1])
    }
    if (!node.next || node.next.handle) {
      break
    }
    node = node.next
  }
}
function drawCircle(ctx, x, y, r, fillColor, s = 2 * Math.PI, t) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, s, t)
  if (fillColor) {
    ctx.fillStyle = fillColor
    ctx.fill()
  } else {
    ctx.fillStyle = '#000'
    ctx.stroke()
  }
}
function drawArrow(ctx, fromX, fromY, toX, toY, theta = 18, headlen = 18, width = 2, color = '#f36') {
  // 计算各角度和对应的P2,P3坐标
  var angle = Math.atan2(fromY - toY, fromX - toX) * 180 / Math.PI,
    angle1 = (angle + theta) * Math.PI / 180,
    angle2 = (angle - theta) * Math.PI / 180,
    topX = headlen * Math.cos(angle1),
    topY = headlen * Math.sin(angle1),
    botX = headlen * Math.cos(angle2),
    botY = headlen * Math.sin(angle2);
  ctx.save();
  ctx.beginPath();
  var arrowX = fromX - topX,
    arrowY = fromY - topY;
  ctx.moveTo(arrowX, arrowY);
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  arrowX = toX + topX;
  arrowY = toY + topY;
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(toX, toY);
  arrowX = toX + botX;
  arrowY = toY + botY;
  ctx.lineTo(arrowX, arrowY);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}
const DemoContainer = Vue.extend({
  template: `
  <div class="demo-container">
    <div class="title">{{ title }}</div>
    <div class="content">
      <canvas :id="canvasId" height="200" width="400"></canvas>
      <div class="desc">
        <div>Slow Node: <div class="circle slow">S</div> => {{ slow && slow.val }}</div>
        <div>Fast Node: <div class="circle fast">F</div> => {{ fast && fast.val }}</div>
        <div style="display: block;margin-top: 8px;">
          <span>Step Count: {{ stepCnt }}</span>
          <div class="gt-container">
            Actions: 
            <button class="gt-btn gt-btn-preview" @click="handleAuto">
              <span class="gt-btn-text">{{ autoBtnText }}</span>
            </button>
            <button class="gt-btn gt-btn-preview" @click="handleNext">
              <span class="gt-btn-text">Next</span>
            </button>
            <button class="gt-btn gt-btn-preview" @click="handleRestart">
              <span class="gt-btn-text">Restart</span>
            </button>
          </div>
        </div>
        <div style="display: block;margin-top: 8px;">
          Log Message：{{ log }}
        </div>
      </div>
    </div>
  </div>`,
  props: {
    canvasId: 'canvasDemo',
    type: String,
    arr: Array,
    circleStartIndex: 0,
    title: String
  },
  data() {
    return {
      linkedList: [],
      initStatus: true,
      afterMeet: false,
      step: 0,
      stepLimit: 1,
      end: false,
      auto: false,
      autoProcessId: null,
      stepCnt: 0,
      log: '',
      slow: null,
      fast: null,
      width: 400
    }
  },
  computed: {
    autoBtnText() {
      return this.auto ? 'Stop Auto' : 'Start Auto'
    }
  },
  methods: {
    initCycleLinkedList() {
      this.linkedList = []
      this.initStatus = true
      this.afterMeet = false
      this.end = false
      this.stepCnt = 0
      this.stepLimit = 1
      this.step = 0
      this.log = '快慢指针初始化在原点'
      this.arr.forEach((o, i) => {
        const node = { val: o }
        this.linkedList.push(node)
        if (i > 0) {
          this.linkedList[i - 1].next = node
        }
      })
      if (this.circleStartIndex > -1 && this.circleStartIndex < this.linkedList.length) {
        this.linkedList[this.circleStartIndex].circleStart = true
        this.linkedList[this.linkedList.length - 1].next = this.linkedList[this.circleStartIndex]
      }
      this.slow = this.linkedList[0]
      this.fast = this.linkedList[0]
      this.width = this.$el.offsetWidth - 48
      drawLinkedList(this.canvasId, this)
    },
    handleAuto() {
      if (this.auto) {
        clearInterval(this.autoProcessId)
      } else {
        this.autoProcessId = window.setInterval(() => {
          if (this.end) {
            this.handleRestart()
          }
          this.handleNext()
        }, 1500)
      }
      this.auto = !this.auto
    },
    handleNext() {
      if (this.end === false) {
        switch (this.type) {
          case 'Brent':
            this.handleNextBrent()
            break
          default:
            this.handleNextFloyd()
        }
        drawLinkedList(this.canvasId, this)
      }
    },
    handleNextFloyd() {
      if (this.afterMeet) {
        if (this.slow === this.fast) {
          this.end = true
          this.log = `[运行完毕] 快慢指针第二次相遇，相遇节点为 ${this.slow.val}，此节点为圆环入口`
        } else {
          this.slow = this.slow.next
          this.fast = this.fast.next
          this.log = `[第二阶段] 快慢指针同速度运行`
        }
      } else {
        if (!this.initStatus && this.slow === this.fast) {
          this.afterMeet = true
          this.fast = this.linkedList[0]
          this.stepCnt++
          this.log = `[第二阶段] 快指针回到原点，并与慢指针同样的速度运行`
        } else {
          this.initStatus = false
          this.slow = this.slow.next
          this.stepCnt++
          this.fast = this.fast.next ? this.fast.next.next : null
          this.stepCnt+=2
          if (!this.fast) {
            this.end = true
            this.log = `该链表无环`
          } else {
            this.log = `[第一阶段] 快指针是慢指针两倍速度运行`
          }
        }
        if (this.slow === this.fast) {
          this.log = `[第一阶段] 快慢指针第一次相遇，相遇节点为 ${this.slow.val}，链表有环`
        }
      }
    },
    handleNextBrent() {
      if (this.step >= this.stepLimit) {
        this.slow = this.fast
        this.stepCnt++
        this.stepLimit = this.stepLimit * 2
        this.step = 0
        this.log = `慢指针归位到快指针处`
      } else {
        this.fast = this.fast.next
        this.stepCnt++
        this.step++
        this.log = `快指针移动一步，已经移动 ${this.step} 步，最多移动 ${this.stepLimit} 步`
        if (this.fast === this.slow) {
          this.end = true
          this.log = '快指针追到慢指针，链表有环'
        }
      }
    },
    handleRestart() {
      this.initCycleLinkedList()
    }
  },
  mounted() {
    this.initCycleLinkedList()
  }
})
new DemoContainer({
  propsData: {
    type: 'Floyd',
    canvasId: 'canvasDemo1',
    arr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    circleStartIndex: 2,
    title: 'Floyd 算法运行图解'
  }
}).$mount('#demo1')
new DemoContainer({
  propsData: {
    type: 'Brent',
    canvasId: 'canvasDemo2',
    arr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    circleStartIndex: 2,
    title: 'Brent 算法运行图解'
  }
}).$mount('#demo2')
</script>
<style>
  .demo-container {
    border: 1px solid #e8e8e8;
    border-radius: 3px;
    transition: .2s;
    margin-top: 15px;
    margin-bottom: 15px;
    background: #fff;
  }
  .demo-container .title {
    font-size: 18px;
    font-weight: bold;
    border-bottom: 2px solid #009688;
    padding: 16px;
  }
  .demo-container .content {
    padding: 24px;
  }
  .demo-container .desc {
    margin-top: 16px;
  }
  .demo-container .desc div {
    display: inline-block;
    margin-left: 8px;
  }
  .demo-container .node {
    margin: 0 16px;
  }
  .demo-container .circle {
    display: inline-block;
    width: 30px;
    height: 30px;
    text-align: center;
    line-height: 28px;
    border: 2px solid #4a4a4a;
    border-radius: 50%;
    margin-left: 0 !important;
  }
  .demo-container .slow {
    background: #8bc34a;
  }
  .demo-container .fast {
    background: #ff9800;
  }
</style>
{% endraw %}