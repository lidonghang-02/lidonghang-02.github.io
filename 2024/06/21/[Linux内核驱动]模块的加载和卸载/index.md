---
title: "[Linux内核驱动]模块的加载和卸载"
date: 2024-06-21 18:59:52
categories: 驱动开发
tags:
  - Linux
  - Linux内核驱动
source: https://blog.csdn.net/qq_66623299/article/details/139868138
description: 最简单的内核模块，包括内核模块的加载和卸载。
---

## Linux内核模块的加载和卸载

最简单的内核模块，包括内核模块的加载和卸载。

更多详细内容可以查看我的github

### 运行

```c
make
// 加载
insmod hello.ko
// 卸载
rmmod hello
```

### 模块加载函数

Linux内核模块加载函数一般以 **__init** 标识声明，然后用 **module_init(函数名)** 的形式指定

加载函数返回一个整形值，若初始化成功，返回0，失败返回错误编码。

在Linux中，所有标识为__init的函数如果直接编译进入内核，成为内核镜像的一部分，在连接的时候都会放在.init.text这个区段内。

所有的__init函数在区段.initcall.init中还保存了一份函数指针，在初始化时内核会通过这些函数指针依次调用这些函数，并且在初始化完成后，释放init区段的内存。

### 模块卸载函数

Linux内核模块卸载函数一般以 **__exit** 标识声明，然后用 **module_exit(函数名)** 的形式指定

卸载函数不返回任何值。

### 代码

```c
/*
 * @Date: 2024-04-29 11:23:01
 * @author: lidonghang-02 2426971102@qq.com
 * @LastEditTime: 2024-05-27 13:17:11
 */
#include <linux/init.h>
#include <linux/module.h>

static int __init hello_init_module(void)
{
	printk(KERN_INFO "Hello World enter\n");
	// pr_info("Hello World enter\n");
	// pr_info 是一个宏，与printk的KERN_INFO等价
	return 0;
}
static void __exit hello_exit_module(void)
{
	printk(KERN_INFO "Hello World exit\n");
}

module_init(hello_init_module);
module_exit(hello_exit_module);

MODULE_AUTHOR("lidonghang-02");
MODULE_LICENSE("GPL");
```
