---
title: [Linux内核驱动]工作队列
date: 2024-06-30 19:23:00
categories: 驱动开发
tags:
  - Linux
  - Linux内核驱动
source: https://blog.csdn.net/qq_66623299/article/details/140085004
description: 工作队列的使用方法和tasklet类似，但是工作队列的执行上下文是内核线程，可以调度和睡眠。使用工作队列构造下面数据表，并通过设备读取。
---

## 工作队列

工作队列的使用方法和tasklet类似，但是工作队列的执行上下文是内核线程，可以调度和睡眠。

使用工作队列构造下面数据表，并通过设备读取

```c
time delta inirq pid cpu command
 8890 0 0 3813 1 cat
 8890 0 0 108 0 kworker/u14:4
 8890 0 0 108 0 kworker/u14:4
 8890 0 0 108 0 kworker/u14:4
 8890 0 0 108 0 kworker/u14:4
```

### struct work_struct

struct work_struct 是一个用来描述一个可延迟执行的工作的结构体。

使用 INIT_WORK(_work, _func) 宏可以初始化一个 work_struct 实例并与处理函数绑定。

### 工作队列API

#### alloc_workqueue

创建一个新的工作队列并返回一个指向新创建的workqueue_struct结构的指针。

```c
struct workqueue_struct *alloc_workqueue(const char *name, int flags, int max_active,...);
```

- name:这是一个格式字符串，用于指定工作队列的名称。它可以包含%s、%d等格式化占位符，后跟相应的可变参数（…）。
- flags：用于配置工作队列的标志位。常见的标志包括：

- WQ_UNBOUND：工作队列中的工作可以在任何CPU上执行，而不是仅限于创建工作队列的CPU。
- WQ_MEM_RECLAIM：允许工作队列在内存不足时回收内存。
- WQ_HIGHPRI：创建一个高优先级的工作队列，其中的工作会比其他工作队列中的工作更频繁地运行。
- WQ_CPU_INTENSIVE：创建一个CPU密集型的工作队列，该队列中的工作会倾向于在相同的CPU上连续运行。
- WQ_FREEZABLE：允许工作队列在冻结时暂停执行工作。

- max_active：工作队列中可以同时运行的最大工作数。如果设置为0，则没有限制。

#### queue_work

这个函数用于将一个工作（work_struct）添加到工作队列中。当工作队列的调度器线程（或线程池中的某个线程）变得可用时，它会执行这个工作。这个函数接受一个指向workqueue_struct的指针和一个指向work_struct的指针作为参数。

```c
int queue_work(struct workqueue_struct *wq, struct work_struct *work);
```

#### destroy_workqueue()

这个函数用于销毁一个工作队列。在销毁之前，它会确保队列中的所有工作都已完成。这个函数接受一个指向workqueue_struct结构的指针作为参数。

```c
void destroy_workqueue(struct workqueue_struct *wq);
```

### 代码

