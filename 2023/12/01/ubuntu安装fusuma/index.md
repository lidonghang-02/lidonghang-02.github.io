---
title: "ubuntu安装fusuma"
date: 2023-12-01 00:00:00
categories: 未分类
---

# 安装fusuma

[fusuma官网](https://github.com/iberianpig/fusuma)

## 安装

### 授予读取触摸板设备的权限

必须是 Input 组的成员才能阅读 Fusuma 的触摸板。

 |

```
sudo gpasswd -a $USER input

```

重启

 |

```
reboot

```

### 安装依赖项

1. 安装libinput-tools |

```
sudo apt-get install libinput-tools

```

2. 安装Ruby（fusuma基于Ruby运行） |

```
sudo apt-get install ruby

```

3. 安装fusuma |

```
sudo gem install fusuma

```

 ** *如果上面命令正常运可直接跳到第四步***

 注意：当在安装gem的时候有时会报下面的错误，或是gem install 太慢 或是无法联接 timeout

 |

```
WARNING: RubyGems 1.2+ index not found for:

RubyGems will revert to legacy indexes degrading performance.

```

这时可以采用本地安装的方式

- 可以在[Ruby官网](https://rubygems.org/)在中下载`fusuma`安装包本地安装，直接搜索`fusuma`即可

 |

```
gem install -l xxx.gem文件

```

4. 安装键盘模拟工具xdotool (optional)(fusuma通过此软件模拟快捷键) |

```
sudo apt-get install xdotool

```
