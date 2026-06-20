---
title: [Linux内核驱动]模块参数
date: 2024-06-21 19:01:43
categories: 驱动开发
tags:
  - Linux
  - Linux内核驱动
source: https://blog.csdn.net/qq_66623299/article/details/139868192
description: 目录下将出现以此模块名为名的目录。当模块参数权限为0时，表示此参数不存在对应的文件节点，此时无法通过文件节点来修改参数的值。对于权限不为0的参数，目录下将出现。可以用过 module_param(参数名，参数类型，参数读/写权限)的形式向模块传递参数，如果不传递，参数将使用模块内定义的缺省值。目录，里面包含以参数名为名的文件，文件中保存了参数的值。除此之外，模块也可以拥有参数数组，形式为。在装载内核模块是，用户可以通过。为模块定义一个参数。对于被内置的模块，无法。更多内容可以查看我的。
---

### 模块参数

更多内容可以查看我的github

可以用过 **module_param(参数名，参数类型，参数读/写权限)** 为模块定义一个参数。

在装载内核模块是，用户可以通过 insmod 模块名 参数名=参数值 的形式向模块传递参数，如果不传递，参数将使用模块内定义的缺省值。

对于被内置的模块，无法insmod，但是bootloader可以通过在bootargs里设置模块名.参数名=值的形式传递参数。

参数类型有：

- byte
- short
- ushort
- int
- uint
- long
- ulong
- bool
- invbool 布尔的反
- charp 字符指针

除此之外，模块也可以拥有参数数组，形式为module_parma_array(数组名，数组类型，数组长，参数读/写权限)

模块被加载后，在/sys/module/目录下将出现以此模块名为名的目录。当模块参数权限为0时，表示此参数不存在对应的文件节点，此时无法通过文件节点来修改参数的值。对于权限不为0的参数，目录下将出现parameters目录，里面包含以参数名为名的文件，文件中保存了参数的值。

### 代码

```c
/*
 * @Date: 2024-04-29 12:28:42
 * @author: lidonghang-02 2426971102@qq.com
 * @LastEditTime: 2024-05-19 19:51:54
 */
#include <linux/init.h>
#include <linux/module.h>

static int param_value = 0;
static char* param_name = "default";

// 在模块加载时，可以通过“insmod 模块名 参数名=参数值”来设置参数
module_param(param_value, int, S_IRUGO);
module_param(param_name, charp, S_IRUGO);

static int __init param_init_module(void)
{
 printk(KERN_INFO "param module init\n");
 printk(KERN_INFO "param_value = %d\n", param_value);
 printk(KERN_INFO "param_name = %s\n", param_name);
 return 0;
}

static void __exit param_exit_module(void)
{
 printk(KERN_INFO "param module exit\n");
}

module_init(param_init_module);
module_exit(param_exit_module);

MODULE_AUTHOR("lidonghang-02");
MODULE_LICENSE("GPL");
```
