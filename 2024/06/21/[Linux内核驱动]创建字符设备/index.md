---
title: "[Linux内核驱动]创建字符设备"
date: 2024-06-21 19:14:58
categories: 驱动开发
tags:
  - Linux
  - Linux内核驱动
source: https://blog.csdn.net/qq_66623299/article/details/139868367
description: 创建一个简单的字符设备
---

## 创建字符设备

### 设备号的分配和注册

更多内容可以查看我的github

#### alloc_chrdev_region

alloc_chrdev_region 函数用于动态地为一个字符设备驱动程序分配一个或多个主设备号（major number）和次设备号（minor number）的范围。这个函数会自动选择一个未使用的主设备号（除非你在调用时指定了一个）。

函数原型：

```c
int alloc_chrdev_region(dev_t *dev, unsigned baseminor, unsigned count, const char *name);
```

参数说明：

- dev：一个指向 dev_t 类型的指针，用于存储分配的设备号。
- baseminor：次设备号的起始值。
- count：要分配的次设备号的数量。
- name：设备名，通常用于在 /proc/devices 中显示。

#### register_chrdev_region

register_chrdev_region 函数用于将一个已知的（通常预先定义或静态分配的）主设备号和次设备号范围注册到内核中。这个函数不会自动选择主设备号，因为你在调用时已经指定了它。

函数原型：

```c
int register_chrdev_region(dev_t from, unsigned count, const char *name);
```

参数说明：

- from：要注册的起始设备号（dev_t 类型）。
- count：要注册的次设备号的数量。
- name：设备名，用于在 /proc/devices 中显示。

#### unregister_chrdev_region

与上面注册的函数相反，用于删除一个设备号

函数原型：

```c
int unregister_chrdev_region(dev_t from, unsigned count);
```

参数说明：

- from：要注销的起始设备号（dev_t 类型）。
- count：要注销的次设备号的数量。

### 设备类

在 Linux 设备模型中，设备类是一种将具有相似属性的设备组织在一起的机制。通过设备类，用户空间可以更方便地识别和管理设备。

#### class_create

class_create 宏的主要作用是在 /sys/class/ 目录下创建一个新的子目录，该子目录的名称由 class_create 的参数指定。这个新创建的子目录实际上是一个设备类的表示，它包含了与该设备类相关的所有信息。

函数原型：

```c
struct class *class_create(struct module *owner, const char *name);
```

- owner：指向创建该类的模块的指针。通常是 THIS_MODULE 宏。
- name：要创建的类的名称，也就是 /sys/class/ 目录下新子目录的名称。

返回值：

- 成功：返回一个指向新创建的 struct class 的指针
- 失败：返回 NULL

#### class_destroy

删除一个设别类，释放相关的资源。

```c
void class_destroy(struct class *cls);
```

### cdev

在Linux内核中，使用cdev结构体来描述一个字符设备

```c
struct cdev{
 ...
 struct module *owner;
 struct file_operations *ops;
 dev_t dev;
 ...
};
```

- owner：设备的所有者，通常是一个模块的名称
- ops：文件操作结构体，包括open、release、read、write等函数的指针
- dev：设备号，32位，其中12位主设备号，20位次设备号

对于dev_t，可以使用MKDEV来生成设备号,使用MAJOR宏来获取主设备号，使用MINOR宏来获取次设备号。

```c
devno = MKDEV(int major, int minor);
major = MAJOR(dev_t dev);
minor = MINOR(dev_t dev);
```

Linux内核提供了操作cdev的函数

- cdev_init()

```c
void cdev_init(struct cdev *cdev, struct file_operations *fops);
```

用于初始化cdev结构体并与文件操作结构体关联起来。

- cdev_put()

```c
void cdev_put(struct cdev *cdev);
```

减少使用计数

- cdev_add()

```c
int cdev_add(struct cdev *cdev, dev_t dev, unsigned count);
```

用于动态申请一个cdev内存，并将设备号与cdev关联起来。其中count是设备号的数量。

- cdev_del

与cdev_add()相反，用于删除一个cdev

### 设备

Linux内核中，设备是系统资源的重要组成部分，通常与物理硬件或虚拟硬件相关联。Linux内核通过设备驱动程序来管理这些设备，并为用户空间提供统一的接口来访问和控制它们。

#### device_create

在Linux内核的设备模型中，device_create() 函数用于动态地创建一个设备实例，并将其与指定的设备类（class）相关联。这个函数将新的设备实例添加到内核的设备驱动程序模型中，并在用户空间中的 /sys/devices/ 和 /dev/ 目录下创建相应的条目，以便用户空间程序可以访问和与该设备交互。

函数原型：

```c
struct device *device_create(struct class *cls, struct device *parent,dev_t devt, void *drvdata, const char *fmt, ...);
```

参数说明：

- cls：指向设备类（struct class）的指针，该设备类与新创建的设备实例相关联。
- parent：指向父设备的指针。如果设备没有父设备，则此参数可以为NULL。
- devt：设备的设备号（dev_t 类型），用于在 /dev/ 目录下创建相应的设备文件。
- drvdata：私有数据指针，可以传递给设备的驱动程序，用于存储与设备相关的特定信息。
- fmt：用于生成设备名称的格式字符串，可以是 %s%d 之类的格式，其中 %s 通常用于设备类名，%d 用于次设备号。
- …：与 fmt 字符串匹配的参数列表，用于生成设备名称。

