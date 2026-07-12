---
title: 在ubuntu上安装/卸载libreoffice
---

# 在ubuntu上安装/卸载libreoffice

## 安装libreoffice

### 安装

添加官方PPA

 |

```
sudo add-apt-repository ppa:libreoffice/ppa

```

安装

 |

```
sudo apt update
sudo apt install libreoffice

```

### 卸载

 |

```
sudo apt remove --purge libreoffice*
sudo rm -rf /home/<username>/.config/libreoffice

```

- 注意：不删除`config/libreoffice`可能在重新安装 LibreOffice 时出现问题

清除不再需要的依赖包

 |

```
sudo apt-get autoremove
sudo apt-get autoclean

```
