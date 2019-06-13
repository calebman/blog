---
title: 算法，老鼠毒药问题
date: 2019-06-12 08:30:52
thumbnail: https://resources.chenjianhui.site/algorithm-home-pic.jpeg
categories: 

- Algorithm
tags: 
- Algorithm
- Java
---

有16瓶水，其中一瓶有毒，小白鼠喝一滴有毒的水一小时后会死，要在一小时找出来哪瓶水有毒最少需要几只小白鼠 ？

<!-- more -->

# 构造题目

```java
/**
 * @author JianhuiChen
 * @description 老鼠毒药问题
 * @date 2019/6/12
 */
public class MousePoisonQuestion {

    public static void main(String[] args) {
        normalSolution();
    }

    /**
     * 普通解法 16瓶水用16只老鼠来找 哪只死了代表哪瓶水有毒
     */
    private static void normalSolution() {
        final int waterLen = 16;
        List<Mouse> mouseList = new ArrayList<>();
        for (int i = 0; i < waterLen; i++) {
            mouseList.add(new Mouse(i, Collections.singleton(i)));
        }
        findPoisonWater(waterLen, mouseList, mouses -> mouses.stream()
                .filter(Mouse::isDie)
                .findFirst()
                .get()
                .getId());
    }

    /**
     * 寻找有毒的水
     *
     * @param waterLen 水的瓶数
     * @param mouses   老鼠列表
     * @param judge    根据老鼠喝完水的状态判断出毒药的编号
     */
    private static void findPoisonWater(int waterLen, List<Mouse> mouses, Function<List<Mouse>, Integer> judge) {
        List<Water> waters = initWaters(waterLen);
        mouses.forEach(mouse -> mouse.setDie(waters));
        // 一小时后
        int resultPoisonId = judge.apply(mouses);
        int poisonId = waters.indexOf(waters.stream().filter(Water::isPoison).findFirst().get());
        Water water = waters.get(poisonId);
        assert (water.isPoison()) : "判断有误,第" + poisonId + "瓶水不是毒药,正确答案是第" + resultPoisonId + "瓶";
        System.out.println("恭喜你找出了包含毒药的水,共使用了" + mouses.size() + "只老鼠");
    }

    /**
     * 初始化Len瓶水
     *
     * @param len 水瓶数
     * @return 带有一瓶毒药的水列表
     */
    private static List<Water> initWaters(int len) {
        Boolean[] poisons = new Boolean[len];
        poisons[new Random().nextInt(len)] = true;
        return Arrays.stream(poisons)
                .map(poison -> new Water(poison != null))
                .collect(Collectors.toList());
    }

    /**
     * 老鼠对象
     */
    static class Mouse {
        /**
         * 老鼠喝过的水ID
         */
        private Integer[] drinkWaterIds;
        /**
         * 老鼠ID
         */
        private int id;
        /**
         * 老鼠是否死亡
         */
        private boolean die;

        Mouse(int id, Collection<Integer> drinkWaterIds) {
            this.id = id;
            this.drinkWaterIds = drinkWaterIds.toArray(new Integer[]{});
        }

        void setDie(List<Water> waters) {
            this.die = Arrays.stream(drinkWaterIds)
                    .anyMatch(id -> waters.get(id).isPoison());
        }

        boolean isDie() {
            return die;
        }

        int getId() {
            return id;
        }
    }

    /**
     * 水对象
     */
    static class Water {
        /**
         * 是否有毒
         */
        private boolean poison;

        Water(boolean poison) {
            this.poison = poison;
        }

        boolean isPoison() {
            return poison;
        }
    }
}
```
# 解题思考

&emsp;&emsp; 显然，使用了十六只老鼠来找这瓶毒药肯定不是最优解，我们来想，16瓶水中有一瓶毒药一共有16种可能性，而老鼠有生存和死亡两种状态，假设我们使用0和1表示老鼠的生存与死亡，那么四只老鼠就能排列组合出16种可能性，我们来利用二进制排列出这16种情况。

