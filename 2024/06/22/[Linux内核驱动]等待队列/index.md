---
title: "[Linux内核驱动]等待队列"
date: 2024-06-22 12:33:23
categories: 驱动开发
tags:
  - Linux
  - Linux内核驱动
source: https://blog.csdn.net/qq_66623299/article/details/139880668
description: Linux内核的等待队列（Wait Queue）是重要的数据结构，与进程调度机制紧密相关联，可以用来同步对系统资源的访问、异步事件通知、跨进程通信等。在Linux中，等待队列以循环链表为基础结构，包括两种数据结构：等待队列头(wait queue head)和等待队列元素(wait queue)，整个等待队列由等待队列头进行管理。
---

## 等待队列

Linux内核的等待队列（Wait Queue）是重要的数据结构，与进程调度机制紧密相关联，可以用来同步对系统资源的访问、异步事件通知、跨进程通信等。

在Linux中，等待队列以循环链表为基础结构，包括两种数据结构：等待队列头(wait queue head)和等待队列元素(wait queue)，整个等待队列由等待队列头进行管理。

### 使用

```c
#include <linux/wait.h>

// 定义等待队列头
wait_queue_head_t wq;
// 初始化
init_waitqueue_head(&wq);

/*上面两步可以直接使用下面宏完成*/
DECLARE_WAIT_QUEUE_HEAD(wq);

// 定义等待队列元素
DECLARE_WAITQUEUE(name, tsk);
// 一般将当前进程定义成名为wait的等待队列元素
DECLARE_WAITQUEUE(wait, current);

// 添加/移除等待队列
add_wait_queue(&wq, &wait);
remove_wait_queue(&wq, &wait);

// 等待事件
wait_event(queue, condition);
wait_event_interruptible(queue, condition);
wait_evect_timeout(queue, condition, timeout)
wait_event_interruptible_timeout(queue, condition, timeout);
// queue 是等待队列头，condition 是等待条件，timeout 是超时时间
// _interruptible可以被信号打断，_timeout意味阻塞等待的超时时间

// 唤醒队列
// wq为上面定义的等待队列头
wake_up(&wq);
wake_up_interruptible(&wq);
```

### 代码

#### wait_queue.c

