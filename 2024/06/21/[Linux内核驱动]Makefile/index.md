---
title: [Linux内核驱动]Makefile
date: 2024-06-21 19:25:39
categories: 驱动开发
tags:
  - Linux
  - Linux内核驱动
source: https://blog.csdn.net/qq_66623299/article/details/139868485
description: 【代码】[Linux内核驱动]Makefile。
---

### 代码

```c
KVERS = $(shell uname -r)

obj-m += xxx.o

build: kernel_modules

kernel_modules:
	make -C /lib/modules/$(KVERS)/build M=$(CURDIR) modules

clean:
	make -C /lib/modules/$(KVERS)/build M=$(CURDIR) clean
```
