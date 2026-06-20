---
title: [Linux内核驱动]proc
date: 2024-06-30 19:26:19
categories: 驱动开发
tags:
  - Linux
  - Linux内核驱动
source: https://blog.csdn.net/qq_66623299/article/details/140085039
description: proc是Linux上的一种虚拟文件系统，存储的是当前内核运行状态的一系列特殊文件，用户可以通过这些文件查看有关系统硬件及当前正在运行进程的信息，甚至可以更改其中某些文件来改变内核的运行状态。
---

## proc文件系统

/proc是Linux上的一种虚拟文件系统，存储的是当前内核运行状态的一系列特殊文件，用户可以通过这些文件查看有关系统硬件及当前正在运行进程的信息，甚至可以更改其中某些文件来改变内核的运行状态。

### API

#### 创建目录

函数原型：

```c
struct proc_dir_entry *proc_mkdir(const char *name, struct proc_dir_entry *parent);
```

参数说明：

- name：要创建的目录的名称。
- parent：父目录的 proc_dir_entry 指针。

返回值：

- 成功时返回指向新创建目录的 proc_dir_entry 指针，失败时返回 NULL。
- proc_dir_entry是Linux内核中的一个数据结构，用于表示/proc文件系统中的目录项。这个结构体定义了/proc文件系统中的目录项的属性和行为，包括目录或文件的名称、模式（如只读、可写等）、所有者、组、大小等信息。此外，它还包含了一些函数指针，用于处理与目录项相关的操作，如读取、写入等。

#### 创建proc文件

函数原型：

```c
static inline struct proc_dir_entry *proc_create(const char *name, mode_t mode, struct proc_dir_entry *parent, const struct file_operations *proc_fops);
```

参数说明：

- name：要创建的文件名。
- mode：文件的访问权限，以UGO的模式表示。
- parent：父节点的proc_dir_entry，表示要在哪个目录下创建该文件。如果为NULL，则在/proc根目录下创建。
- proc_fops：指向一个file_operations结构体的指针，该结构体定义了与文件相关的操作，如读取、写入等。

返回值：

- 成功时返回指向新创建文件的proc_dir_entry指针，失败时返回NULL。

#### 删除proc文件

函数原型：

```c
void remove_proc_entry(const char *name, struct proc_dir_entry *parent);
```

参数说明：

- name：要删除的文件名。
- parent：父节点的proc_dir_entry，表示要在哪个目录下删除该文件。

### seq_file

procfs的默认操作函数只使用一页的缓存，在处理较大的proc文件时就有点麻烦，并且在输出一系列结构体中的数据时也比较不灵活，需要自己在read_proc函数中实现迭代，容易出现Bug。所以内核黑客们对一些/proc代码做了研究，抽象出共性，最终形成了seq_file（Sequence file：序列文件）接口。 seq_file提供了一种机制，使得内核代码能够逐步地、按需地生成内容，而不是一次性地将所有数据加载到内存中。

seq_file结构体定义于linux/seq_file.h

#### struct seq_operations

这是一个包含了一组函数指针的结构体，这些函数定义了如何开始、停止、移动到下一个条目以及显示条目内容。主要的函数指针有：

- start：开始一个序列。
- stop：结束一个序列。
- next：移动到序列中的下一个条目。
- show：显示当前条目的内容。

使用seq_file框架时，内核代码通常会定义一个seq_operations结构体，并实现其中的函数指针。当用户空间程序读取/proc中的一个文件时，内核会调用这些函数来生成内容，并逐行发送给用户空间。

### 代码

```c
#include <linux/module.h>
#include <linux/uaccess.h>
#include <linux/proc_fs.h>
#include <linux/seq_file.h>

#include <linux/string.h>

static char* str = "Hello, World!\n";
static int len;

// seq
static void* proc_seq_start(struct seq_file* m, loff_t* pos)
{
 printk(KERN_INFO "proc_seq_start\n");
 if (*pos >= len)
 return NULL;
 return &str[*pos];
}

static void proc_seq_stop(struct seq_file* m, void* v)
{
 printk(KERN_INFO "proc_seq_stop\n");
}

static int proc_seq_show(struct seq_file* m, void* v)
{
 printk(KERN_INFO "proc_seq_show\n");
 seq_putc(m, *(char*)v);
 return 0;
}

static void* proc_seq_next(struct seq_file* m, void* v, loff_t* pos)
{
 printk(KERN_INFO "proc_seq_next\n");
 (*pos)++;
 if (*pos >= len)
 return NULL;
 return &str[*pos];
}

static const struct seq_operations proc_seq_ops = {
 .start = proc_seq_start,
 .stop = proc_seq_stop,
 .next = proc_seq_next,
 .show = proc_seq_show,
};

static int proc_open_func(struct inode* inode, struct file* filp)
{
 printk(KERN_INFO "proc_open_func\n");

 return seq_open(filp, &proc_seq_ops);
}

static ssize_t proc_read_func(struct file* filp, char __user* buf, size_t count, loff_t* f_pos)
{
 int ret = 0;

 if (*f_pos < 0)
 {
 ret = -EINVAL;
 goto out;
 }
 if (*f_pos >= len)
 goto out;

 if (copy_to_user(buf, str, len))
 {
 ret = -EFAULT;
 goto out;
 }

 *f_pos += len;
 ret = len;

out:
 return ret;
}

static const struct file_operations proc_ops = {
 .open = proc_open_func,
 .read = proc_read_func,
};

static int __init proc_init(void)
{
 len = strlen(str);
 proc_create("my_proc", 0, NULL, &proc_ops);
 return 0;
}

static void __exit proc_exit(void)
{
 remove_proc_entry("my_proc", NULL);
 remove_proc_entry("my_proc_seq", NULL);
}

module_param(str, charp, S_IRUGO);

module_init(proc_init);
module_exit(proc_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("lidonghang-02");
```
