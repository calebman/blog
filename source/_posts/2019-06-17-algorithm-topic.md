---
title: 算法，24点游戏
date: 2019-06-17 21:47:06
thumbnail: https://resources.chenjianhui.site/algorithm-home-pic.jpeg
categories: 
- Algorithm
tags: 
- Algorithm
- Java
---

给定四个1-10的正整数，可以进行+ - * / 四种运算，每个数字只能用一次，任意组合构造表达式使结果为24，要找出所有可能的组合？

<!-- more -->

# 解题思考

&emsp;&emsp;初拿到题目最先想到的就是穷举法了，我们先假设四个数字为A、B、C、D，然后穷举所有的可能性，简单算一下可以得到一共有**4! * 4^3 = 1536**种可能性，如下图所示：

![](https://resources.chenjianhui.site/2019-06-17-24game-tree.jpg)

# DFS解法

&emsp;&emsp;DFS是**Depth-First search 深度优先搜索**的简称，与其对应的还有BFS(**Breadth-First-Search 广度优先搜索**)，在这里我们使用递归的方式深度优先遍历搜索树找到所有可能性，代码如下：

```java
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * @author JianhuiChen
 * @description 24点游戏
 * @date 2019/6/18
 */
public class Count24 {

    public static void main(String[] args) {
        List&lt;String&gt; results = permutation(Arrays.asList(1, 2, 3, 4),
                Arrays.asList(Operator.PLUS, Operator.MINUS, Operator.MULTIPLY, Operator.DIVIDE));
        results.stream()
                .filter(express -&gt; expectCalc(express, 24))
                .forEach(System.out::println);
    }


    private static List&lt;String&gt; permutation(List&lt;Integer&gt; numbers, List&lt;Operator&gt; operators) {
        return permutation(numbers, operators, null);
    }

    /**
     * 深度优先搜索策略得出所有的组合可能性
     *
     * @param numbers       参与选择的数字
     * @param operators     参与运算的运算符
     * @param expressRecord 算术表达式记录值
     * @return 可能性组合
     */
    private static List&lt;String&gt; permutation(List&lt;Integer&gt; numbers, List&lt;Operator&gt; operators, String expressRecord) {
        if (expressRecord == null) {
            expressRecord = &quot;&quot;;
        }
        List&lt;String&gt; resultList = new ArrayList&lt;&gt;();
        for (int num : numbers) {
            if (numbers.size() == 1) {
                // 只剩一个数字未选时退出循环
                resultList.add(expressRecord + num);
                break;
            }
            for (Operator oper : operators) {
                // 过滤掉已选项
                List&lt;Integer&gt; optional = numbers.stream()
                        .filter(n -&gt; n != num)
                        .collect(Collectors.toList());
                resultList.addAll(permutation(optional, operators, expressRecord + num + oper));
            }
        }
        return resultList;
    }

    /**
     * 进行预期运算
     *
     * @param aritExpression 算术表达式
     * @param targetVal      目标值
     * @return 是否符合预期
     */
    private static boolean expectCalc(String aritExpression, int targetVal) {
        return calculation(aritExpression) == targetVal;
    }


    /**
     * 根据算术表达式求值
     *
     * @param aritExpression 算术表达式 exp: 4*2/1*3
     * @return 计算结果
     */
    private static int calculation(String aritExpression) {
        // 将表达式根据运算符切割
        StringTokenizer tokenizer = new StringTokenizer(aritExpression, &quot;+-*/&quot;, true);
        Stack&lt;Double&gt; numStack = new Stack&lt;&gt;();   // 存放数字
        Stack&lt;Operator&gt; operStack = new Stack&lt;&gt;();  // 存放操作符
        String currentEle;  // 当前元素
        while (tokenizer.hasMoreTokens()) {
            currentEle = tokenizer.nextToken().trim();  // 去掉前后的空格
            if (!&quot;&quot;.equals(currentEle)) {   // 只处理非空字符
                if (Pattern.matches(&quot;^\\d+(\\.\\d+)?$&quot;, currentEle)) { // 为数字时则加入到数字栈中
                    numStack.push(Double.valueOf(currentEle));
                } else {
                    Operator currentOper = Operator.getOperatorBySymbol(currentEle);//获取当前运算操作符
                    if (currentOper == null) {
                        throw new RuntimeException(&quot;存在无效的操作符&quot; + currentEle);
                    }
                    while (!operStack.empty() &amp;&amp; operStack.peek().priority() &gt;= currentOper.priority()) {
                        compute(numStack, operStack);
                    }
                    // 计算完后把当前操作符加入到操作栈中
                    operStack.push(currentOper);
                }
            }
        }
        // 经过上面代码的遍历后最后的应该是nums里面剩两个数或三个数，operators里面剩一个或两个运算操作符
        while (!operStack.empty()) {
            compute(numStack, operStack);
        }
        return numStack.pop().intValue();
    }

    /**
     * 取numStack的最顶上两个数字
     * operStack的最顶上一个运算符进行运算
     * 然后把运算结果再放到numStack的最顶端
     *
     * @param numStack  数字栈
     * @param operStack 操作栈
     */
    private static void compute(Stack&lt;Double&gt; numStack, Stack&lt;Operator&gt; operStack) {
        Double num2 = numStack.pop(); // 弹出数字栈最顶上的数字作为运算的第二个数字
        Double num1 = numStack.pop(); // 弹出数字栈最顶上的数字作为运算的第一个数字
        Double computeResult = operStack.pop().compute(num1, num2); // 弹出操作栈最顶上的运算符进行计算
        numStack.push(computeResult); // 把计算结果重新放到队列的末端
    }


    /**
     * 支持的运算符
     */
    private enum Operator {
        PLUS(&quot;+&quot;) {
            @Override
            public int priority() {
                return 1;
            }

            @Override
            public double compute(double a, double b) {
                return a + b;
            }
        },
        MINUS(&quot;-&quot;) {
            @Override
            public int priority() {
                return 1;
            }

            @Override
            public double compute(double a, double b) {
                return a - b;
            }
        },
        MULTIPLY(&quot;*&quot;) {
            @Override
            public int priority() {
                return 2;
            }

            @Override
            public double compute(double a, double b) {
                return a * b;
            }
        },
        DIVIDE(&quot;/&quot;) {
            @Override
            public int priority() {
                return 2;
            }

            @Override
            public double compute(double a, double b) {
                return a / b;
            }
        };

        Operator(String symbol) {
            this.symbol = symbol;
        }

        /**
         * 运算符
         */
        private String symbol;

        /**
         * @return 运算优先级
         */
        public abstract int priority();

        /**
         * @param a 第一个运算数
         * @param b 第二个运算数
         * @return 两个数对应的运算结果
         */
        public abstract double compute(double a, double b);

        /**
         * 根据运算符查找运算操作类
         *
         * @param symbol 运算符
         * @return 运算操作类
         */
        public static Operator getOperatorBySymbol(String symbol) {
            for (Operator operator : Operator.values()) {
                if (symbol.equals(operator.toString())) {
                    return operator;
                }
            }
            return null;
        }


        @Override
        public String toString() {
            return symbol;
        }
    }
}
```