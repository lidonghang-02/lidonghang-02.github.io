---
title: "[Linux内核驱动]自旋锁"
date: 2024-06-21 19:20:32
categories: 驱动开发
tags:
  - Linux
  - Linux内核驱动
source: https://blog.csdn.net/qq_66623299/article/details/139868415
description: Linux内核驱动中自旋锁的简单应用
---

## 自旋锁（spinlock）

更多内容可以查看我的github

### 概念

Spinlock是linux内核中常用的一种互斥锁机制，和mutex不同，当无法持锁进入临界区的时候，当前执行线索不会阻塞，而是不断的自旋等待该锁释放。 正因为如此，自旋锁也是可以用在中断上下文的。 也正是因为自旋，临界区的代码要求尽量的精简，否则在高竞争场景下会浪费宝贵的CPU资源。

### 使用

```c
#include <linux/spinlock.h>
// 定义自选锁
spinlock_t lock;
// 初始化自旋锁
spin_lock_init(&lock);
// 获取自旋锁
spin_lock(&lock);
// 释放自旋锁
spin_unlock(&lock);
```

尽管使用自旋锁可以保证临界区不受别的CPU和本CPU内的抢占进程打扰。但是得到锁的代码路径在执行临界区的时候，可能受到 **中断** 的影响。因此，需要使用自旋锁的衍生函数。

```c
// 锁 + 开/关中断
spin_lock_irq();
spin_unlock_irq();

// 锁 + 关中断并保存中断状态/开中断并恢复中断状态
spin_lock_irqsave();
spin_unlock_irqrestore();
```

### 测试

```c
make
dmesg -C
insmod spinlock.ko
mknod /dev/spinlock c 232 0

cat /dev/spinlock
dmesg
echo "1" > /dev/spinlock
dmesg
cat /dev/spinlock
dmesg
```

### 代码

```c
/*
 * @Date: 2024-04-30 15:35:19
 * @author: lidonghang-02 2426971102@qq.com
 * @LastEditTime: 2024-05-19 20:02:50
 */
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/slab.h>
#include <linux/spinlock.h>
#include <linux/uaccess.h>
#include <linux/device.h>

#define DEVICE_NAME "spinlock_dev"

#define SPINLOCK_MAJOR 0
static int spinlock_major = SPINLOCK_MAJOR;

struct spinlock_dev
{
 struct cdev cdev;
 int shared_resource;
 struct device *class_dev;
};

struct spinlock_dev *spinlock_devp;
struct class *my_class = NULL;
static dev_t dev_no;

// 自旋锁
spinlock_t my_lock;

static int spinlock_open_func(struct inode *inode, struct file *file)
{
 file->private_data = spinlock_devp;
 printk(KERN_INFO "Spinlock Device Opened\n");
 return 0;
}
static int spinlock_release_func(struct inode *inode, struct file *file)
{
 printk(KERN_INFO "Spinlock Device Closed\n");
 return 0;
}
static ssize_t spinlock_read_func(struct file *filp, char __user *buf, size_t size,
 loff_t *ppos)
{
 struct spinlock_dev *dev = filp->private_data;

 // 从用户空间读取数据
 if (copy_to_user(buf, &dev->shared_resource, sizeof(int)))
 {
 printk(KERN_ERR "Failed to copy data to user space\n");
 return -EFAULT;
 }
 else
 printk(KERN_INFO "shared_resource: %d\n", dev->shared_resource);

 ppos += sizeof(int);

 return 0;
}
static ssize_t spinlock_write_func(struct file *filp, const char __user *buf, size_t size,
 loff_t *ppos)
{
 unsigned long flags;
 unsigned int count = size;
 struct spinlock_dev *dev = filp->private_data;

 // 加锁
 spin_lock_irqsave(&my_lock, flags);

 // 假设的共享资源操作
 dev->shared_resource += 1;

 // 解锁
 spin_unlock_irqrestore(&my_lock, flags);

 printk(KERN_INFO "shared_resource: %d\n", dev->shared_resource);

 return count;
}

// 设备操作结构体
static const struct file_operations fops = {
 .open = spinlock_open_func,
 .release = spinlock_release_func,
 .read = spinlock_read_func,
 .write = spinlock_write_func,
};

// 驱动初始化函数
static int __init my_driver_init_module(void)
{

 int ret;
 dev_no = MKDEV(spinlock_major, 0);
 spin_lock_init(&my_lock);

 // 分配设备号
 if (spinlock_major)
 ret = register_chrdev_region(dev_no, 1, DEVICE_NAME);
 else
 {
 ret = alloc_chrdev_region(&dev_no, 0, 1, DEVICE_NAME);
 spinlock_major = MAJOR(dev_no);
 }
 if (ret < 0)
 {
 printk(KERN_ERR "Failed to allocate device number\n");
 return ret;
 }
 spinlock_devp = kzalloc(sizeof(struct spinlock_dev), GFP_KERNEL);
 if (!spinlock_devp)
 {
 ret = -ENOMEM;
 goto free_chrdev_region;
 }

 my_class = class_create(THIS_MODULE, "spinlock");
 if (IS_ERR(my_class))
 {
 ret = PTR_ERR(my_class);
 goto free_chrdev_region;
 }

 // 初始化字符设备
 cdev_init(&spinlock_devp->cdev, &fops);
 spinlock_devp->cdev.owner = THIS_MODULE;
 ret = cdev_add(&spinlock_devp->cdev, dev_no, 1);
 if (ret < 0)
 {
 printk(KERN_ERR "Failed to add cdev\n");
 goto free_chrdev_class;
 }
 spinlock_devp->class_dev = device_create(my_class, NULL, dev_no, NULL, DEVICE_NAME);
 if (IS_ERR(spinlock_devp->class_dev))
 {
 ret = PTR_ERR(spinlock_devp->class_dev);
 goto free_chrdev_class;
 }

 printk(KERN_INFO "My Spinlock Driver Init\n");

 return 0;

free_chrdev_class:
 class_destroy(my_class);

free_chrdev_region:
 unregister_chrdev_region(dev_no, 1);

 return ret;
}

// 驱动退出函数
static void __exit my_driver_exit_module(void)
{
 cdev_del(&spinlock_devp->cdev);
 unregister_chrdev_region(dev_no, 1);
 kfree(spinlock_devp);

 printk(KERN_INFO "My Spinlock Driver Exited\n");
}

module_init(my_driver_init_module);
module_exit(my_driver_exit_module);

MODULE_AUTHOR("lidonghang-02");
MODULE_LICENSE("GPL");
```
