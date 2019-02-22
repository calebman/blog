---
title: 基于Element构建自定义树
date: 2017-09-19 15:18:56
description: 做项目的时候要使用到一个自定义的树形控件来构建表格树，在github上搜了一下没有搜索到合适的可以直接用的，查看Element的组件说明时发现它的Tree控件可以使用render来自定义节点样式，于是基于它封装了一个可以增、删、改的树形组件
categories: 
- 前端
tags: 
- vuejs
- element-ui
---

![](http://pnb4x7vrc.bkt.clouddn.com/tree.jpg)

<!--more-->

# 说明
---
做项目的时候要使用到一个自定义的树形控件来构建表格树，在github上搜了一下没有搜索到合适的（好看的）可以直接用的，查看Element的组件说明时发现它的[Tree控件](http://element.eleme.io/#/zh-CN/component/tree)可以使用render来自定义节点样式，于是基于它封装了一个可以增、删、改的树形组件，现在分享一下它的使用与实现。

## 控件演示
![](https://user-gold-cdn.xitu.io/2017/9/20/12020eae4eaa20e2028a8570d7ad34e9)

## 控件使用
---
#### 概要
* 基于element-ui树形控件的二次封装
* 提供编辑、删除节点的接口
* 提供一个next钩子，在业务处理失败时可使用next(false)回滚操作
* 控件源码见 [github](https://github.com/calebman/vue-DBM)

#### 文档
* props

属性 | 说明 | 类型
------------ | ------------- | -------------
value | 源数据，可使用v-model双向绑定 | Array

* events

事件名 | 说明 | 参数
------------ | ------------- | -------------
SaveEdit | 点击编辑或者添加树节点后的保存事件 | (父节点数据、当前节点数据、next)
DelNode | 删除节点事件 | (父节点数据、当前节点数据、next)
NodeClick | 节点点击事件 | (当前节点数据)

* 源数据描述

属性 | 说明 
------------ | -------------
value | 树节点的唯一标识
label | 树节点的显示名称
status | (1：编辑状态)(0：显示状态)(-1不可编辑状态)
children | 子节点数据

* 调用示例

```javascript
 <m-tree
    v-model="tableTree"
    @SaveEdit="SaveEdit"
    @DelNode="DelNode"
    @NodeClick="handleNodeClick"></m-tree>

SaveEdit(parentNode,data,next){
    var param = {
      parentNode:parentNode,
      node:data
    }
    this.$http.post(URL,param).then((response) => {
      if(response.status == 200){
        next(true,response.body.data.nodeId)
      }else{
        next(false)
      }
    })
}
```
## 实现方式
---
* 构建子节点的模板
```javascript
  <span class="span_item">
    <span @click="Expanded">
      <Input v-if="node.status == 1" style="width: 100px;" v-model="node.label" size="small" ></Input>
      <Icon  v-if="node.status == 0" type="asterisk"></Icon>
      <Icon v-if="node.status == -1" type="ios-keypad-outline"></Icon>
      <span v-if="node.status != 1">{{node.label}}</span>
    </span>
    <span v-if="node.status == 1">
      <Button  style="margin-left: 8px;" size="small" type="success" icon="checkmark-circled" @click="SaveEdit">确认</Button>
      <Button style="margin-left: 8px;" size="small" type="ghost" icon="checkmark-circled" @click="CancelEdit">取消</Button>
    </span>
    <span class="span_icon">
       <Icon v-if="node.status == 0" style="margin-left: 8px" color="gray" type="edit" size="16" @click.native="OpenEdit"></Icon>
       <Icon v-if="node.status == 0" style="margin-left: 8px" type="plus-round" color="gray" size="16" @click.native="Append"></Icon>
       <Icon v-if="node.status == 0&&node.children.length < 1" style="margin-left: 8px" type="ios-trash" color="red" size="18" @click.native="Delete"></Icon>
    </span>
  </span>
```
* 子节点通过$emit通知父节点事件
```javascript
SaveEdit(){
    //保存节点事件
    this.$emit('SaveEdit',this.nodeData)
},
```
* 父节点核心实现，使用renderContent函数加载子节点模板，点击保存节点时将业务参数保存在runParam中用于在业务操作失败（网络请求失败、服务端异常等情况）的数据回滚
```javascript
    <el-tree
      class="filter-tree"
      style="overflow:auto;"
      :data="treeData"
      :filter-node-method="filterNode"
      @node-click="handleNodeClick"
      ref="tree"
      node-key="value"
      :expand-on-click-node="false"
      :render-content="renderContent"
      default-expand-all>
    </el-tree>
    //子节点模板
    renderContent(h, { node, data, store }) {
        return h(TreeItem,{
          props:{
            value:data,
            treeNode:node
          },
          on:{
            input:(node)=>{
              data = node
            },
            Append: () => {
              node.expanded = true
              data.children.push({ value: this.$utilHelper.generateUUID(), label: '请输入模块名称', children: [],status:1,isAdd:true })
            },
            //保存节点
            SaveEdit:(nodeData)=> {
              //递归查找父节点
              var parentNode = this.$utilHelper.getNode(this.treeData,data.value).parentNode
              this.runParam.parentNode = parentNode
              this.runParam.data = data
              this.runParam.nodeData = nodeData
              this.$emit('SaveEdit',parentNode,data,this.CanSaveNext)
            }
          }
        })
      }
```
* 操作结果钩子，如果next函数传入false则判定操作失败，使用runParam中的参数进行回滚，该节点的编辑保存操作将无效
```javascript
      CanSaveNext(isNext,nodeId){
        let parentNode = this.runParam.parentNode
        let nodeData = this.runParam.nodeData
        let data = this.runParam.data
        if(isNext){
          parentNode.children.forEach((v,i)=>{
            if(v.value == data.value){
              if(this.HOST != "static"&&data.isAdd){
                data.value = nodeId
              }
              data.status = 0
              parentNode.children.splice(i,1,data)
            }
          })
        }else{
          if(!data.isAdd){
            parentNode.children.forEach((v,i)=>{
              if(v.value == nodeData.value){
                data.label = nodeData.label
                parentNode.children.splice(i,1,data)
              }
            })
          }
        }
        this.runParam = {}
      }
```

如果觉得有用，欢迎star [calebman/vue-DBM](https://github.com/calebman/vue-DBM)
