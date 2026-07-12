---
title: D1-H哪吒开发板GPIO使用
---

# D1-H哪吒开发板GPIO使用

基 于 开 发 板 的 Tina_Linux 操 作 系 统 , 可 以 通 过 sysfs 方 式 控 制 GPIO
(`/sys/class/gpio`)。基本原理如下。

查看系统中有没有`/sys/class/gpio`这个文件夹,如果没有就在编译内核的时候勾选` Device Drivers-> GPIO Support ->/sys/class/gpio/... (sysfsinterface)`。

通过 sysfs 方式控制 GPIO,先访问`/sys/class/gpio` 目录,向 `export` 文件写入GPIO 编号,使得该 GPIO 的操作接口从内核空间暴露到用户空间,GPIO 的操作接口包括 `direction` 和 `value` 等,`direction` 控制 GPIO 方向,而 `value` 可控制 GPIO 输出或获得 GPIO 输入。文件 IO 方式操作 GPIO,使用到了 4 个函数 `open`、`close`、`read`、`write`。

1. `gpio_operation` 通过`/sys/`文件接口操作 IO 端口 GPIO 到文件系统
的映射:

  - 控制 GPIO 的目录位于`/sys/class/gpio`。
  - `/sys/class/gpio/export` 文件用于通知系统需要导出控制的 GPIO 引脚
 编号。
  - `/sys/class/gpio/unexport`用于通知系统取消导出。
  - `/sys/class/gpio/gpiochipX` 目录保存系统中 GPIO 寄存器的信息,包括
 每个寄存器控制引脚的起始编号 base,寄存器名称,引脚总数 导出一个引脚的
 操作。
  - `/sys/class/gpio/gpioX/direction` 文件,定义输入输入方向,可以通
 过下面命令定义为输出。`direction` 接受的参数:`in, out, high, low。high/low`同时设置方向为输出,并将 `value` 设置为相应的 `1/0`
  - `/sys/class/gpio/gpioX/value` 文件是端口的数值,为 1 或 0

2. 在Tina-Linux系统中操作

  - 导出：` echo 65 > export`
  - 取消导出：`echo 65 > unexport`
  - 设置方向：`echo out > direction`
  - 查看方向：`cat direction`
  - 设置输出：`/echo 1 > value`
  - 查看输出值：`cat value`

使用时需要计算 GPIO 的编号,比如需要采用 `PC1`,那么 C 组是第三组那
么可以利用公式
$$num = (n-1) * 32 + m$$
其中 `num` 是 GPIO 的编号,`n` 是第几组 gpio,`m` 是当前的 gpio 的序号。经过计算 PC1 的 GPIO 编号为 65。

所以当执行`echo 65 > /sys/class/gpio/export`会在`/sys/class/gpio/`文件夹中生成 `gpio65` 这个目录,里面有些文件可以设置 GPIO 的值。

3. 在 C 程序中使用

  1. 在`/sys/class/gpio/`生成 gpio 相关的文件夹，使用`gpio_export()`
  2. 设置 gpio 输入输出方向，使用`gpio_set_dir()`
  3. 读写 gpio 的值，使用`gpio_set_value()`或`gpio_get_value()` |

```
#define SYSFS_GPIO_DIR "/sys/class/gpio"
#define MAX_BUF 64
// 导出
int gpio_export(unsigned int gpio)
{
    int fd, len;
    char buf[MAX_BUF];

    fd = open(SYSFS_GPIO_DIR "/export", O_WRONLY);
    if (fd < 0)
    {
        perror("gpio/export");
        return fd;
    }

    len = snprintf(buf, sizeof(buf), "%d", gpio);
    write(fd, buf, len);
    close(fd);

    return 0;
}
// 取消导出
int gpio_unexport(unsigned int gpio)
{
    int fd, len;
    char buf[MAX_BUF];

    fd = open(SYSFS_GPIO_DIR "/unexport", O_WRONLY);
    if (fd < 0)
    {
        perror("gpio/export");
        return fd;
    }

    len = snprintf(buf, sizeof(buf), "%d", gpio);
    write(fd, buf, len);
    close(fd);
    return 0;
}
// 设置方向
int gpio_set_dir(unsigned int gpio, unsigned int out_flag)
{
    int fd, len;
    char buf[MAX_BUF];

    len = snprintf(buf, sizeof(buf), SYSFS_GPIO_DIR "/gpio%d/direction", gpio);

    fd = open(buf, O_WRONLY);
    if (fd < 0)
    {
        perror("gpio/direction");
        return fd;
    }
    if (out_flag)
        write(fd, "out", 3);
    else
        write(fd, "in", 2);
    close(fd);
    return 0;
}
// 设置输出值
int gpio_set_value(unsigned int gpio, unsigned int value)
{
    int fd, len;
    char buf[MAX_BUF];

    len = snprintf(buf, sizeof(buf), SYSFS_GPIO_DIR "/gpio%d/value", gpio);

    fd = open(buf, O_WRONLY);
    if (fd < 0)
    {
        perror("gpio/set-value");
        return fd;
    }

    if (value)
        write(fd, "1", 1);
    else
        write(fd, "0", 1);

    close(fd);
    return 0;
}
// 读取输入值
int gpio_get_value(unsigned int gpio, unsigned int *value)
{
    int fd, len;
    char buf[MAX_BUF];
    char ch;

    len = snprintf(buf, sizeof(buf), SYSFS_GPIO_DIR "/gpio%d/value", gpio);

    fd = open(buf, O_RDONLY);
    if (fd < 0)
    {
        perror("gpio/get-value");
        printf("%s\n", buf);
        return fd;
    }
    read(fd, &ch, 1);
    if (ch != '0')
        *value = 1;
    else
        *value = 0;
    close(fd);
    return 0;
}

```
