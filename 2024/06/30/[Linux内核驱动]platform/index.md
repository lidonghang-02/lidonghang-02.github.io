---
title: "[Linux内核驱动]platform"
date: 2024-06-30 19:25:36
categories: 驱动开发
tags:
  - Linux
  - Linux内核驱动
source: https://blog.csdn.net/qq_66623299/article/details/140085025
description: 这里只是简单介绍，更详细的内容在中。Linux 系统要考虑到驱动的可重用性，因此提出了驱动的分离与分层这样的软件思路，为了达到所有硬件都可以按照总线设备驱动模型来实现驱动，Linux从2.6起就加入了 platform 设备驱动，在内核中建立一条虚拟的总线platform，它可以将那些不依赖于传统总线（如PCI, USB, I2C等）的设备，虚拟的挂在了platform总线上，达到统一。
---

## platform设备驱动

这里只是简单介绍，更详细的内容在bus/platform/中。

Linux 系统要考虑到驱动的可重用性，因此提出了驱动的分离与分层这样的软件思路，为了达到所有硬件都可以按照总线设备驱动模型来实现驱动，Linux从2.6起就加入了 platform 设备驱动，在内核中建立一条虚拟的总线platform，它可以将那些不依赖于传统总线（如PCI, USB, I2C等）的设备，虚拟的挂在了platform总线上，达到统一。

### platform_device结构体

```c
struct platform_device
{
 	// 设备的名字，用于和驱动进行匹配的
	const char *name;
	// 内核中维护的所有的设备必须包含该成员
 struct device dev;
	//资源个数
 u32 num_resources;
 //描述资源
 struct resource * resource;
 ...
};
```

### platform_driver结构体

```c
struct platform_driver {
 int (*probe)(struct platform_device *);
 int (*remove)(struct platform_device *);
 void (*shutdown)(struct platform_device *);
 int (*suspend)(struct platform_device *, pm_message_t state);
 int (*resume)(struct platform_device *);
 struct device_driver driver;
 const struct platform_device_id *id_table;
 bool prevent_deferred_probe;
};
```

- probe: 当驱动和硬件信息匹配成功之后，就会调用probe函数，驱动所有的资源的注册和初始化全部放在probe函数中
- remove: 当设备被移除时，此函数被调用。
- shutdown: 系统关闭时，此函数被调用。
- suspend 和 resume: 电源管理相关的回调，用于设备挂起和恢复。
- driver: 这是一个 struct device_driver 结构体，包含了驱动的一些通用信息。
- id_table: 往往一个驱动可能能同时支持多个硬件，这些硬件的名字都放在该结构体数组中。

### platform_bus_type

系统为platform总线创建了一个总线类型，platform_bus_type定义位于Linux/drivers/base/platform.c中

```c
struct bus_type platform_bus_type = {
 .name = "platform",
 .dev_groups = platform_dev_groups,
 .match = platform_match,
 .uevent = platform_uevent,
 .pm = &platform_dev_pm_ops,
};
```

其中的match()函数实现了platform_device和platform_driver之间的匹配。

### 测试

```c
make
insmod platform.ko
insmod platform-dev.ko
```

成功后可以看到如下目录结构

```c
➜ my_platform_device git:(master) ✗ pwd
/sys/devices/platform/my_platform_device
➜ my_platform_device git:(master) ✗ ll
total 0
-rw-r--r-- 1 root root 4.0K 5月 19 15:56 driver_override
-r--r--r-- 1 root root 4.0K 5月 19 15:56 modalias
drwxr-xr-x 2 root root 0 5月 19 15:56 power
lrwxrwxrwx 1 root root 0 5月 19 15:56 subsystem -> ../../../bus/platform
-rw-r--r-- 1 root root 4.0K 5月 19 15:56 uevent
```

### 其他

关于platform的知识还有很多，这里只是简单的介绍和一种编写的方法，更多的知识在网上查阅，也可以参考内核中一些设备的实现，如DM9000网卡驱动（/linux/drivers/net/ethernet/davicom/dm9000.c ）等

### 代码

#### platform-dev.c

