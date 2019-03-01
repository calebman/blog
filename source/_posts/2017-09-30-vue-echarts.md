---
title: vue封装echarts组件
date: 2017-09-30 11:11:52
description: 将Echarts做一层小小的封装以满足使用需求
categories: 
- 前端
tags: 
- vuejs
- echarts
---

![](http://pnb4x7vrc.bkt.clouddn.com/2017-09-30-home-pic.png)

<!--more-->

# 说明
---
做项目的时候为了让数据展示的更加直观，总会用到图表相关的控件，而说到图表控件第一时间当然想到[ECharts](http://echarts.baidu.com/examples.html)这个开源项目，而它不像iview、element-ui这些组件使用起来那么便捷，需要绕一个小弯，为了图方便于是对ECharts进行了一层封装

## 控件演示
![](http://pnb4x7vrc.bkt.clouddn.com/2017-09-30-effect.gif)

## 控件使用
---
#### 概要
* 基于echarts的二次封装
* 由数据驱动
* 控件源码见src/components/charts

#### 文档
* props

| 属性       | 说明                                         | 类型   |
| ---------- | -------------------------------------------- | ------ |
| _id        | 图表唯一标识，当id重复将会报错               | String |
| _titleText | 图表标题                                     | String |
| _xText     | x轴描述                                      | String |
| _yText     | y轴描述                                      | String |
| _chartData | 图表数据                                     | Array  |
| _type      | 图表类型，提供三种(LineAndBar/LineOrBar/Pie) | String |

* 调用示例

```javascript
 <chart
  :_id="'testCharts'"
  :_titleText="'访问量统计'"
  :_xText="'类别'"
  :_yText="'总访问量'"
  :_chartData="chartData"
  :_type="'Pie'"></chart>
 //测试数据样例 [["类别1",10],["类别2",20]]
```
## 实现方式
---
* 创建一个待渲染的dom
```javascript
<template>
    <div :id="_id" class="chart"></div>
</template>
```
* 绘制函数
```javascript
function drawPie(chartData,id,titleText,xText,yText) {
    var chart = echarts.init(document.getElementById(id))
    var xAxisData = chartData.map(function (item) {return item[0]})
    var pieData = []
    chartData.forEach((v,i)=>{
      pieData.push({
        name:v[0],
        value:v[1]
      })
    })
    chart.setOption({
      title : {
        text: titleText,
        subtext: '',
        x:'center'
      },
      tooltip : {
        trigger: 'item',
        formatter: "{a} <br/>{b} : {c} ({d}%)"
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: xAxisData
      },
      series : [
        {
          name: xText,
          type: 'pie',
          radius : '55%',
          center: ['50%', '60%'],
          data:pieData,
          itemStyle: {
            emphasis: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    })
  }
```
* 挂载结束、数据源改变时重绘
```javascript
    watch:{
      _chartData(val){
        switch (this._type){
          case "LineAndBar":
            drawLineAndBar(val,this._id,this._titleText,this._xText,this._yText);
            break
          case "LineOrBar":
            drawLineOrBar(val,this._id,this._titleText,this._xText,this._yText);
            break
          case "Pie":
            drawPie(val,this._id,this._titleText,this._xText,this._yText);
            break
          default:
            drawLineAndBar(val,this._id,this._titleText,this._xText,this._yText);
            break
        }
      }
    },
    mounted() {
      switch (this._type){
        case "LineAndBar":
          drawLineAndBar(this._chartData,this._id,this._titleText,this._xText,this._yText);
          break
        case "LineOrBar":
          drawLineOrBar(this._chartData,this._id,this._titleText,this._xText,this._yText);
          break
        case "Pie":
          drawPie(this._chartData,this._id,this._titleText,this._xText,this._yText);
          break
        default:
          drawLineAndBar(this._chartData,this._id,this._titleText,this._xText,this._yText);
          break
      }
    }
```

如果觉得有用，欢迎star [calebman/vue-DBM](https://github.com/calebman/vue-DBM)