---
title: 算法——猫鼠游戏
date: 2019-06-20 19:23:16
thumbnail: https://resources.chenjianhui.site/algorithm-home-pic.jpeg
categories: 
- Algorithm
tags: 
- Algorithm
- Java
---

&emsp;&emsp;给定一张地图，其中包含`猫`、`老鼠`、`障碍物`三类元素，游戏初始化时猫在地图的左上角，老鼠在地图的右下角，猫每个回合可以选择自己临近格子移动一步，不可超过地图边界，不可移动至有障碍物处，请设计一个算法让`猫`使用最少的回合抓住`老鼠`。

<!-- more -->

# 游戏设计

&emsp;&emsp;首先我们需要设计出整个游戏，并预留出猫的移动逻辑交给用户去实现，这里我基于canvas设计了[cat-mouse-game-gen.js](https://resources.chenjianhui.site/cat-mouse-game-gen-0.1.9.js)来作为游戏构建程序，借助这个脚本使用如下代码即可构建一个猫鼠游戏棋盘：

```html
<!DOCTYPE html>
<html lang="en">
<body>
<canvas id="gamePlace">not support canvas</canvas>
</body>
<script type="text/javascript" src="https://resources.chenjianhui.site/cat-mouse-game-gen-0.1.9.js"></script>
<script>
    gameGen.initGame('gamePlace')
</script>
</html>
```

{% raw %}
<canvas id="staticPlace">not support canvas</canvas>
{% endraw %}

&emsp;&emsp;其中**gameGen.initGame(`canvasId`, `catHandler`, `mouseHandler`, `options`)**是游戏的初始化函数，它负责渲染统计数据及运行游戏，函数共接收四个参数
* `canvasId`：canvas画布ID
* `catHandler`： 猫的行动决策函数function(`chessboard`, `curIndex`, `canMovePoints`) ，不传此参数代表不行动，函数的返回值即是猫的下一步位置，行动目标是抓住老鼠
  * `chessboard`：棋盘局势，是一个一维数组，数组长度为棋盘的总格子数，每个点位的值都是一个对象（exp `{ flag: 1, depletePower: null }`），包括`flag`（棋子类型）与`depletePower`（当flag为0时此值不为空，代表行走需要消耗的体力值）两个属性，其中`flag`的类型码定义如下
    * 0：可移动格子
    * 1：猫
    * 2：老鼠
    * 3：障碍物
  * `curIndex`：猫的当前位置
  * `canMovePoints`：可以移动的点位，是一个一维数组，代表可移动的位置信息，如果返回值不在此范围内棋子将不会移动
* `mouseHandler`: 老鼠的行动决策函数，介绍同catHandler，行动目标是躲避猫的追击
* `options`: 配置信息
  * `columns`：棋盘列的数量，默认为8
  * `rows`：棋盘行的数量，默认为16
  * `delay`：回合时间延迟毫秒数，默认为800
  * `complexRoad`：是否开启复杂道路，默认为false，开启后将会引入不同类型的道路如草地/溪流，不同的道路行走消耗的体力也不同，问题将演变成有优先级的最短路径

&emsp;&emsp;举个例子，以下代码实现了一个随机行动的猫，虽然随机移动的猫抓到老鼠全凭运气，不过这也算一种移动策略了

```html
<canvas id="randomPlace">not support canvas</canvas>
<script>
    const randomHandler = (chessboard, curIndex, canMovePoints) => {
        const randomIndex = Math.round(Math.random() * (canMovePoints.length - 1))
        return canMovePoints[randomIndex]
    }
    gameGen.initGame('randomPlace', randomHandler)
</script>
```

{% raw %}
<canvas id="randomPlace">not support canvas</canvas>
{% endraw %}

# 算法设计

&emsp;&emsp;至此我们已经有了一个可以根据算法移动的猫了，接下来就是设计猫抓老鼠的算法，我们稍微转化一下这个问题，其实就是根据行动决策函数中的棋盘局势数组去找猫到老鼠之间的**最短路径**，既然要找最短路径我们免不了要对棋盘进行遍历搜索，在上一篇博客[24点游戏](/2019-06-17-algorithm-topic)中我们讲到搜索算法有`DFS`与`BFS`两种策略，我们对比一下这两种策略，`DFS`算法属于一种**盲目搜索**，要找到最短路径必然要遍历全局，而`BFS`扩散式搜索，只要第一次搜索到终点就可以退出，不需要遍历全局，因此在这里我们将使用`BFS`实现猫的行动策略。

## 设计思路

&emsp;&emsp;我们先假设有一个4*8的棋盘，猫在棋盘的左上角（数组的下标0处），老鼠在棋盘的右下角（数组下标31处），并在3、 10、 13、 18、 28处位置设置了5个障碍物，现在我将基于这个局势去模拟`BFS`算法的搜索流程。

|        |      |                            |                           |                            |                            |      |           |
| ------ | ---- | -------------------------- | ------------------------- | -------------------------- | -------------------------- | ---- | --------- |
| 0:cat: | 1    | 2                          | **3**:mountain_bicyclist: | 4                          | 5                          | 6    | 7         |
| 8      | 9    | **10**:mountain_bicyclist: | 11                        | 12                         | **13**:mountain_bicyclist: | 14   | 15        |
| 16     | 17   | **18**:mountain_bicyclist: | 19                        | 20                         | 21                         | 22   | 23        |
| 24     | 25   | 26                         | 27                        | **28**:mountain_bicyclist: | 29                         | 30   | 31:mouse: |
|        |      |                            |                           |                            |                            |      |           |

1. **[回合1]** 基于位置0搜索可能的走法得到[1, 8]，判断所在点位并非老鼠所在点位，否则基于这两个点位继续搜索
2. **[回合2]** 基于位置1搜索 => [0, 2, 9]，由于0是历史走过点位，因此过滤此项 => [2, 9]，非目标点，回到点位8进行搜索
3. **[回合2]** 基于位置8搜索 => [0, 9, 16]，过滤 => [16]，非目标点，回到点位2进行搜索，后面的步骤默认过滤
4. **[回合3]** 基于位置2搜索 => []， 没有可移动点位，回到点位9进行搜索
5. **[回合3]** 9  => [17]，非目标点，回到16
6. **[回合3]** 16 => [24]，非目标点
7. **[回合4 - 8]** 24 => [25]，25 => [26]，26 => [27]，27 => [19]，19 => [11, 20]，非目标点
8. **[回合9]** 11 => [12]，20 => [21]
9. **[回合10]** 12 => [4]，21 => [22, 29]
10. **[回合11]** 4 => [5]，22 => [23, 30]，29 => []
11. **[回合12]**  5 => [6]，23 => [31]，到达目标点，索引走过的路径为**31,23,22,21,20,19,27,26,25,24,16,8,0**

&emsp;&emsp;整个流程简单来说就是自左到右自上到下遍历了全部的节点，只不过它是根据层次优先进行遍历的，在层次遍历的过程中如果遇到了目标点位即可返回，因为同一个层次所消耗的回合数是相同的，所以第一次遇到目标点位的路径即是最优解之一。

## 代码实现

&emsp;&emsp;清楚算法流程后，代码的实现相对简单，可以使用递归也可以使用队列，我这边是递归完成最短路径搜索的，具体实现如下：

```javascript
class BFSCat {
    constructor(options) {
        // 定义基础行列信息
        this.columns = (options && options.columns) || 16
        this.rows = (options && options.rows) || 8
    }

    /**
     * 获取最短路径
     * @param chessboard 棋盘信息
     * @param catIndex 猫的位置
     * @returns {Array} 路径信息 无解时返回空数组
     */
    getShortestWays(chessboard, catIndex) {
        return this.search(chessboard, [{cur: catIndex, ways: []}])
    }

    /**
     * 根据当前棋盘局势搜索出一条最短路径
     * @param curChessboard 当前棋盘局势
     * @param curs 猫的当前位置
     * @param history 历史走过的路径
     * @returns {Array} 返回最短路径 无解时返回空数组
     */
    search(curChessboard, curs, history) {
        if (!history) history = []
        let nexts = []
        for (let i in curs) {
            const curObj = curs[i];
            const cur = curObj.cur
            const ways = curObj.ways
            const effectNeighbors = this.getEffectNeighbors(history, cur, curChessboard)
            for (let j in effectNeighbors) {
                const next = effectNeighbors[j]
                if (curChessboard[next].flag === 2) {
                    // 广度遍历抓到老鼠 直接返回路径
                    return ways.slice().concat([cur, next])
                }
            }
            // 缓存历史路径
            history = history.concat(effectNeighbors)
            nexts = nexts.concat(effectNeighbors.map(next => ({
                cur: next,
                ways: ways.slice().concat([cur])
            })))
        }
        if (nexts.length === 0) { // 无路可走 此题无解
            return []
        }
        return this.search(curChessboard, nexts, history)
    }

    /**
     *
     * @param history 历史走过的路径 防止走回头路
     * @param cur 当前位置
     * @param chessboard 棋盘信息
     * @returns {Array} 下一步可能的走法
     */
    getEffectNeighbors(history, cur, chessboard) {
        let result = []
        const p = this.computeXY(cur)
        const columns = this.columns
        const rows = this.rows
        if (p.x > 0 && this.checkNextPoint(chessboard[cur - 1])) result.push(cur - 1)
        if (p.x < columns - 1 && this.checkNextPoint(chessboard[cur + 1])) result.push(cur + 1)
        if (p.y > 0 && this.checkNextPoint(chessboard[cur - columns])) result.push(cur - columns)
        if (p.y < rows - 1 && this.checkNextPoint(chessboard[cur + columns])) result.push(cur + columns)
        return result.filter(next => !(history && history.includes(next)))
    }

    /**
     * 根据棋盘的相对位置计算棋子的坐标
     * @param index 棋盘相对位置
     * @returns {{x: number, y: number}}
     */
    computeXY(index) {
        const columns = this.columns
        const x = index % columns
        const y = Math.floor(index / columns)
        return {x, y}
    }

    /**
     * 判断下一步点位是否可以移动
     */
    checkNextPoint(point) {
        return point.flag !== 3
    }
}
```

## 效果演示

&emsp;&emsp;将使用基于`BFS`算法策略设计的猫加入到猫鼠游戏，效果如下：

```html
<canvas id="BFSPlace">not support canvas</canvas>
<script>
    let cacheWays = null
    let index = 0
    const catHandler = (chessboard, curIndex, canMovePoints) => {
            if (cacheWays === null) {
                cacheWays = new BFSCat().getShortestWays(chessboard, curIndex)
                if (cacheWays.length === 0) {
                    throw new Error('此题无解')
                }
            }
            return cacheWays[index++]
        }
    gameGen.initGame('BFSPlace', catHandler , null)
</script>
```

{% raw %}
<canvas id="BFSPlace">not support canvas</canvas>
{% endraw %}

# 加强版猫鼠游戏

&emsp;&emsp;普通版的猫鼠游戏我们使用基于`BFS`的最短路径搜索算法即可找到最优解了，现在我们将游戏升级，引入不同类型的道路，请设计一个算法让`猫`使用最少的体力抓住`老鼠`，其中加强版猫鼠游戏引入的三种道路类型如下：

* 普通道路 ![](https://resources.chenjianhui.site/2019-06-20-game-background.png?imageView2/2/w/36/h/36/q/75|imageslim)：消耗**一点**体力值
* 草地 ![](https://resources.chenjianhui.site/grassland-1.png?imageView2/2/w/45/h/45/q/75|imageslim)：消耗**两点**体力值
* 溪流 <img src="https://resources.chenjianhui.site/waterway-2.svg" style="width:45px;height:45px;"/>：消耗**三点**体力值

&emsp;&emsp;同样我们先构建出这个棋盘，只需要将`options.complexRoad`配置为`true`即可，未加入行动决策算法的棋盘效果如下：

```html
<canvas id="complexRoadPlace">not support canvas</canvas>
<script>
    gameGen.initGame('complexRoadPlace', null, null, {
        complexRoad: true
    })
</script>
```
{% raw %}
<canvas id="complexRoadPlace">not support canvas</canvas>
{% endraw %}

## 解题思考

&emsp;&emsp;加强版本的游戏要考虑体力消耗最小，因此最短的路径未必消耗的体力就是最少的，这个很容易理解，所以我们不能单考虑最短路径这个方面去解题了，还应该考虑到不同道路的体力消耗。

## A星寻路算法

&emsp;&emsp;可以直接点击[A*算法wiki](https://zh.wikipedia.org/wiki/A*搜尋演算法)查看一下算法的背景，我在这里只介绍算法的一些核心概念，在A*算法中有两个核心概念

* **G值**：**起始点**到**行动点**的**移动量**
  * 起始点：猫的初始位置
  * 行动点：猫的下一步决策位置
  * 移动量：在这里我们考虑地形的情况下是可移动格子的**体力消耗量**
* **H值**：行动点到**终点**的**估算量**，这个值仅仅是一个估算值，比如位置1到位置31的估算值我们忽略地形可以取最小格子数，即9
  * 终点：老鼠的位置
  * 估算量：这里是不考虑障碍物的一个估算移动量

&emsp;&emsp;好的核心概念介绍完，我们基于一个棋盘来完成A星算法的决策流程，下面的棋盘和上面的基本一致，区别在于加入了地形因素，每个可行走的格子中用括号括起来的就是特殊地形的体力消耗值，这将会影响到各个点位的G、H值。

|           |          |                            |                           |                            |                            |      |           |
| --------- | -------- | -------------------------- | ------------------------- | -------------------------- | -------------------------- | ---- | --------- |
| 0:cat:    | 1**(2)** | 2                          | **3**:mountain_bicyclist: | 4                          | 5                          | 6    | 7         |
| 8         | 9**(2)** | **10**:mountain_bicyclist: | 11                        | 12                         | **13**:mountain_bicyclist: | 14   | 15**(2)** |
| 16        | 17       | **18**:mountain_bicyclist: | 19                        | 20**(3)**                  | 21**(3)**                  | 22   | 23**(3)** |
| 24**(2)** | 25       | 26                         | 27                        | **28**:mountain_bicyclist: | 29                         | 30   | 31:mouse: |
|           |          |                            |                           |                            |                            |      |           |

&emsp;&emsp;现在我们基于上述棋盘来简述一下A星算法的决策流程，首先我们要基于**当前行动点**求出**邻近可移动点**的G、H值，根据`F = G + H`公式得出点位的**和值F**，然后找一个F值最小的点作为当前行动点继续进行判断，直到找到老鼠位置或者无点可选。在这个过程中，我们需要定义两个列表

* **open列表**：记录下所有**被考虑**的点位列表
* **close列表**：记录下所有**不被考虑**的点位列表

&emsp;&emsp;现在我将基于这个局势去模拟**A星算法**的搜索流程，其中🔕代表不被考虑的点位close、:walking_man:代表当前行动点、:cat:代表被考虑的点位open、**F()**括号内部的值代表被考虑点位的和值`G + H`，现在我们一步一步的模拟如下：

1. **[回合1]** 基于位置0搜索到可能走法[1, 8]，计算和值为[1(2 + 9), 8(1 + 9)]，`open = [1(11), 8(10)]`、`close = [0(10)]`，括号内为和值F

|                         |                    |                            |                           |                            |                            |      |           |
| ----------------------- | ------------------ | -------------------------- | ------------------------- | -------------------------- | -------------------------- | ---- | --------- |
| 0:no_bell::walking_man: | 1**(2)**:cat:F(11) | 2                          | **3**:mountain_bicyclist: | 4                          | 5                          | 6    | 7         |
| 8🐱F(10)                 | 9**(2)**           | **10**:mountain_bicyclist: | 11                        | 12                         | **13**:mountain_bicyclist: | 14   | 15**(2)** |
| 16                      | 17                 | **18**:mountain_bicyclist: | 19                        | 20**(3)**                  | 21**(3)**                  | 22   | 23**(3)** |
| 24**(2)**               | 25                 | 26                         | 27                        | **28**:mountain_bicyclist: | 29                         | 30   | 31:mouse: |
|                         |                    |                            |                           |                            |                            |      |           |

2. **[回合2]** 在open列表找到和值最小的点作为当前行动点，找到可能走法计算和值并加入到open列表，同时当前行动点放入close列表，在这里我们将选择点8作为当前行动点，此时 `open = [1(11), 9(11), 16(10)`、`close = [0(10), 8(10)]`

|                         |                |                            |                           |                            |                            |      |           |
| ----------------------- | -------------- | -------------------------- | ------------------------- | -------------------------- | -------------------------- | ---- | --------- |
| 0:no_bell:              | 1**(2)**🐱F(11) | 2                          | **3**:mountain_bicyclist: | 4                          | 5                          | 6    | 7         |
| 8:no_bell::walking_man: | 9**(2)**🐱F(11) | **10**:mountain_bicyclist: | 11                        | 12                         | **13**:mountain_bicyclist: | 14   | 15**(2)** |
| 16🐱F(10)                | 17             | **18**:mountain_bicyclist: | 19                        | 20**(3)**                  | 21**(3)**                  | 22   | 23**(3)** |
| 24**(2)**               | 25             | 26                         | 27                        | **28**:mountain_bicyclist: | 29                         | 30   | 31:mouse: |
|                         |                |                            |                           |                            |                            |      |           |

3. **[回合3]** 选择16，此时`open = [1(11), 9(11), 17(10), 24(11)`、`close = [0(10), 8(10), 16(10)]`

|                          |                |                            |                           |                            |                            |      |           |
| ------------------------ | -------------- | -------------------------- | ------------------------- | -------------------------- | -------------------------- | ---- | --------- |
| 0:no_bell:               | 1**(2)**🐱F(11) | 2                          | **3**:mountain_bicyclist: | 4                          | 5                          | 6    | 7         |
| 8:no_bell:               | 9**(2)**🐱F(11) | **10**:mountain_bicyclist: | 11                        | 12                         | **13**:mountain_bicyclist: | 14   | 15**(2)** |
| 16:no_bell::walking_man: | 17🐱F(10)       | **18**:mountain_bicyclist: | 19                        | 20**(3)**                  | 21**(3)**                  | 22   | 23**(3)** |
| 24**(2)**🐱F(11)          | 25             | 26                         | 27                        | **28**:mountain_bicyclist: | 29                         | 30   | 31:mouse: |
|                          |                |                            |                           |                            |                            |      |           |

4. **[回合4]** 选择17

|                          |                |                            |                           |                            |                            |      |           |
| ------------------------ | -------------- | -------------------------- | ------------------------- | -------------------------- | -------------------------- | ---- | --------- |
| 0:no_bell:               | 1**(2)**🐱F(11) | 2                          | **3**:mountain_bicyclist: | 4                          | 5                          | 6    | 7         |
| 8:no_bell:               | 9**(2)**🐱F(11) | **10**:mountain_bicyclist: | 11                 | 12                         | **13**:mountain_bicyclist: | 14   | 15**(2)** |
| 16:no_bell: | 17:no_bell::walking_man: | **18**:mountain_bicyclist: | 19 | 20**(3)**           | 21**(3)**                  | 22   | 23**(3)** |
| 24**(2)**🐱F(11)          | 25🐱F(10) | 26                | 27 | **28**:mountain_bicyclist: | 29                         | 30   | 31:mouse: |
|                          |                |                            |                           |                            |                            |      |           |

5. **[回合5]** 选择25

|                          |                |                            |                           |                            |                            |      |           |
| ------------------------ | -------------- | -------------------------- | ------------------------- | -------------------------- | -------------------------- | ---- | --------- |
| 0:no_bell:               | 1**(2)**🐱F(11) | 2                          | **3**:mountain_bicyclist: | 4                          | 5                          | 6    | 7         |
| 8:no_bell:               | 9**(2)**🐱F(11) | **10**:mountain_bicyclist: | 11                 | 12                         | **13**:mountain_bicyclist: | 14   | 15**(2)** |
| 16:no_bell: | 17:no_bell: | **18**:mountain_bicyclist: | 19 | 20**(3)**           | 21**(3)**                  | 22   | 23**(3)** |
| 24**(2)**🐱F(11)          | 25:no_bell::walking_man: | 26🐱F(10)         | 27 | **28**:mountain_bicyclist: | 29                         | 30   | 31:mouse: |
|                          |                |                            |                           |                            |                            |      |           |

6. **[回合6]** 选择26

|                          |                |                            |                           |                            |                            |      |           |
| ------------------------ | -------------- | -------------------------- | ------------------------- | -------------------------- | -------------------------- | ---- | --------- |
| 0:no_bell:               | 1**(2)**🐱F(11) | 2                          | **3**:mountain_bicyclist: | 4                          | 5                          | 6    | 7         |
| 8:no_bell:               | 9**(2)**🐱F(11) | **10**:mountain_bicyclist: | 11                 | 12                         | **13**:mountain_bicyclist: | 14   | 15**(2)** |
| 16:no_bell: | 17:no_bell: | **18**:mountain_bicyclist: | 19 | 20**(3)**           | 21**(3)**                  | 22   | 23**(3)** |
| 24**(2)**🐱F(11)          | 25:no_bell: | 26🔕🚶     | 27🐱F(10) | **28**:mountain_bicyclist: | 29                         | 30   | 31:mouse: |
|                          |                |                            |                           |                            |                            |      |           |

7. **[回合7]** 选择27，注意，这里由于路障问题绕路了，所以F值变为了12(7 + 5)

|                          |                |                            |                           |                            |                            |      |           |
| ------------------------ | -------------- | -------------------------- | ------------------------- | -------------------------- | -------------------------- | ---- | --------- |
| 0:no_bell:               | 1**(2)**🐱F(11) | 2                          | **3**:mountain_bicyclist: | 4                          | 5                          | 6    | 7         |
| 8:no_bell:               | 9**(2)**🐱F(11) | **10**:mountain_bicyclist: | 11                 | 12                         | **13**:mountain_bicyclist: | 14   | 15**(2)** |
| 16:no_bell: | 17:no_bell: | **18**:mountain_bicyclist: | 19🐱F(12) | 20**(3)**           | 21**(3)**                  | 22   | 23**(3)** |
| 24**(2)**🐱F(11)          | 25:no_bell: | 26🔕     | 27🔕🚶 | **28**:mountain_bicyclist: | 29                         | 30   | 31:mouse: |
|                          |                |                            |                           |                            |                            |      |           |

8. **[回合8]** 选择1

|                          |                |                            |                           |                            |                            |      |           |
| ------------------------ | -------------- | -------------------------- | ------------------------- | -------------------------- | -------------------------- | ---- | --------- |
| 0:no_bell:               | 1**(2)**🔕🚶 | 2🐱F(11)                 | **3**:mountain_bicyclist: | 4                          | 5                          | 6    | 7         |
| 8:no_bell:               | 9**(2)**🐱F(11) | **10**:mountain_bicyclist: | 11                 | 12                         | **13**:mountain_bicyclist: | 14   | 15**(2)** |
| 16:no_bell: | 17:no_bell: | **18**:mountain_bicyclist: | 19🐱F(12) | 20**(3)**           | 21**(3)**                  | 22   | 23**(3)** |
| 24**(2)**🐱F(11)          | 25:no_bell: | 26🔕     | 27🔕 | **28**:mountain_bicyclist: | 29                         | 30   | 31:mouse: |
|                          |                |                            |                           |                            |                            |      |           |

9. **[回合9 - 12]** 选择2、9、24，发现都为死路，加入close列表，最终只能选择19

|                          |                |                            |                           |                            |                            |      |           |
| ------------------------ | -------------- | -------------------------- | ------------------------- | -------------------------- | -------------------------- | ---- | --------- |
| 0:no_bell:               | 1**(2)**🔕 | 2🔕               | **3**:mountain_bicyclist: | 4                          | 5                          | 6    | 7         |
| 8:no_bell:               | 9**(2)**🔕 | **10**:mountain_bicyclist: | 11🐱F(14)        | 12                         | **13**:mountain_bicyclist: | 14   | 15**(2)** |
| 16:no_bell: | 17:no_bell: | **18**:mountain_bicyclist: | 19🔕🚶 | 20**(3)**🐱F(14)  | 21**(3)**                  | 22   | 23**(3)** |
| 24**(2)**🔕        | 25:no_bell: | 26🔕     | 27🔕 | **28**:mountain_bicyclist: | 29                         | 30   | 31:mouse: |
|                          |                |                            |                           |                            |                            |      |           |

10. **[回合13]** 选择20，当出现F值相同的情况我们就取第一个判断生成的，我的判断是自左向右、自上到下，所以点位20先被判断

|                          |                |                            |                           |                            |                            |      |           |
| ------------------------ | -------------- | -------------------------- | ------------------------- | -------------------------- | -------------------------- | ---- | --------- |
| 0:no_bell:               | 1**(2)**🔕 | 2🔕               | **3**:mountain_bicyclist: | 4                          | 5                          | 6    | 7         |
| 8:no_bell:               | 9**(2)**🔕 | **10**:mountain_bicyclist: | 11🐱F(14)        | 12🐱F(16)                | **13**:mountain_bicyclist: | 14   | 15**(2)** |
| 16:no_bell: | 17:no_bell: | **18**:mountain_bicyclist: | 19🔕 | 20**(3)**🔕🚶 | 21**(3)**🐱F(16)         | 22   | 23**(3)** |
| 24**(2)**🔕        | 25:no_bell: | 26🔕     | 27🔕 | **28**:mountain_bicyclist: | 29                         | 30   | 31:mouse: |
|                          |                |                            |                           |                            |                            |      |           |

11. **[回合14]** 选择11，我们发现以点11为行动点的相邻点12计算出的F值为14比16小，故更新节点

|                          |                |                            |                           |                            |                            |      |           |
| ------------------------ | -------------- | -------------------------- | ------------------------- | -------------------------- | -------------------------- | ---- | --------- |
| 0:no_bell:               | 1**(2)**🔕 | 2🔕               | **3**:mountain_bicyclist: | 4                          | 5                          | 6    | 7         |
| 8:no_bell:               | 9**(2)**🔕 | **10**:mountain_bicyclist: | 11🔕🚶    | 12🐱F(14)                | **13**:mountain_bicyclist: | 14   | 15**(2)** |
| 16:no_bell: | 17:no_bell: | **18**:mountain_bicyclist: | 19🔕 | 20**(3)**🔕 | 21**(3)**🐱F(16)         | 22   | 23**(3)** |
| 24**(2)**🔕        | 25:no_bell: | 26🔕     | 27🔕 | **28**:mountain_bicyclist: | 29                         | 30   | 31:mouse: |
|                          |                |                            |                           |                            |                            |      |           |

12. **[回合15 - 18]** 选择12、4、5、6

|                          |                |                            |                           |                            |                            |      |           |
| ------------------------ | -------------- | -------------------------- | ------------------------- | -------------------------- | -------------------------- | ---- | --------- |
| 0:no_bell:               | 1**(2)**🔕 | 2🔕               | **3**:mountain_bicyclist: | 4🔕                 | 5🔕                        | 6🔕🚶 | 7🐱F(16)  |
| 8:no_bell:               | 9**(2)**🔕 | **10**:mountain_bicyclist: | 11🔕    | 12🔕            | **13**:mountain_bicyclist: | 14🐱F(16) | 15**(2)** |
| 16:no_bell: | 17:no_bell: | **18**:mountain_bicyclist: | 19🔕 | 20**(3)**🔕 | 21**(3)**🐱F(16)         | 22   | 23**(3)** |
| 24**(2)**🔕        | 25:no_bell: | 26🔕     | 27🔕 | **28**:mountain_bicyclist: | 29                         | 30   | 31:mouse: |
|                          |                |                            |                           |                            |                            |      |           |

12. **[回合19]** 选择7

|                          |                |                            |                           |                            |                            |      |           |
| ------------------------ | -------------- | -------------------------- | ------------------------- | -------------------------- | -------------------------- | ---- | --------- |
| 0:no_bell:               | 1**(2)**🔕 | 2🔕               | **3**:mountain_bicyclist: | 4🔕                 | 5🔕                        | 6🔕 | 7🔕🚶 |
| 8:no_bell:               | 9**(2)**🔕 | **10**:mountain_bicyclist: | 11🔕    | 12🔕            | **13**:mountain_bicyclist: | 14🐱F(16) | 15**(2)**🐱F(17) |
| 16:no_bell: | 17:no_bell: | **18**:mountain_bicyclist: | 19🔕 | 20**(3)**🔕 | 21**(3)**🐱F(16)         | 22   | 23**(3)** |
| 24**(2)**🔕        | 25:no_bell: | 26🔕     | 27🔕 | **28**:mountain_bicyclist: | 29                         | 30   | 31:mouse: |
|                          |                |                            |                           |                            |                            |      |           |

13. **[回合20]** 选择14

|                          |                |                            |                           |                            |                            |      |           |
| ------------------------ | -------------- | -------------------------- | ------------------------- | -------------------------- | -------------------------- | ---- | --------- |
| 0:no_bell:               | 1**(2)**🔕 | 2🔕               | **3**:mountain_bicyclist: | 4🔕                 | 5🔕                        | 6🔕 | 7🔕 |
| 8:no_bell:               | 9**(2)**🔕 | **10**:mountain_bicyclist: | 11🔕    | 12🔕            | **13**:mountain_bicyclist: | 14🔕🚶 | 15**(2)**🐱F(17) |
| 16:no_bell: | 17:no_bell: | **18**:mountain_bicyclist: | 19🔕 | 20**(3)**🔕 | 21**(3)**🐱F(16)         | 22🐱F(16) | 23**(3)** |
| 24**(2)**🔕        | 25:no_bell: | 26🔕     | 27🔕 | **28**:mountain_bicyclist: | 29                         | 30   | 31:mouse: |
|                          |                |                            |                           |                            |                            |      |           |

14. **[回合21]** 选择22

|                          |                |                            |                           |                            |                            |      |           |
| ------------------------ | -------------- | -------------------------- | ------------------------- | -------------------------- | -------------------------- | ---- | --------- |
| 0:no_bell:               | 1**(2)**🔕 | 2🔕               | **3**:mountain_bicyclist: | 4🔕                 | 5🔕                        | 6🔕 | 7🔕 |
| 8:no_bell:               | 9**(2)**🔕 | **10**:mountain_bicyclist: | 11🔕    | 12🔕            | **13**:mountain_bicyclist: | 14🔕 | 15**(2)**🐱F(17) |
| 16:no_bell: | 17:no_bell: | **18**:mountain_bicyclist: | 19🔕 | 20**(3)**🔕 | 21**(3)**🐱F(16)         | 22🔕🚶 | 23**(3)**🐱F(18) |
| 24**(2)**🔕        | 25:no_bell: | 26🔕     | 27🔕 | **28**:mountain_bicyclist: | 29                         | 30🐱F(16) | 31:mouse: |
|                          |                |                            |                           |                            |                            |      |           |

15. **[回合22]** 选择30，发现邻近点中有目标点，且值为16是最短路径之一，遍历完成，具体路径为 **0,8,16,17,25,26,27,19,11,12,4,5,6,14,22,30,31**，共消耗体力值16点

|                          |                |                            |                           |                            |                            |      |           |
| ------------------------ | -------------- | -------------------------- | ------------------------- | -------------------------- | -------------------------- | ---- | --------- |
| 0:no_bell:               | 1**(2)**🔕 | 2🔕               | **3**:mountain_bicyclist: | 4🔕                 | 5🔕                        | 6🔕 | 7🔕 |
| 8:no_bell:               | 9**(2)**🔕 | **10**:mountain_bicyclist: | 11🔕    | 12🔕            | **13**:mountain_bicyclist: | 14🔕 | 15**(2)**🐱F(17) |
| 16:no_bell: | 17:no_bell: | **18**:mountain_bicyclist: | 19🔕 | 20**(3)**🔕 | 21**(3)**🐱F(16)         | 22🔕 | 23**(3)**🐱F(18) |
| 24**(2)**🔕        | 25:no_bell: | 26🔕     | 27🔕 | **28**:mountain_bicyclist: | 29🐱F(18)                 | 30🔕🚶 | 31:mouse:🐱F(16) |
|                          |                |                            |                           |                            |                            |      |           |

## 代码实现

```javascript
class AStarCat {
    constructor(options) {
        // 定义基础行列信息
        this.columns = (options && options.columns) || 16
        this.rows = (options && options.rows) || 8
    }

    /**
     * 获取最优解
     * @param chessboard 棋盘信息
     * @returns {Array} 路径信息 无解时返回空数组
     */
    getShortestWays(chessboard) {
        const catIndex = chessboard.findIndex(item => item.flag === 1)
        const mouseIndex = chessboard.findIndex(item => item.flag === 2)
        return this.search(chessboard, {cur: catIndex, ways: []}, catIndex, mouseIndex)
    }

    /**
     * 搜索路径
     * @param curChessboard 棋盘信息
     * @param curObj 当前行动点对象
     * @param catIndex 猫的初始位置
     * @param mouseIndex 老鼠的初始位置
     * @param open 被考虑的点位
     * @param close 不被考虑的点位
     * @returns {Array} 返回最优路径 无解时返回空数组
     */
    search(curChessboard, curObj, catIndex, mouseIndex, open, close) {
        if (!open) open = []
        if (!close) close = []
        const cur = curObj.cur
        close.push(cur)
        open.splice(open.findIndex(o => o.cur === cur), 1)
        const effectNeighbors = this.getEffectNeighbors(close, cur, curChessboard)
        const nextOpen = effectNeighbors.map(next => {
            const ways = curObj.ways.concat([next])
            return {
                cur: next,
                f: this.computeF(mouseIndex, next, ways, curChessboard),
                ways: ways
            }
        })
        // 如果open与nextOpen有交集，取更小值
        nextOpen.forEach(n => {
            let sameIndex = open.findIndex(o => o.cur === n.cur)
            if (sameIndex > -1) {
                if (n.f < open[sameIndex].f) {
                    open.splice(sameIndex, 1, n)
                }
            } else {
                open.push(n)
            }
        })
        open = open.concat()
        const success = open.find(o => o.cur === mouseIndex)
        if (success) {
            return success.ways
        }
        if (open.length > 0) {
            return this.search(curChessboard, open.sort((a, b) => (a.f - b.f))[0], catIndex, mouseIndex, open.slice(), close.slice())
        }
        return []
    }

    /**
     *
     * @param close 不被考虑的节点
     * @param cur 当前位置
     * @param chessboard 棋盘信息
     * @returns {Array} 下一步可能的走法
     */
    getEffectNeighbors(close, cur, chessboard) {
        let result = []
        const p = this.computeXY(cur)
        const columns = this.columns
        const rows = this.rows
        if (p.x > 0 && this.checkNextPoint(chessboard[cur - 1])) result.push(cur - 1)
        if (p.x < columns - 1 && this.checkNextPoint(chessboard[cur + 1])) result.push(cur + 1)
        if (p.y > 0 && this.checkNextPoint(chessboard[cur - columns])) result.push(cur - columns)
        if (p.y < rows - 1 && this.checkNextPoint(chessboard[cur + columns])) result.push(cur + columns)
        return result.filter(next => !(close && close.includes(next)))
    }

    /**
     * 计算GH的和值
     * @param mouseIndex 老鼠的位置
     * @param curIndex 当前行动点
     * @param ways 当前行动点的历史路径
     * @param chessboard 棋盘信息
     */
    computeF(mouseIndex, curIndex, ways, chessboard) {
        const mouseP = this.computeXY(mouseIndex)
        const curP = this.computeXY(curIndex)
        const g = ways.reduce((a, b) => (chessboard[a].depletePower + chessboard[b].depletePower), 0)
        const h = Math.abs(curP.x - mouseP.x) + Math.abs(curP.y - mouseP.y)
        return g + h
    }

    /**
     * 根据棋盘的相对位置计算棋子的坐标
     * @param index 棋盘相对位置
     * @returns {{x: number, y: number}}
     */
    computeXY(index) {
        const columns = this.columns
        const x = index % columns
        const y = Math.floor(index / columns)
        return {x, y}
    }

    /**
     * 判断下一步点位是否可以移动
     */
    checkNextPoint(point) {
        return point.flag !== 3
    }
}
```

## 效果演示

```html
<canvas id="AStarPlace">not support canvas</canvas>
<script>
    let cacheWays = null
    let index = 0
    const catHandler = (chessboard, curIndex, canMovePoints) => {
            if (cacheWays === null) {
                cacheWays = new AStarCat().getShortestWays(chessboard)
                if (cacheWays.length === 0) {
                    throw new Error('此题无解')
                }
            }
            return cacheWays[index++]
        }
    gameGen.initGame('AStarPlace', catHandler , null, {
        complexRoad: true
    })
</script>
```

{% raw %}
<canvas id="AStarPlace">not support canvas</canvas>
{% endraw %}

# 升级玩法

&emsp;&emsp;在这个游戏中，我们不仅可以设计猫的行动策略函数，还可以设计老鼠的行动策略函数来躲避猫的追击，有兴趣的同学可以想想如果躲避算法又应该如何实现。

# 参考资料

* [A星寻路算法-(入门级) - Colin丶- CSDN博客](https://blog.csdn.net/hitwhylz/article/details/41383561)

{% raw %}
<!-- 此段代码为游戏构建程序 -->
<script type="text/javascript" src="https://resources.chenjianhui.site/cat-mouse-game-gen-0.1.9.js"></script>
<script type="text/javascript" src="https://resources.chenjianhui.site/cat-mouse-game-BFSCat-0.2.js"></script>
<script type="text/javascript" src="https://resources.chenjianhui.site/cat-mouse-game-AStarCat-0.1.js"></script>
<script>
    gameGen.initGame('staticPlace')
    gameGen.initGame('randomPlace', (chessboard, curIndex, canMovePoints) => canMovePoints[Math.round(Math.random() * (canMovePoints.length - 1))])
    let cacheWaysOfBSF = null
    let indexOfBSF = 0
    const catHandlerOfBFS = (chessboard, curIndex, canMovePoints) => {
            if (cacheWaysOfBSF === null) {
                cacheWaysOfBSF = new BFSCat().getShortestWays(chessboard, curIndex)
                if (cacheWaysOfBSF.length === 0) {
                    throw new Error('此题无解')
                }
            }
            return cacheWaysOfBSF[indexOfBSF++]
        }
    gameGen.initGame('BFSPlace', catHandlerOfBFS , null)
    gameGen.initGame('complexRoadPlace', null, null, { complexRoad: true })
    let cacheWaysOfAStar = null
    let indexOfAstar = 0
    const catHandlerOfAstar = (chessboard, curIndex, canMovePoints) => {
            if (cacheWaysOfAStar === null) {
                cacheWaysOfAStar = new AStarCat().getShortestWays(chessboard)
                if (cacheWaysOfAStar.length === 0) {
                    throw new Error('此题无解')
                }
            }
            return cacheWaysOfAStar[indexOfAstar++]
        }
    gameGen.initGame('AStarPlace', catHandlerOfAstar , null, {
        complexRoad: true
    })
</script>
{% endraw %}