返回值：

- 成功：返回一个指向新创建的设备实例的指针-
- 失败返回NULL

#### device_destroy

用于销毁设备

```c
void device_destroy(struct class *cls, dev_t devt);
```

参数说明：

- cls：指向设备类（struct class）的指针，该设备类与要销毁的设备实例相关联。
- devt：要销毁的设备的设备号（dev_t 类型），用于唯一标识设备。

### 代码

```c
/*
 * @Date: 2024-05-05 17:49:29
 * @author: lidonghang-02 2426971102@qq.com
 * @LastEditTime: 2024-05-19 19:56:00
 */
#include <linux/module.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/slab.h>
#include <linux/device.h>

#define CREATE_CHR_MAJOR 0
#define CREATE_CHR_NR_DEVS 2

static int create_chr_major = CREATE_CHR_MAJOR;
static int create_chr_minor = 0;
static int create_chr_nr_devs = CREATE_CHR_NR_DEVS;

struct class* cls = NULL;
struct create_char_dev
{
 struct cdev cdev;
 struct device* class_dev;
};

struct create_char_dev* create_chr_devp;

static int create_chr_open_func(struct inode* inode, struct file* filp)
{
 printk(KERN_INFO "open create_dev%d %d\n", iminor(inode), MINOR(inode->i_cdev->dev));
 return 0;
}
static int create_chr_release_func(struct inode* inode, struct file* filp)
{
 printk(KERN_INFO "release create_dev\n");
 return 0;
}
static ssize_t create_chr_read_func(struct file* filp, char __user* buf, size_t size, loff_t* ppos)
{
 printk(KERN_INFO "read create_dev\n");
 return 0;
}
static ssize_t create_chr_write_func(struct file* filp, const char __user* buf, size_t size, loff_t* ppos)
{
 printk(KERN_INFO "write create_dev\n");
 return size; // 不能返回0，否则会不停的写
}

static struct file_operations create_chr_fops = {
 // 字符设备的操作函数
 .owner = THIS_MODULE,
 .open = create_chr_open_func,
 .release = create_chr_release_func,
 .read = create_chr_read_func,
 .write = create_chr_write_func,
};

static int __init create_init_module(void)
{
 int ret, i;
 dev_t devno = MKDEV(create_chr_major, create_chr_minor);
 if (create_chr_major)
 ret = register_chrdev_region(devno, create_chr_nr_devs, "create_chr"); // 使用指定的设备号分配
 else
 {
 ret = alloc_chrdev_region(&devno, create_chr_minor, create_chr_nr_devs, "create_chr"); // 动态分配主设备号
 create_chr_major = MAJOR(devno);
 }
 if (ret < 0)
 {
 printk(KERN_WARNING "create: can't get major %d\n", create_chr_major);
 goto out_err_1;
 }

 create_chr_devp = kzalloc(sizeof(struct create_char_dev) * create_chr_nr_devs, GFP_KERNEL); // 给字符设备分配空间，这里create_chr_nr_devs为2
 if (!create_chr_devp)
 {
 printk(KERN_WARNING "alloc mem failed");
 ret = -ENOMEM;
 goto out_err_2;
 }

 cls = class_create(THIS_MODULE, "create_chr"); // 创建一个类
 if (IS_ERR(cls))
 {
 ret = PTR_ERR(cls);
 printk(KERN_WARNING "create_chr: can't create class\n");
 goto out_err_2;
 }

 for (i = 0; i < create_chr_nr_devs; i++)
 {
 // 初始化字符设备结构
 cdev_init(&create_chr_devp[i].cdev, &create_chr_fops);
 create_chr_devp[i].cdev.owner = THIS_MODULE;
 ret = cdev_add(&create_chr_devp[i].cdev, MKDEV(create_chr_major, create_chr_minor + i), 1); // 添加该字符设备到系统中
 if (ret)
 {
 printk(KERN_WARNING "fail add create_dev%d", i);
 continue;
 }
 create_chr_devp[i].class_dev = device_create(cls, NULL, devno + i, NULL, "create_dev%d", i); // 创建设备节点
 if (IS_ERR(create_chr_devp[i].class_dev))
 printk(KERN_WARNING "fail create create_dev%d", i);
 }

 printk(KERN_INFO "create_chr init\n");
 return 0;

out_err_2:
 unregister_chrdev_region(devno, create_chr_nr_devs);
out_err_1:
 return ret; // 返回错误，模块无法正常加载
}

static void __exit create_exit_module(void)
{
 int i;
 for (i = 0; i < create_chr_nr_devs; i++)
 {
 device_destroy(cls, MKDEV(create_chr_major, create_chr_minor + i));
 cdev_del(&create_chr_devp[i].cdev);
 }
 class_destroy(cls);
 kfree(create_chr_devp);
 unregister_chrdev_region(MKDEV(create_chr_major, create_chr_minor), create_chr_nr_devs); // 移除模块时释放设备号
 printk(KERN_INFO "create_chr exit\n");
}

module_param(create_chr_major, int, S_IRUGO);
module_param(create_chr_minor, int, S_IRUGO);
module_param(create_chr_nr_devs, int, S_IRUGO);

module_init(create_init_module);
module_exit(create_exit_module);

MODULE_AUTHOR("lidonghang-02");
MODULE_LICENSE("GPL");
```