```c
/*
 * @Date: 2024-05-08 13:55:54
 * @author: lidonghang-02 2426971102@qq.com
 * @LastEditTime: 2024-05-19 20:07:16
 */
#include <linux/module.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/slab.h>
#include <linux/uaccess.h>
#include <linux/sched.h>
#include <linux/mutex.h>
#include <linux/device.h>

#include <linux/wait.h>
#include "wait_queue.h"

#define WAIT_QUEUE_MAJOR 0
#define WAIT_QUEUE_MINOR 0
#define WAIT_QUEUE_NR_DEVS 1

static int wq_major = WAIT_QUEUE_MAJOR;
static int wq_minor = WAIT_QUEUE_MINOR;
static int wq_nr_devs = WAIT_QUEUE_NR_DEVS;

static struct class *wq_class;
struct wait_queue_dev
{
 struct cdev cdev;
 char *s;
 int len;
 struct device *class_dev;
 struct mutex mutex;
};

static struct wait_queue_dev *wq_devp;
DECLARE_WAIT_QUEUE_HEAD(wq);

static int wq_open_func(struct inode *inode, struct file *filp)
{
 struct wait_queue_dev *dev;
 dev = container_of(inode->i_cdev, struct wait_queue_dev, cdev);
 filp->private_data = dev;
 printk(KERN_INFO "wait_queue_open\n");
 return 0;
}

static ssize_t wq_read_func(struct file *filp, char __user *buf, size_t count, loff_t *f_pos)
{
 int ret = 0;
 struct wait_queue_dev *dev = filp->private_data;

 wait_event_interruptible(wq, dev->s != NULL);

 if (*f_pos >= dev->len)
 {
 printk(KERN_INFO "wait_queue_read: empty\n");
 goto out_err_1;
 }
 if (count > dev->len - *f_pos)
 count = dev->len - *f_pos;

 if (copy_to_user(buf, dev->s, count))
 {
 ret = -EFAULT;
 goto out_err_1;
 }
 *f_pos += count;
 printk(KERN_INFO "wait_queue_read\n");
 return count;
out_err_1:
 return ret;
}

static ssize_t wq_write_func(struct file *filp, const char __user *buf, size_t count, loff_t *f_pos)
{
 int ret = 0;
 struct wait_queue_dev *dev = filp->private_data;

 if (mutex_lock_interruptible(&dev->mutex))
 {
 ret = -ERESTARTSYS;
 goto out_err_1;
 }

 kfree(dev->s);
 dev->s = NULL;
 dev->s = kzalloc(count, GFP_KERNEL);
 if (dev->s == NULL)
 {
 ret = -ENOMEM;
 goto out_err_2;
 }
 dev->len = count;

 if (copy_from_user(dev->s, buf, count))
 {
 ret = -EFAULT;
 goto out_err_3;
 }

 mutex_unlock(&dev->mutex);
 wake_up_interruptible(&wq);
 printk(KERN_INFO "wait_queue_write\n");

 return count;

out_err_3:
 kfree(dev->s);
 dev->s = NULL;
out_err_2:
 mutex_unlock(&dev->mutex);
out_err_1:
 return ret;
}

static long wq_ioctl_func(struct file *filp, unsigned int cmd, unsigned long arg)
{
 int ret = 0;
 struct wait_queue_dev *dev = filp->private_data;

 // 检查幻数(返回值POSIX标准规定，也用-EINVAL)
 if (_IOC_TYPE(cmd) != IOCTL_CHR_MAGIC)
 return -ENOTTY;
 // 检查命令编号
 if (_IOC_NR(cmd) > WQ_MAXNR)
 return -ENOTTY;
 // 检查命令方向，并验证用户空间指针的访问权限。
 if (_IOC_DIR(cmd) & _IOC_READ)
 ret = !access_ok(VERIFY_WRITE, (void __user *)arg, _IOC_SIZE(cmd));
 else if (_IOC_DIR(cmd) & _IOC_WRITE)
 ret = !access_ok(VERIFY_READ, (void __user *)arg, _IOC_SIZE(cmd));

 if (ret)
 return -EFAULT;

 switch (cmd)
 {
 case WQ_CLEAN:
 kfree(dev->s);
 dev->s = NULL;
 dev->len = 0;
 break;
 default:
 return -ENOTTY;
 }
 return ret;
}

static int wq_release_func(struct inode *inode, struct file *filp)
{
 printk(KERN_INFO "wait_queue_release\n");
 return 0;
}

struct file_operations wq_fops =
 {
 .owner = THIS_MODULE,
 .open = wq_open_func,
 .read = wq_read_func,
 .write = wq_write_func,
 .release = wq_release_func,
 .unlocked_ioctl = wq_ioctl_func,
};

static int __init wq_init_module(void)
{
 int ret = 0, i;
 dev_t devno = MKDEV(wq_major, wq_minor);
 if (wq_major)
 ret = register_chrdev_region(devno, wq_nr_devs, "wait_queue");
 else
 {
 ret = alloc_chrdev_region(&devno, wq_minor, wq_nr_devs, "wait_queue");
 wq_major = MAJOR(devno);
 }
 if (ret < 0)
 {
 ret = -ENODEV;
 goto out_err_1;
 }

 wq_devp = kzalloc(sizeof(struct wait_queue_dev) * wq_nr_devs, GFP_KERNEL);
 if (wq_devp == NULL)
 {
 ret = -ENOMEM;
 goto out_err_2;
 }

 wq_class = class_create(THIS_MODULE, "wait_queue");
 if (IS_ERR(wq_class))
 {
 printk(KERN_WARNING "fail create class");
 goto out_err_3;
 }

 for (i = 0; i < wq_nr_devs; i++)
 {
 wq_devp[i].s = NULL;
 wq_devp[i].len = 0;
 cdev_init(&wq_devp[i].cdev, &wq_fops);
 wq_devp[i].cdev.owner = THIS_MODULE;
 ret = cdev_add(&wq_devp[i].cdev, MKDEV(wq_major, wq_minor + i), 1);
 if (ret < 0)
 printk(KERN_WARNING "fail add hc_dev%d", i);
 else
 {
 wq_devp[i].class_dev = device_create(wq_class, NULL, MKDEV(wq_major, wq_minor + i), NULL, "wait_queue%d", i);
 if (IS_ERR(wq_devp[i].class_dev))
 {
 printk(KERN_WARNING "fail create device for wait_queue%d", i);
 cdev_del(&wq_devp[i].cdev);
 }
 }

 mutex_init(&wq_devp[i].mutex);
 }

 printk(KERN_INFO "wait_queue init success\n");
 return 0;
out_err_3:
 kfree(wq_devp);
out_err_2:
 unregister_chrdev_region(devno, wq_nr_devs);
out_err_1:
 return ret;
}

static void __exit wq_exit_module(void)
{
 int i;
 for (i = 0; i < wq_nr_devs; i++)
 {
 device_destroy(wq_class, MKDEV(wq_major, wq_minor + i));
 cdev_del(&wq_devp[i].cdev);
 }
 class_destroy(wq_class);
 kfree(wq_devp);
 unregister_chrdev_region(MKDEV(wq_major, wq_minor), wq_nr_devs);
 printk(KERN_INFO "wait_queue exit\n");
}

module_param(wq_major, int, S_IRUGO);
module_param(wq_minor, int, S_IRUGO);
module_param(wq_nr_devs, int, S_IRUGO);

module_init(wq_init_module);
module_exit(wq_exit_module);

MODULE_AUTHOR("lidonghang-02");
MODULE_LICENSE("GPL");
```

#### wait_queue.h

```c
#ifndef _WQ_CHR_H_
#define _WQ_CHR_H_

#define IOCTL_CHR_MAGIC 'c'

#define WQ_CLEAN _IO(IOCTL_CHR_MAGIC, 0)

#define WQ_MAXNR 0

#endif /* _WQ_CHR_H_ */
```