```c
#include <linux/module.h>
#include <linux/platform_device.h>

static struct platform_device* pdev;

static int __init platform_init_module(void)
{
 int ret = 0;

 // platform_device_alloc 函数
 // 用于分配一个新的 platform_device 结构体，并初始化其中的一些字段。
 // 这个函数不会将设备添加到系统中，只是简单地分配并初始化结构体。
 pdev = platform_device_alloc("my_platform_device", -1);
 if (!pdev)
 return -ENOMEM;

 // platform_device_add 函数
 // 用于将之前通过 platform_device_alloc 分配并初始化
 // 的 platform_device 结构体添加到系统中。
 // 这个函数会触发与设备相关的驱动程序进行匹配，
 // 并可能触发设备的探测和初始化过程。
 ret = platform_device_add(pdev);
 if (ret)
 {
 // platform_device_put 函数用于释放通过 platform_device_alloc 分配的平台设备。
 // 这个函数会递减设备的引用计数，并在引用计数达到 0 时释放设备占用的内存。
 // 如果设备已经被添加到系统中（通过 platform_device_add），
 // 那么你需要先使用 platform_device_unregister 来注销设备，
 // 然后才能使用 platform_device_put 来释放它
 platform_device_put(pdev);
 return ret;
 }
 printk(KERN_INFO "platform_init_module \n");
 return 0;
}
static void __exit platform_exit_module(void)
{
 printk(KERN_INFO "platform_exit_module \n");
 platform_device_unregister(pdev);
 platform_device_put(pdev);
}

module_init(platform_init_module);
module_exit(platform_exit_module);

MODULE_AUTHOR("lidonghang-02");
MODULE_LICENSE("GPL");
```

#### platform.c

```c
#include <linux/fs.h>
#include <linux/module.h>
#include <linux/platform_device.h>
#include <linux/miscdevice.h>

// miscdevice结构体在Linux内核中用于定义杂项设备（也称为混合设备或misc设备）的属性。
// 杂项设备是字符设备的一种，当板子上的某个设备没有办法明确分类时，
// 可以使用杂项设备驱动。杂项设备可以自动生成设备节点，
// 并且所有的MISC设备驱动的主设备号都为10，不同的设备使用不同的从设备号。
struct miscdevice misc_device;

static int platform_device_open_func(struct inode *inode, struct file *file)
{
 printk(KERN_INFO "platform_open_func\n");
 return 0;
}
static int platform_device_release_func(struct inode *inode, struct file *file)
{
 printk(KERN_INFO "platform_release_func\n");
 return 0;
}
static const struct file_operations platform_device_fops = {
 .owner = THIS_MODULE,
 .open = platform_device_open_func,
 .release = platform_device_release_func,
};

static int platform_driver_probe_func(struct platform_device *pdev)
{
 int ret;
 // 创建设备节点
 misc_device.minor = MISC_DYNAMIC_MINOR;
 misc_device.name = "platform_device";
 misc_device.fops = &platform_device_fops;

 ret = misc_register(&misc_device);
 if (ret < 0)
 {
 printk(KERN_ERR "Failed to register misc device\n");
 return ret;
 }

 // dev_info 是一个宏，通常用于在内核驱动中打印信息。
 dev_info(&pdev->dev, "Platform device probed\n");

 printk(KERN_INFO "Platform device probed\n");
 return 0;
}

static int platform_driver_remove_func(struct platform_device *pdev)
{
 printk(KERN_INFO "Platform device removed\n");
 misc_deregister(&misc_device);
 dev_info(&pdev->dev, "Platform device removed\n");
 return 0;
}

static struct platform_driver platform_driver = {
 .driver = {
 .name = "platform_device",
 .owner = THIS_MODULE,
 },
 .probe = platform_driver_probe_func,
 .remove = platform_driver_remove_func,
};

module_platform_driver(platform_driver);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("lidonghang-02");
```

#### Makefile

```c
KVERS = $(shell uname -r)

# Kernel modules
obj-m += platform-dev.o platform.o

# Specify flags for the module compilation.
EXTRA_CFLAGS=-g -O0

build: kernel_modules

kernel_modules:
	make -C /lib/modules/$(KVERS)/build M=$(CURDIR) modules

clean:
	make -C /lib/modules/$(KVERS)/build M=$(CURDIR) clean
```