```c
#include <linux/module.h>
#include <linux/fs.h>
#include <linux/cdev.h>
#include <linux/uaccess.h>
#include <linux/slab.h>
#include <linux/device.h>
#include <linux/sched.h>

#include <linux/workqueue.h>

#define WORK_QUEUE_MAJOR 0
#define WORK_QUEUE_MINOR 0
#define WORK_QUEUE_NR_DEVS 1

static int work_queue_major = WORK_QUEUE_MAJOR;
static int work_queue_minor = WORK_QUEUE_MINOR;
static int work_queue_nr_devs = WORK_QUEUE_NR_DEVS;

struct work_queue_dev
{
 struct cdev cdev;
 struct device* cls_dev;
 wait_queue_head_t wq;

 char* buf;
 int loops;
 unsigned long pre_jiffies;
 struct work_struct work;
 struct workqueue_struct* work_queue;
};

static struct class* class = NULL;
static struct work_queue_dev* work_queue_devp;

static int work_queue_open_func(struct inode* inode, struct file* filp)
{
 struct work_queue_dev* dev = container_of(inode->i_cdev, struct work_queue_dev, cdev);
 filp->private_data = dev;
 return 0;
}

static int work_queue_release_func(struct inode* inode, struct file* filp)
{
 return 0;
}

static void work_queue_handeler(struct work_struct* work)
{
 struct work_queue_dev* dev = container_of(work, struct work_queue_dev, work);
 dev->buf += sprintf(dev->buf,
 "%9li %3li %i %6i %i %s\n",
 jiffies, jiffies - dev->pre_jiffies,
 in_interrupt() ? 1 : 0, current->pid,
 smp_processor_id(), current->comm);

 dev->loops--;
 if (dev->loops > 0)
 {
 queue_work(dev->work_queue, work);
 dev->pre_jiffies = jiffies;
 }
 else
 wake_up_interruptible(&dev->wq);
}
static ssize_t work_queue_read_func(struct file* filp, char __user* buf, size_t count, loff_t* f_pos)
{
 int ret = 0;
 char* tmp_buf;
 int cnt;
 struct work_queue_dev* dev = filp->private_data;
 if (*f_pos > 0)
 return 0;

 dev->work_queue = alloc_workqueue("work_queue", WQ_UNBOUND, 0);

 tmp_buf = kzalloc(300, GFP_KERNEL);
 if (!tmp_buf)
 return -ENOMEM;
 dev->loops = 4;
 dev->buf = tmp_buf;
 dev->buf += sprintf(dev->buf, " time delta inirq pid cpu command\n");
 dev->buf += sprintf(dev->buf,
 "%9li %3li %i %6i %i %s\n",
 jiffies, 0L, in_interrupt() ? 1 : 0,
 current->pid, smp_processor_id(), current->comm);
 dev->pre_jiffies = jiffies;

 INIT_WORK(&dev->work, work_queue_handeler);
 queue_work(dev->work_queue, &dev->work);

 wait_event_interruptible(dev->wq, !dev->loops);
 destroy_workqueue(dev->work_queue);

 cnt = dev->buf - tmp_buf;
 if (copy_to_user(buf, tmp_buf, cnt))
 {
 ret = -EFAULT;
 goto out;
 }

 *f_pos += cnt;
 ret = cnt;
out:
 kfree(tmp_buf);
 return ret;
}

struct file_operations work_queue_fops = {
 .owner = THIS_MODULE,
 .read = work_queue_read_func,
 .open = work_queue_open_func,
 .release = work_queue_release_func,
};

static int __init work_queue_init_module(void)
{
 int ret = 0, i;
 dev_t devno = MKDEV(work_queue_major, work_queue_minor);

 if (work_queue_major)
 ret = register_chrdev_region(devno, work_queue_nr_devs, "work_queue");
 else
 {
 ret = alloc_chrdev_region(&devno, work_queue_minor, work_queue_nr_devs, "work_queue");
 work_queue_major = MAJOR(devno);
 }

 if (ret < 0)
 {
 printk(KERN_ALERT "register_chrdev_region failed with %d\n", ret);
 goto out_1;
 }

 work_queue_devp = kzalloc(sizeof(struct work_queue_dev) * work_queue_nr_devs, GFP_KERNEL);
 if (!work_queue_devp)
 {
 ret = -ENOMEM;
 printk(KERN_ALERT "Out of memory\n");
 goto out_2;
 }

 class = class_create(THIS_MODULE, "work_queue_class");
 if (IS_ERR(class))
 {
 ret = PTR_ERR(class);
 printk(KERN_ALERT "class_create failed with %d\n", ret);
 goto out_3;
 }

 for (i = 0; i < work_queue_nr_devs; i++)
 {
 cdev_init(&work_queue_devp[i].cdev, &work_queue_fops);
 work_queue_devp[i].cdev.owner = THIS_MODULE;
 ret = cdev_add(&work_queue_devp[i].cdev, MKDEV(work_queue_major, work_queue_minor + i), 1);
 if (ret < 0)
 printk(KERN_ALERT "cdev_add failed with %d\n", ret);
 else
 {
 work_queue_devp[i].cls_dev = device_create(class, NULL, MKDEV(work_queue_major, work_queue_minor + i), NULL, "work_queue%d", i);
 if (IS_ERR(work_queue_devp[i].cls_dev))
 printk(KERN_ALERT "device_create failed with %d\n", ret);
 }
 init_waitqueue_head(&work_queue_devp[i].wq);
 }
 return 0;
out_3:
 kfree(work_queue_devp);
out_2:
 unregister_chrdev_region(devno, work_queue_nr_devs);
out_1:
 return ret;
}

static void __exit work_queue_exit_module(void)
{
 int i;
 for (i = 0; i < work_queue_nr_devs; i++)
 {
 device_destroy(class, MKDEV(work_queue_major, work_queue_minor + i));
 cdev_del(&work_queue_devp[i].cdev);
 }
 class_destroy(class);
 kfree(work_queue_devp);
 unregister_chrdev_region(MKDEV(work_queue_major, work_queue_minor), work_queue_nr_devs);
}

module_param(work_queue_major, int, S_IRUGO);
module_param(work_queue_minor, int, S_IRUGO);
module_param(work_queue_nr_devs, int, S_IRUGO);

module_init(work_queue_init_module);
module_exit(work_queue_exit_module);

MODULE_AUTHOR("lidonghang-02");
MODULE_LICENSE("GPL");
```