| :mouse:老鼠1 | :mouse:老鼠2 | :mouse:老鼠3 | :mouse:老鼠4 | :beer:水 |
| ------------ | ------------ | ------------ | ------------ | -------- |
| 0            | 0            | 0            | 1 :beer:     | 瓶子1    |
| 0            | 0            | 1 :beer:     | 0            | 瓶子2    |
| 0            | 0            | 1 :beer:     | 1 :beer:     | 瓶子3    |
| 0            | 1 :beer:     | 0            | 0            | 瓶子4    |
| 0            | 1 :beer:     | 0            | 1 :beer:     | 瓶子5    |
| 0            | 1 :beer:     | 1 :beer:     | 0            | 瓶子6    |
| 0            | 1 :beer:     | 1 :beer:     | 1 :beer:     | 瓶子7    |
| 1 :beer:     | 0            | 0            | 0            | 瓶子8    |
| 1 :beer:     | 0            | 0            | 1 :beer:     | 瓶子9    |
| 1 :beer:     | 0            | 1 :beer:     | 0            | 瓶子10   |
| 1 :beer:     | 0            | 1 :beer:     | 1 :beer:     | 瓶子11   |
| 1 :beer:     | 1 :beer:     | 0            | 0            | 瓶子12   |
| 1 :beer:     | 1 :beer:      | 0            | 1 :beer:     | 瓶子13   |
| 1 :beer:     | 1 :beer:     | 1 :beer:     | 0            | 瓶子14   |
| 1 :beer:     | 1 :beer:     | 1 :beer:     | 1 :beer:     | 瓶子15   |

排列下来即是

* :mouse:老鼠1喝:beer: 8，9，10，11，12，13，14，15
* :mouse:老鼠2喝:beer: 4，5，6，7，12，13，14，15
* :mouse:老鼠3喝:beer: 2，3，6，7，10，11，14，15
* :mouse:老鼠4喝:beer: 1，3，5，7，9，11，13，15

这样排列后，老鼠的生存与死亡状态都能得到一串二进制码，这串二进制码可以转换成有毒的瓶子信息，如

* 0010：表示:mouse:老鼠3死亡，其余:mouse:老鼠存活，代表:beer:瓶子2是毒药
* 0000：表示没有:mouse:老鼠死亡，代表:beer:瓶子16是毒药

# 编码实现

```java
    /**
     * 使用二进制的思路解法
     */
    private static void binarySolution() {
        final int waterLen = 16;
        List<Mouse> mouseList = new ArrayList<>();
        mouseList.add(new Mouse(1, Arrays.asList(8, 9, 10, 11, 12, 13, 14, 15)));
        mouseList.add(new Mouse(2, Arrays.asList(4, 5, 6, 7, 12, 13, 14, 15)));
        mouseList.add(new Mouse(3, Arrays.asList(2, 3, 6, 7, 10, 11, 14, 15)));
        mouseList.add(new Mouse(4, Arrays.asList(1, 3, 5, 7, 9, 11, 13, 15)));
        findPoisonWater(waterLen, mouseList, mouses -> {
            int num = -1;
            for (Mouse m : mouses) {
                num += Math.pow(2, m.isDie() ? (m.getId() - 1) : 0);
            }
            return num < 0 ? (waterLen - 1) : num;
        });
    }
```
&emsp;&emsp;运行后程序将打印**“恭喜你找出了包含毒药的水,共使用了4只老鼠”**，代码运行成功了没错，但是通用性不足，只能够适用于16只老鼠的解法，能否编写一个根据瓶子数量作为参数的通用解法函数？只要理解解题思路，这个代码并不难，在此就不做演示了。

&emsp;&emsp;有兴趣的朋友可以在下方留言给出通用解法:dog:

# 题目拓展

&emsp;&emsp;**有16瓶水，其中只有一瓶水有毒，小白鼠喝一滴之后一小时会死。请问最少用多少只小白鼠，可以在1小时内找出至少14瓶无毒的水。**

&emsp;&emsp;找14瓶无毒的水是可以转化为和上面那道一样的解题思路，我们将16瓶水分为8组两两一瓶，我们只需要找到一组水中包含毒药即可得到14瓶无毒的水，一组水只可能有两种状态，有毒或者无毒，所以我们可以将8组水看作8瓶水，至此题目就变成了“8瓶水用最少几只老鼠找那瓶有毒的水”，答案是3只。